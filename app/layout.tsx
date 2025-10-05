// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import CssGuard from "@/components/CssGuard";
import ConsentDomBridge from "@/components/ConsentDomBridge";
import AnalyticsBridge from "@/components/AnalyticsBridge";
import SiteFooter from "@/components/SiteFooter";
import CookieNotice from "@/components/CookieNotice";
import ConsentGtagBridge from "@/components/ConsentGtagBridge";
import AnalyticsLoader from "@/components/AnalyticsLoader";
import AdsConsentBridge from "@/components/AdsConsentBridge";
import AdSenseAuto from "@/components/AdSenseAuto";
import ClientMount from "@/components/ClientMount";
import JsonLd from "@/components/JsonLd";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

// Résolution d'URL propre (prod > preview > dev)
const RAW_HOST =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

const SITE_URL = RAW_HOST.replace(/\/+$/, "");
const isPreview = process.env.VERCEL_ENV === "preview";
const hasAdsense = !!process.env.NEXT_PUBLIC_ADSENSE_PUB_ID;

// (Optionnel) Déclare un viewport explicite
export const viewport: Viewport = {
  themeColor: "#0e1117",
  width: "device-width",
  initialScale: 1,
};

// Métadonnées globales
const siteName = "Legends Rift";
const defaultTitle = "Legends Rift — Jeux & Quiz League of Legends";
const defaultDesc =
  "Jeux et quiz autour des champions de League of Legends. Devine les champions, découvre leurs rôles et leur lore, en français.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: defaultTitle,
    template: "%s — Legends Rift",
  },
  description: defaultDesc,
  alternates: {
    canonical: "/", // avec metadataBase, cela pointe vers SITE_URL/
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName,
    title: defaultTitle,
    description: defaultDesc,
    images: [
      // place un fichier public/og.jpg
      { url: "/og.jpg", width: 1200, height: 630, alt: "Legends Rift" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDesc,
    images: ["/og.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // JSON-LD organisation + website
  const ORG = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: SITE_URL,
    logo: `${SITE_URL}/icon.png`,
  };

  const WEBSITE = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: SITE_URL,
  };

  return (
    <html lang="fr" dir="ltr">
      <head>

        {process.env.NODE_ENV === "production" ? (
        <meta
        name="google-site-verification"
        content="GZOWd8_r_248eI4etmNmX0znAhTsbVB-OzIcqhE8bs0"
        />
      ) : null}

        {/* PERF: préconnect aux CDN images */}
        <link rel="preconnect" href="https://ddragon.leagueoflegends.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://ddragon.leagueoflegends.com" />
        <link rel="preconnect" href="https://raw.communitydragon.org" crossOrigin="" />
        <link rel="dns-prefetch" href="https://raw.communitydragon.org" />

        {/* Couleur barre d’adresse (mobile) */}
        <meta name="theme-color" content="#0e1117" />

        {/* Noindex explicite en PREVIEW (ceinture+bretelles avec header Vercel) */}
        {isPreview ? <meta name="robots" content="noindex, nofollow, noarchive" /> : null}

        {/* Déclaration AdSense (sans script), respect CMP */}
        {hasAdsense ? (
          <meta
            name="google-adsense-account"
            content={`ca-${process.env.NEXT_PUBLIC_ADSENSE_PUB_ID}`} // ex: ca-pub-1234567890123456
          />
        ) : null}

        {/* JSON-LD globaux */}
        <JsonLd data={ORG} />
        <JsonLd data={WEBSITE} />
      </head>

      {/* ⚠️ Tu avais "overflow-y-scroll" (force la scrollbar). 
          Pour éviter la barre forcée en desktop, on laisse le comportement natif (auto). */}
      <body className="min-h-dvh bg-[#0e1117] text-white antialiased">
        {/* 🛟 Garde-fou CSS si les styles ne chargent pas */}
        <CssGuard />

        {/* chargés tôt mais “consent-aware” */}
        <AnalyticsLoader />
        <AdsConsentBridge />

        <ConsentDomBridge />
        <AnalyticsBridge />

        {/* Lien d’évitement (invisible sauf au Tab) */}
        <a href="#main" className="skip-link">
          Aller au contenu principal
        </a>

        {/* En-tête global */}
        <SiteHeader />

        {/* Bandeau cookies RGPD (monté côté client avec délai pour ne pas impacter le LCP) */}
        <ClientMount delayMs={1500}>
          <CookieNotice />
        </ClientMount>

        {/* 🔌 Bridge Consent → gtag (no-op si gtag absent) */}
        <ConsentGtagBridge />

        {/* Contenu principal */}
        <main id="main" tabIndex={-1} className="mx-auto max-w-6xl px-3 sm:px-4 py-6">
          {children}
        </main>

        {/* Pied de page */}
        <SiteFooter />

        {/* Publicités AdSense Auto (prod + env présent) */}
        {process.env.NODE_ENV === "production" && hasAdsense ? <AdSenseAuto /> : null}

        {/* ⬇️ Speed Insights */}
        <SpeedInsights />

        {/* ⬇️ Vercel Analytics (optionnel) */}
        <Analytics />
      </body>
    </html>
  );
}
