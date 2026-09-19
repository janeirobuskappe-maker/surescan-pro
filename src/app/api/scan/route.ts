import { NextResponse } from "next/server";
import { ensureSeeded, runScan } from "@/lib/engine";

export const dynamic = "force-dynamic";

export async function POST() {
  await ensureSeeded();
  const result = await runScan("manual");
  return NextResponse.json({ ok: true, ...result, at: new Date().toISOString() });
}
