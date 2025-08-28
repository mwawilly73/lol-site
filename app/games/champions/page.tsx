// app/games/champions/page.tsx
// ----------------------------------------------------------------------------
// Page "Jeu" côté serveur, qui charge la liste des champions via DDragon (CDN).
// - runtime nodejs
// - revalidate littéral (86400 = 24h) pour Next 15 (pas d'expression !)
// ----------------------------------------------------------------------------

export const runtime = "nodejs";
export const revalidate = 86400; // ⚠️ LITTÉRAL requis par Next (pas de 60*60*24)

import type { Metadata } from "next";
import Link from "next/link";
import { getChampionsFromCDN, type ChampionMeta } from "@/lib/champions";
import ChampionsGame from "./ChampionsGame";

export const metadata: Metadata = {
  title: "Trouve tous les Champions | LoL Quiz",
  description:
    "Écris le nom exact d'un champion de League of Legends pour retourner sa carte. Mode facile : flou NB. Mode normal : débrouille-toi !",
  alternates: { canonical: "/games/champions" },
  openGraph: {
    title: "Trouve tous les Champions | LoL Quiz",
    description:
      "Écris le nom exact d'un champion de League of Legends pour retourner sa carte.",
    url: "/games/champions",
    type: "website",
  },
};

export default async function ChampionsPage() {
  let champions: ChampionMeta[] = [];

  try {
    // ✅ Liste depuis DDragon (CDN), typée
    champions = await getChampionsFromCDN();
  } catch (e) {
    console.error("[games/champions] Erreur chargement CDN:", e);
  }

  const TARGET_TOTAL = champions.length || 171;

  return (
    <section className="space-y-6 container-lg">
      {/* ── Fil d’Ariane (micro-données SEO) ─────────────────────────── */}
      <nav
        aria-label="Fil d'Ariane"
        className="pt-4"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        <ol className="flex items-center gap-2 text-sm text-white/70">
          <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            <Link href="/" itemProp="item" className="hover:underline">
              <span itemProp="name">Accueil</span>
            </Link>
            <meta itemProp="position" content="1" />
          </li>
          <span aria-hidden="true">›</span>
          <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            <Link href="/games/champions" itemProp="item" className="hover:underline">
              <span itemProp="name">Liste des champions</span>
            </Link>
            <meta itemProp="position" content="2" />
          </li>
        </ol>
      </nav>

      {/* ── En-tête de page ──────────────────────────────────────────── */}
      <header className="space-y-2 text-center">
        <h1 className="text-2xl md:text-3xl font-bold">Trouve tous les Champions</h1>
        <p className="text-white/80">
          Écris le nom exact d&apos;un champion de League of Legends pour retourner sa carte.
        </p>
        <p className="text-xs text-white/60">
          <span className="text-green-400 font-medium">Mode facile</span> : champions affichés en flou / noir et blanc
          &nbsp;—&nbsp;
          <span className="text-rose-400 font-medium">Mode normal</span> : débrouille-toi
        </p>
      </header>

      {/* ── Alerte fallback si CDN KO ────────────────────────────────── */}
      {champions.length === 0 && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-300">
          Aucun champion chargé depuis le CDN.
          <br />
          Vérifie la connexion &amp; la CSP pour autoriser :
          <code className="ml-1">ddragon.leagueoflegends.com</code> (fetch &amp; images) et{" "}
          <code>raw.communitydragon.org</code> (images).
        </div>
      )}

      {/* ── Jeu ──────────────────────────────────────────────────────── */}
      <ChampionsGame initialChampions={champions} targetTotal={TARGET_TOTAL} />
    </section>
  );
}
