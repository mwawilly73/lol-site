// next.config.ts
import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

const isDev = process.env.NODE_ENV !== "production";
const isPreview = process.env.VERCEL_ENV === "preview";

const allowPlausible = !!process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const allowAds = !!process.env.NEXT_PUBLIC_ADSENSE_PUB_ID;

function buildCsp(): string {
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'", // pragmatique (sinon mettre un nonce)
    ...(allowPlausible ? ["https://plausible.io"] : []),
    ...(allowAds ? ["https://pagead2.googlesyndication.com"] : []),
  ];

  const imgSrc = [
    "'self'",
    "data:",
    "blob:",
    "https://ddragon.leagueoflegends.com",
    "https://raw.communitydragon.org",
    ...(allowAds
      ? [
          "https://pagead2.googlesyndication.com",
          "https://googleads.g.doubleclick.net",
          "https://tpc.googlesyndication.com",
        ]
      : []),
  ];

  const connectSrc = [
    "'self'",
    "https://ddragon.leagueoflegends.com",
    "https://raw.communitydragon.org",
    ...(allowPlausible ? ["https://plausible.io"] : []),
    ...(allowAds ? ["https://googleads.g.doubleclick.net"] : []),
  ];

  const frameSrc = [
    "'self'",
    ...(allowAds ? ["https://googleads.g.doubleclick.net", "https://tpc.googlesyndication.com"] : []),
  ];

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "object-src 'none'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imgSrc.join(" ")}`,
    "font-src 'self' data:",
    `connect-src ${connectSrc.join(" ")}`,
    `frame-src ${frameSrc.join(" ")}`,
    "media-src 'self' data: blob:",
    "upgrade-insecure-requests",
  ];

  return directives.join("; ");
}

const securityHeadersProd = [
  { key: "Content-Security-Policy", value: buildCsp() },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  // ➕ NoIndex automatique en PREVIEW
  ...(isPreview ? [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] : []),
];

// Helper qui force le littéral "https"
const rpHttps = (hostname: string, pathname: string = "/**"): RemotePattern => ({
  protocol: "https",
  hostname,
  pathname,
});

const remotePatterns: RemotePattern[] = [
  rpHttps("ddragon.leagueoflegends.com"),
  rpHttps("raw.communitydragon.org"),
  ...(allowAds
    ? [
        rpHttps("pagead2.googlesyndication.com"),
        rpHttps("googleads.g.doubleclick.net"),
        rpHttps("tpc.googlesyndication.com"),
      ]
    : []),
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: false,
    remotePatterns,
  },
  async headers() {
    if (isDev) return []; // en dev: pas de headers de sécu (HMR/WS)
    return [
      {
        source: "/:path*",
        headers: securityHeadersProd,
      },
    ];
  },
};

export default nextConfig;
