import "./globals.css";
import type { Metadata, Viewport } from "next";
export const metadata: Metadata = { title: "Fútbol Total", description: "Resultados, estadísticas y tablas de fútbol" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };
const init = `try{if(localStorage.getItem("ft-th")==="light")document.documentElement.classList.add("light")}catch(e){}`;
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="es" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: init }} /></head><body>{children}</body></html>);
}
