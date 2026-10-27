import { NextResponse } from "next/server";
import { cacheSize, hasKey, quota } from "@/lib/api-football";
export async function GET() {
  return NextResponse.json({ mode: hasKey() ? "api-football" : "demo", quota: { daily: quota.daily, minute: quota.minute }, cacheEntries: cacheSize() });
}
