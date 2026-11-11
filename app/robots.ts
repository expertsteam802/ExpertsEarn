import type { MetadataRoute } from "next";

const SITE_URL = "https://expertsearn.mywire.org";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/dashboard",
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
