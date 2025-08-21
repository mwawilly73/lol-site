// app/page.tsx
// ───────────────────────────────────────────────────────────────
// Accueil “générique” (pas la description du jeu). On présente
// le site, sa promesse et une entrée vers le jeu existant.
// ───────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Accueil",
  description:
    "LoL Quiz — un projet fan-made qui propose des mini-jeux autour des champions de League of Legends.",
};

export default function HomePage() {
  return (
    <section className="mx-auto max-w-6xl px-3 sm:px-4 py-8 sm:py-12">
      {/* Hero d’accueil */}
      <header className="text-center space-y-3 sm:space-y-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
          Bienvenue sur <span className="text-indigo-400">LoL&nbsp;Quiz</span>
        </h1>
        <p className="text-white/80 max-w-2xl mx-auto">
          Un espace simple et gratuit pour s’amuser autour de l’univers de{" "}
          <span className="font-semibold">League of Legends</span> :
          défis, mini-jeux et découvertes à venir. Projet non officiel, réalisé par un fan.
        </p>
        <p className="text-white/60 text-sm max-w-2xl mx-auto">
          Commence par notre premier mini-jeu, et reste à l’affût pour de nouvelles expériences.
        </p>
      </header>

      {/* Cartes de navigation principales */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Carte — Accès au jeu dispo */}
        <div className="group rounded-2xl ring-1 ring-white/10 bg-white/5 hover:bg-white/10 transition p-5 sm:p-6 flex flex-col">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-indigo-600/90 text-white flex items-center justify-center text-lg font-bold">
              🎮
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold">Liste des champions</h2>
              <p className="text-white/70 text-sm">
                Retourne des cartes en retrouvant le nom des champions.
              </p>
            </div>
          </div>

          <div className="mt-auto pt-4">
            <Link
              href="/games/champions"
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-white font-semibold"
            >
              Jouer maintenant
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>

        {/* Carte — Jeux à venir */}
        <div className="rounded-2xl ring-1 ring-white/10 bg-white/5 p-5 sm:p-6 opacity-80">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-gray-700 text-white/90 flex items-center justify-center text-lg font-bold">
              🧩
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold">Autres jeux</h2>
              <p className="text-white/70 text-sm">De nouveaux modes arriveront prochainement.</p>
            </div>
          </div>

          <div className="mt-4">
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 rounded-md bg-gray-700 px-4 py-2 text-white/70 border border-white/10 cursor-not-allowed"
              title="Bientôt…"
            >
              Bientôt&nbsp;…
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
