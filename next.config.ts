// next.config.ts
// ─────────────────────────────────────────────────────────────────────────────
// PROD : on autorise les scripts inline (unsafe-inline) pour éviter de bloquer
//        les scripts d'hydratation générés par Next.js.
// DEV  : aucun header de sécurité (HMR, React Refresh, etc.)
// On whiteliste aussi les CDNs d’images/fetch (DDragon/CDragon).
// ─────────────────────────────────────────────────────────────────────────────

import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// CDNs que l’on utilise pour images & fetch
const IMG_CDNS = [
  "https://ddragon.leagueoflegends.com",
  "https://raw.communitydragon.org",
];
const CONNECT_CDNS = [
  "https://ddragon.leagueoflegends.com",
  "https://raw.communitydragon.org",
];

// ⚠️ En PROD, autorise les inline-scripts pour Next (sinon page blanche en start)
const CSP_PROD = [
  "default-src 'self'",
  // 👇 Fix principal : permet aux scripts inline de Next de s’exécuter
  "script-src 'self' 'unsafe-inline'",
  // Tailwind/inline styles
  "style-src 'self' 'unsafe-inline'",
  // Images locales + CDNs LoL
  `img-src 'self' data: blob: ${IMG_CDNS.join(" ")}`,
  "font-src 'self' data:",
  // fetch vers DDragon/CDragon (lore, etc.)
  `connect-src 'self' ${CONNECT_CDNS.join(" ")}`,
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
    // Next/Image : autoriser nos 2 CDNs d’images
    remotePatterns: [
      { protocol: "https", hostname: "ddragon.leagueoflegends.com", pathname: "/**" },
      { protocol: "https", hostname: "raw.communitydragon.org", pathname: "/**" },
    ],
  },
  async headers() {
    if (isDev) return []; // DEV : pas de headers CSP
    return [{ source: "/:path*", headers: securityHeadersProd }];
  },
};

export default nextConfig;
