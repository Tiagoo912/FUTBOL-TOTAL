"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Envelope, Match } from "@/lib/types";

const iso = (d: Date) => d.toLocaleDateString("en-CA");
const shift = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
const hm = (s: string) => new Date(s).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

function Crest({ name, logo, size = 44 }: { name: string; logo: string | null; size?: number }) {
  const [bad, setBad] = useState(false);
  if (logo && !bad) return <img src={logo} alt={`Escudo de ${name}`} loading="lazy" onError={() => setBad(true)} className="object-contain" style={{ width: size, height: size }} />;
  return <span aria-hidden className="grid place-items-center bg-rd font-bold text-white" style={{ width: size, height: size * 1.1, clipPath: "polygon(0 0,100% 0,100% 62%,50% 100%,0 62%)", fontSize: size / 3.4 }}>{name.slice(0, 3).toUpperCase()}</span>;
}

function Card({ m, fav, onFav }: { m: Match; fav: Record<string, boolean>; onFav: (id: number) => void }) {
  const ns = m.status === "NS" || m.status === "PST";
  const { home: h, away: a } = m.score;
  const w = m.status === "FT" && h !== null && a !== null ? (h > a ? 1 : h < a ? 2 : 0) : -1;
  const label = { LIVE: `EN VIVO · ${m.minute ?? "–"}'`, FT: "FINALIZADO", NS: "PRÓXIMO", PST: "APLAZADO", SUS: "SUSPENDIDO", OTHER: "CANCELADO" }[m.status];
  const side = (t: Match["home"], lose: boolean, win: boolean) => (
    <div className={`flex flex-col items-center gap-1 text-center text-sm font-semibold ${lose ? "opacity-55" : ""}`}>
      <Crest name={t.name} logo={t.logo} />
      <span className={win ? "border-b-2 border-rd" : ""}>{t.name}</span>
      {t.id > 0 && <button onClick={() => onFav(t.id)} aria-pressed={!!fav[t.id]} aria-label={`${fav[t.id] ? "Quitar de favoritos" : "Agregar a favoritos"} ${t.name}`} className="min-h-[44px] min-w-[44px] text-xl text-mu aria-pressed:text-rd">{fav[t.id] ? "★" : "☆"}</button>}
    </div>);
  return (
    <article className="overflow-hidden rounded-xl border border-ln bg-sf">
      <div className="flex items-center justify-between gap-2 bg-sf2 px-3 py-2 text-xs text-mu">
        <span className="truncate">{m.league.name}</span>
        <span className={`whitespace-nowrap rounded-full border px-2 py-0.5 font-bold ${m.status === "LIVE" ? "border-rd bg-rd text-white" : "border-ln bg-sf text-tx"}`}>{m.status === "LIVE" && <i className="blink mr-1 inline-block h-1.5 w-1.5 rounded-full bg-white" />}{label}</span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-2 pb-2 pt-3">
        {side(m.home, w === 2, w === 1)}
        <div className="min-w-[88px] text-center text-4xl font-bold tabular-nums">{ns ? hm(m.date) : <>{h ?? "–"} - {a ?? "–"}</>}</div>
        {side(m.away, w === 1, w === 2)}
      </div>
      <div className="px-3 pb-3 text-xs text-mu">{new Date(m.date).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })} · hora local</div>
    </article>);
}

