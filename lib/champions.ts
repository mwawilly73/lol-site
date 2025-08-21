// lib/champions.ts
// ─────────────────────────────────────────────────────────────────────────────
// AJOUT : charger la liste des champions depuis Data Dragon (CDN), FR, avec ISR.
// Conserve ton type ChampionMeta et ta fonction getChampionsFromDisk pour rollback.

import fs from "node:fs/promises";
import path from "node:path";
import { DDRAGON_VERSION } from "@/lib/championAssets"; // on réutilise la version déjà définie

export type ChampionMeta = {
  id: string;        // "Aatrox"
  key: string;       // "266" (clé Riot numérique, chaîne)
  slug: string;      // "aatrox"
  name: string;      // "Aatrox"
  title: string;     // "Épée des Darkin"
  roles: string[];   // ["Fighter", ...]
  partype?: string;  // "Puits de sang"
  blurb?: string;
  lore?: string;     // ⚠ pas fourni par champion.json (reste vide ici)
  imagePath: string; // on laisse une chaîne vide: on utilise le CDN dans ChampionCard
};

const DATA_DIR = path.join(process.cwd(), "data", "champions");

// === EXISTANT (pour rollback) ===
export async function getChampionsFromDisk(): Promise<ChampionMeta[]> {
  let files: string[] = [];
  try {
    files = await fs.readdir(DATA_DIR);
  } catch (e) {
    console.error("[champions] Impossible de lire data/champions :", e);
    return [];
  }

  const champions: ChampionMeta[] = [];

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const full = path.join(DATA_DIR, file);
    try {
      const raw = await fs.readFile(full, "utf-8");
      const parsed = JSON.parse(raw);
      const root = parsed.data ? Object.values(parsed.data)[0] : parsed;
      if (!root) continue;

      const id: string = root.id;
      const name: string = root.name;
      const title: string = root.title;
      const key: string = root.key?.toString?.() ?? "";
      const roles: string[] = Array.isArray(root.tags) ? root.tags : [];
      const partype: string | undefined = root.partype;
      const blurb: string | undefined = root.blurb;
      const lore: string | undefined = root.lore;

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
        imagePath: "", // on n'utilise plus le local pour l'image
      });
    } catch (e) {
      console.error("[champions] Erreur de parsing pour", file, e);
    }
  }

  champions.sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
  return champions;
}

// === NOUVEAU : chargement CDN (champion.json FR) ===
// - Inclut: id, key, name, title, tags, partype, blurb
// - N'inclut PAS: lore (texte long) → on pourra le charger à la volée plus tard si tu veux.
export async function getChampionsFromCDN(): Promise<ChampionMeta[]> {
  const url = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/data/fr_FR/champion.json`;

  try {
    const res = await fetch(url, {
      // ISR: on révalide toutes les 24h (ajuste si besoin)
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!res.ok) {
      console.error("[champions] CDN fetch KO:", res.status, res.statusText);
      return [];
    }
    const json = await res.json();

    // Format: { data: { Aatrox: { ... }, Ahri: { ... }, ... } }
    const arr = Object.values(json?.data ?? {});
    const champions: ChampionMeta[] = (arr as any[]).map((root) => {
      const id: string = root.id;
      const name: string = root.name;
      const title: string = root.title;
      const key: string = root.key?.toString?.() ?? "";
      const roles: string[] = Array.isArray(root.tags) ? root.tags : [];
      const partype: string | undefined = root.partype;
      const blurb: string | undefined = root.blurb;

      return {
        id,
        key,
        slug: id.toLowerCase(),
        name,
        title,
        roles,
        partype,
        blurb,
        lore: undefined, // non fourni par ce endpoint
        imagePath: "",   // on n'utilise pas de chemin local
      };
    });

    champions.sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
    return champions;
  } catch (e) {
    console.error("[champions] Erreur fetch CDN:", e);
    return [];
  }
}
