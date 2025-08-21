// next.config.ts
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Sources images autorisées en production (CSP).
 * ⚠️ Si tu ajoutes d’autres CDNs plus tard, mets-les aussi ici.
 */
const IMG_SOURCES = [
  "'self'",
  "data:",
  "blob:",
  "https://ddragon.leagueoflegends.com",
  "https://raw.communitydragon.org",
  "https://static.u.gg",
];

/**
 * En développement :
 *  - PAS de CSP pour laisser HMR/React Refresh/WS fonctionner.
 *
 * En production :
 *  - CSP stricte mais compatible avec nos images externes.
 */
const CSP_PROD = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'", // tu pourras retirer 'unsafe-inline' si tout est purifié
  `img-src ${IMG_SOURCES.join(" ")}`, // 👈 aligne avec images.remotePatterns
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-src 'self'",
].join("; ");

const securityHeadersProd = [
  { key: "Content-Security-Policy", value: CSP_PROD },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: false,
    /**
     * CDNs autorisés pour next/image
     * - DDragon (portraits, passives, sorts)
     * - CommunityDragon (assets alternatifs, raw)
     * - U.GG (si un jour tu veux illustrer des builds/meta)
     *
     * Si tu ajoutes un domaine, pense à :
     *  1) L’ajouter ici
     *  2) L’ajouter dans IMG_SOURCES (CSP) ci-dessus
     */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ddragon.leagueoflegends.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "raw.communitydragon.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "static.u.gg",
        pathname: "/**",
      },

      // Exemple pour en ajouter un 4e plus tard :
      // {
      //   protocol: "https",
      //   hostname: "opgg-static.akamaized.net",
      //   pathname: "/**",
      // },
    ],
  },

  async headers() {
    // 👉 En DEV: aucun header sécurité (retourne un tableau vide)
    if (isDev) return [];
    // 👉 En PROD: applique les headers sécurité
    return [
      {
        source: "/:path*",
        headers: securityHeadersProd,
      },
    ];
  },
};

export default nextConfig;
