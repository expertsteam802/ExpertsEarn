import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: { colors: { forest: "#1B4332", gold: "#F59E0B", mist: "#F9FAFB" }, fontFamily: { sans: ["Inter", "Arial", "sans-serif"] } } },
  plugins: []
};
export default config;