import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./store/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0A0A0A",
          2: "#525252",
          3: "#a3a3a3",
        },
        rule: {
          DEFAULT: "#ededed",
          2: "#f5f5f5",
        },
        brand: {
          DEFAULT: "#2D0D50",
          50: "#F8F2FB",
          100: "#EDE3F4",
          600: "#5C3373",
          700: "#3D1668",
        },
        // legacy aliases so existing pages don't break while we re-style them
        bone: "#ffffff",
        cream: "#fafafa",
        accent: "#0A0A0A",
        purple: {
          DEFAULT: "#2D0D50",
          50: "#F8F2FB",
          100: "#EDE3F4",
          200: "#E8D5F5",
          300: "#C8A8DD",
          600: "#5C3373",
          700: "#3D1668",
          800: "#2D0D50",
          900: "#1A0730",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        display: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        tightest: "-0.04em",
        tighter: "-0.025em",
      },
    },
  },
  plugins: [],
};

export default config;
