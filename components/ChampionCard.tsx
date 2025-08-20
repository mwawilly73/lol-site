// components/ChampionCard.tsx
// ---------------------------------------------------------------------
// Carte "jeu":
// - L'image est TOUJOURS rendue avec next/image pour perf (CDN/local).
// - Tant que non révélé: l'image est en niveaux de gris + floutée + sombre.
// - Nom + tags (rôles + partype) s'affichent UNIQUEMENT si révélé.
// - Bouton "Aide" quand NON révélé :
//    * au survol -> tooltip avec le "titre" du champion (ex: Épée des Darkin).
//    * le titre dans le tooltip est cliquable -> copie dans le presse-papiers.
//      (on affiche "Copié !" quelques secondes)
// - Aucune lore ici.
//
// Props minimales :
//   - champion: ChampionMeta
//   - isRevealed: boolean
// ---------------------------------------------------------------------

import { useId, useState } from "react";
import Image from "next/image";
import type { ChampionMeta } from "@/lib/champions";

type Props = {
  champion: ChampionMeta;
  isRevealed: boolean;
};

export default function ChampionCard({ champion, isRevealed }: Props) {
  const uid = useId();
  const [copied, setCopied] = useState(false);

  // Sécurité + fallbacks
  const name = champion?.name ?? "";
  const title = champion?.title ?? ""; // ex: "Épée des Darkin"
  const roles = Array.isArray(champion?.roles) ? champion.roles : [];
  const partype = champion?.partype ?? "";
  const img = champion?.imageUrl || champion?.imagePath || "";

  // Copie du titre au clic (bouton du tooltip)
  async function copyTitle() {
    try {
      await navigator.clipboard.writeText(title);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Pas de toast envahissant, on reste silencieux si refus.
    }
  }

  // Classes d'état visuel
  const imgFilters = isRevealed
    ? "" // net et en couleurs
    : "grayscale blur-[2px] brightness-75"; // indices légers sans révéler

  return (
    <div className="relative rounded-lg shadow hover:shadow-xl transition border border-white/10 overflow-hidden">
      {/* IMAGE (toujours rendue pour l'effet "avant/après") */}
      <div className="relative w-full aspect-square">
        {img ? (
          <Image
            src={img}
            alt={name || "Champion LoL"}
            fill
            sizes="(max-width: 768px) 50vw,
                   (max-width: 1200px) 25vw,
                   200px"
            className={`object-cover ${imgFilters}`}
            priority={false}
          />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-white/5 ${imgFilters}`}>
            <span className="text-white/50 text-xl">{name || "Champion"}</span>
          </div>
        )}
      </div>

      {/* CONTENU TEXTE */}
      <div className="p-2 text-center">
        {/* Nom + tags visibles UNIQUEMENT si révélé */}
        {isRevealed ? (
          <>
            <h3 className="text-lg font-semibold">{name}</h3>
            <p className="text-sm text-gray-400">
              {[roles.join(", "), partype].filter(Boolean).join(" • ")}
            </p>
          </>
        ) : (
          // Placeholder compact quand non révélé (pas de nom/tags)
          <div className="flex flex-col items-center gap-2">
            <div className="h-5 w-28 rounded bg-white/5" />
            <div className="flex items-center justify-center gap-2">
              <div className="h-4 w-16 rounded bg-white/5" />
              <div className="h-4 w-10 rounded bg-white/5" />
            </div>
          </div>
        )}
      </div>

      {/* BOUTON AIDE — visible UNIQUEMENT si non révélé */}
      {!isRevealed && title && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
          <div className="group relative">
            <button
              type="button"
              aria-describedby={`hint-${uid}`}
              className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 border border-white/15"
            >
              Aide
            </button>

            {/* TOOLTIP au survol/focus */}
            <div
              id={`hint-${uid}`}
              role="tooltip"
              className="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity duration-150 absolute left-1/2 -translate-x-1/2 bottom-full mb-2 min-w-[12rem] max-w-[16rem] rounded-lg border border-white/15 bg-black/80 backdrop-blur p-2 text-center"
            >
              <div className="text-[11px] uppercase tracking-wide text-white/60">
                Titre du champion
              </div>

              {/* Le titre est cliquable -> copie dans le presse-papiers */}
              <button
                type="button"
                onClick={copyTitle}
                className="mt-1 text-sm text-white hover:underline focus:underline"
              >
                {title}
              </button>

              {/* Feedback de copie */}
              <div
                className={`mt-1 text-[11px] ${
                  copied ? "text-emerald-400" : "text-white/40"
                }`}
                aria-live="polite"
              >
                {copied ? "Copié !" : "Clique pour copier"}
              </div>

              {/* Petite flèche */}
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45 bg-black/80 border-b border-r border-white/15" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
