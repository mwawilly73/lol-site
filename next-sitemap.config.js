/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://example.com",
  generateRobotsTxt: true,
  exclude: ["/_next/*"],
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
