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
        bce: {
          purple: "#8857a4",
          rose: "#ffb4e5",
          red: "#ef404a",
          gold: "#ffcb05",
          orange: "#fd770b",
          green: "#00ae4d",
          "light-blue": "#4fc6e0",
          navy: "#054166",
          "navy-dark": "#02273C",
          cream: "#F7F5F2",
          slate: "#4A5568",
        },
      },
      fontFamily: {
        sans: ["Open Sans", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
