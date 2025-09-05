// app/api/skins/route.ts
// -----------------------------------------------------------------------------
// Retourne une map { [championId]: number[] } des index de skins disponibles
// (exclut 0 = splash de base). Les données proviennent de DDragon "championFull".
// - runtime: nodejs
// - revalidate: LITTÉRAL (86400) requis par Next 15
// - fetch: avec revalidate côté Data Cache
// - headers: Cache-Control pour le CDN
// -----------------------------------------------------------------------------

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 86400; // ⚠️ DOIT être littéral (pas de 60*60*24)
export const dynamic = "force-static"; // optionnel, OK avec revalidate

type RiotSkin = { id: string; num: number; name: string };
type RiotChampion = { id: string; name: string; skins: RiotSkin[] };
type RiotChampionFull = {
  type: string;
  format: string;
  version: string;
  data: Record<string, RiotChampion>;
};

async function getLatestVersion(): Promise<string> {
  const r = await fetch("https://ddragon.leagueoflegends.com/api/versions.json", {
    next: { revalidate: 86400 },
  });
  if (!r.ok) throw new Error(`versions.json ${r.status}`);
  const arr = (await r.json()) as string[];
  if (!Array.isArray(arr) || arr.length === 0) throw new Error("versions empty");
  return arr[0]!;
}

async function getChampionFull(version: string): Promise<RiotChampionFull> {
  const url = `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/championFull.json`;
  const r = await fetch(url, { next: { revalidate: 86400 } });
  if (!r.ok) throw new Error(`championFull ${r.status}`);
  return (await r.json()) as RiotChampionFull;
}

export async function GET() {
  try {
    const v = await getLatestVersion();
    const full = await getChampionFull(v);

    const map: Record<string, number[]> = {};
    for (const key of Object.keys(full.data)) {
      const champ = full.data[key]!;
      // Conserver uniquement les "num" > 0 (skins alternatifs)
      const nums = (champ.skins || [])
        .map((s) => s.num)
        .filter((n) => n > 0)
        .sort((a, b) => a - b);
      map[champ.id] = nums;
    }

    return NextResponse.json(map, {
      headers: {
        // Cache côté edge/CDN pour de bonnes pratiques HTTP (en plus du Data Cache Next)
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
      },
    });
  } catch (e) {
    // En cas d’erreur, on renvoie un objet vide (le jeu retombera sur le splash 0)
    console.error("[/api/skins] error:", e);
    return NextResponse.json({}, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300",
      },
    });
  }
}
