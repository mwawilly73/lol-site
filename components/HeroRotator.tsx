// components/HeroRotator.tsx
"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Props = {
  images: string[];
  intervalMs?: number;
  children?: React.ReactNode;
};

/**
 * Hero avec rotation d’images :
 * - Base opaque (bg solide) qui masque le background global.
 * - Images en full cover (object-cover), crossfade doux.
 * - Overlay sombre lisible.
 * - Aucune transparence ne laisse voir le background du site.
 */
export default function HeroRotator({ images, intervalMs = 5000, children }: Props) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<number | null>(null);

  // Rotation aléatoire (différent du précédent)
  useEffect(() => {
    if (!images?.length) return;
    timerRef.current = window.setInterval(() => {
      setIdx((prev) => {
        if (images.length <= 1) return prev;
        let next = prev;
        while (next === prev) {
          next = Math.floor(Math.random() * images.length);
        }
        return next;
      });
    }, intervalMs) as unknown as number;

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [images, intervalMs]);

  return (
    <div
      className="
        relative isolate
        mx-auto max-w-6xl
        my-3 sm:my-4
        h-[42vh] min-h-[280px] sm:h-[56vh] lg:h-[64vh]
        overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-lg
      "
    >
      {/* ✅ BASE OPAQUE : masque totalement le bg du site */}
      <div className="absolute inset-0 bg-[#0e1117]" aria-hidden />

      {/* Pile d’images en cover (aucun espace vide) */}
      <div className="absolute inset-0">
        {images.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt=""
            fill
            priority={i === idx}
            sizes="(max-width: 1280px) 100vw, 1280px"
            quality={85}
            className={`object-cover will-change-[opacity,transform] transition-opacity duration-700 ease-out
              ${i === idx ? "opacity-100" : "opacity-0"}
            `}
          />
        ))}
      </div>

      {/* Scrim lisible (sombre) – pas transparent au point de laisser voir le BG du site */}
      <div
        className="
          pointer-events-none absolute inset-0
          bg-gradient-to-b from-black/60 via-black/35 to-black/65
        "
        aria-hidden
      />

      {/* Contenu au-dessus des images */}
      <div className="relative z-10 h-full w-full flex items-center justify-center px-3 sm:px-6">
        {children}
      </div>
    </div>
  );
}
