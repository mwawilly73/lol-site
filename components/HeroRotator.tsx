// components/HeroRotator.tsx
"use client";

import Image from "next/image";
import { PropsWithChildren, useEffect, useMemo, useRef, useState } from "react";

type Props = {
  images: string[];
  intervalMs?: number;
  className?: string;
};

export default function HeroRotator({
  images,
  intervalMs = 5000,
  className = "",
  children,
}: PropsWithChildren<Props>) {
  const safeImages = useMemo(
    () => images.filter((u) => typeof u === "string" && u.length > 0),
    [images]
  );

  const [idx, setIdx] = useState(0);
  const timerRef = useRef<number | null>(null);

  // Rotation
  useEffect(() => {
    if (safeImages.length <= 1) return;
    timerRef.current = window.setInterval(() => {
      setIdx((i) => (i + 1) % safeImages.length);
    }, intervalMs) as unknown as number;
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [safeImages, intervalMs]);

  // Warm-up de l'image suivante (pas de <link rel="preload"> pour éviter les warnings)
  useEffect(() => {
    if (safeImages.length <= 1) return;
    const next = safeImages[(idx + 1) % safeImages.length];

    type ImgWithFetchPriority = HTMLImageElement & {
      fetchPriority?: "high" | "low" | "auto";
    };

    const pre = new window.Image() as ImgWithFetchPriority;
    pre.decoding = "async";
    pre.referrerPolicy = "no-referrer";
    pre.fetchPriority = "low"; // aucun warning même si non standard côté TS
    pre.src = next;
  }, [idx, safeImages]);

  if (safeImages.length === 0) {
    return (
      <div className={`relative rounded-2xl ring-1 ring-white/10 bg-white/5 ${className}`}>
        <div className="px-4 py-10 text-center">
          <h1 className="text-2xl font-bold">LoL Quiz</h1>
          <p className="text-white/80 mt-1">Bienvenue !</p>
          {children}
        </div>
      </div>
    );
  }

  const current = safeImages[idx];

  return (
    <section
      className={`relative overflow-hidden rounded-2xl ring-1 ring-white/10 ${className}`}
      aria-label="Mise en avant"
    >
      {/* Image plein écran dans le cadre */}
      <div className="relative h-[42vh] min-h-[260px] sm:h-[52vh]">
        <Image
          src={current}
          alt=""                // décoratif
          fill
          sizes="100vw"
          quality={85}
          priority={idx === 0}  // ✅ LCP: seule la 1ʳᵉ image est prioritaire
          loading={idx === 0 ? "eager" : "lazy"}
          className="object-cover"
        />
        {/* Voile sombre + masque pour lisibilité du texte */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-black/45" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        {/* Contenu centré */}
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="text-center">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
