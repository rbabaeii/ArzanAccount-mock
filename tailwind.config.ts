import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        slate: {
          850: "#172033",
        },
        // Storefront Sefid & Teal Tokens
        store: {
          bg: "#f8fafc",
          primary: "#005a71",
          secondary: "#212529",
          muted: "#64748b",
          border: "#e2e8f0",
          borderLight: "#f1f5f9",
          accent: "#d97706",
        },
        // Cohesive Stitch Palette (Teal Primary + Amber Complementary)
        brand: {
          primary: "#005a71",
          primaryDark: "#004153",
          primaryContainer: "#0e7490",
          primaryLight: "#e0f2fe",
          secondary: "#21667d",
          accent: "#d97706",
          accentHover: "#b45309",
          accentLight: "#fef3c7",
          dark: "#0f172a",
          muted: "#475569",
          mutedLight: "#94a3b8",
          surface: "#ffffff",
          surfaceDim: "#f8fafc",
          surfaceTeal: "#f0fdfa",
          border: "#e2e8f0",
          borderTeal: "#ccfbf1",
          borderDark: "#cbd5e1",
        },
        // Admin Specific UI tokens
        admin: {
          primary: "#005a71",
          primaryDark: "#004153",
          primaryContainer: "#0e7490",
          secondary: "#21667d",
          bg: "#f8fafc",
          surface: "#ffffff",
          container: "#f1f5f9",
          containerHighest: "#e2e8f0",
          text: "#0f172a",
          textMuted: "#475569",
          border: "#e2e8f0",
          borderLight: "#f1f5f9",
          danger: "#ba1a1a",
          success: "#15803d",
          warning: "#b45309",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-vazirmatn)",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "Vazirmatn",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px 0 rgba(0, 0, 0, 0.04)",
        cardHover: "0 10px 25px -5px rgba(0, 90, 113, 0.1), 0 8px 10px -6px rgba(0, 90, 113, 0.05)",
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.08)",
        "glass-dark": "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "3d": "0 20px 25px -5px rgba(0, 90, 113, 0.15), 0 8px 10px -6px rgba(0, 90, 113, 0.1)",
        "3d-hover": "0 25px 35px -5px rgba(0, 90, 113, 0.25), 0 15px 15px -7px rgba(0, 90, 113, 0.15)",
        "glow-teal": "0 0 25px -5px rgba(14, 116, 144, 0.45)",
        "glow-amber": "0 0 25px -5px rgba(217, 119, 6, 0.4)",
        "glow-purple": "0 0 25px -5px rgba(124, 58, 237, 0.35)",
      },
      animation: {
        "float-slow": "floatSlow 6s ease-in-out infinite",
        "float-delayed": "floatSlow 7s ease-in-out 2s infinite",
        "glow-pulse": "glowPulse 4s ease-in-out infinite",
      },
      keyframes: {
        floatSlow: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "0.9", transform: "scale(1.04)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
