import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: { colors: { bg: "var(--bg)", sf: "var(--sf)", sf2: "var(--sf2)", tx: "var(--tx)", mu: "var(--mu)", ln: "var(--ln)", rd: "var(--rd)", ok: "var(--ok)" } } },
} satisfies Config;
