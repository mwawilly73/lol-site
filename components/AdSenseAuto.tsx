// components/AdSenseAuto.tsx
"use client";

import { useEffect } from "react";

type Props = {
  publisherId?: string | null; // ex: "ca-pub-XXXXXXXXXXXX"
  /** réservé si tu ajoutes d’autres stratégies plus tard */
  strategy?: "auto";
};

type AdsByGoogleParams = Record<string, unknown>;
type AdsByGoogleQueue = {
  push: (params: AdsByGoogleParams) => void;
  loaded?: boolean;
} & AdsByGoogleParams[];

declare global {
  interface Window {
    adsbygoogle?: AdsByGoogleQueue;
  }
}

export default function AdSenseAuto({ publisherId, strategy = "auto" }: Props) {
  useEffect(() => {
    if (!publisherId || strategy !== "auto") return;

    // Évite les doublons
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src^="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]'
    );
    if (existing) return;

    const s = document.createElement("script");
    s.async = true;
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
      publisherId
    )}`;
    s.crossOrigin = "anonymous";
    document.head.appendChild(s);

    return () => {
      // On garde le script si déjà chargé (évite rechargements) — rien à faire au cleanup.
    };
  }, [publisherId, strategy]);

  return null;
}
