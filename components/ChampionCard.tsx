// components/ChampionCard.tsx
"use client";

import type { ChampionMeta } from "@/lib/champions";

type Props = {
  champ: ChampionMeta;
  isRevealed: boolean;
};

export default function ChampionCard({ champ, isRevealed }: Props) {
  const hasRoles = Array.isArray(champ.roles) && champ.roles.length > 0;
  const resource = champ.partype || "";

  return (
    <div className="flip-scene">
      <div
        className={`flip-card ${isRevealed ? "is-revealed" : ""}`}
        data-champion-id={champ.id}
      >
        {/* Face avant : visible seulement si pas révélée */}
        {!isRevealed && (
          <div className="flip-face flip-front" aria-hidden={isRevealed}>
            <div className="text-center px-2 select-none">
              <div className="text-xs uppercase tracking-wide text-white/60">
                Champion
              </div>
              <div className="text-sm">Écris son nom pour révéler</div>
            </div>
          </div>
        )}

        {/* Face arrière : image + infos */}
        <div className="flip-face flip-back">
          {/* Image (ne flip pas) */}
          <img
            className={`no-flip art ${isRevealed ? "art-on" : ""}`}
            src={champ.imagePath}
            alt={`${champ.name} — ${champ.title}`}
            loading="lazy"
            decoding="async"
            width={1024}
            height={1280}
            sizes="(min-width:1280px) 18vw, (min-width:768px) 23vw, (min-width:640px) 30vw, 45vw"
          />

          {/* Légende en bas */}
          {isRevealed && (
            <div className="flip-caption">
              <div className="name">{champ.name}</div>
              <div className="title">{champ.title}</div>

              {(hasRoles || resource) && (
                <div className="meta">
                  {hasRoles &&
                    champ.roles.map((r) => (
                      <span className="pill" key={r} title={`Rôle : ${r}`}>
                        {r}
                      </span>
                    ))}
                  {resource && (
                    <span className="pill" title={`Ressource : ${resource}`}>
                      {resource}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
