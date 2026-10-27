import type { Match } from "./types";
// DATOS FICTICIOS: equipos inventados, sin partidos en vivo simulados.
const N = ["Ribera Atlético", "Deportivo Pampa", "Unión del Sur", "Club Sierra", "Estudiantes del Plata", "Real Norte", "Sporting Valle", "Atlético Costa"];
export function demoMatches(date: string): Match[] {
  const past = date < new Date().toLocaleDateString("en-CA");
  const seed = [...date].reduce((a, c) => a + c.charCodeAt(0), 0);
  return [0, 2, 4, 6].map((h, i) => ({
    id: -(i + 1),
    league: i < 2 ? { id: -1, name: "Liga Demo Argentina", country: null, logo: null } : { id: -2, name: "Copa Demo Sudamericana", country: null, logo: null },
    date: `${date}T${["16:00", "18:30", "20:00", "21:30"][i]}:00`,
    status: past ? "FT" : "NS", minute: null,
    home: { id: -(h + 1), name: N[h], logo: null }, away: { id: -(h + 2), name: N[h + 1], logo: null },
    score: past ? { home: (seed + i) % 4, away: (seed * 3 + i) % 3 } : { home: null, away: null },
  }));
}
