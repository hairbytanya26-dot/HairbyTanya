import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Blush background, from the logo
        blush: {
          DEFAULT: "#F7E9E4",
          light: "#FCF4F1",
          dark: "#EFD5CC",
        },
        // "plum" = primary heading/text colour -> charcoal in this brand
        plum: {
          DEFAULT: "#2B2B2B",
          light: "#4A4A4A",
          dark: "#1A1A1A",
        },
        // "mauve" = secondary/script heading colour -> dusty rose
        mauve: {
          DEFAULT: "#C98A78",
          light: "#DDA898",
        },
        // "maroon" = strong accent -> deep terracotta
        maroon: {
          DEFAULT: "#8F5747",
          light: "#A96B59",
        },
        // "rose" = soft accent -> light dusty rose
        rose: {
          DEFAULT: "#E0B3A5",
          light: "#EFD5CC",
        },
        // "glow" = buttons/links/highlight -> terracotta rose from the script logo text
        glow: {
          DEFAULT: "#B97662",
          light: "#D3A192",
          dark: "#8F5747",
        },
      },
      fontFamily: {
        display: ["var(--font-playfair)", "serif"],
        script: ["var(--font-script)", "cursive"],
        body: ["var(--font-lato)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
