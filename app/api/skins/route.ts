// app/api/skins/route.ts
import { NextResponse } from "next/server";

export const revalidate = 86400; // 24h

type SkinsMap = Record<string, number[]>; // ex: { "Aatrox": [1,2,3,7,...] } (sans 0)

async function getLatestVersion(): Promise<string> {
  const res = await fetch("https://ddragon.leagueoflegends.com/api/versions.json", { cache: "force-cache" });
  const arr = (await res.json()) as string[];
  return arr?.[0] ?? "14.1.1";
}

export async function GET() {
  const ver = await getLatestVersion();
  const url = `https://ddragon.leagueoflegends.com/cdn/${ver}/data/en_US/championFull.json`;

  const res = await fetch(url, { cache: "force-cache" });
  const json = (await res.json()) as {
    data: Record<string, { id: string; skins: { num: number }[] }>;
  };

  const map: SkinsMap = {};
  for (const key of Object.keys(json.data)) {
    const champ = json.data[key];
    // On garde seulement les "num" > 0 (les skins). 0 = splash de base.
    const nums = (champ.skins || [])
      .map((s) => s.num)
      .filter((n) => Number.isInteger(n) && n > 0);
    map[champ.id] = nums;
  }

  return NextResponse.json(map, {
    // hint cache niveau CDN
    headers: { "Cache-Control": "public, max-age=86400, immutable" },
  });
}
