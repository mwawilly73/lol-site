/** @type {import('next-sitemap').IConfig} */
const isProd = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';

module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://legendsrift.com",
  generateRobotsTxt: isProd, // ✅ robots.txt écrit seulement en prod (sinon robots.ts fera foi)
  changefreq: 'weekly',
  sitemapSize: 7000,

  // Optionnel: exclure opengraph-image/icônes pour alléger
  exclude: ["/_next/*" , "/opengraph-image" , "/games/*/opengraph-image"],
  transform: async (config, path) => {
    const isGame = path.startsWith("/games");
    return {
      loc: path,
      changefreq: isGame ? "weekly" : "monthly",
      priority: isGame ? 0.8 : 0.7,
      lastmod: new Date().toISOString(),
    };
  },
};
