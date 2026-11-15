import type { MetadataRoute } from "next";

const SITE_URL = "https://expertsearn.mywire.org";

export default function sitemap(): MetadataRoute.Sitemap {
  const publicPages = [
    { path: "/", priority: 1, changeFrequency: "weekly" as const },
    { path: "/how-it-works", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/partners", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/about", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/contact", priority: 0.6, changeFrequency: "yearly" as const },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/docs/partner-api", priority: 0.5, changeFrequency: "monthly" as const },
  ];

  return publicPages.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency,
    priority,
  }));
}
