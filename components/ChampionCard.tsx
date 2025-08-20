// components/ChampionCard.tsx
// ---------------------------------------------------------------------
// Carte "jeu":
// - previewMode: "none" (normal) | "blur" (facile)
// - Bouton Aide : centré et légèrement descendu (top ~62%)
// - Nom + tags visibles UNIQUEMENT si révélé (pas de lore)
// ---------------------------------------------------------------------

import { useId, useState } from "react";
import Image from "next/image";
import type { ChampionMeta } from "@/lib/champions";

type PreviewMode = "none" | "blur";

type Props = {
  champion: ChampionMeta;
  isRevealed: boolean;
  previewMode?: PreviewMode;
};

export default function ChampionCard({ champion, isRevealed, previewMode = "blur" }: Props) {
  const uid = useId();
  const [copied, setCopied] = useState(false);

  const name = champion?.name ?? "";
  const title = champion?.title ?? "";
  const roles = Array.isArray(champion?.roles) ? champion.roles : [];
  const partype = champion?.partype ?? "";
  const img = champion?.imageUrl || champion?.imagePath || "";

  async function copyTitle() {
    try {
      await navigator.clipboard.writeText(title);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  const hiddenFilters = "grayscale blur-[4px] brightness-75";

  return (
    <div className="relative rounded-lg shadow hover:shadow-xl transition border border-white/10 overflow-hidden">
      {/* IMAGE */}
      <div className="relative w-full aspect-square bg-white/5">
        {isRevealed ? (
          img ? (
            <Image
              src={img}
              alt={name || "Champion LoL"}
              fill
              sizes="(max-width: 768px) 50vw,(max-width: 1200px) 25vw,200px"
              className="object-cover"
              priority={false}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/60">
              {name || "Champion"}
            </div>
          )
        ) : previewMode === "blur" && img ? (
          <Image
            src={img}
            alt="Aperçu flouté"
            fill
            sizes="(max-width: 768px) 50vw,(max-width: 1200px) 25vw,200px"
            className={`object-cover ${hiddenFilters}`}
            priority={false}
          />
        ) : (
          <div className="h-full w-full" />
        )}

        {/* BOUTON AIDE (centré, descendu) */}
        {!isRevealed && title && (
          <div className="absolute inset-x-0 top-[62%] flex items-center justify-center pointer-events-none">
            <div className="group relative pointer-events-auto">
              <button
                type="button"
                aria-describedby={`hint-${uid}`}
                className="px-3 py-1.5 text-xs rounded bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur"
              >
                Aide
              </button>

              {/* TOOLTIP */}
              <div
                id={`hint-${uid}`}
                role="tooltip"
                className="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity duration-150 absolute left-1/2 -translate-x-1/2 -top-2 -translate-y-full min-w-[12rem] max-w-[18rem] rounded-lg border border-white/15 bg-black/80 backdrop-blur p-2 text-center"
              >
                <div className="text-[11px] uppercase tracking-wide text-white/60">
                  Titre du champion
                </div>
                <button
                  type="button"
                  onClick={copyTitle}
                  className="mt-1 text-sm text-white hover:underline focus:underline"
                >
                  {title}
                </button>
                <div
                  className={`mt-1 text-[11px] ${
                    copied ? "text-emerald-400" : "text-white/40"
                  }`}
                  aria-live="polite"
                >
                  {copied ? "Copié !" : "Clique pour copier"}
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full w-2 h-2 rotate-45 bg-black/80 border-l border-t border-white/15" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CONTENU TEXTE */}
      <div className="p-2 text-center">
        {isRevealed ? (
          <>
            <h3 className="text-lg font-semibold">{name}</h3>
            <p className="text-sm text-gray-400">
              {[roles.join(", "), partype].filter(Boolean).join(" • ")}
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="h-5 w-28 rounded bg-white/5" />
            <div className="flex items-center justify-center gap-2">
              <div className="h-4 w-16 rounded bg-white/5" />
              <div className="h-4 w-10 rounded bg-white/5" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
