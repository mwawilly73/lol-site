// components/AdSlot.tsx
"use client";

import { useEffect, useRef } from "react";
import { isProdLike } from "@/lib/runtime";

type Props = {
  id: string;
  className?: string;
  size?: "banner" | "rectangle" | "leaderboard" | "fluid";
};

/**
 * Slot publicitaire minimal (placeholder).
 * - En dev/localhost : n'initialise rien.
 * - En prod : point d'intégration futur ((window.adsbygoogle||[]).push({}))
 * L’attribut `data-ads-personalized` sur <html> est géré par AdsConsentBridge.
 */
export default function AdSlot({ id, className = "", size = "banner" }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isProdLike()) return; // ⛔ aucun init en dev/localhost
    // Exemple d'intégration plus tard :
    // try {
    //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
    //   (window as any).adsbygoogle = (window as any).adsbygoogle || [];
    //   (window as any).adsbygoogle.push({});
    // } catch {}
  }, []);

  const label =
    size === "leaderboard"
      ? "728×90"
      : size === "rectangle"
      ? "300×250"
      : size === "fluid"
      ? "responsive"
      : "468×60";

  const heightClass =
    size === "leaderboard"
      ? "h-24 md:h-28"
      : size === "rectangle"
      ? "h-40 md:h-48"
      : size === "fluid"
      ? "h-24 md:h-28 lg:h-32"
      : "h-16 md:h-20";

  return (
    <div
      ref={ref}
      id={id}
      data-ad-size={size}
      role="region"
      aria-label="Emplacement publicitaire"
      className={`relative overflow-hidden rounded-lg ring-1 ring-white/10 bg-white/5 ${className}`}
    >
      <div className="flex items-center justify-between px-3 py-2 text-xs text-white/70">
        <span>Ad slot: {id}</span>
        <span>{label}</span>
      </div>

      <div className={`flex items-center justify-center text-white/55 ${heightClass}`}>
        Publicité
      </div>
    </div>
  );
}
