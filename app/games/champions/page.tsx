// app/games/champions/page.tsx
export const runtime = "nodejs";

import type { Metadata } from "next";
import { getChampionsFromDisk } from "@/lib/champions";
import ChampionsGame from "./ChampionsGame";

export const metadata: Metadata = {
  title: "Jeu — Liste des Champions | LoL Quiz",
  description:
    "Devine les 171 champions de League of Legends : tape leur nom (1 faute autorisée, accents optionnels) pour retourner chaque carte.",
  alternates: { canonical: "/games/champions" },
  openGraph: {
    title: "Jeu — Liste des Champions | LoL Quiz",
    description: "Devine les 171 champions : écris leur nom pour révéler chaque carte !",
    url: "/games/champions",
    type: "website",
  },
};

export default async function ChampionsPage() {
  const champions = await getChampionsFromDisk();
  const TARGET_TOTAL = 171;

  return (
    <section className="space-y-6 container-lg">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl md:text-3xl font-bold">Liste des Champions</h1>
        <p className="text-white/80">
          Écris le nom exact d’un champion (1 faute autorisée, accents optionnels) pour retourner sa carte.
        </p>
      </header>

      {champions.length === 0 && (
        <div className="badge danger">
          ⚠️ Aucun champion chargé. Vérifie que <code>data/champions/*.json</code> existent
          et relance le serveur (<code>npm run dev</code>).
        </div>
      )}

      <ChampionsGame initialChampions={champions} targetTotal={TARGET_TOTAL} />
    </section>
  );
}
