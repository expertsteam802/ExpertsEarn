import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://experts-earn.vercel.app").replace(/\\/$/, "");
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin/", "/dashboard/", "/wallet/", "/profile/", "/surveys/", "/partners/dashboard", "/login", "/signup"] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
