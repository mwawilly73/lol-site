// components/AdSlot.tsx
"use client";

import { useEffect, useState } from "react";
import type { ConsentSnapshot } from "@/lib/consent";

type Props = {
  id: string;
  size?: "banner" | "rectangle" | "leaderboard";
  className?: string;
};

function useAdsPersonalizedFlag() {
  const [personalized, setPersonalized] = useState<boolean>(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.dataset.adsPersonalized === "true";
  });

  useEffect(() => {
    const onChange = (e: Event) => {
      const evt = e as CustomEvent<ConsentSnapshot>;
      const next = !!evt.detail?.adsPersonalized;
      setPersonalized(next);
    };
    window.addEventListener("ads:consent-changed", onChange);
    return () => window.removeEventListener("ads:consent-changed", onChange);
  }, []);

  return personalized;
}

export default function AdSlot({ id, size = "banner", className = "" }: Props) {
  const personalized = useAdsPersonalizedFlag();

  const dims =
    size === "leaderboard"
      ? "h-20"
      : size === "rectangle"
      ? "h-24"
      : "h-16"; // banner (défaut)

  return (
    <div
      id={`ad-${id}`}
      className={`relative w-full ${dims} rounded-md ring-1 ring-white/10 bg-white/5 ${className}`}
      aria-label="Emplacement publicitaire"
    >
      <div className="absolute inset-0 grid place-items-center text-xs sm:text-sm text-white/70">
        <span>
          {personalized ? "Annonce (personnalisée)" : "Annonce (non personnalisée)"}
        </span>
      </div>
    </div>
  );
}
