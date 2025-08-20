// lib/championAssets.ts
import {
  USE_DDRAGON,
  championImgUrl,
  passiveImgUrl,
  spellImgUrl,
} from "./ddragon";

export function getChampionPortraitUrl(
  version: string,
  imageFull: string,
  localPath: string
): string {
  return USE_DDRAGON ? championImgUrl(version, imageFull) : localPath;
}

export function getChampionPassiveUrl(
  version: string,
  passiveFull: string,
  localPath: string
): string {
  return USE_DDRAGON ? passiveImgUrl(version, passiveFull) : localPath;
}

export function getChampionSpellUrl(
  version: string,
  spellFull: string,
  localPath: string
): string {
  return USE_DDRAGON ? spellImgUrl(version, spellFull) : localPath;
}
