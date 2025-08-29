// components/HeroRotator.tsx
"use client";

import Image from "next/image";
import { PropsWithChildren, useEffect, useMemo, useRef, useState } from "react";

type Props = {
  images: string[];
  intervalMs?: number;
  className?: string;
};

const HERO_SIZES =
  // Ton site est centré en max-w-6xl (~1152px). On évite "100vw" pour supprimer le warning.
  "(min-width:1280px) 1152px, 100vw";

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

  // Index de la couche "rotation" (au-dessus de la base)
  const [idx, setIdx] = useState(0);
  // Ne démarre la rotation qu'après la fenêtre LCP
  const [rotating, setRotating] = useState(false);

  const intervalRef = useRef<number | null>(null);
  const startTimeoutRef = useRef<number | null>(null);
  const fallbackTimeoutRef = useRef<number | null>(null);

  // Démarrer la rotation : après onload + marge
  useEffect(() => {
    if (safeImages.length <= 1) return;

    const start = () => {
      if (rotating) return;
      // petite marge après onload pour être sûr de ne pas parasiter le LCP
      startTimeoutRef.current = window.setTimeout(() => {
        setRotating(true);
      }, 3500) as unknown as number;
    };

    // on attend l'évènement 'load'
    if (document.readyState === "complete") {
      start();
    } else {
      const onLoad = () => start();
      window.addEventListener("load", onLoad, { once: true });
      // fallback si 'load' capricieux en dev/HMR
      fallbackTimeoutRef.current = window.setTimeout(() => start(), 6000) as unknown as number;
      return () => {
        window.removeEventListener("load", onLoad);
      };
    }

    return () => {
      if (startTimeoutRef.current) window.clearTimeout(startTimeoutRef.current);
      if (fallbackTimeoutRef.current) window.clearTimeout(fallbackTimeoutRef.current);
    };
  }, [safeImages, rotating]);

  // Boucle de rotation (uniquement quand rotating === true)
  useEffect(() => {
    if (!rotating || safeImages.length <= 1) return;

    intervalRef.current = window.setInterval(() => {
      setIdx((i) => (i + 1) % safeImages.length);
    }, intervalMs) as unknown as number;

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [rotating, safeImages, intervalMs]);

  // Pré-chargement "soft" de l'image suivante
  useEffect(() => {
    if (!rotating || safeImages.length <= 1) return;
    const next = safeImages[(idx + 1) % safeImages.length];

    type ImgWithFetchPriority = HTMLImageElement & {
      fetchPriority?: "high" | "low" | "auto";
    };

    try {
      const pre = new window.Image() as ImgWithFetchPriority;
      pre.decoding = "async";
      pre.referrerPolicy = "no-referrer";
      pre.fetchPriority = "low";
      pre.src = next;
    } catch {}
  }, [rotating, idx, safeImages]);

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

  // Image de base : la 1ʳᵉ, PRIORITAIRE → devient bien le LCP
  const base = safeImages[0];
  // Image au-dessus : la "courante" quand rotation active
  const current = safeImages[idx];

  return (
    <section
      className={`relative overflow-hidden rounded-2xl ring-1 ring-white/10 ${className}`}
      aria-label="Mise en avant"
    >
      {/* Même gabarit + fond opaque pour éviter toute transparence au chargement */}
      <div className="relative h-[42vh] min-h-[260px] sm:h-[52vh] bg-[#0b0f16]">
        {/* Couche de base — ne bouge plus → LCP stable */}
        <Image
          src={base}
          alt="" // décoratif
          fill
          sizes={HERO_SIZES}
          quality={85}
          priority // ✅ LCP : seule cette image est prioritaire
          loading="eager"
          className="absolute inset-0 object-cover object-center"
        />

        {/* Couche de rotation — par-dessus, uniquement après onload+marge */}
        {rotating && (
          <Image
            key={current}
            src={current}
            alt="" // décoratif
            fill
            sizes={HERO_SIZES}
            quality={85}
            // pas de priority ici
            className="absolute inset-0 object-cover object-center transition-opacity duration-700 opacity-100"
          />
        )}

        {/* Voile sombre + dégradé (au-dessus des images) */}
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
