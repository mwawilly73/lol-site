// components/HeroRotator.tsx
"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import NextImage from "next/image";

type Props = {
  images: string[];
  intervalMs?: number; // défaut: 5000ms
  children?: ReactNode;
};

// Petite helper: exécute cb quand le thread est dispo (ou après ~200ms)
function scheduleIdle(cb: () => void, timeout = 1500) {
  const ric = (globalThis as any).requestIdleCallback as
    | ((cb: (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void, opts?: { timeout?: number }) => number)
    | undefined;

  if (typeof ric === "function") {
    ric(() => cb(), { timeout });
  } else {
    setTimeout(cb, 200);
  }
}

export default function HeroRotator({ images, intervalMs = 5000, children }: Props) {
  // Filtre URLs valides
  const safeImages = useMemo(
    () => (Array.isArray(images) ? images.filter((u) => typeof u === "string" && u.trim().length > 0) : []),
    [images]
  );

  // Index courant + précédent (pour crossfade)
  const [idx, setIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState(0);

  // Auto-rotation: un seul interval, on met à jour idx/prevIdx de façon fonctionnelle
  useEffect(() => {
    if (safeImages.length <= 1) return;
    const id = window.setInterval(() => {
      setIdx((i) => {
        setPrevIdx(i);
        return (i + 1) % safeImages.length;
      });
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [safeImages.length, intervalMs]);

  // Warm-up de l’image suivante (sans <link rel="preload">)
  useEffect(() => {
    if (safeImages.length <= 1) return;
    // Évite data-saver et l’onglet non visible
    // @ts-ignore - NetworkInformation pas partout
    if (navigator?.connection?.saveData) return;
    if (document.visibilityState === "hidden") return;

    const nextUrl = safeImages[(idx + 1) % safeImages.length];
    let cancelled = false;

    scheduleIdle(() => {
      if (cancelled) return;
      type ImgWithFetchPriority = HTMLImageElement & { fetchPriority?: "high" | "low" | "auto" };
      const pre = new window.Image() as ImgWithFetchPriority;
      pre.decoding = "async";
      pre.referrerPolicy = "no-referrer";
      pre.fetchPriority = "low";
      pre.src = nextUrl; // déclenche le fetch
    });

    return () => {
      cancelled = true;
    };
  }, [idx, safeImages]);

  const currentUrl = safeImages[idx] ?? "";
  const previousUrl = prevIdx !== idx ? (safeImages[prevIdx] ?? "") : ""; // ⚠️ pas d’image “prev” au 1er rendu
  const isFirst = idx === 0;

  return (
    <section
      className="relative isolate overflow-hidden"
      aria-label="Diaporama d'illustrations League of Legends"
    >
      {/* Fond plein = empêche le bg-site de transparaître */}
      <div className="absolute inset-0 -z-10 bg-[#0e1117]" aria-hidden="true" />

      {/* Calque image précédente (fade-out) */}
      {previousUrl && (
        <div className="absolute inset-0">
          <NextImage
            key={`prev-${prevIdx}`}
            src={previousUrl}
            alt=""
            fill
            sizes="100vw"
            priority={false}
            className="object-cover will-change-opacity transition-opacity duration-700 opacity-0"
          />
        </div>
      )}

      {/* Calque image courante (fade-in) */}
      {currentUrl && (
        <div className="absolute inset-0">
          <NextImage
            key={`cur-${idx}`}
            src={currentUrl}
            alt=""
            fill
            sizes="100vw"
            priority={isFirst} // ✅ LCP sur la 1ère image
            className="object-cover will-change-opacity transition-opacity duration-700 opacity-100"
          />
        </div>
      )}

      {/* Overlay sombre (bords propres, pas de transparence) */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 20%, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.75) 100%)",
        }}
      />

      {/* Contenu centré */}
      <div className="relative mx-auto max-w-6xl px-3 sm:px-4">
        <div className="flex min-h-[36vh] sm:min-h-[44vh] items-center justify-center">
          {children}
        </div>
      </div>
    </section>
  );
}
