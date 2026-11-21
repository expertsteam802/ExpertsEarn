import type { MetadataRoute } from "next";

const SITE_URL = "https://www.expertsearn.mywire.org";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/contact", "/how-it-works", "/partners", "/privacy", "/terms", "/docs/"],
        disallow: [
          "/admin",
          "/dashboard",
          "/referrals",
          "/wallet",
          "/profile",
          "/surveys",
          "/partners/dashboard",
          "/partners/apply",
          "/login",
          "/signup",
          "/welcome",
          "/complete",
          "/auth",
          "/api",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
