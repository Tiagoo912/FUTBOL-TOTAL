import { NextRequest, NextResponse } from "next/server";
import { af } from "@/lib/api-football";
import { normalize, type RawFixture } from "@/lib/normalize";
import { envelope, fail, ok } from "@/lib/http";

type Pl = { id: number; name: string; number: number | null; pos: string | null; grid: string | null };
type Raw = RawFixture & {
  events?: { time: { elapsed: number | null; extra: number | null }; team: { id: number; name: string }; player: { name: string | null }; type: string; detail: string }[];
  lineups?: { team: { id: number; name: string }; formation: string | null; startXI: { player: Pl }[]; substitutes: { player: Pl }[] }[];
  statistics?: { team: { id: number; name: string }; statistics: { type: string; value: string | number | null }[] }[];
  players?: { team: { id: number }; players: { player: { id: number; name: string; photo: string | null }; statistics: { games?: { minutes: number | null }; goals?: { total: number | null; assists: number | null }; shots?: { total: number | null; on: number | null }; tackles?: { total: number | null }; fouls?: { drawn: number | null; committed: number | null } }[] }[] }[];
};

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d{1,9}$/.test(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  try {
    // /fixtures?id= trae eventos, alineaciones, estadísticas y jugadores en UNA sola solicitud.
    const r = await af<Raw[]>("/fixtures", { id }, (d) => { const s = d[0] && normalize(d[0]).status; return s === "FT" ? 86400 : s === "NS" ? 3600 : 120; });
    const f = r.data[0];
    if (!f) return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
    const data = {
      match: normalize(f),
      events: (f.events ?? []).map((e) => ({ minute: e.time.elapsed, extra: e.time.extra, teamId: e.team.id, player: e.player.name, type: e.type, detail: e.detail })),
      statistics: (f.statistics ?? []).map((s) => ({ teamId: s.team.id, items: s.statistics })),
      lineups: (f.lineups ?? []).map((l) => ({ teamId: l.team.id, formation: l.formation, startXI: l.startXI.map((x) => x.player), substitutes: l.substitutes.map((x) => x.player) })),
      players: (f.players ?? []).flatMap((t) => t.players.map((p) => { const s = p.statistics[0]; return { teamId: t.team.id, id: p.player.id, name: p.player.name, photo: p.player.photo, minutes: s?.games?.minutes ?? null, goals: s?.goals?.total ?? null, assists: s?.goals?.assists ?? null, shots: s?.shots?.total ?? null, shotsOn: s?.shots?.on ?? null, tackles: s?.tackles?.total ?? null, foulsDrawn: s?.fouls?.drawn ?? null, foulsCommitted: s?.fouls?.committed ?? null }; })),
    };
    return ok(envelope("api-football", data, r.at, r.stale));
  } catch (e) { return fail(e); }
}
