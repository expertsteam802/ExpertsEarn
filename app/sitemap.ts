import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://experts-earn.vercel.app").replace(/\\/$/, "");
  const pages = ["/", "/how-it-works", "/about", "/contact", "/partners", "/docs/partner-api", "/terms", "/privacy"];
  return pages.map((path) => ({ url: `${base}${path}`, changeFrequency: path === "/" ? "weekly" : "monthly", priority: path === "/" ? 1 : path === "/how-it-works" ? 0.9 : 0.6 }));
}