export default function Home() {
  const tz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const [date, setDate] = useState(iso(new Date()));
  const [env, setEnv] = useState<Envelope<Match[]> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [onlyFav, setOnlyFav] = useState(false);
  const [fav, setFav] = useState<Record<string, boolean>>({});

  useEffect(() => { try { setFav(JSON.parse(localStorage.getItem("ft-fav") ?? "{}")); } catch { /* sin almacenamiento */ } }, []);
  const toggleFav = (id: number) => setFav((f) => { const n = { ...f, [id]: !f[id] }; try { localStorage.setItem("ft-fav", JSON.stringify(n)); } catch { /* ignorar */ } return n; });
  const toggleTheme = () => { const l = document.documentElement.classList.toggle("light"); try { localStorage.setItem("ft-th", l ? "light" : "dark"); } catch { /* ignorar */ } };

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/fixtures?date=${date}&tz=${encodeURIComponent(tz)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? `Error ${r.status}`);
      setEnv(j); setErr(null);
    } catch (e) { setErr(e instanceof Error ? e.message : "Error de red"); } finally { setLoading(false); }
  }, [date, tz]);
  useEffect(() => { setLoading(true); load(); }, [load]);
  const hasLive = !!env?.data.some((m) => m.status === "LIVE");
  useEffect(() => {
    if (!hasLive || date !== iso(new Date())) return;
    const t = setInterval(() => { if (!document.hidden) load(); }, 120000);
    return () => clearInterval(t);
  }, [hasLive, date, load]);

  const isFav = (m: Match) => !!(fav[m.home.id] || fav[m.away.id]);
  const groups = useMemo(() => {
    const t = q.trim().toLowerCase();
    const list = (env?.data ?? []).filter((m) => (!t || [m.home.name, m.away.name, m.league.name].some((s) => s.toLowerCase().includes(t))) && (!onlyFav || isFav(m)));
    const g = new Map<number, { league: Match["league"]; items: Match[] }>();
    for (const m of list) { const e = g.get(m.league.id) ?? { league: m.league, items: [] }; e.items.push(m); g.set(m.league.id, e); }
    return [...g.values()].map((x) => ({ ...x, items: x.items.sort((a, b) => Number(isFav(b)) - Number(isFav(a)) || a.date.localeCompare(b.date)) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [env, q, onlyFav, fav]);
  const live = (env?.data ?? []).filter((m) => m.status === "LIVE");
  const chip = (on: boolean) => `min-h-[44px] rounded-full border px-4 ${on ? "border-rd bg-rd text-white" : "border-ln bg-sf"}`;

  return (
    <>
      <header className="sticky top-0 z-10 border-b-[3px] border-rd bg-[#0d0d0f] px-3 py-2 text-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-wide">FÚTBOL <span className="text-rd">TOTAL</span></h1>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar equipos o ligas" aria-label="Buscar equipos o ligas" className="min-h-[44px] min-w-[150px] flex-1 rounded-lg border border-[#34343a] bg-[#1d1d21] px-3 text-white" />
          <button onClick={() => setOnlyFav((v) => !v)} aria-pressed={onlyFav} aria-label="Mostrar solo favoritos" className="min-h-[44px] min-w-[44px] rounded-lg border border-[#34343a] bg-[#1d1d21] text-lg aria-pressed:text-rd">★</button>
          <button onClick={toggleTheme} className="min-h-[44px] rounded-lg border border-[#34343a] bg-[#1d1d21] px-3">Tema</button>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-3 pb-10">
        {env?.source === "demo" && <p role="note" className="my-3 rounded-md border-l-4 border-rd bg-sf2 p-3 text-sm text-mu"><strong className="text-tx">Modo demostración.</strong> Equipos y resultados son ficticios. Configurá API_FOOTBALL_KEY en el servidor para ver datos reales.</p>}
        {env?.source === "api-football" && <p className="my-3 text-sm text-mu">Datos de API-Football · actualizado {new Date(env.updatedAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}{env.stale && " · mostrando datos guardados (la API no respondió)"}{env.quota.daily !== null && ` · solicitudes restantes hoy: ${env.quota.daily}`}</p>}
        <div className="flex flex-wrap gap-2 py-2" role="group" aria-label="Elegir día">
          {([[-1, "Ayer"], [0, "Hoy"], [1, "Mañana"]] as const).map(([n, l]) => <button key={n} onClick={() => setDate(shift(n))} aria-pressed={date === shift(n)} className={chip(date === shift(n))}>{l}</button>)}
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Elegir otra fecha" className="min-h-[44px] rounded-full border border-ln bg-sf px-3" />
        </div>
        {loading && <p className="py-10 text-center text-mu">Cargando partidos…</p>}
        {err && <p role="alert" className="my-3 rounded-md border border-rd p-3 text-sm">No pudimos cargar los partidos: {err}. <button onClick={() => { setLoading(true); load(); }} className="font-semibold text-rd underline">Reintentar</button></p>}
        {!loading && !err && live.length > 0 && <><h2 className="mb-2 mt-5 text-xl font-bold">En vivo ahora</h2><div className="grid gap-3 sm:grid-cols-2">{live.map((m) => <Card key={m.id} m={m} fav={fav} onFav={toggleFav} />)}</div></>}
        {!loading && !err && groups.map((g) => (
          <section key={g.league.id}>
            <h2 className="mb-2 mt-6 flex items-center gap-2 border-b border-ln pb-1 text-xl font-bold">{g.league.logo && <img src={g.league.logo} alt="" className="h-6 w-6 object-contain" />}{g.league.name}</h2>
            <div className="grid gap-3 sm:grid-cols-2">{g.items.map((m) => <Card key={m.id} m={m} fav={fav} onFav={toggleFav} />)}</div>
          </section>))}
        {!loading && !err && groups.length === 0 && <p className="py-10 text-center text-mu">No hay partidos para mostrar con estos filtros.</p>}
        <p className="mt-10 text-center text-sm text-mu">Detalle, tablas y perfiles: <a className="text-rd underline" href="/demo.html">versión demo completa</a></p>
      </main>
    </>);
}
