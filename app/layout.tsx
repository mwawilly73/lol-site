// app/layout.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Layout racine : importe les styles globaux + styles de layout, et pose le header.
// Pas d’inline script → compatible avec ta CSP actuelle.
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import "./globals.css";          // tes styles globaux EXISTANTS (on n’y touche pas)
import "./styles/layout.css";    // petit fichier CSS “layout” (créé ci-dessous)
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: {
    default: "LoL Quiz",
    template: "%s | LoL Quiz",
  },
  description:
    "Deviens incollable sur les champions de League of Legends avec LoL Quiz.",
  alternates: { canonical: "/" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-dvh bg-gradient-to-b from-[#0b0d12] to-[#0b0d12] text-white antialiased">
        <SiteHeader />
        <main className="site-main">{children}</main>
        <footer className="site-footer">
          <div className="mx-auto max-w-6xl px-3 sm:px-4 py-6 text-center text-white/60 text-sm">
            © {new Date().getFullYear()} LoL Quiz — Projet personnel non affilié à Riot Games.
          </div>
        </footer>
      </body>
    </html>
  );
}
