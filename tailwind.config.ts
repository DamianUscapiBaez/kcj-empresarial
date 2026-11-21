import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        kcj: {
          paper: "#F8F9FC",
          red: "#A6192E",
          redDark: "#731022",
          charcoal: "#263238",

          // Colores adicionales utilizados en globals.css
          border: "#E2E8F0",
          muted: "#64748B",
          redSoft: "#FCE8EC",
        },
      },
      boxShadow: {
        pane: "0 4px 20px rgba(15, 23, 42, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
