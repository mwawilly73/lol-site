// components/SiteFooter.tsx
// Footer compact, fond plein (comme le header), responsive, SEO/A11y friendly.
// Le fond du site n’empiète pas (isolate + bg plein + z-index).

import Link from "next/link";

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      itemScope
      itemType="https://schema.org/WPFooter"
      role="contentinfo"
      className="relative isolate mt-10 text-xs sm:text-sm"
    >
      {/* filet haut */}
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
        aria-hidden="true"
      />
      {/* bloc fond plein : empêche toute “transparence” de l’image de fond globale */}
      <div className="relative z-10 bg-[#0e1117]">
        <div className="mx-auto max-w-6xl px-3 sm:px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Identité */}
            <section itemScope itemType="https://schema.org/Organization">
              <div className="font-semibold text-white">LoL Quiz</div>
              <p className="mt-1 text-white/70">
                Mini-jeux & quiz non officiels autour des champions de League of Legends.
              </p>
              {/* micro-données */}
              <meta itemProp="name" content="LoL Quiz" />
              <meta itemProp="url" content="https://lol-quiz.example.com" />
            </section>

            {/* Navigation de pied */}
            <nav
              aria-label="Liens de pied de page"
              itemScope
              itemType="https://schema.org/SiteNavigationElement"
              className="flex flex-wrap items-center gap-x-4 gap-y-2"
            >
              <Link className="hover:text-white transition-colors" href="/" itemProp="url">
                <span itemProp="name">Accueil</span>
              </Link>
              <Link className="hover:text-white transition-colors" href="/games/champions" itemProp="url">
                <span itemProp="name">Jeu : Champions</span>
              </Link>
              <Link className="hover:text-white transition-colors" href="/a-propos" itemProp="url">
                <span itemProp="name">À propos</span>
              </Link>
              <a
                className="hover:text-white transition-colors"
                href="https://www.riotgames.com/en/legal"
                target="_blank"
                rel="noopener nofollow"
              >
                Mentions Riot
              </a>
            </nav>

            {/* Légal / info SEO */}
            <section className="text-white/70">
              <p>
                Projet fan-made non affilié à Riot Games. League of Legends et Riot Games
                sont des marques de Riot Games, Inc.
              </p>
            </section>
          </div>

          {/* Bas de pied */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-white/60">
            <div>© {year} LoL Quiz. Tous droits réservés.</div>
            <div className="text-center sm:text-right">
              <span className="hidden sm:inline">Fait avec ❤️ pour la commu.</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
