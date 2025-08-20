// app/games/champions/page.tsx

/**
 * ⚙️ On force l'exécution côté Node (RSC côté serveur)
 *    => SEO ok (contenu HTML rendu), pas de fetch côté client.
 */
export const runtime = "nodejs";

import type { Metadata } from "next";
import { getChampionsFromDisk } from "@/lib/champions";
// ⤷ Les cartes sont rendues par le composant "jeu" existant
import ChampionsGame from "./ChampionsGame";

/**
 * 🧭 SEO / Open Graph
 * - Titre/description de la page
 * - Canonical pour éviter le contenu dupliqué
 */
export const metadata: Metadata = {
  title: "Jeu — Liste des Champions | LoL Quiz",
  description:
    "Devine les 171 champions de League of Legends : tape leur nom (1 faute autorisée, accents optionnels) pour retourner chaque carte.",
  alternates: { canonical: "/games/champions" },
  openGraph: {
    title: "Jeu — Liste des Champions | LoL Quiz",
    description:
      "Devine les 171 champions : écris leur nom pour révéler chaque carte !",
    url: "/games/champions",
    type: "website",
  },
};

/**
 * 🧩 Page serveur :
 * - lit les JSON locaux (lib/champions.ts)
 * - calcule imageUrl (CDN Data Dragon si USE_DDRAGON=1 + version dispo)
 *   ou imagePath (fallback local) sinon
 * - passe la liste au composant de jeu existant
 */
export default async function ChampionsPage() {
  // 1) Charger les champions depuis le disque (et éventuellement, préparer l'URL CDN/local)
  const champions = await getChampionsFromDisk();

  // 2) Cible à atteindre dans le jeu :
  //    - tu peux garder 171 si tu veux "le chiffre officiel"
  //    - ou rendre ça dynamique (champions.length) si ta data évolue
  // const TARGET_TOTAL = champions.length;
  const TARGET_TOTAL = 171;

  // 3) (Optionnel) Petit debug serveur : affiche un échantillon en console
  //    Utile pour vérifier qu'on a bien imageUrl OU imagePath.
  //    Tu peux commenter/retirer après test.
  if (process.env.NODE_ENV !== "production") {
    console.log("[/games/champions] sample:", {
      count: champions.length,
      sample: champions[0]
        ? {
            id: champions[0].id,
            slug: champions[0].slug,
            imageUrl: champions[0].imageUrl,
            imagePath: champions[0].imagePath,
            ddragonVersion: champions[0].ddragonVersion,
          }
        : null,
    });
  }

  // 4) Rendu
  return (
    <section className="container-lg space-y-6">
      {/* En-tête de page */}
      <header className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">Liste des Champions</h1>
        <p className="text-white/80">
          Écris le nom exact d’un champion (1 faute autorisée, accents optionnels) pour
          retourner sa carte.
        </p>
      </header>

      {/* Alerte si aucune donnée trouvée (ex: data/champions vide) */}
      {champions.length === 0 && (
        <div className="badge danger">
          ⚠️ Aucun champion chargé. Vérifie que{" "}
          <code>data/champions/*.json</code> existent et relance le serveur (
          <code>npm run dev</code>).
        </div>
      )}

      {/* 🕹️ Composant du jeu existant : reçoit toute la liste et l'objectif */}
      <ChampionsGame initialChampions={champions} targetTotal={TARGET_TOTAL} />
    </section>
  );
}
