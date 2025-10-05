// app/layout.tsx
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import CssGuard from "@/components/CssGuard";
import ConsentDomBridge from "@/components/ConsentDomBridge";
import AnalyticsBridge from "@/components/AnalyticsBridge";
import SiteFooter from "@/components/SiteFooter";
import CookieNotice from "@/components/CookieNotice";
// 🔕 GA direct désactivé : on retire AnalyticsLoader & GaPageview
// import ConsentGtagBridge from "@/components/ConsentGtagBridge"; // Optionnel: tu peux l’enlever si tu fais le Consent Mode dans GTM
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
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID; // ✅ GTM only

export const viewport: Viewport = {
  themeColor: "#0e1117",
  width: "device-width",
  initialScale: 1,
};

// Métadonnées globales
const siteName = "Legends Rift";
const defaultTitle = "Legends Rift — Jeux & Quiz League of Legends";
const defaultDesc =
  "Quiz LoL (League of Legends) en français : devine les champions et leurs spells, révise le lore et les rôles. Jouable sur mobile et PC, avec indices et fautes mineures tolérées.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: defaultTitle,
    template: "%s — Legends Rift",
  },
  description: defaultDesc,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName,
    title: defaultTitle,
    description: defaultDesc,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Legends Rift" }],
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
        {/* Vérification Search Console (prod only) */}
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

        {/* Noindex explicite en PREVIEW */}
        {isPreview ? <meta name="robots" content="noindex, nofollow, noarchive" /> : null}

        {/* Déclaration AdSense (sans script), respect CMP */}
        {hasAdsense ? (
          <meta
            name="google-adsense-account"
            content={`ca-${process.env.NEXT_PUBLIC_ADSENSE_PUB_ID}`}
          />
        ) : null}

        {/* JSON-LD globaux */}
        <JsonLd data={ORG} />
        <JsonLd data={WEBSITE} />

        {/* === GTM: Script (HEAD) === */}
        {GTM_ID ? (
          <Script id="gtm-init" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${GTM_ID}');
            `}
          </Script>
        ) : null}
      </head>

      <body className="min-h-dvh bg-[#0e1117] text-white antialiased">
        {/* === GTM: NoScript (tout en haut du <body>) === */}
        {GTM_ID ? (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        ) : null}

        {/* 🛟 Garde-fou CSS si les styles ne chargent pas */}
        <CssGuard />

        {/* chargés tôt mais “consent-aware” */}
        {/* 🔕 AnalyticsLoader supprimé en mode GTM */}
        <AdsConsentBridge />

        <ConsentDomBridge />
        <AnalyticsBridge />

        {/* Lien d’évitement (invisible sauf au Tab) */}
        <a href="#main" className="skip-link">
          Aller au contenu principal
        </a>

        {/* En-tête global */}
        <SiteHeader />

        {/* Bandeau cookies RGPD (monté côté client) */}
        <ClientMount delayMs={1500}>
          <CookieNotice />
        </ClientMount>

        {/* Optionnel : Bridge Consent → gtag (no-op en GTM si gtag absent)
            Recommandation: gérer Consent Mode DANS GTM (Consent Initialization tag) */}
        {/* <ConsentGtagBridge /> */}

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
