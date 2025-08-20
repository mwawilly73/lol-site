// components/ChampionCard.tsx
// --------------------------------------------------------------
// Carte "jeu" : n'affiche l'image + le nom + les tags du champion
// QUE si isRevealed === true. Sinon, on montre un "dos de carte".
// - Pas de navigation (noLink par défaut dans le jeu)
// - Gère imageUrl (CDN) ou imagePath (local) en fallback
// --------------------------------------------------------------

import Image from "next/image";
import type { ChampionMeta } from "@/lib/champions";

type Props = {
  champion: ChampionMeta;     // données du champion (id, name, roles, partype, imageUrl/imagePath...)
  isRevealed: boolean;        // true => montrer l'image et les infos ; false => dos de carte
};

export default function ChampionCard({ champion, isRevealed }: Props) {
  // Sécurité : si jamais un champ manque, on met des valeurs safe
  const name = champion?.name ?? "";
  const roles = Array.isArray(champion?.roles) ? champion.roles : [];
  const partype = champion?.partype ?? "";      // ex: "Mana", "Énergie", "Puits de sang", etc.
  const img = champion?.imageUrl || champion?.imagePath || "";

  // "Dos" de carte (état non révélé) : simple panneau
  if (!isRevealed) {
    return (
      <div className="rounded-lg shadow bg-white/5 border border-white/10 overflow-hidden">
        {/* Zone visuelle carrée */}
        <div className="aspect-square w-full flex items-center justify-center">
          {/* Tu peux remplacer ce contenu par une image de dos de carte si tu veux */}
          <span className="text-white/40 text-4xl select-none">?</span>
        </div>
        {/* Pas de nom, pas de tags tant que non trouvé */}
        <div className="p-2 text-center">
          <div className="h-5 bg-white/5 rounded" />
          <div className="mt-2 flex items-center justify-center gap-2">
            <div className="h-4 w-16 bg-white/5 rounded" />
            <div className="h-4 w-10 bg-white/5 rounded" />
          </div>
        </div>
      </div>
    );
  }

  // État révélé : image + nom + petites caractéristiques
  return (
    <div className="rounded-lg shadow hover:shadow-xl transition border border-white/10 overflow-hidden">
      <div className="relative w-full aspect-square">
        {img ? (
          <Image
            src={img}
            alt={name}
            fill
            sizes="(max-width: 768px) 50vw,
                   (max-width: 1200px) 25vw,
                   200px"
            className="object-cover"
            priority={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/60 bg-white/5">
            {name || "Champion"}
          </div>
        )}
      </div>

      <div className="p-2 text-center">
        {/* Nom */}
        <h3 className="text-lg font-semibold">{name}</h3>

        {/* Petites caractéristiques: rôles + partype (ex: "Fighter • Puits de sang") */}
        <p className="text-sm text-gray-400">
          {[roles.join(", "), partype].filter(Boolean).join(" • ")}
        </p>
      </div>
    </div>
  );
}
