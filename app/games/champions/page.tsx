// app/games/champions/page.tsx
export const runtime = "nodejs";
export const revalidate = 86400;

import type { Metadata } from "next";
import { getChampionsFromCDN, type ChampionMeta } from "@/lib/champions";
import ChampionsGame from "@/components/ChampionsGame";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Jeu des Champions — Quiz LoL | Legends Rift",
  description:
    "Quiz LoL : Écris le nom exact d'un champion de League of Legends pour retourner sa carte. Mode facile : flou NB. Mode normal : débrouille-toi !",
  alternates: { canonical: "/games/champions" },
  openGraph: {
    title: "Trouve tous les Champions | Legends Rift",
    description:
      "Quiz LoL : Écris le nom exact d'un champion de League of Legends pour retourner sa carte.",
    url: "/games/champions",
    type: "website",
  },
};

export default async function ChampionsPage() {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const crumbs = breadcrumbJsonLd([
    { name: "Accueil", item: `${SITE_URL}/` },
    { name: "Jeux", item: `${SITE_URL}/games` },
    { name: "Liste des champions", item: `${SITE_URL}/games/champions` },
  ]);

  const COLLECTION = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Liste des champions",
    url: `${SITE_URL}/games/champions`,
    isPartOf: { "@type": "WebSite", name: "Legends Rift", url: SITE_URL },
    about: { "@type": "Thing", name: "Champions de League of Legends" },
  };

  const FAQ = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Que fait le mode facile ?",
        acceptedAnswer: { "@type": "Answer", text: "Il affiche les champions en flou / noir et blanc pour aider la mémoire visuelle." },
      },
      {
        "@type": "Question",
        name: "Le mode normal applique-t-il une tolérance ?",
        acceptedAnswer: { "@type": "Answer", text: "Oui, il tolère certaines fautes via une distance d’édition." },
      },
    ],
  };

  let champions: ChampionMeta[] = [];
  try {
    champions = await getChampionsFromCDN();
  } catch (e) {
    console.error("[games/champions] Erreur chargement CDN:", e);
  }

  const TARGET_TOTAL = champions.length || 171;

  return (
    <section className="space-y-6 container-lg">
      {/* JSON-LD (breadcrumb + collection + faq) */}
      <JsonLd data={crumbs} />
      <JsonLd data={COLLECTION} />
      <JsonLd data={FAQ} />

      {/* Fil d’Ariane UI */}
      <Breadcrumbs items={[{ label: "Accueil", href: "/" }, { label: "Jeux", href: "/games" }, { label: "Liste des champions" }]} />

      {/* En-tête de page */}
      <header className="space-y-2 text-center">
        <h1 className="text-2xl md:text-3xl font-bold"> Quiz LoL : Trouve tous les Champions</h1>
        <p className="text-white/80">
          Écris le nom exact d&apos;un champion de League of Legends pour retourner sa carte.
        </p>
        <p className="text-xs text-white/60">
          <span className="text-green-400 font-medium">Mode facile</span> : flou / N&B
          &nbsp;—&nbsp;
          <span className="text-rose-400 font-medium">Mode normal</span> : débrouille-toi
        </p>
      </header>

      {/* Alerte si CDN KO */}
      {champions.length === 0 && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-300">
          Aucun champion chargé depuis le CDN.
          <br />
          Vérifie la connexion &amp; la CSP pour autoriser :
          <code className="ml-1">ddragon.leagueoflegends.com</code> (fetch &amp; images) et{" "}
          <code>raw.communitydragon.org</code> (images).
        </div>
      )}

      {/* Le jeu */}
      <ChampionsGame initialChampions={champions} targetTotal={TARGET_TOTAL} />
    </section>
  );
}
