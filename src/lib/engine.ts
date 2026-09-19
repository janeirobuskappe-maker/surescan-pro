import { and, desc, eq, gt, lt, inArray, sql, count } from "drizzle-orm";
import { db } from "@/db";
import { bookmakers, events, odds, surebets, scans } from "@/db/schema";
import type { ArbLeg, Bookmaker, EventRow } from "@/db/schema";
import { detectArbitrage, type Offer } from "@/lib/arbitrage";
import {
  BOOKMAKERS,
  REAL_LEAGUES,
  VIRTUAL_LEAGUES,
  MARKETS_BY_SPORT,
  type LeagueSeed,
} from "@/lib/catalog";

/* ------------------------------------------------------------------ */
/* Utilitaires probabilistes                                           */
/* ------------------------------------------------------------------ */

const FACT = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800, 39916800, 479001600, 6227020800];

function poisson(lambda: number, k: number): number {
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / FACT[k];
}

function gauss(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const round2 = (n: number) => Math.round(n * 100) / 100;

export const OUTCOMES: Record<string, string[]> = {
  "1X2": ["1", "X", "2"],
  OU25: ["over", "under"],
  BTTS: ["yes", "no"],
  "12": ["1", "2"],
  OU2: ["over", "under"],
};

function marketKey(m: string): string {
  return m.split(":")[0];
}

/** Probabilités "réelles" d'un match de football via modèle de Poisson bivarié simplifié */
function footballModel(sh: number, sa: number) {
  const lh = 1.42 * (sh / sa);
  const la = 1.02 * (sa / sh);
  let p1 = 0;
  let px = 0;
  let p2 = 0;
  let pUnder25 = 0;
  let pBtts = 0;
  let ph0 = 0;
  let pa0 = 0;
  for (let i = 0; i <= 10; i++) {
    for (let j = 0; j <= 10; j++) {
      const p = poisson(lh, i) * poisson(la, j);
      if (i > j) p1 += p;
      else if (i === j) px += p;
      else p2 += p;
      if (i + j <= 2) pUnder25 += p;
      if (i > 0 && j > 0) pBtts += p;
      if (i === 0) ph0 += poisson(lh, i) * 1;
      if (j === 0) pa0 += poisson(la, j) * 1;
    }
  }
  void ph0;
  void pa0;
  const pNoBtts = 1 - pBtts;
  return { p1, px, p2, pUnder25, pOver25: 1 - pUnder25, pBtts, pNoBtts };
}

/** Cote proposée par un bookmaker : cote équitable − marge ± bruit de cotation */
function bookmakerPrice(p: number, margin: number, vol: number): number {
  const noise = gauss() * 0.013 * vol;
  let price = (1 / p) * (1 - margin) * (1 + noise);
  price = Math.max(1.04, Math.min(price, (1 / p) * 1.32));
  return round2(price);
}

/* ------------------------------------------------------------------ */
/* Amorçage (seed)                                                     */
/* ------------------------------------------------------------------ */

let seedPromise: Promise<void> | null = null;

export function ensureSeeded(): Promise<void> {
  seedPromise ??= (async () => {
    const rows = await db.select({ id: bookmakers.id }).from(bookmakers).limit(1);
    if (rows.length === 0) {
      await db.insert(bookmakers).values(
        BOOKMAKERS.map((b) => ({
          slug: b.slug,
          name: b.name,
          color: b.color,
          textColor: b.textColor,
          margin: b.margin,
          virtualMargin: b.virtualMargin,
          volatility: b.volatility,
          hasVirtuals: b.hasVirtuals,
          region: b.region,
        })),
      );
    }
    await runScan("seed");
  })();
  return seedPromise;
}

/* ------------------------------------------------------------------ */
/* Génération d'événements                                             */
/* ------------------------------------------------------------------ */

function makeEvent(league: LeagueSeed, kind: "real" | "virtual", now: Date) {
  let home = pick(league.teams);
  let away = pick(league.teams);
  while (away === home) away = pick(league.teams);

  let startsAt: Date;
  if (kind === "virtual") {
    startsAt = new Date(now.getTime() + rand(1, 32) * 60_000);
  } else {
    startsAt = new Date(now.getTime() + rand(0.6, 90) * 3_600_000);
  }
  return {
    sport: league.sport,
    league: league.name,
    home,
    away,
    startsAt,
    kind,
    status: "upcoming",
  };
}

async function maintainEventPool(books: Bookmaker[], now: Date) {
  // Nettoyage des événements terminés (cascade sur cotes & surebets)
  const cutoff = new Date(now.getTime() - 8 * 3_600_000);
  await db.delete(events).where(lt(events.startsAt, cutoff));

  // Marquer les événements démarrés et expirer leurs surebets actifs
  const started = await db
    .select({ id: events.id, kind: events.kind })
    .from(events)
    .where(and(eq(events.status, "upcoming"), lt(events.startsAt, now)));
  if (started.length > 0) {
    const startedIds = started.map((e) => e.id);
    await db
      .update(events)
      .set({ status: "live" })
      .where(inArray(events.id, startedIds));
    await db
      .update(surebets)
      .set({ status: "expired" })
      .where(and(inArray(surebets.eventId, startedIds), eq(surebets.status, "active")));
  }

  // Compléter le pool réel
  const [realCount] = await db
    .select({ n: count() })
    .from(events)
    .where(and(eq(events.kind, "real"), eq(events.status, "upcoming")));
  if (realCount.n < 42) {
    const batch = Array.from({ length: 46 }, () => makeEvent(pick(REAL_LEAGUES), "real", now));
    await db.insert(events).values(batch);
  }

  // Compléter le pool virtuel (matchs courts toutes les quelques minutes)
  const [virtCount] = await db
    .select({ n: count() })
    .from(events)
    .where(and(eq(events.kind, "virtual"), gt(events.startsAt, now)));
  const virtualEnabled = books.some((b) => b.hasVirtuals);
  if (virtualEnabled && virtCount.n < 22) {
    const batch = Array.from({ length: 26 }, () => makeEvent(pick(VIRTUAL_LEAGUES), "virtual", now));
    await db.insert(events).values(batch);
  }
}

/* ------------------------------------------------------------------ */
/* Cotation + détection                                                */
/* ------------------------------------------------------------------ */

type ModelProbs = Record<string, Record<string, { p: number; meta?: string }>>;

function buildModel(ev: EventRow): ModelProbs {
  const seedStr = `${ev.id}:${ev.home}:${ev.away}`;
  let h = 0;
  for (const c of seedStr) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const det = (k: number) => {
    const x = Math.sin(h * 0.0001 + k * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };

  if (ev.sport === "football") {
    const sh = 0.82 + det(1) * 0.5;
    const sa = 0.82 + det(2) * 0.5;
    const m = footballModel(sh, sa);
    return {
      "1X2": {
        "1": { p: m.p1 },
        X: { p: m.px },
        "2": { p: m.p2 },
      },
      OU25: {
        over: { p: m.pOver25 },
        under: { p: m.pUnder25 },
      },
      BTTS: {
        yes: { p: m.pBtts },
        no: { p: m.pNoBtts },
      },
    };
  }
  if (ev.sport === "tennis") {
    const rh = 1500 + det(1) * 500;
    const ra = 1500 + det(2) * 500;
    const p1 = 1 / (1 + Math.pow(10, -(rh - ra) / 400));
    return { "12": { "1": { p: p1 }, "2": { p: 1 - p1 } } };
  }
  // basketball
  const sh = 100 + det(1) * 30;
  const sa = 100 + det(2) * 30;
  const p1 = sh / (sh + sa) + 0.06; // avantage domicile
  const line = Math.round((198 + det(3) * 34) * 2) / 2; // ex. 214.5
  const pOver = 0.47 + det(4) * 0.06;
  return {
    "12": { "1": { p: Math.min(0.93, p1) }, "2": { p: Math.min(0.93, 1 - p1) } },
    OU2: {
      over: { p: pOver, meta: String(line) },
      under: { p: 1 - pOver, meta: String(line) },
    },
  };
}

async function scanMarket(
  ev: EventRow,
  market: string,
  probs: Record<string, { p: number; meta?: string }>,
  books: Bookmaker[],
  now: Date,
): Promise<{ arbFound: boolean; oddsWritten: number }> {
  const key = marketKey(market);
  const isVirtual = ev.kind === "virtual";
  const eligible = books.filter((b) => (isVirtual ? b.hasVirtuals : true));
  if (eligible.length < 2) return { arbFound: false, oddsWritten: 0 };

  const byOutcome: Record<string, Offer[]> = {};
  const wrote: { bookmakerId: number; outcome: string; price: number }[] = [];

  for (const b of eligible) {
    const outcomeList = OUTCOMES[key];
    const injectChance = isVirtual ? 0.22 : 0.11;
    const doInject = Math.random() < injectChance;
    const boostedOutcome = doInject ? pick(outcomeList) : null;

    // 1) Cotes brutes du bookmaker + éventuelle dislocation (cote "en retard")
    const local: Record<string, number> = {};
    for (const oc of outcomeList) {
      const prob = probs[oc]?.p ?? 0.33;
      const margin = isVirtual ? b.virtualMargin : b.margin;
      let price = bookmakerPrice(prob, margin, b.volatility);
      if (oc === boostedOutcome) {
        price = round2(price * rand(1.045, isVirtual ? 1.12 : 1.09));
      }
      local[oc] = price;
    }

    // 2) Garde-fou réalisme : un bookmaker conserve toujours une marge positive
    //    → la cote boostée est recalée pour garder Σ(1/prix) ≥ ~1,00
    const floor = rand(1.003, 1.016);
    const invSumLocal = outcomeList.reduce((s, oc) => s + 1 / local[oc], 0);
    if (invSumLocal < floor && boostedOutcome) {
      const others = outcomeList
        .filter((oc) => oc !== boostedOutcome)
        .reduce((s, oc) => s + 1 / local[oc], 0);
      if (floor - others > 0.004) {
        local[boostedOutcome] = Math.max(1.04, round2(1 / (floor - others)));
      } else {
        // impossible de garder une marge positive : on annule le boost
        const prob = probs[boostedOutcome]?.p ?? 0.33;
        const margin = isVirtual ? b.virtualMargin : b.margin;
        local[boostedOutcome] = bookmakerPrice(prob, margin, b.volatility);
      }
    }

    // 3) Publication des prix ajustés
    for (const oc of outcomeList) {
      const price = local[oc];
      wrote.push({ bookmakerId: b.id, outcome: oc, price });
      (byOutcome[oc] ??= []).push({
        outcome: oc,
        bookmakerSlug: b.slug,
        bookmakerName: b.name,
        bookmakerColor: b.color,
        bookmakerTextColor: b.textColor,
        price,
      });
    }
  }

  // Persistance des cotes (upsert)
  const CHUNK = 60;
  for (let i = 0; i < wrote.length; i += CHUNK) {
    const chunk = wrote.slice(i, i + CHUNK);
    await db
      .insert(odds)
      .values(
        chunk.map((w) => ({ eventId: ev.id, market, ...w, updatedAt: now })),
      )
      .onConflictDoUpdate({
        target: [odds.eventId, odds.bookmakerId, odds.market, odds.outcome],
        set: { price: sql`excluded.price`, updatedAt: now },
      });
  }

  // Détection d'arbitrage sur les meilleures cotes de chaque issue
  const grouped = OUTCOMES[key].map((oc) => byOutcome[oc] ?? []);
  if (grouped.some((g) => g.length === 0)) return { arbFound: false, oddsWritten: wrote.length };

  const result = detectArbitrage(grouped);

  // Un surebet exploitable doit répartir ses mises sur ≥ 2 bookmakers distincts
  const distinctBooks = new Set(result.legs.map((l) => l.bookmakerSlug)).size;

  const minProfit = ev.kind === "virtual" ? 0.25 : 0.15;
  const maxProfit = ev.kind === "virtual" ? 8 : 6;

  if (
    result.isArb &&
    distinctBooks >= 2 &&
    result.profitPct >= minProfit &&
    result.profitPct <= maxProfit
  ) {
    let legs = result.legs;
    if (key === "OU2") {
      const line = probs["over"]?.meta ?? "215.5";
      legs = legs.map((l) => ({
        ...l,
        outcomeLabel: `${l.outcome === "over" ? "Plus" : "Moins"} de ${line} points`,
      }));
    }
    await db
      .insert(surebets)
      .values({
        eventId: ev.id,
        market,
        kind: ev.kind,
        profitPct: round2(result.profitPct * 100) / 100,
        invSum: result.invSum,
        legs,
        status: "active",
        detectedAt: now,
        lastSeenAt: now,
        expiresAt: ev.startsAt,
      })
      .onConflictDoUpdate({
        target: [surebets.eventId, surebets.market],
        set: {
          profitPct: round2(result.profitPct * 100) / 100,
          invSum: result.invSum,
          legs,
          status: "active",
          lastSeenAt: now,
          expiresAt: ev.startsAt,
        },
      });
    return { arbFound: true, oddsWritten: wrote.length };
  }

  // Plus d'arbitrage sur ce marché → expirer l'éventuel surebet actif
  await db
    .update(surebets)
    .set({ status: "expired" })
    .where(
      and(eq(surebets.eventId, ev.id), eq(surebets.market, market), eq(surebets.status, "active")),
    );
  return { arbFound: false, oddsWritten: wrote.length };
}

/* ------------------------------------------------------------------ */
/* Scan global                                                         */
/* ------------------------------------------------------------------ */

let lastScanAt = 0;
let scanning: Promise<{ found: number; total: number }> | null = null;

export async function runScan(mode: "seed" | "auto" | "manual" = "auto") {
  if (scanning) return scanning;
  scanning = (async () => {
    const t0 = Date.now();
    const now = new Date();
    const books = await db.select().from(bookmakers).where(eq(bookmakers.active, true));
    if (books.length === 0) return { found: 0, total: 0 };

    await maintainEventPool(books, now);

    // Événements à coter : réels à venir (sous-ensemble rotatif) + tous les virtuels
    const upcomingReal = await db
      .select()
      .from(events)
      .where(and(eq(events.kind, "real"), eq(events.status, "upcoming")))
      .orderBy(events.startsAt)
      .limit(60);
    const upcomingVirtual = await db
      .select()
      .from(events)
      .where(and(eq(events.kind, "virtual"), gt(events.startsAt, now)))
      .orderBy(events.startsAt)
      .limit(40);

    const pool = [...upcomingVirtual, ...upcomingReal];
    let found = 0;
    let oddsWritten = 0;

    for (const ev of pool) {
      const model = buildModel(ev);
      const markets = MARKETS_BY_SPORT[ev.sport] ?? [];
      for (const m of markets) {
        // Les marchés secondaires ne sont pas cotés à chaque passage (réalisme + perfs)
        if (m !== "1X2" && m !== "12" && Math.random() > 0.72) continue;
        const probs = model[marketKey(m)];
        if (!probs) continue;
        const r = await scanMarket(ev, m, probs, books, now);
        oddsWritten += r.oddsWritten;
        if (r.arbFound) found++;
      }
    }

    const [activeCount] = await db
      .select({ n: count() })
      .from(surebets)
      .where(eq(surebets.status, "active"));

    await db.insert(scans).values({
      mode,
      eventsScanned: pool.length,
      oddsUpdated: oddsWritten,
      surebetsFound: found,
      activeSurebets: activeCount.n,
      durationMs: Date.now() - t0,
    });

    lastScanAt = Date.now();
    return { found, total: pool.length };
  })().finally(() => {
    scanning = null;
  });
  return scanning;
}

/** Lance un scan automatique si le dernier date de plus de `minGapMs` */
export async function maybeAutoScan(minGapMs = 15_000) {
  if (Date.now() - lastScanAt < minGapMs) return;
  await runScan("auto");
}

export function lastScanAgeMs() {
  return lastScanAt === 0 ? Number.POSITIVE_INFINITY : Date.now() - lastScanAt;
}

export async function recentScans(limit = 30) {
  return db.select().from(scans).orderBy(desc(scans.id)).limit(limit);
}
