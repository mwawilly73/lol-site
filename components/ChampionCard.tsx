// components/ChampionCard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Cartes carrées nettes : on passe à "squareHD" (champion-icons CDragon) avec fallback.
// - Next/Image optimisé (quality=90 + placeholder blur).
// - Non révélé (facile) : blur renforcé + désaturation + contraste ↓.
// - Non révélé (normal) : dos de carte "?".
// ─────────────────────────────────────────────────────────────────────────────

import Image from "next/image";
import type { ChampionMeta } from "@/lib/champions";
import { getChampionPortraitUrl, DEFAULT_BLUR_DATA_URL } from "@/lib/championAssets";

type Props = {
  champion: ChampionMeta;
  isRevealed: boolean;
  previewMode?: "none" | "blur";
  isSelected?: boolean;
  onCardClick?: (slug: string) => void;
};

export default function ChampionCard({
  champion,
  isRevealed,
  previewMode = "none",
  isSelected = false,
  onCardClick,
}: Props) {
  // 👉 Carré HD **fiable** (champion-icons). On passe la clé numérique.
  const imgSrc =
    getChampionPortraitUrl(champion.id, champion.imagePath, {
      variant: "squareHD",
      riotKey: champion.key, // clé numérique (ex: "266")
    }) || champion.imagePath;

  const handleCardClick = () => onCardClick?.(champion.slug);
  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onCardClick?.(champion.slug);
    }
  };

  return (
    <div
      data-champion-card
      data-slug={champion.slug}
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className={`group relative block rounded-xl overflow-hidden
        ring-1 ring-white/10 bg-black hover:ring-white/20 transition
        ${isSelected ? "ring-2 ring-indigo-400 ring-offset-2 ring-offset-gray-900" : ""}
      `}
      aria-pressed={isSelected}
      aria-label={isRevealed ? champion.name : "Carte cachée"}
    >
      {/* Conteneur carré */}
      <div className="relative aspect-square select-none">
        {/* Image HD carrée */}
        <Image
          src={imgSrc}
          alt={champion.name}
          fill
          sizes="
                  (max-width: 480px) 45vw,      /* ~2 colonnes sur mobile */
                  (max-width: 768px) 30vw,      /* ~3 colonnes sur tablette */
                  (max-width: 1280px) 22vw,     /* ~4 colonnes sur laptop */
                  18vw                           /* grands écrans */
                "
          quality={90}
          placeholder="blur"
          blurDataURL={DEFAULT_BLUR_DATA_URL}
          className={`transition-opacity object-contain
            ${
              isRevealed
                ? "opacity-100"
                : previewMode === "blur"
                ? "grayscale blur-[6px] md:blur-[8px] opacity-90 saturate-[0.8] contrast-[0.85]"
                : "opacity-0"
            }
          `}
          priority={false}
        />

        {/* Dos de carte : visible uniquement si NON révélé ET mode normal */}
        {!isRevealed && previewMode === "none" && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
            <div className="h-20 w-20 md:h-24 md:w-24 rounded-full border-2 border-white/20 bg-black/40 shadow-inner flex items-center justify-center">
              <span className="text-4xl md:text-5xl font-extrabold text-white/80 select-none">?</span>
            </div>
          </div>
        )}

        {/* Bandeau d'infos (uniquement si révélée) */}
        {isRevealed && (
          <>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-2">
              <div className="rounded-md bg-black/60 ring-1 ring-white/10 px-2 py-1.5">
                <div className="text-sm font-semibold text-white">{champion.name}</div>
                <div className="text-xs text-white/80">{champion.title}</div>
                {champion.roles?.length > 0 && (
                  <div className="mt-1 text-[11px] text-white/75">
                    {champion.roles.join(" • ")}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
