// app/robots.ts
// Rôle : laissez indexer l’ensemble du site et pointez vers le sitemap généré.
// ⚠️ Remplace NEXT_PUBLIC_SITE_URL en prod.
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const host = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${host}/sitemap.xml`,
    host,
  };
}
