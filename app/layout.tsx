// app/layout.tsx
import type { Metadata } from "next";
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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const isPreview = process.env.VERCEL_ENV === "preview";


export const metadata: Metadata = {
  title: "LoL Quiz — Accueil",
  description:
    "Jeux et quiz autour des champions de League of Legends. Devine les champions, découvre leurs rôles, et entraîne ta mémoire !",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: "LoL Quiz",
    description:
      "Jeux et quiz autour des champions de League of Legends. Devine les champions et entraîne ta mémoire !",
    type: "website",
    url: "/",
  },
  alternates: { canonical: "/" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const hasAdsense = !!process.env.NEXT_PUBLIC_ADSENSE_PUB_ID;

  const ORG = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LoL Quiz",
    url: SITE_URL,
    logo: `${SITE_URL}/icon.png`,
  };

  const WEBSITE = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "LoL Quiz",
    url: SITE_URL,
  };

  return (
    <html lang="fr" dir="ltr">
      <head>
        {/* PERF: préconnect aux CDN images */}
        <link rel="preconnect" href="https://ddragon.leagueoflegends.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://ddragon.leagueoflegends.com" />
        <link rel="preconnect" href="https://raw.communitydragon.org" crossOrigin="" />
        <link rel="dns-prefetch" href="https://raw.communitydragon.org" />
        {/* Couleur barre d’adresse (mobile) */}
        <meta name="theme-color" content="#0e1117" />
        {/* Noindex explicite en PREVIEW (ceinture+bretelles avec le header) */}
        {isPreview ? <meta name="robots" content="noindex, nofollow, noarchive" /> : null}

        {/* JSON-LD globaux */}
        <JsonLd data={ORG} />
        <JsonLd data={WEBSITE} />
      </head>

      <body className="min-h-dvh bg-[#0e1117] text-white antialiased">
        {/* 🛟 Garde-fou CSS si les styles ne chargent pas */}
        <CssGuard />

        {/* chargés tôt mais “consent-aware” */}
        <AnalyticsLoader />
        <AdsConsentBridge />

        <ConsentDomBridge />
        <AnalyticsBridge />

        {/* Lien d’évitement (invisible sauf au Tab) */}
        <a href="#main" className="skip-link">Aller au contenu principal</a>

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

        {/* ⬇️ Speed Insights : place parfaite */}
        <SpeedInsights />
        
      </body>
    </html>
  );
}
