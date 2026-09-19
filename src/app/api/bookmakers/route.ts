import { NextResponse } from "next/server";
import { db } from "@/db";
import { bookmakers } from "@/db/schema";
import { ensureSeeded } from "@/lib/engine";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeeded();
  const rows = await db.select().from(bookmakers);
  return NextResponse.json({ bookmakers: rows });
}
