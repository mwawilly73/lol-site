// app/layout.tsx
// Rôle : structure HTML globale + SEO par défaut (Metadata API) + import Tailwind global.
// - On met des meta Open Graph et Twitter pour un meilleur partage.
// - On prépare un emplacement pour Google AdSense (commenté pour le moment).
// - On garde une structure header/main/footer simple et responsive.

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
// import Script from 'next/script'; // Décommente quand tu activeras AdSense

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  // Titre/description par défaut ; on fera du dynamique page par page plus tard.
  title: 'LoL Quiz — Champions & Jeux',
  description:
    "Site interactif League of Legends : jeux, quiz, et liste des champions. Optimisé SEO, rapide et responsive.",
  metadataBase: new URL('http://localhost:3000'), // ⚠️ change quand tu auras ton vrai domaine
  alternates: { canonical: '/' },
  openGraph: {
    title: 'LoL Quiz — Champions & Jeux',
    description:
      "Devine les champions, découvre leurs sorts et leur lore. Site rapide et optimisé.",
    url: '/',
    siteName: 'LoL Quiz',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LoL Quiz — Champions & Jeux',
    description:
      "Devine les champions, découvre leurs sorts et leur lore. Site rapide et optimisé.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        {/* ---------- (OPTIONNEL) Google AdSense : décommente quand ton site est validé ----------
        <Script
          id="adsense-script"
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=TON_CLIENT_ID"
          crossOrigin="anonymous"
        />
        -------------------------------------------------------------------------------------- */}

        {/* Header du site */}
        <header className="border-b border-white/10 bg-black/20 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
            <a href="/" className="text-xl font-semibold">LoL Quiz</a>
            <nav className="text-sm opacity-80 hover:opacity-100 transition">
              <a href="/" className="px-2">Accueil</a>
              <a href="/a-propos" className="px-2">À propos</a>
            </nav>
          </div>
        </header>

        {/* Contenu principal */}
        <main className="mx-auto max-w-7xl px-4 py-8">
          {children}
        </main>

        {/* Footer simple */}
        <footer className="border-t border-white/10">
          <div className="mx-auto max-w-7xl px-4 py-6 text-sm opacity-70">
            © {new Date().getFullYear()} LoL Quiz — Tous droits réservés.
          </div>
        </footer>
      </body>
    </html>
  );
}
