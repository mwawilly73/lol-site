// app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // Host public prioritaire
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const base = raw.replace(/\/+$/, "");
  const isProd = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";

  // En dev/preview : noindex (bloque les bots)
  if (!isProd) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
      sitemap: `${base}/sitemap.xml`,
      host: base,
    };
  }

  // En prod : index ouvert
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
