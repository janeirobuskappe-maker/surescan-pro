import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gte, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { events, surebets } from "@/db/schema";
import { ensureSeeded, maybeAutoScan, lastScanAgeMs } from "@/lib/engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureSeeded();
  await maybeAutoScan();

  const sp = req.nextUrl.searchParams;
  const kind = sp.get("kind") ?? "all"; // all | real | virtual
  const status = sp.get("status") ?? "active"; // active | expired | all
  const market = sp.get("market") ?? "all";
  const sport = sp.get("sport") ?? "all";
  const minProfit = Number(sp.get("minProfit") ?? "0");
  const limit = Math.min(Number(sp.get("limit") ?? "60"), 200);
  const sort = sp.get("sort") ?? "profit"; // profit | recent | start

  const conds: SQL[] = [];
  if (kind !== "all") conds.push(eq(surebets.kind, kind));
  if (status !== "all") conds.push(eq(surebets.status, status));
  if (market !== "all") conds.push(sql`${surebets.market} LIKE ${market + "%"}`);
  if (sport !== "all") conds.push(eq(events.sport, sport));
  if (minProfit > 0) conds.push(gte(surebets.profitPct, minProfit));

  const orderBy =
    sort === "recent"
      ? desc(surebets.detectedAt)
      : sort === "start"
        ? events.startsAt
        : desc(surebets.profitPct);

  const rows = await db
    .select({
      id: surebets.id,
      market: surebets.market,
      kind: surebets.kind,
      profitPct: surebets.profitPct,
      invSum: surebets.invSum,
      legs: surebets.legs,
      status: surebets.status,
      detectedAt: surebets.detectedAt,
      lastSeenAt: surebets.lastSeenAt,
      expiresAt: surebets.expiresAt,
      event: {
        id: events.id,
        sport: events.sport,
        league: events.league,
        home: events.home,
        away: events.away,
        startsAt: events.startsAt,
        status: events.status,
      },
    })
    .from(surebets)
    .innerJoin(events, eq(surebets.eventId, events.id))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(orderBy)
    .limit(limit);

  return NextResponse.json({
    surebets: rows,
    scanAgeMs: lastScanAgeMs(),
    serverTime: new Date().toISOString(),
  });
}
