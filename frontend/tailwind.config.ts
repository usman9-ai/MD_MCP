import type { Config } from "tailwindcss";
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Martin Dow / Tableau dark navy palette
        navy: {
          950: "#060D1A",
          900: "#0B1220",
          800: "#0D1526",
          700: "#111C30",
          600: "#162138",
          500: "#1C2A47",
          400: "#243355",
        },
        // Tableau orange accent
        amber: {
          500: "#E8871A",
          400: "#F0973A",
          300: "#F5B060",
        },
        // Tableau teal accent
        teal: {
          500: "#1B8FA8",
          400: "#22A8C5",
          300: "#35C0DA",
        },
        // Muted blue for text
        slate: {
          600: "#4A5A7A",
          500: "#5C6E8F",
          400: "#7285A8",
          300: "#8B9BBE",
          200: "#A8B6D0",
          100: "#C8D2E4",
          50:  "#E8EDF6",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-mesh": "radial-gradient(ellipse at 20% 50%, rgba(27,143,168,0.12) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(232,135,26,0.08) 0%, transparent 50%)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-in-left": "slideInLeft 0.3s ease-out",
      },
      keyframes: {
        fadeIn:      { "0%": { opacity: "0" },                          "100%": { opacity: "1" } },
        slideUp:     { "0%": { opacity: "0", transform: "translateY(12px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        slideInLeft: { "0%": { opacity: "0", transform: "translateX(-16px)" }, "100%": { opacity: "1", transform: "translateX(0)" } },
      },
    },
  },
  plugins: [],
};
export default config;
