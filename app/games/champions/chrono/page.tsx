// app/games/champions/chrono/page.tsx
export const runtime = "nodejs";
export const revalidate = 86400;

import type { Metadata } from "next";
import { getChampionsFromCDN, type ChampionMeta } from "@/lib/champions";
import ChampionsChrono from "@/components/ChampionsChrono";

export const metadata: Metadata = {
  title: "Mode Chrono 60s — Champions | LoL Quiz",
  description: "Devine un maximum de champions en 60 secondes. Accents/typos tolérées.",
  alternates: { canonical: "/games/champions/chrono" },
  openGraph: {
    title: "Mode Chrono 60s — Champions | LoL Quiz",
    description: "Devine un maximum de champions en 60 secondes.",
    url: "/games/champions/chrono",
    type: "website",
  },
};

export default async function ChampionsChronoPage() {
  let champions: ChampionMeta[] = [];
  try {
    champions = await getChampionsFromCDN();
  } catch (e) {
    console.error("[chrono] CDNs down?", e);
  }

  return (
    <section className="space-y-6 container-lg">
      <ChampionsChrono initialChampions={champions} targetTotal={champions.length} />
    </section>
  );
}
