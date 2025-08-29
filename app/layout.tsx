// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import CssGuard from "@/components/CssGuard";
import SiteFooter from "@/components/SiteFooter";
import CookieNotice from "@/components/CookieNotice";

export const metadata: Metadata = {
  title: "LoL Quiz — Accueil",
  description:
    "Jeux et quiz autour des champions de League of Legends. Devine les champions, découvre leurs rôles, et entraîne ta mémoire !",
  metadataBase: new URL("http://localhost:3000"),
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
  return (
    <html lang="fr">
      <head>
        {/* PERF: préconnect aux CDN images */}
        <link rel="preconnect" href="https://ddragon.leagueoflegends.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://ddragon.leagueoflegends.com" />
        <link rel="preconnect" href="https://raw.communitydragon.org" crossOrigin="" />
        <link rel="dns-prefetch" href="https://raw.communitydragon.org" />
        {/* Couleur barre d’adresse (mobile) */}
        <meta name="theme-color" content="#0e1117" />
      </head>

      <body className="min-h-dvh bg-[#0e1117] text-white antialiased">
        {/* 🛟 Garde-fou CSS si les styles ne chargent pas */}
        <CssGuard />

        {/* Lien d’évitement (invisible sauf au Tab) */}
        <a href="#main" className="skip-link">Aller au contenu principal</a>

        {/* En-tête global */}
        <SiteHeader />

        {/* Bannière cookies RGPD */}
        <CookieNotice />

        {/* Contenu principal */}
        <main id="main" tabIndex={-1} className="mx-auto max-w-6xl px-3 sm:px-4 py-6">
          {children}
        </main>

        {/* Pied de page soigné */}
        <SiteFooter />
      </body>
    </html>
  );
}
