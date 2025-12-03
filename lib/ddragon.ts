// lib/ddragon.ts
// ─────────────────────────────────────────────────────────────────────────────
// Utilitaires "client-safe" pour interroger Data Dragon (CDN) et récupérer
// les détails d’un champion (dont son 'lore') à la demande.
//
// IMPORTANT :
// - La version DDragon utilisée est importée depuis championAssets.ts.
// - championAssets.ts met à jour DDRAGON_VERSION automatiquement
//   via https://ddragon.leagueoflegends.com/api/versions.json.
// - Ici, on se contente d'utiliser la valeur actuelle de DDRAGON_VERSION,
//   qui est un binding "live" (la valeur se met à jour quand championAssets
//   la change).

import { DDRAGON_VERSION } from "@/lib/championAssets";

const DDRAGON_BASE = "https://ddragon.leagueoflegends.com";

// Cache mémoire typé : clé = "<version>|<locale>|<id>"
const detailCache = new Map<string, ChampionDetail>();

export type ChampionDetail = {
  id: string;
  key: string;
  name: string;
  title: string;
  lore?: string;
  blurb?: string;
  tags?: string[];
  partype?: string;
  // On laisse la porte ouverte aux autres champs renvoyés par DDragon
  [k: string]: unknown;
};

type DDragonDetailResponse = {
  type: string;
  format: string;
  version: string;
  data: Record<string, ChampionDetail>;
};

/**
 * Récupère l'objet "detail" pour un champion donné sur DDragon, ex :
 * https://ddragon.leagueoflegends.com/cdn/<VERSION>/data/fr_FR/champion/Aatrox.json
 * Structure : { type, format, version, data: { Aatrox: { ...ChampionDetail } } }
 */
export async function getChampionDetailFromCDN(
  id: string,
  locale: string = "fr_FR"
): Promise<ChampionDetail | null> {
  const trimmedId = (id || "").trim();

  if (!trimmedId) {
    console.error("[ddragon] getChampionDetailFromCDN appelé avec un id vide");
    return null;
  }

  // On inclut la version dans la clé pour ne jamais mélanger les détails
  // de deux versions différentes de DDragon.
  const key = `${DDRAGON_VERSION}|${locale}|${trimmedId}`;
  const cached = detailCache.get(key);
  if (cached) {
    return cached;
  }

  const url = `${DDRAGON_BASE}/cdn/${DDRAGON_VERSION}/data/${locale}/champion/${encodeURIComponent(
    trimmedId
  )}.json`;

  try {
    // "force-cache" côté client → le navigateur garde une copie.
    // Côté Next server, ce sera ignoré si ce n'est pas supporté,
    // mais ça reste sans danger.
    const res = await fetch(url, { cache: "force-cache" });

    if (!res.ok) {
      console.error(
        "[ddragon] getChampionDetailFromCDN KO:",
        res.status,
        res.statusText,
        "url=",
        url
      );
      return null;
    }

    const json = (await res.json()) as DDragonDetailResponse;
    const root = json?.data?.[trimmedId] ?? null;

    if (!root) {
      console.error(
        "[ddragon] getChampionDetailFromCDN: aucun détail trouvé pour",
        trimmedId,
        "dans la réponse DDragon"
      );
      return null;
    }

    detailCache.set(key, root);
    return root;
  } catch (e) {
    console.error("[ddragon] fetch error:", e);
    return null;
  }
}

/**
 * Raccourci pour récupérer uniquement le lore (texte long).
 */
export async function getChampionLoreFromCDN(
  id: string,
  locale: string = "fr_FR"
): Promise<string | undefined> {
  const detail = await getChampionDetailFromCDN(id, locale);
  return detail?.lore || undefined;
}
