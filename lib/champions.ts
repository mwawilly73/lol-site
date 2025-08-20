// lib/champions.ts
// Lecture des fichiers data/champions/*.json côté serveur (Node),
// mapping des champs utiles pour l’affichage.

import fs from "node:fs/promises";
import path from "node:path";

export type ChampionMeta = {
  id: string;          // "Aatrox"
  key: string;         // "266"
  slug: string;        // "aatrox"
  name: string;        // "Aatrox"
  title: string;       // "Épée des Darkin"
  roles: string[];     // ["Fighter"]...
  partype?: string;    // "Puits de sang"
  blurb?: string;
  lore?: string;
  imagePath: string;   // "/assets/champions/Aatrox.png"
};

const DATA_DIR = path.join(process.cwd(), "data", "champions");
const PUBLIC_PREFIX = "/assets/champions";

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

      // Le JSON DDragon-like est souvent { data: { Aatrox: { ... } } }
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

      // Image : on suppose public/assets/champions/<ID>.png
      const imageFile = root.image?.full ?? `${id}.png`;
      const imagePath = `${PUBLIC_PREFIX}/${imageFile}`; // ex: /assets/champions/Aatrox.png

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
        imagePath,
      });
    } catch (e) {
      console.error("[champions] Erreur de parsing pour", file, e);
    }
  }

  // Tri alpha par nom (comme demandé)
  champions.sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
  return champions;
}
