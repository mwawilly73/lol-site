// lib/championAssets.ts
// Utilitaires images/versions CDN (DDragon + CDragon) + blur placeholder.

const DDRAGON_BASE = "https://ddragon.leagueoflegends.com";
const CDRAGON_RAW = "https://raw.communitydragon.org/latest";

/**
 * Version actuelle de Data Dragon utilisée pour construire les URLs.
 *
 * - On part d'une valeur de secours "15.24.1" (celle qui marche déjà chez toi).
 * - À l'init du module on tente de récupérer la vraie dernière version via
 *   https://ddragon.leagueoflegends.com/api/versions.json
 *   et on met à jour cette variable si tout se passe bien.
 *
 * Du coup : tu n'as plus besoin de venir modifier cette valeur à la main
 * à chaque patch, au pire tu restes temporairement sur la version fallback.
 */
export let DDRAGON_VERSION: string = "15.24.1";

/**
 * Met à jour DDRAGON_VERSION avec la dernière version connue par Data Dragon.
 * - Utilise /api/versions.json (tableau de strings, index 0 = dernière version).
 * - Best-effort : en cas d’erreur, on garde la version de secours.
 */
async function refreshDDragonVersion(): Promise<void> {
  try {
    const res = await fetch(`${DDRAGON_BASE}/api/versions.json`);

    if (!res.ok) {
      // Si Data Dragon ne répond pas correctement, on ne casse rien.
      return;
    }

    const versions = (await res.json()) as string[];

    // On vérifie que la réponse a bien la forme attendue.
    if (Array.isArray(versions) && versions.length > 0 && typeof versions[0] === "string") {
      DDRAGON_VERSION = versions[0];
    }
  } catch {
    // En cas de problème réseau/JSON, on reste sur la version fallback.
  }
}

/**
 * On déclenche la mise à jour dès le chargement du module.
 *
 * Important :
 * - On N’ATTEND PAS (pas de await) → le code continue à fonctionner tout de suite
 *   avec la version de secours.
 * - Dès que la vraie version est récupérée, DDRAGON_VERSION est mise à jour et
 *   les appels suivants utiliseront la bonne version.
 */
void refreshDDragonVersion();

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
      return `${DDRAGON_BASE}/cdn/${DDRAGON_VERSION}/img/champion/${encodeURIComponent(
        safeId
      )}.png`;
    }

    // 3) Fallback : si on a riotKey, tente tout de même l’HD
    if (riotKey) {
      return `${CDRAGON_RAW}/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${encodeURIComponent(
        riotKey
      )}.png`;
    }

    // 4) Repli final DDragon (au cas où on n’a pas de riotKey)
    return `${DDRAGON_BASE}/cdn/${DDRAGON_VERSION}/img/champion/${encodeURIComponent(
      safeId
    )}.png`;
  } catch {
    // 5) Ultime secours : image locale dans /public/assets/champions
    return fallbackLocal || `/assets/champions/${safeId}.png`;
  }
}

/**
 * Placeholder blur très léger (SVG 24x24 gris foncé).
 * Avantage: pas de btoa côté serveur, inline data-URL stable pour Next/Image.
 */
export const DEFAULT_BLUR_DATA_URL =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Crect width='100%25' height='100%25' fill='%23111418'/%3E%3C/svg%3E";
