// lib/ddragon.ts
// ===============================================================
// Utilitaires pour consommer le CDN officiel "Data Dragon" de Riot.
// - Construction d'URL images (portrait, passive, spells)
// - Construction d'URL JSON (fiche champion)
// - Résolution de version (pin depuis .env ou fetch de la dernière)
// - Flag d'activation CDN (USE_DDRAGON), pour rollback instantané
//
// NB : Ce fichier est conçu pour Next.js (App Router).
// - Les fetch côté serveur peuvent utiliser "next: { revalidate }"
//   pour mettre en cache proprement.
// ===============================================================

// Base du CDN
const DDRAGON_BASE = "https://ddragon.leagueoflegends.com";

// ----------- FLAGS DE COMPORTEMENT (pilotés par .env) -----------------

/**
 * USE_DDRAGON
 *  - "1"  => ON  (on sert les assets/JSON depuis le CDN)
 *  - autre => OFF (on reste en local, fallback total)
 *
 * Permet un rollback instantané sans toucher au code,
 * simplement en modifiant .env.local et en relançant.
 */
export const USE_DDRAGON: boolean = process.env.USE_DDRAGON === "1";

/**
 * DD_VERSION (optionnel)
 *  - Si défini (ex: "15.16.1"), on "pinn" la version utilisée.
 *  - Si vide/absent, on résout dynamiquement la dernière version
 *    via /api/versions.json (index 0).
 */
const PINNED_VERSION = (process.env.DD_VERSION ?? "").trim();

// ----------- RÉSOLUTION DE VERSION -----------------------------------

/**
 * Récupère la liste des versions disponibles.
 * Par convention, l'index 0 est la plus récente.
 *
 * ⚠️ À utiliser côté serveur (RSC/route server) pour éviter
 *    de frapper le CDN depuis le client.
 * ⚠️ On utilise une revalidation de 6h (ajuste si besoin).
 */
export async function getDDragonVersions(): Promise<string[]> {
  const res = await fetch(`${DDRAGON_BASE}/api/versions.json`, {
    next: { revalidate: 60 * 60 * 6 },
  });
  if (!res.ok) {
    throw new Error(`Échec de récupération des versions Data Dragon (${res.status})`);
  }
  return (await res.json()) as string[];
}

/**
 * Retourne la dernière version disponible (versions[0]).
 */
export async function getLatestDDragonVersion(): Promise<string> {
  const versions = await getDDragonVersions();
  if (!Array.isArray(versions) || versions.length === 0) {
    throw new Error("Aucune version Data Dragon disponible");
  }
  return versions[0];
}

/**
 * Résout la version à utiliser :
 *  - Si PINNED_VERSION est défini dans .env => on l'utilise.
 *  - Sinon => on récupère la dernière version du CDN.
 */
export async function resolveDDragonVersion(): Promise<string> {
  if (PINNED_VERSION) return PINNED_VERSION;
  return await getLatestDDragonVersion();
}

// ----------- HELPERS D’URL (JSON + IMAGES) ----------------------------

/**
 * URL JSON d'un champion.
 * Exemple :
 *   https://ddragon.leagueoflegends.com/cdn/15.16.1/data/fr_FR/champion/Aatrox.json
 *
 * @param version - version Data Dragon (ex: "15.16.1")
 * @param championId - ID Data Dragon (sensible à la casse), ex: "Aatrox", "LeBlanc", "JarvanIV", "KSante"
 * @param locale - locale à utiliser (défaut: "fr_FR")
 */
export function championJsonUrl(version: string, championId: string, locale = "fr_FR"): string {
  return `${DDRAGON_BASE}/cdn/${version}/data/${locale}/champion/${championId}.json`;
}

/**
 * URL image "portrait" d’un champion (champion.image.full dans le JSON).
 * Exemple :
 *   https://ddragon.leagueoflegends.com/cdn/15.16.1/img/champion/Aatrox.png
 */
export function championImgUrl(version: string, imageFull: string): string {
  return `${DDRAGON_BASE}/cdn/${version}/img/champion/${imageFull}`;
}

/**
 * URL image d'une passive (champion.passive.image.full).
 * Exemple :
 *   https://ddragon.leagueoflegends.com/cdn/15.16.1/img/passive/Aatrox_Passive.png
 */
export function passiveImgUrl(version: string, passiveFull: string): string {
  return `${DDRAGON_BASE}/cdn/${version}/img/passive/${passiveFull}`;
}

/**
 * URL image d'un sort (spell) (spells[].image.full).
 * Exemple :
 *   https://ddragon.leagueoflegends.com/cdn/15.16.1/img/spell/AatroxQ.png
 */
export function spellImgUrl(version: string, spellFull: string): string {
  return `${DDRAGON_BASE}/cdn/${version}/img/spell/${spellFull}`;
}

// ----------- AIDES PRATIQUES (ID/Slug) --------------------------------

/**
 * Normalise un slug d'URL ("/champions/[slug]") vers un ID Data Dragon.
 * - Retire espaces, tirets, apostrophes
 * - bcp de champions suivent la règle "Capitalize"
 * - exceptions connues : KSante, LeBlanc, JarvanIV, (tu peux étendre ce map si nécessaire)
 */
export function slugToChampionId(slug: string): string {
  const s = slug.replace(/[\s_\-]+/g, "").replace(/['’]/g, "").toLowerCase();
  const map: Record<string, string> = {
    ksante: "KSante",
    leblanc: "LeBlanc",
    jarvaniv: "JarvanIV",
  };
  if (map[s]) return map[s];
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ----------- TYPES MINIMAUX UTILES -----------------------------------

/**
 * Types minimaux pour manipuler la structure Data Dragon
 * sans devoir typer 100% du schéma (garde ça simple).
 */

export type DDragonImage = { full: string };

export type DDragonSpell = {
  id: string;
  name: string;
  description: string;
  image: DDragonImage;
};

export type DDragonPassive = {
  name: string;
  description: string;
  image: DDragonImage;
};

export type DDragonChampion = {
  id: string;
  name: string;
  title: string;
  lore?: string;
  image: DDragonImage;
  spells: DDragonSpell[];
  passive: DDragonPassive;
};

export type DDragonChampionResponse = {
  type: string;
  format: string;
  version: string;
  data: Record<string, DDragonChampion>;
};

// ----------- FETCH JSON CHAMPION (avec cache Next) --------------------

/**
 * Récupère la fiche champion depuis Data Dragon (JSON).
 * - Utilise "next: { revalidate }" pour mettre en cache côté serveur
 * - Jette une erreur si réseau KO, à attraper côté appelant
 */
export async function fetchChampionFromCDN(
  version: string,
  championId: string,
  locale = "fr_FR"
): Promise<DDragonChampion> {
  const url = championJsonUrl(version, championId, locale);
  const res = await fetch(url, {
    next: { revalidate: 60 * 60 * 24 }, // revalide toutes les 24h (ajuste à ta convenance)
  });
  if (!res.ok) {
    throw new Error(`Échec fetch champion ${championId} (${res.status})`);
  }
  const json = (await res.json()) as DDragonChampionResponse;
  const champ = json.data[championId];
  if (!champ) {
    throw new Error(`Champion introuvable dans la réponse JSON: ${championId}`);
  }
  return champ;
}
