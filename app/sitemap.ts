// app/sitemap.ts
// Rôle : aider Google à comprendre tes pages clés.
// Tu étendras la liste quand on ajoutera /games/champions, etc.
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const host = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const now = new Date();
  return [
    {
      url: `${host}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${host}/a-propos`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];
}
