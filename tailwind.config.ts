import type { Config } from "tailwindcss";
const config:Config={content:["./app/**/*.{js,ts,jsx,tsx,mdx}","./components/**/*.{js,ts,jsx,tsx,mdx}"],theme:{extend:{colors:{forest:"#c6a873",gold:"#d5bd91",mist:"#111219",ink:"#090a0f",ivory:"#f2ecdf"},fontFamily:{sans:["DM Sans","Arial","sans-serif"]},boxShadow:{cinematic:"0 24px 80px rgba(0,0,0,.32)"}}},plugins:[]};export default config;
