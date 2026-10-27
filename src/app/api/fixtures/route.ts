import { NextRequest, NextResponse } from "next/server";
import { af, hasKey } from "@/lib/api-football";
import { FEATURED, normalize, type RawFixture } from "@/lib/normalize";
import { demoMatches } from "@/lib/demo";
import { envelope, fail, ok, validTz } from "@/lib/http";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const date = p.get("date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) return NextResponse.json({ error: "Fecha inválida (AAAA-MM-DD)" }, { status: 400 });
  const tz = validTz(p.get("tz"));
  const all = p.get("all") === "1";
  if (!hasKey()) return ok(envelope("demo", demoMatches(date), Date.now(), false));
  const today = new Date().toLocaleDateString("en-CA", { timeZone: tz });
  try {
    // Una sola solicitud trae todos los partidos del día; se filtra acá, sin gastar cuota extra.
    const r = await af<RawFixture[]>("/fixtures", { date, timezone: tz }, (d) => {
      if (date < today) return 86400;
      if (date > today) return 3600;
      return d.some((f) => normalize(f).status === "LIVE") ? 120 : 600;
    });
    const ms = r.data.map(normalize).filter((m) => all || FEATURED.has(m.league.id));
    return ok(envelope("api-football", ms, r.at, r.stale));
  } catch (e) { return fail(e); }
}
