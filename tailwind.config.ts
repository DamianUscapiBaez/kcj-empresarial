import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Mantener alias existentes para no afectar módulos no rediseñados.
        navy: "#2A323A",
        marine: "#45505A",
        gold: "#A6263A",
        cloud: "#F3F5F7",
        kcj: {
          charcoal: "#2A323A",
          dark: "#303B45",
          red: "#A6263A",
          redDark: "#831E2F",
          redSoft: "#F7E9EC",
          sidebar: "#EAF0F3",
          border: "#DAE1E7",
          silver: "#DCE2E6",
          muted: "#5B6672",
          paper: "#F3F5F7",
        },
      },
      boxShadow: {
        soft: "0 10px 26px -18px rgba(30,36,42,.20)",
        pane: "0 1px 3px rgba(25,33,40,.035), 0 12px 28px -22px rgba(23,31,39,.14)",
      },
    },
  },
  plugins: [],
} satisfies Config;
