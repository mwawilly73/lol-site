
// next.config.ts
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * En développement :
 *  - PAS de CSP (0 header sécurité) pour laisser React Refresh/HMR, WebSocket, etc. fonctionner.
 *
 * En production :
 *  - CSP stricte, sans 'unsafe-eval', prête à être ajustée (ex: AdSense) plus tard.
 */

const CSP_PROD = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",  // tu pourras retirer 'unsafe-inline' si tout est purifié
  "img-src 'self' data: blob: https://ddragon.leagueoflegends.com", // 👈 ajout CDN Riot ici
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
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ddragon.leagueoflegends.com",
        pathname: "/**", // 👈 permet toutes les images du CDN Riot
      },
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

