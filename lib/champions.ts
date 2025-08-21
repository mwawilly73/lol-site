// lib/champions.ts
// ─────────────────────────────────────────────────────────────────────────────
// Lecture des champions depuis le disque (fallback) ET depuis le CDN DDragon.
// Objectif : zéro `any` (type guards) + fix ESLint du catch inutilisé.
// ─────────────────────────────────────────────────────────────────────────────

import fs from "node:fs/promises";
import path from "node:path";
import { DDRAGON_VERSION } from "@/lib/championAssets";

// Ce type est ce que notre UI consomme (cartes, etc.)
export type ChampionMeta = {
  id: string;          // ex: "Aatrox"
  key: string;         // ex: "266" (stringifiée)
  slug: string;        // ex: "aatrox" (id.toLowerCase())
  name: string;        // ex: "Aatrox"
  title: string;       // ex: "Épée des Darkin"
  roles: string[];     // ex: ["Fighter", "Tank"]
  partype?: string;    // ex: "Mana" | "Énergie" | "Rage" | ...
  blurb?: string;      // résumé court (DDragon)
  lore?: string;       // lore long (peut n’exister que dans certains JSON)
  imagePath: string;   // laissé vide si on utilise le CDN pour les images
};

// Répertoire fallback si tu gardes /data/champions/*.json
const DATA_DIR = path.join(process.cwd(), "data", "champions");

/* ========================= Types DDragon ========================== */

// Image “sprite” DDragon (non utilisée mais typée pour complétude)
type DDragonChampionImage = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

// Structure d’un champion minimal vue côté DDragon “list”
export type DDragonChampion = {
  version: string;
  id: string;
  key: string;          // numérique transporté en string
  name: string;
  title: string;
  blurb: string;
  info?: unknown;
  image?: DDragonChampionImage;
  tags: string[];
  partype?: string;
  stats?: Record<string, number>;
};

// Quand on charge la LISTE “champion.json”
type DDragonChampionList = {
  type: string;
  format: string;
  version: string;
  data: Record<string, DDragonChampion>;
};

// Variante “un champion direct” depuis disque (certains dumps custom peuvent contenir `lore`)
type DDragonChampionWithLore = DDragonChampion & { lore?: string };

// Format alternatif qu’on rencontre parfois depuis disque : { data: { Aatrox: {...} } }
type WrappedChampion = {
  data: Record<string, DDragonChampionWithLore>;
};

/* ========================= Type Guards (sans any) ========================= */

// Vérifie qu’on a bien un objet simple (pas null, pas array)
function isRecord(o: unknown): o is Record<string, unknown> {
  return typeof o === "object" && o !== null;
}

// Reconnaît le format “wrap” : { data: { Aatrox: {...} } }
function isWrappedChampion(o: unknown): o is WrappedChampion {
  if (!isRecord(o)) return false;
  const r = o as Record<string, unknown>;
  if (!("data" in r)) return false;
  return isRecord(r.data);
}

// Reconnaît “un champion direct” (id / name / title en string)
function isDDragonChampion(o: unknown): o is DDragonChampionWithLore {
  if (!isRecord(o)) return false;
  const r = o as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.name === "string" &&
    typeof r.title === "string"
  );
}

/* ========================= Fallback disque =========================
   Lis tous les fichiers *.json de /data/champions et tente de parser :
   - soit { data: { Aatrox: {...} } }  → on prend le 1er
   - soit directement { id, name, title, ... }
   Tout est typé via les guards ci-dessus → zéro `any`.
==================================================================== */
export async function getChampionsFromDisk(): Promise<ChampionMeta[]> {
  let files: string[] = [];
  try {
    files = await fs.readdir(DATA_DIR);
  } catch {
    // ✅ Fix ESLint: pas de variable `e` non utilisée
    console.warn("[champions] Aucun dossier data/champions (fallback disque ignoré).");
    return [];
  }

  const champions: ChampionMeta[] = [];

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const full = path.join(DATA_DIR, file);
    try {
      const raw = await fs.readFile(full, "utf-8");
      const parsed: unknown = JSON.parse(raw);

      let root: DDragonChampionWithLore | undefined;

      // 1) Format { data: { Aatrox: {...} } }
      if (isWrappedChampion(parsed)) {
        const first = Object.values(parsed.data)[0];
        if (first && isDDragonChampion(first)) {
          root = first;
        }
      }
      // 2) Format “champion direct”
      else if (isDDragonChampion(parsed)) {
        root = parsed;
      }

      if (!root) continue;

      const id = root.id;
      const name = root.name;
      const title = root.title;
      const key = String(root.key ?? "");
      const roles = Array.isArray(root.tags) ? root.tags : [];
      const partype = root.partype;
      const blurb = root.blurb;
      const lore =
        typeof (root as DDragonChampionWithLore).lore === "string"
          ? (root as DDragonChampionWithLore).lore
          : undefined;

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
        // ✅ si tu utilises CDragon/DDragon pour les images, laisse vide
        imagePath: "",
      });
    } catch (e) {
      console.error("[champions] Erreur de parsing pour", file, e);
    }
  }

  champions.sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
  return champions;
}

/* ========================= CDN (prod) =========================
   Charge la LISTE des champions depuis DDragon :
   https://ddragon.leagueoflegends.com/cdn/<ver>/data/fr_FR/champion.json
================================================================ */
export async function getChampionsFromCDN(): Promise<ChampionMeta[]> {
  const url = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/data/fr_FR/champion.json`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
    if (!res.ok) {
      console.error("[champions] CDN fetch KO:", res.status, res.statusText);
      return [];
    }
    const json = (await res.json()) as DDragonChampionList;

    const arr = Object.values(json.data);
    const champions: ChampionMeta[] = arr.map((root) => {
      const id = root.id;
      const name = root.name;
      const title = root.title;
      const key = String(root.key ?? "");
      const roles = Array.isArray(root.tags) ? root.tags : [];
      const partype = root.partype;
      const blurb = root.blurb;

      return {
        id,
        key,
        slug: id.toLowerCase(),
        name,
        title,
        roles,
        partype,
        blurb,
        lore: undefined,     // le lore complet est chargé “à la demande” via lib/ddragon.ts
        imagePath: "",       // images via CDN (championAssets)
      };
    });

    champions.sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
    return champions;
  } catch (e) {
    console.error("[champions] Erreur fetch CDN:", e);
    return [];
  }
}
