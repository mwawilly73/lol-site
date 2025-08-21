// app/games/champions/page.tsx
export const runtime = "nodejs";

import type { Metadata } from "next";
import { getChampionsFromCDN /* , getChampionsFromDisk */ } from "@/lib/champions";
import ChampionsGame from "./ChampionsGame";

export const metadata: Metadata = {
  title: "Jeu — Trouve tous les Champions | LoL Quiz",
  description:
    "Écris le nom exact d'un champion de League of Legends pour retourner sa carte. Mode facile : flou/nb • Mode normal : aucune aide.",
  alternates: { canonical: "/games/champions" },
  openGraph: {
    title: "Jeu — Trouve tous les Champions | LoL Quiz",
    description: "Écris le nom exact d'un champion pour retourner sa carte.",
    url: "/games/champions",
    type: "website",
  },
};

export default async function ChampionsPage() {
  const champions = await getChampionsFromCDN();
  const TARGET_TOTAL = 171;
  // const champions = await getChampionsFromDisk(); // si tu veux tester avec les fichiers locaux
  return (
    <section className="space-y-6 container-lg">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl md:text-3xl font-bold">Trouve tous les Champions</h1>
        <p className="text-white/80">
          écris le nom exact d&apos;un champion de League of Legends pour retourner sa carte
        </p>
        <p className="text-sm md:text-base">
          <span className="text-green-400 font-medium">mode facile</span> : champions affichés en flou / noir et blanc
          {" \u00A0 \u2014 \u00A0 "}
          <span className="text-rose-400 font-medium">mode normal</span> : débrouille toi
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
