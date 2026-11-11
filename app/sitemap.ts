import type { MetadataRoute } from "next";

const SITE_URL = "https://expertsearn.mywire.org";

export default function sitemap(): MetadataRoute.Sitemap {
  const publicPaths = [
    "/",
    "/how-it-works",
    "/about",
    "/contact",
    "/partners",
    "/docs/partner-api",
    "/terms",
    "/privacy",
  ];

  return publicPaths.map((path, index) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: index === 0 ? 1 : 0.6,
  }));
}
