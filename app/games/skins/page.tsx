// app/games/skins/page.tsx
export const runtime = "nodejs";
export const revalidate = 86400;

import type { Metadata } from "next";
import { getChampionsFromCDN, type ChampionMeta } from "@/lib/champions";
import Breadcrumbs from "@/components/Breadcrumbs";
import SkinFinder from "@/components/SkinFinder";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Skin Finder — Legends Rift",
  description: "Devine le nom du skin (FR ou EN) à partir du splash d’un champion.",
  alternates: { canonical: "/games/skins" },
  openGraph: {
    title: "Skin Finder — Legends Rift",
    description: "Devine le nom du skin (FR ou EN) à partir du splash d’un champion.",
    url: "/games/skins",
    type: "website",
  },
};

export default async function SkinFinderPage() {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  
  const crumbs = breadcrumbJsonLd([
    { name: "Accueil", item: `${SITE_URL}/` },
    { name: "Jeux", item: `${SITE_URL}/games` },
    { name: "Skin Finder", item: `${SITE_URL}/games/skins` },
  ]);

  let champions: ChampionMeta[] = [];
  try {
    champions = await getChampionsFromCDN();
  } catch (e) {
    console.error("[games/skins] Erreur chargement CDN:", e);
  }

  return (
    <section className="space-y-6 container-lg">
      <Breadcrumbs items={[{ label: "Accueil", href: "/" },{ label: "Jeux", href: "/games" },{ label: "Skin Finder" }]} />

      <header className="space-y-2 text-center">
        <h1 className="text-2xl md:text-3xl font-bold">Skin Finder</h1>
        <p className="text-white/80">
          But du jeu : <strong>trouver le nom du skin</strong>. Langues acceptées : FR ou EN.
        </p>
      </header>

      <SkinFinder initialChampions={champions} />
    </section>
  );
}
