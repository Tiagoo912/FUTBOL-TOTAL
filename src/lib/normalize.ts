import type { Match, Status } from "./types";
// IDs de competiciones de API-Football. VERIFICAR con /api/coverage antes de asegurar cobertura.
export const FEATURED = new Set([128, 130, 13, 11, 2, 3, 39, 140, 135, 78, 61, 1, 34, 9]);
const MAP: Record<string, Status> = { "1H": "LIVE", HT: "LIVE", "2H": "LIVE", ET: "LIVE", BT: "LIVE", P: "LIVE", LIVE: "LIVE", INT: "LIVE", FT: "FT", AET: "FT", PEN: "FT", NS: "NS", TBD: "NS", PST: "PST", SUSP: "SUS" };
type RawTeam = { id: number; name: string; logo: string | null };
export type RawFixture = {
  fixture: { id: number; date: string; status: { short: string; elapsed: number | null } };
  league: { id: number; name: string; country: string | null; logo: string | null };
  teams: { home: RawTeam; away: RawTeam };
  goals: { home: number | null; away: number | null };
};
export function normalize(f: RawFixture): Match {
  const status = MAP[f.fixture.status.short] ?? "OTHER";
  return { id: f.fixture.id, league: { id: f.league.id, name: f.league.name, country: f.league.country, logo: f.league.logo }, date: f.fixture.date, status, minute: status === "LIVE" ? f.fixture.status.elapsed : null, home: f.teams.home, away: f.teams.away, score: { home: f.goals.home, away: f.goals.away } };
}
