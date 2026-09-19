import { NextResponse } from "next/server";
import { and, avg, count, desc, eq, max, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookmakers, events, scans, surebets } from "@/db/schema";
import { ensureSeeded, maybeAutoScan } from "@/lib/engine";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeeded();
  await maybeAutoScan(30_000);

  const [[active], [avgRow], [best], [evCount], [totalFound], recentScans, byBookmaker] =
    await Promise.all([
      db.select({ n: count() }).from(surebets).where(eq(surebets.status, "active")),
      db
        .select({ v: avg(surebets.profitPct) })
        .from(surebets)
        .where(eq(surebets.status, "active")),
      db
        .select({ v: max(surebets.profitPct) })
        .from(surebets)
        .where(eq(surebets.status, "active")),
      db.select({ n: count() }).from(events).where(eq(events.status, "upcoming")),
      db.select({ n: count() }).from(surebets),
      db.select().from(scans).orderBy(desc(scans.id)).limit(24),
      db.execute(sql`
        SELECT elem->>'bookmakerName' AS name,
               elem->>'bookmakerSlug' AS slug,
               COUNT(*)::int AS hits
        FROM surebets,
             LATERAL jsonb_array_elements(legs) elem
        WHERE surebets.status = 'active'
        GROUP BY name, slug
        ORDER BY hits DESC
      `),
    ]);

  const [activeVirtual] = await db
    .select({ n: count() })
    .from(surebets)
    .where(and(eq(surebets.status, "active"), eq(surebets.kind, "virtual")));

  const books = await db
    .select({
      id: bookmakers.id,
      slug: bookmakers.slug,
      name: bookmakers.name,
      color: bookmakers.color,
      textColor: bookmakers.textColor,
      region: bookmakers.region,
      hasVirtuals: bookmakers.hasVirtuals,
    })
    .from(bookmakers);

  return NextResponse.json({
    activeSurebets: active.n,
    activeVirtual: activeVirtual.n,
    activeReal: active.n - activeVirtual.n,
    avgProfit: Number(avgRow.v ?? 0),
    bestProfit: Number(best.v ?? 0),
    upcomingEvents: evCount.n,
    totalDetected: totalFound.n,
    scanHistory: recentScans.reverse().map((s) => ({
      id: s.id,
      at: s.createdAt,
      found: s.surebetsFound,
      active: s.activeSurebets,
      events: s.eventsScanned,
      durationMs: s.durationMs,
    })),
    byBookmaker: byBookmaker.rows as { name: string; slug: string; hits: number }[],
    bookmakers: books,
  });
}
