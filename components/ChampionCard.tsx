// components/ChampionCard.tsx
// ---------------------------------------------------------------------
// Carte "jeu":
// - Propriété previewMode contrôle l'aperçu avant découverte:
//      * "none" => pas d'image avant découverte (mode Normal).
//      * "blur" => image visible en N&B + flou (mode Facile).
// - Bouton Aide : centré au milieu de la carte quand non révélé.
// - Nom + tags visibles UNIQUEMENT si révélé.
// - Aucune lore ici.
// ---------------------------------------------------------------------

import { useId, useState } from "react";
import Image from "next/image";
import type { ChampionMeta } from "@/lib/champions";

type PreviewMode = "none" | "blur";

type Props = {
  champion: ChampionMeta;     // données du champion (id, name, roles, partype, imageUrl/imagePath...)
  isRevealed: boolean;        // true => montrer l'image et les infos ; false => état caché
  previewMode?: PreviewMode;  // "none" (normal) | "blur" (facile). Par défaut "blur".
};

export default function ChampionCard({ champion, isRevealed, previewMode = "blur" }: Props) {
  const uid = useId();
  const [copied, setCopied] = useState(false);

  // Sécurité + fallbacks
  const name = champion?.name ?? "";
  const title = champion?.title ?? ""; // ex: "Épée des Darkin"
  const roles = Array.isArray(champion?.roles) ? champion.roles : [];
  const partype = champion?.partype ?? "";
  const img = champion?.imageUrl || champion?.imagePath || "";

  // Copie du titre au clic (dans le tooltip)
  async function copyTitle() {
    try {
      await navigator.clipboard.writeText(title);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* silencieux si refus navigateur */
    }
  }

  // Filtre visuel de l'image quand non révélé (mode "Facile")
  const hiddenFilters =
    "grayscale blur-[4px] brightness-75"; // flou un peu plus fort qu'avant

  return (
    <div className="relative rounded-lg shadow hover:shadow-xl transition border border-white/10 overflow-hidden">
      {/* ZONE IMAGE */}
      <div className="relative w-full aspect-square bg-white/5">
        {/* Rendu conditionnel de l'image */}
        {isRevealed ? (
          // ÉTAT RÉVÉLÉ : image nette en couleurs
          img ? (
            <Image
              src={img}
              alt={name || "Champion LoL"}
              fill
              sizes="(max-width: 768px) 50vw,
                     (max-width: 1200px) 25vw,
                     200px"
              className="object-cover"
              priority={false}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/60">
              {name || "Champion"}
            </div>
          )
        ) : previewMode === "blur" && img ? (
          // ÉTAT NON RÉVÉLÉ — MODE FACILE : image en arrière-plan + N&B + flou
          <Image
            src={img}
            alt="Aperçu flouté"
            fill
            sizes="(max-width: 768px) 50vw,
                   (max-width: 1200px) 25vw,
                   200px"
            className={`object-cover ${hiddenFilters}`}
            priority={false}
          />
        ) : (
          // ÉTAT NON RÉVÉLÉ — MODE NORMAL : pas d'image (fond uni)
          <div className="h-full w-full" />
        )}

        {/* BOUTON AIDE — visible UNIQUEMENT si non révélé et s'il y a un titre */}
        {!isRevealed && title && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="group relative pointer-events-auto">
              <button
                type="button"
                aria-describedby={`hint-${uid}`}
                className="px-3 py-1.5 text-xs rounded bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur"
              >
                Aide
              </button>

              {/* TOOLTIP centré au-dessus du bouton (visible au survol/focus) */}
              <div
                id={`hint-${uid}`}
                role="tooltip"
                className="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity duration-150 absolute left-1/2 -translate-x-1/2 -top-2 -translate-y-full min-w-[12rem] max-w-[18rem] rounded-lg border border-white/15 bg-black/80 backdrop-blur p-2 text-center"
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
                <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full w-2 h-2 rotate-45 bg-black/80 border-l border-t border-white/15" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CONTENU TEXTE — uniquement si révélé */}
      <div className="p-2 text-center">
        {isRevealed ? (
          <>
            <h3 className="text-lg font-semibold">{name}</h3>
            <p className="text-sm text-gray-400">
              {[roles.join(", "), partype].filter(Boolean).join(" • ")}
            </p>
          </>
        ) : (
          // Placeholder compact (mêmes hauteurs pour éviter les sauts)
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
