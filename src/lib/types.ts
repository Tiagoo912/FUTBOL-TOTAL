export type Team = { id: number; name: string; logo: string | null };
export type Status = "LIVE" | "FT" | "NS" | "PST" | "SUS" | "OTHER";
export type Match = {
  id: number;
  league: { id: number; name: string; country: string | null; logo: string | null };
  date: string; status: Status; minute: number | null; home: Team; away: Team;
  score: { home: number | null; away: number | null };
};
export type Envelope<T> = {
  source: "api-football" | "demo"; updatedAt: number; stale: boolean;
  quota: { daily: number | null; minute: number | null }; data: T;
};
