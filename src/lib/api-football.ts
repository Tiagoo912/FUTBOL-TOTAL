// Cliente de API-Football. Solo se usa en el servidor: la clave nunca llega al navegador.
const BASE = process.env.API_FOOTBALL_BASE ?? "https://v3.football.api-sports.io";
const RESERVE = Number(process.env.QUOTA_RESERVE ?? 10);
type Entry = { exp: number; at: number; data: unknown };
const store = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();
export const quota: { daily: number | null; minute: number | null; day: string } = { daily: null, minute: null, day: "" };
export const hasKey = () => Boolean(process.env.API_FOOTBALL_KEY);
export const cacheSize = () => store.size;
export class ApiError extends Error {
  status: number;
  constructor(m: string, status = 502) { super(m); this.status = status; }
}
export type Result<T> = { data: T; at: number; stale: boolean };

/** ttl en segundos, o función que lo calcula a partir de la respuesta. */
export async function af<T>(path: string, params: Record<string, string | number>, ttl: number | ((d: T) => number)): Promise<Result<T>> {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  qs.sort();
  const key = `${path}?${qs}`;
  const hit = store.get(key);
  if (hit && hit.exp > Date.now()) return { data: hit.data as T, at: hit.at, stale: false };
  const stale = (): Result<T> | null => (hit ? { data: hit.data as T, at: hit.at, stale: true } : null);
  const key_ = process.env.API_FOOTBALL_KEY;
  if (!key_) throw new ApiError("Falta API_FOOTBALL_KEY en el servidor", 503);
  const day = new Date().toISOString().slice(0, 10);
  if (quota.day !== day) { quota.day = day; quota.daily = null; }
  if (quota.daily !== null && quota.daily <= RESERVE) {
    const s = stale(); if (s) return s;
    throw new ApiError("Cuota diaria casi agotada; se renueva a las 00:00 UTC", 429);
  }
  const pending = inflight.get(key) as Promise<Result<T>> | undefined;
  if (pending) return pending;
  const run = (async (): Promise<Result<T>> => {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const r = await fetch(`${BASE}${path}?${qs}`, { headers: { "x-apisports-key": key_ }, signal: ctrl.signal, cache: "no-store" }).finally(() => clearTimeout(timer));
      const d = r.headers.get("x-ratelimit-requests-remaining");
      const m = r.headers.get("x-ratelimit-remaining");
      if (d !== null && !Number.isNaN(Number(d))) quota.daily = Number(d);
      if (m !== null && !Number.isNaN(Number(m))) quota.minute = Number(m);
      if (!r.ok) throw new ApiError(`API-Football respondió ${r.status}`, r.status === 429 ? 429 : 502);
      const j = (await r.json()) as { response: T; errors?: unknown };
      const e = j.errors;
      if (Array.isArray(e) ? e.length : e && typeof e === "object" && Object.keys(e).length) throw new ApiError(`API-Football: ${JSON.stringify(e)}`, 502);
      const at = Date.now();
      const secs = typeof ttl === "function" ? ttl(j.response) : ttl;
      if (store.size > 500) { const k = store.keys().next().value; if (k !== undefined) store.delete(k); }
      store.set(key, { exp: at + secs * 1000, at, data: j.response });
      return { data: j.response, at, stale: false };
    } catch (err) {
      const s = stale(); if (s) return s;
      throw err instanceof ApiError ? err : new ApiError("No se pudo conectar con API-Football");
    } finally { inflight.delete(key); }
  })();
  inflight.set(key, run);
  return run;
}
