# Fútbol Total

Next.js + TypeScript + Tailwind. La clave de API-Football vive solo en el servidor.

## Ejecutar
1. `npm install`
2. `cp .env.example .env.local` (sin clave, la app corre en **modo demostración** con datos ficticios identificados)
3. `npm run dev` y abrir http://localhost:3000
4. Chequeo de tipos: `npm run typecheck`. Build: `npm run build`

## Clave de API-Football (gratis)
1. Crear cuenta en api-football.com y copiar la clave del plan Free (100 solicitudes/día).
2. Pegarla en `.env.local` como `API_FOOTBALL_KEY=...` (sin prefijo NEXT_PUBLIC_) y reiniciar.

## Verificar cobertura real (antes de prometer nada)
- `/api/coverage?ids=128,130,13,11` muestra, por liga, temporadas y qué ofrece la API: eventos, alineaciones, estadísticas de partido y de jugador, tablas, goleadores.
- Los IDs de `FEATURED` en `src/lib/normalize.ts` salen de memoria: confirmalos ahí.
- El plan gratis limita las temporadas disponibles: puede no incluir la actual.

## Rutas del backend
- `/api/fixtures?date=AAAA-MM-DD&tz=...` (1 solicitud por día consultado; `all=1` quita el filtro de ligas)
- `/api/fixture/ID` (eventos, alineaciones, estadísticas y jugadores en 1 solicitud)
- `/api/standings?league=ID&season=AAAA`, `/api/coverage`, `/api/status`

## Cuota y caché
Caché en memoria con vigencia según el caso (partidos pasados 24 h, de hoy 10 min o 2 min si hay alguno en vivo, tablas 6 h), deduplicación de pedidos iguales, tiempo máximo de 8 s, datos guardados si la API falla, y corte al llegar a la reserva (`QUOTA_RESERVE`). La pantalla solo vuelve a consultar cada 2 min y solo si hay partidos en vivo.

## Publicar
Subir a GitHub e importar en Vercel; cargar `API_FOOTBALL_KEY` en Environment Variables. En Vercel cada instancia tiene su propia caché: con mucho tráfico conviene pasarla a Redis (p. ej. Upstash).

## Pendiente
Páginas de detalle, tablas y perfiles en React (hoy en `public/demo.html`, versión demo), notificaciones, usuarios.
