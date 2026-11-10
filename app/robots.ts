import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const configured = process.env.NEXT_PUBLIC_APP_URL || "https://experts-earn.vercel.app";
  const base = configured.endsWith("/") ? configured.slice(0, -1) : configured;
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin/", "/dashboard/", "/wallet/", "/profile/", "/surveys/", "/partners/dashboard", "/login", "/signup"] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}