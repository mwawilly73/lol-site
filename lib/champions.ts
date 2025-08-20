// lib/champions.ts
// ===============================================================
// Lecture des fichiers data/champions/*.json côté serveur (Node),
// mapping des champs utiles POUR L’AFFICHAGE.
//
// Intégration Data Dragon (CDN) SANS CASSER l’existant :
//  - On conserve imagePath (chemin local dans /public) pour compatibilité.
//  - On ajoute imageUrl = URL finale (CDN si USE_DDRAGON=1, sinon local).
//  - On résout la version Data Dragon UNE seule fois pour toute la liste.
//
// À utiliser dans tes pages/server components :
//   const champions = await getChampionsFromDisk();
//   ... et consommer champion.imageUrl (ou imagePath en fallback).
// ===============================================================

import fs from "node:fs/promises";
import path from "node:path";
import { USE_DDRAGON, resolveDDragonVersion } from "./ddragon";
import { getChampionPortraitUrl } from "./championAssets";

// ---- Types exposés à l’UI --------------------------------------------

export type ChampionMeta = {
  id: string;           // "Aatrox"
  key: string;          // "266"
  slug: string;         // "aatrox"
  name: string;         // "Aatrox"
  title: string;        // "Épée des Darkin"
  roles: string[];      // ["Fighter"]...
  partype?: string;     // "Puits de sang"
  blurb?: string;
  lore?: string;

  // Chemin local (legacy) -> ex: "/assets/champions/Aatrox.png"
  imagePath: string;

  // URL finale pour <Image /> : CDN si flag ON + version ok, sinon local
  imageUrl: string;

  // Info complémentaire (debug/analytics)
  ddragonVersion?: string;
};

// ---- Constantes de chemins -------------------------------------------

const DATA_DIR = path.join(process.cwd(), "data", "champions");
const PUBLIC_PREFIX = "/assets/champions"; // correspond à /public/assets/champions

// ---- Fonction principale ---------------------------------------------

/**
 * Lit tous les JSON de data/champions et construit la liste de métadonnées.
 * - imagePath: chemin local conservé (rétro‑compat).
 * - imageUrl : URL finale (CDN/local) via helper.
 * - Résout la version Data Dragon une seule fois si USE_DDRAGON=1.
 */
export async function getChampionsFromDisk(): Promise<ChampionMeta[]> {
  // 1) Lister les fichiers .json
  let files: string[] = [];
  try {
    files = await fs.readdir(DATA_DIR);
  } catch (e) {
    console.error("[champions] Impossible de lire data/champions :", e);
    return [];
  }

  // 2) Si on a activé le CDN, on résout la version maintenant (optim perf)
  let version = "";
  if (USE_DDRAGON) {
    try {
      version = await resolveDDragonVersion();
    } catch (e) {
      // Si la résolution échoue (réseau indispo), on log et on repasse en local
      console.warn("[champions] Échec résolution version Data Dragon -> fallback local", e);
      version = "";
    }
  }

  const champions: ChampionMeta[] = [];

  // 3) Parcourir chaque fichier et mapper les champs utiles
  for (const file of files) {
    if (!file.endsWith(".json")) continue;

    const full = path.join(DATA_DIR, file);

    try {
      const raw = await fs.readFile(full, "utf-8");
      const parsed = JSON.parse(raw);

      // Les JSON DDragon-like sont souvent { data: { Aatrox: { ... } } }
      const root = parsed.data ? (Object.values(parsed.data)[0] as any) : parsed;
      if (!root) continue;

      const id: string = root.id;
      const name: string = root.name;
      const title: string = root.title;
      const key: string = root.key?.toString?.() ?? "";
      const roles: string[] = Array.isArray(root.tags) ? root.tags : [];
      const partype: string | undefined = root.partype;
      const blurb: string | undefined = root.blurb;
      const lore: string | undefined = root.lore;

      // Image : comme avant, on suppose public/assets/champions/<ID>.png
      const imageFile: string = root.image?.full ?? `${id}.png`;

      // Chemin local (legacy) — utile en rollback et en fallback
      const imagePath = `${PUBLIC_PREFIX}/${imageFile}`; // ex: /assets/champions/Aatrox.png

      // URL finale : CDN si activé ET version résolue, sinon local
      const imageUrl =
        version && imageFile
          ? getChampionPortraitUrl(version, imageFile, imagePath)
          : imagePath;

      champions.push({
        id,
        key,
        slug: id.toLowerCase(),
        name,
        title,
        roles,
        partype,
        blurb,
        lore,
        imagePath,                     // champ conservé (compatibilité)
        imageUrl,                      // champ à utiliser dans l’UI
        ddragonVersion: version || undefined,
      });
    } catch (e) {
      console.error("[champions] Erreur de parsing pour", file, e);
    }
  }

  // 4) Tri alpha par nom (français, insensible à la casse/accents)
  champions.sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));

  return champions;
}
