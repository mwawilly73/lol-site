// app/games/chrono/page.tsx
export const runtime = "nodejs";
export const revalidate = 86400;

import type { Metadata } from "next";
import { getChampionsFromCDN, type ChampionMeta } from "@/lib/champions";
import ChampionsChrono from "@/components/ChampionsChrono";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

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
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const crumbs = breadcrumbJsonLd([
    { name: "Accueil", item: `${SITE_URL}/` },
    { name: "Jeux", item: `${SITE_URL}/games` },
    { name: "Chrono-Break", item: `${SITE_URL}/games/chrono` },
  ]);

  const GAME = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: "Chrono-Break",
    applicationCategory: "Game",
    operatingSystem: "Web",
    genre: ["Quiz", "Mémoire", "LoL"],
    url: `${SITE_URL}/games/chrono`,
    image: `${SITE_URL}/og/chrono.png`,
    description: "Devine des champions LoL via leurs splash en temps limité.",
  };

  const HOWTO = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Comment jouer à Chrono-Break",
    description: "Règles de base pour Chrono-Break.",
    step: [
      { "@type": "HowToStep", name: "Choisir la durée", text: "1:30, 5, 10 ou 15 min." },
      { "@type": "HowToStep", name: "Lancer la partie", text: "Clique sur Démarrer ; le chrono part." },
      { "@type": "HowToStep", name: "Deviner", text: "Tape le nom du champion ; valide." },
      { "@type": "HowToStep", name: "Score", text: "Enregistre ton score et partage-le." },
    ],
  };

  const FAQ = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Les accents/typos sont-ils tolérés ?",
        acceptedAnswer: { "@type": "Answer", text: "Oui, une tolérance (distance de Levenshtein) est appliquée." },
      },
      {
        "@type": "Question",
        name: "Les skins sont-ils activables ?",
        acceptedAnswer: { "@type": "Answer", text: "Oui, tu peux activer/désactiver l’affichage des skins." },
      },
    ],
  };

  let champions: ChampionMeta[] = [];
  try {
    champions = await getChampionsFromCDN();
  } catch (e) {
    console.error("[games/chrono] Erreur chargement CDN:", e);
  }

  return (
    <section className="space-y-6 container-lg">
      {/* JSON-LD (breadcrumb + game + howto + faq) */}
      <JsonLd data={crumbs} />
      <JsonLd data={GAME} />
      <JsonLd data={HOWTO} />
      <JsonLd data={FAQ} />

      {/* Fil d’Ariane UI */}
      <Breadcrumbs items={[{ label: "Accueil", href: "/" }, { label: "Jeux", href: "/games" }, { label: "Chrono-Break" }]} />

      <header className="space-y-2 text-center">
        <h1 className="text-2xl md:text-3xl font-bold">Chrono-Break</h1>
        <p className="text-white/80">Devine les champions grâce à leurs skins/splashes avec un chrono.</p>
      </header>

      <ChampionsChrono initialChampions={champions} targetTotal={champions.length} />
    </section>
  );
}
