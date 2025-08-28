// components/SiteFooter.tsx
// Footer minimal, fond plein, responsive, SEO/A11y-friendly.

import Link from "next/link";
import { CookieManageButton } from "@/components/CookieNotice";

export default function SiteFooter() {
  const year = new Date().getFullYear();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

  return (
    <footer
      itemScope
      itemType="https://schema.org/WPFooter"
      role="contentinfo"
      className="relative isolate mt-10 text-xs sm:text-sm"
    >
      <div className="relative z-10 bg-[#0e1117] border-t border-white/10">
        <div className="mx-auto max-w-6xl px-3 sm:px-4 py-4">
          <div className="flex flex-col gap-3 md:gap-0 md:flex-row md:items-center md:justify-between">
            {/* Bloc gauche (identité + court texte) */}
            <div itemScope itemType="https://schema.org/Organization" className="text-white/80">
              <span className="font-semibold text-white">LoL Quiz</span>
              <span className="mx-2 hidden md:inline">•</span>
              <span className="block md:inline">
                Fan-site non affilié à Riot Games.
              </span>
              <meta itemProp="name" content="LoL Quiz" />
              <meta itemProp="url" content={siteUrl} />
            </div>

            {/* Liens (wrap sur mobile) */}
            <nav
              aria-label="Liens de pied de page"
              itemScope
              itemType="https://schema.org/SiteNavigationElement"
              className="flex flex-wrap items-center gap-x-4 gap-y-2 text-white/75"
            >
              <Link href="/" className="hover:text-white transition">Accueil</Link>
              <Link href="/games/champions" className="hover:text-white transition">Jeu : Champions</Link>
              <Link href="/a-propos" className="hover:text-white transition">À propos</Link>
              <Link href="/legal/mentions-legales" className="hover:text-white transition">Mentions légales</Link>
              <Link href="/legal/confidentialite" className="hover:text-white transition">Confidentialité</Link>
              <Link href="/cookies" className="hover:text-white transition">Cookies</Link>
              <a
                href="https://www.riotgames.com/en/legal"
                target="_blank"
                rel="noopener nofollow"
                className="hover:text-white transition"
              >
                Mentions Riot
              </a>
              {/* Gestion des cookies (optionnel si tu utilises CookieNotice) */}
              <CookieManageButton />
            </nav>

            {/* Copyright */}
            <div className="text-white/60">
              © {year} LoL Quiz
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
