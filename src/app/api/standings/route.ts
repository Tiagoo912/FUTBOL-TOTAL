import { NextRequest, NextResponse } from "next/server";
import { af, hasKey } from "@/lib/api-football";
import { envelope, fail, ok } from "@/lib/http";

type Row = { rank: number; team: { id: number; name: string; logo: string | null }; points: number; goalsDiff: number; description: string | null; all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } } };
type Raw = { league: { standings: Row[][] } };
const CAL_YEAR = new Set([128, 130, 13, 11, 1, 9, 34]);

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const league = p.get("league") ?? "";
  if (!/^\d{1,6}$/.test(league)) return NextResponse.json({ error: "Parámetro league inválido" }, { status: 400 });
  const now = new Date();
  const season = p.get("season") ?? String(CAL_YEAR.has(Number(league)) || now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1);
  if (!/^\d{4}$/.test(season)) return NextResponse.json({ error: "Parámetro season inválido" }, { status: 400 });
  if (!hasKey()) return NextResponse.json({ error: "Tablas reales no disponibles: falta API_FOOTBALL_KEY (modo demostración)" }, { status: 503 });
  try {
    const r = await af<Raw[]>("/standings", { league, season }, 21600);
    const groups = (r.data[0]?.league.standings ?? []).map((rows, i) => ({ name: `Grupo ${i + 1}`, rows: rows.map((x) => ({ rank: x.rank, team: x.team, points: x.points, played: x.all.played, win: x.all.win, draw: x.all.draw, lose: x.all.lose, gf: x.all.goals.for, ga: x.all.goals.against, gd: x.goalsDiff, zone: x.description })) }));
    return ok(envelope("api-football", { league: Number(league), season: Number(season), groups }, r.at, r.stale));
  } catch (e) { return fail(e); }
}
