// app/games/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Index des jeux. On affiche un fil d'Ariane (sauf sur la home) + 2 entrées :
// - Liste des champions
// - Chrono-Break
// ─────────────────────────────────────────────────────────────────────────────

export const metadata = { title: "Jeux — Legends Rift" };

import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function GamesIndex() {
  return (
    <main className="mx-auto max-w-4xl px-3 sm:px-4 py-8">
      {/* Fil d’Ariane */}
      <Breadcrumbs items={[{ label: "Accueil", href: "/" }, { label: "Jeux" }]} />

      <h1 className="text-2xl font-semibold text-white mb-4">Jeux</h1>
      <ul className="space-y-3">
        <li>
          <Link
            href="/games/champions"
            className="block rounded-lg ring-1 ring-white/10 bg-white/5 hover:bg-white/10 px-4 py-3"
          >
            Liste des champions
          </Link>
        </li>
        <li>
          <Link
            href="/games/chrono"
            className="block rounded-lg ring-1 ring-white/10 bg-white/5 hover:bg-white/10 px-4 py-3"
          >
            Chrono-Break
          </Link>
        </li>
         <li>
          <Link
            href="/games/skins"
            className="block rounded-lg ring-1 ring-white/10 bg-white/5 hover:bg-white/10 px-4 py-3"
          >
            Skin Finder
          </Link>
        </li>
      </ul>
    </main>
  );
}
