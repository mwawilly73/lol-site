// app/games/chrono/page.tsx
export const runtime = "nodejs";
export const revalidate = 86400;

import type { Metadata } from "next";
import { getChampionsFromCDN, type ChampionMeta } from "@/lib/champions";
import ChampionsChrono from "@/components/ChampionsChrono";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Chrono-Break — LoL Quiz",
  description: "Devine les champions grâce à leurs skins/splashes avec un chrono.",
  alternates: { canonical: "/games/chrono" },
  openGraph: {
    title: "Chrono-Break — LoL Quiz",
    description: "Devine les champions grâce à leurs skins/splashes avec un chrono.",
    url: "/games/chrono",
    type: "website",
  },
};

export default async function ChronoBreakPage() {
  let champions: ChampionMeta[] = [];
  try {
    champions = await getChampionsFromCDN();
  } catch (e) {
    console.error("[games/chrono] Erreur chargement CDN:", e);
  }

  return (
    <section className="space-y-6 container-lg">
      {/* Fil d’Ariane */}
      <Breadcrumbs items={[{ label: "Accueil", href: "/" }, { label: "Chrono-Break" }]} />

      <header className="space-y-2 text-center">
        <h1 className="text-2xl md:text-3xl font-bold">Chrono-Break</h1>
        <p className="text-white/80">
          Devine les champions grâce à leurs skins/splashes avec un chrono.
        </p>
      </header>

      <ChampionsChrono initialChampions={champions} targetTotal={champions.length} />
    </section>
  );
}
