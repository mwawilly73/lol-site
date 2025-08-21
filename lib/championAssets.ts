// lib/championAssets.ts
// Utilitaires d'URL pour les assets Riot/CommunityDragon.
// Objectif : fournir des portraits CARRÉS en haute définition, stables (pas de 404).

export const DDRAGON_VERSION = "15.16.1";
const DDRAGON_BASE = "https://ddragon.leagueoflegends.com";
const CDRAGON_BASE =
  "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default";

export type PortraitVariant = "squareHD" | "tileHD" | "loading" | "splash" | "square";

/**
 * Retourne une URL d’image “portrait” pour un champion.
 *
 * Variants :
 * - squareHD : ✅ CommunityDragon "champion-icons/<key>.png" (carré ~480x480, fiable)
 * - tileHD   : CommunityDragon "champion-tiles/<key>/<skin>.jpg" (peut 404 sur qq IDs)
 * - loading  : DDragon /cdn/img/champion/loading/<ID>_<skin>.jpg (vertical net)
 * - splash   : DDragon /cdn/img/champion/splash/<ID>_<skin>.jpg (grand horizontal)
 * - square   : DDragon /cdn/<ver>/img/champion/<ID>.png (120x120, fallback)
 *
 * @param id        "Aatrox" (ID texte)
 * @param fallback  chemin local éventuel (ex: "/assets/champions/Aatrox.png")
 * @param opts
 *  - variant       portrait demandé (par défaut: "squareHD")
 *  - skinIndex     index du skin (par défaut 0)
 *  - riotKey       clé num. du champion ("266" pour Aatrox) — utile pour CDragon
 */
export function getChampionPortraitUrl(
  id: string,
  fallback?: string,
  opts?: { variant?: PortraitVariant; skinIndex?: number; riotKey?: string | number }
): string {
  const keyText = (id || "").trim();
  const riotKey = String(opts?.riotKey ?? "").trim();
  const skin = Number.isFinite(opts?.skinIndex) ? String(opts!.skinIndex) : "0";
  const variant: PortraitVariant = opts?.variant ?? "squareHD";

  // 1) Carré HD **stable** : champion-icons (PNG) — recommandé
  if (variant === "squareHD") {
    if (riotKey) {
      // ex : .../v1/champion-icons/266.png
      return `${CDRAGON_BASE}/v1/champion-icons/${riotKey}.png`;
    }
    // Pas de clé numérique → fallback DDragon square
    if (keyText) {
      return `${DDRAGON_BASE}/cdn/${DDRAGON_VERSION}/img/champion/${keyText}.png`;
    }
    return fallback || "";
  }

  // 2) Carré HD via "tiles" (attention: peut 404 sur certains IDs/skins)
  if (variant === "tileHD") {
    if (riotKey) {
      // ex : .../v1/champion-tiles/266/0.jpg
      return `${CDRAGON_BASE}/v1/champion-tiles/${riotKey}/${skin}.jpg`;
    }
    if (keyText) {
      return `${DDRAGON_BASE}/cdn/${DDRAGON_VERSION}/img/champion/${keyText}.png`;
    }
    return fallback || "";
  }

  // 3) Loading (vertical net)
  if (variant === "loading" && keyText) {
    return `${DDRAGON_BASE}/cdn/img/champion/loading/${keyText}_${skin}.jpg`;
  }

  // 4) Splash (énorme horizontal)
  if (variant === "splash" && keyText) {
    return `${DDRAGON_BASE}/cdn/img/champion/splash/${keyText}_${skin}.jpg`;
  }

  // 5) Square (120x120)
  if (variant === "square" && keyText) {
    return `${DDRAGON_BASE}/cdn/${DDRAGON_VERSION}/img/champion/${keyText}.png`;
  }

  return fallback || "";
}

/** Placeholder léger pour <Image placeholder="blur"> (évite le flash moche) */
export const DEFAULT_BLUR_DATA_URL =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0' stop-color='black' stop-opacity='0.6'/>
          <stop offset='1' stop-color='black' stop-opacity='0.2'/>
        </linearGradient>
      </defs>
      <rect fill='url(#g)' width='100%' height='100%'></rect>
    </svg>`
  );
