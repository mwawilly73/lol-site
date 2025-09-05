// components/AdSenseAuto.tsx
"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

function isProdLike() {
  if (process.env.NODE_ENV === "production") return true;
  const devProd = process.env.NEXT_PUBLIC_FORCE_PROD === "1";
  return !!devProd;
}

/**
 * Charge le script AdSense une seule fois quand:
 * - on est "prod-like"
 * - un publisher id est défini
 */
export default function AdSenseAuto() {
  const pubId = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID;
  const loaded = useRef(false);

  useEffect(() => {
    if (!isProdLike()) return;
    if (!pubId || loaded.current) return;

    // Évite double-injection
    if (document.querySelector('script[data-ad-client]')) {
      loaded.current = true;
      return;
    }

    const s = document.createElement("script");
    s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
    s.async = true;
    s.setAttribute("data-ad-client", pubId);
    s.crossOrigin = "anonymous";
    document.head.appendChild(s);

    // Prépare le tableau global typé (évite any)
    window.adsbygoogle = window.adsbygoogle || [];
    // On ne pousse rien ici (slots feront push plus tard), mais on initialise proprement.

    loaded.current = true;
  }, [pubId]);

  return null;
}
