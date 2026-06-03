import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#e8f0f8",
          100: "#c5d8ee",
          200: "#9fbde3",
          300: "#79a2d7",
          400: "#5a8dce",
          500: "#3b78c5",
          600: "#2f67ab",
          700: "#245490",
          800: "#1a4276",
          900: "#1F4E79",
        },
      },
    },
  },
  plugins: [],
};

export default config;
