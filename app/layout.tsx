// app/layout.tsx
// ───────────────────────────────────────────────────────────────
// Layout racine : ajoute un viewport qui désactive le double-tap zoom
// et intègre le header. (Header non-sticky.)
// ───────────────────────────────────────────────────────────────

import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./styles/layout.css";
import SiteHeader from "@/components/SiteHeader";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // ⛔️ désactive pinch/double-tap zoom (meilleure UX “jeu”, moins accessible)
};

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
