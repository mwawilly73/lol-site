// app/layout.tsx
// ─────────────────────────────────────────────────────────────
// Layout racine (App Router Next 15)
// - Monte le header global (SiteHeader)
// - Préconnecte les CDN (DDragon & CommunityDragon) pour perfs
// - Importe le CSS global depuis app/globals.css (chemin CORRECT)
// ─────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import "./globals.css"; // ✅ chemin correct (fichier placé directement dans /app)
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "LoL Quiz — Accueil",
  description:
    "Jeux et quiz autour des champions de League of Legends. Devine les champions, découvre leurs rôles, et entraîne ta mémoire !",
  // Mets ton vrai domaine si tu en as un, sinon laisse localhost pour le dev
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
        {/* PERF: préconnect aux CDN images pour réduire la latence TCP/TLS */}
        <link rel="preconnect" href="https://ddragon.leagueoflegends.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://ddragon.leagueoflegends.com" />
        <link rel="preconnect" href="https://raw.communitydragon.org" crossOrigin="" />
        <link rel="dns-prefetch" href="https://raw.communitydragon.org" />
      </head>

      <body className="min-h-dvh bg-[#0e1117] text-white antialiased">
        {/* Header global */}
        <SiteHeader />

        {/* Contenu des pages */}
        <main className="mx-auto max-w-6xl px-3 sm:px-4 py-6">
          {children}
        </main>

        <footer className="mt-10 border-t border-white/10 py-6 text-center text-sm text-white/60">
          Projet fan-made non affilié à Riot Games.
        </footer>
      </body>
    </html>
  );
}
