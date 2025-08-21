// next.config.ts
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * En DEV :
 *  - PAS de CSP (0 header sécurité) pour laisser HMR/WebSocket fonctionner.
 *
 * En PROD :
 *  - CSP stricte mais pragmatique :
 *      • script-src inclut 'unsafe-inline' pour éviter les erreurs "Refused to execute inline script"
 *        (sinon il faut mettre en place un système de nonce par requête).
 *      • img-src et connect-src autorisent les 2 CDN qu’on utilise (DDragon & CommunityDragon).
 */
const CSP_PROD = [
  "default-src 'self'",
  // 👉 FIX ICI : on ajoute 'unsafe-inline' pour laisser passer les scripts inline nécessaires
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'", // déjà présent (utile si styles inline)
  // 👉 images locales + data + nos CDN
  "img-src 'self' data: blob: https://ddragon.leagueoflegends.com https://raw.communitydragon.org",
  "font-src 'self' data:",
  // 👉 preconnect/fetch côté client vers les mêmes domaines
  "connect-src 'self' https://ddragon.leagueoflegends.com https://raw.communitydragon.org",
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
    remotePatterns: [
      // DDragon (tuiles, splash, data…)
      { protocol: "https", hostname: "ddragon.leagueoflegends.com", pathname: "/**" },
      // CommunityDragon (champion-tiles HQ)
      { protocol: "https", hostname: "raw.communitydragon.org", pathname: "/**" },
    ],
  },
  async headers() {
    if (isDev) return []; // en dev, aucun header de sécurité pour éviter les frictions
    return [
      {
        source: "/:path*",
        headers: securityHeadersProd,
      },
    ];
  },
};

export default nextConfig;
