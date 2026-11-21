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
          paper: "#F1F3F8",
          dark: "#14202D",
          red: "#A6192E",
          redDark: "#731022",
          redSoft: "#FCE8EC",
          charcoal: "#263238",
          border: "#E2E8F0",
          muted: "#64748B"
        }
      },
      boxShadow: {
        pane: "0 4px 20px rgba(15, 23, 42, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
