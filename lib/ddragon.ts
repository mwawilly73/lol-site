// lib/ddragon.ts
// ─────────────────────────────────────────────────────────────────────────────
// Utilitaires "client-safe" pour interroger Data Dragon (CDN) et récupérer
// les détails d’un champion (dont son 'lore') à la demande.

import { DDRAGON_VERSION } from "@/lib/championAssets";

const DDRAGON_BASE = "https://ddragon.leagueoflegends.com";

// Cache mémoire typé
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
 * https://ddragon.leagueoflegends.com/cdn/15.16.1/data/fr_FR/champion/Aatrox.json
 * Structure : { data: { Aatrox: { ...ChampionDetail } } }
 */
export async function getChampionDetailFromCDN(
  id: string,
  locale: string = "fr_FR"
): Promise<ChampionDetail | null> {
  const key = `${DDRAGON_VERSION}|${locale}|${id}`;
  if (detailCache.has(key)) {
    return detailCache.get(key)!;
  }

  const url = `${DDRAGON_BASE}/cdn/${DDRAGON_VERSION}/data/${locale}/champion/${encodeURIComponent(
    id
  )}.json`;

  try {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) {
      console.error("[ddragon] getChampionDetailFromCDN KO:", res.status, res.statusText);
      return null;
    }
    const json = (await res.json()) as DDragonDetailResponse;
    const root = json?.data?.[id] ?? null;
    if (!root) return null;
    detailCache.set(key, root);
    return root;
  } catch (e) {
    console.error("[ddragon] fetch error:", e);
    return null;
  }
}

/** Raccourci pour récupérer uniquement le lore (texte long). */
export async function getChampionLoreFromCDN(
  id: string,
  locale: string = "fr_FR"
): Promise<string | undefined> {
  const detail = await getChampionDetailFromCDN(id, locale);
  return detail?.lore || undefined;
}
