// lib/ddragon.ts
// ─────────────────────────────────────────────────────────────────────────────
// Utilitaires "client-safe" pour interroger Data Dragon (CDN) et récupérer
// les détails d’un champion (dont son 'lore') à la demande.
//
// On s'appuie sur la version exposée par lib/championAssets.ts pour rester
// consistants dans tout le projet.

import { DDRAGON_VERSION } from "@/lib/championAssets";

const DDRAGON_BASE = "https://ddragon.leagueoflegends.com";

// Cache mémoire simple pour éviter de refetch en permanence dans la session.
const detailCache = new Map<string, any>();

export type ChampionDetail = {
  id: string;
  key: string;
  name: string;
  title: string;
  lore?: string;      // 👈 ce qui nous intéresse ici
  blurb?: string;
  tags?: string[];
  partype?: string;
  [k: string]: any;
};

/**
 * Récupère l'objet "detail" pour un champion donné sur DDragon, ex :
 * https://ddragon.leagueoflegends.com/cdn/15.16.1/data/fr_FR/champion/Aatrox.json
 * Structure : { data: { Aatrox: { ...ChampionDetail } } }
 *
 * @param id     "Aatrox" (ID texte exact)
 * @param locale "fr_FR" par défaut
 */
export async function getChampionDetailFromCDN(
  id: string,
  locale: string = "fr_FR"
): Promise<ChampionDetail | null> {
  const key = `${DDRAGON_VERSION}|${locale}|${id}`;
  if (detailCache.has(key)) {
    return detailCache.get(key);
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
    const json = await res.json();
    const root = json?.data ? json.data[id] : null;
    if (!root) return null;
    detailCache.set(key, root);
    return root as ChampionDetail;
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
