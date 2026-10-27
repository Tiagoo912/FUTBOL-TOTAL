import { NextResponse } from "next/server";
import { ApiError, quota } from "./api-football";
import type { Envelope } from "./types";
export function envelope<T>(source: Envelope<T>["source"], data: T, updatedAt: number, stale: boolean): Envelope<T> {
  return { source, updatedAt, stale, quota: { daily: quota.daily, minute: quota.minute }, data };
}
export const ok = <T,>(e: Envelope<T>) => NextResponse.json(e);
export function fail(e: unknown) {
  if (e instanceof ApiError) return NextResponse.json({ error: e.message }, { status: e.status });
  return NextResponse.json({ error: "Error interno" }, { status: 500 });
}
export function validTz(tz: string | null): string {
  const d = "America/Argentina/Buenos_Aires";
  if (!tz) return d;
  try { new Intl.DateTimeFormat("es", { timeZone: tz }); return tz; } catch { return d; }
}
