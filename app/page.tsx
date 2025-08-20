// app/page.tsx
// Accueil avec CTA "Jouer" qui pointe vers /games/champions.
// Responsive + sémantique propre. Ready pour SEO via Metadata dans layout.

import Link from 'next/link';

export default function HomePage() {
  return (
    <section className="space-y-10">
      {/* Hero */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl md:text-5xl font-extrabold">
          Bienvenue sur <span className="text-white/90">LoL Quiz</span>
        </h1>
        <p className="text-white/80 max-w-2xl mx-auto">
          Devine les champions de League of Legends, explore leurs sorts et leur lore.
          Site rapide, accessible et optimisé SEO.
        </p>
      </div>

      {/* Cartes d’entrée */}
      <div className="grid md:grid-cols-2 gap-6">
        <article className="rounded-2xl p-6 bg-white/5 border border-white/10 hover-lift">
          <h2 className="text-xl font-semibold mb-2">Jeu : Liste des champions</h2>
          <p className="text-sm text-white/80 mb-4">
            Trouve les 171 champions en tapant leurs noms (1 faute autorisée, accents optionnels).
          </p>

          {/* 👉 Lien de jeu actif */}
          <Link
            href="/games/champions"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20"
            aria-label="Commencer le jeu Liste des champions"
          >
            Jouer
          </Link>
        </article>

        <article className="rounded-2xl p-6 bg-white/5 border border-white/10">
          <h2 className="text-xl font-semibold mb-2">Autres jeux (à venir)</h2>
          <p className="text-sm text-white/80">
            Quiz Lore, Sorts, Skins… Reste connecté !
          </p>
        </article>
      </div>

      {/* Placeholder publicitaire (avant AdSense) */}
      <div className="ad-placeholder">
        Espace publicitaire — en attente d’activation AdSense
      </div>
    </section>
  );
}
