// lib/championAssets.ts
// Utilitaires images/versions CDN (DDragon + CDragon) + blur placeholder.

export const DDRAGON_VERSION = "15.16.1"; // garde ta version synchronisée avec ddragon.ts

const DDRAGON_BASE = "https://ddragon.leagueoflegends.com";
const CDRAGON_RAW = "https://raw.communitydragon.org/latest";

export type PortraitOptions = {
  /**
   * - "square"   → DDragon: /img/champion/<ID>.png (120x120 env.)
   * - "squareHD" → CDragon: /champion-icons/<riotKey>.png (icône nette)
   * - "splash"   → (si besoin plus tard)
   */
  variant?: "square" | "squareHD" | "splash";
  /** Clé numérique Riot (ex: "266") — requise pour squareHD */
  riotKey?: string;
};

/**
 * Retourne l’URL d’un portrait de champion en fonction de la variante.
 * Fallback : essaye DDragon square si la variante HD n’est pas possible.
 */
export function getChampionPortraitUrl(
  id: string,
  fallbackLocal?: string,
  options: PortraitOptions = {}
): string {
  const { variant = "squareHD", riotKey } = options;
  const safeId = (id || "").trim();

  try {
    // 1) Variante HD carrée (CDragon) — nécessite riotKey numérique
    if (variant === "squareHD" && riotKey) {
      return `${CDRAGON_RAW}/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${encodeURIComponent(
        riotKey
      )}.png`;
    }

    // 2) Variante carrée classique (DDragon)
    if (variant === "square") {
      return `${DDRAGON_BASE}/cdn/${DDRAGON_VERSION}/img/champion/${encodeURIComponent(safeId)}.png`;
    }

    // 3) Fallback : si on a riotKey, tente tout de même l’HD
    if (riotKey) {
      return `${CDRAGON_RAW}/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${encodeURIComponent(
        riotKey
      )}.png`;
    }

    // 4) Repli final DDragon
    return `${DDRAGON_BASE}/cdn/${DDRAGON_VERSION}/img/champion/${encodeURIComponent(safeId)}.png`;
  } catch {
    // 5) Ultime secours : local/public
    return fallbackLocal || `/assets/champions/${safeId}.png`;
  }
}

/**
 * Placeholder blur très léger (SVG 24x24 gris foncé).
 * Avantage: pas de btoa côté serveur, inline data-URL stable pour Next/Image.
 */
export const DEFAULT_BLUR_DATA_URL =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Crect width='100%25' height='100%25' fill='%23111418'/%3E%3C/svg%3E";
