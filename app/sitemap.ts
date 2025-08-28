// app/sitemap.ts
// Sitemap propre avec toutes les pages clés.
// Utilise NEXT_PUBLIC_SITE_URL en prod (fallback localhost en dev).

import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  const now = new Date();

  return [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/a-propos`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${base}/games/champions`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },

    { url: `${base}/legal`, 
      lastModified: now, 
      changeFrequency: 'monthly', 
      priority: 0.3 
    },

    {
      url: `${base}/legal/mentions-legales`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${base}/legal/confidentialite`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
