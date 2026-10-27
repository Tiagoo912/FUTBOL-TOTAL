import { NextRequest, NextResponse } from "next/server";
import { af, hasKey } from "@/lib/api-football";
import { envelope, fail, ok } from "@/lib/http";

type Raw = { league: { id: number; name: string; logo: string | null }; country: { name: string }; seasons: { year: number; current: boolean; coverage: Record<string, unknown> }[] };

/** Verifica qué ofrece REALMENTE la API con tu clave. Gasta 1 solicitud por liga (cacheada 24 h). */
export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get("ids") ?? "128,130,13,11";
  if (!/^\d+(,\d+){0,4}$/.test(ids)) return NextResponse.json({ error: "ids: hasta 5 IDs separados por coma" }, { status: 400 });
  if (!hasKey()) return NextResponse.json({ error: "Falta API_FOOTBALL_KEY: no se puede verificar cobertura" }, { status: 503 });
  try {
    const out = [];
    let at = Date.now(), stale = false;
    for (const id of ids.split(",")) {
      const r = await af<Raw[]>("/leagues", { id }, 86400);
      at = Math.min(at, r.at); stale = stale || r.stale;
      const l = r.data[0];
      out.push(l ? { id: Number(id), name: l.league.name, country: l.country.name, logo: l.league.logo, seasons: l.seasons.slice(-3).map((s) => ({ year: s.year, current: s.current, coverage: s.coverage })) } : { id: Number(id), found: false });
    }
    return ok(envelope("api-football", out, at, stale));
  } catch (e) { return fail(e); }
}
