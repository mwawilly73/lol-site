// components/AdSenseAuto.tsx
"use client";

import { useEffect, useRef } from "react";

export default function AdSenseAuto() {
  const pubId = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID;
  const loaded = useRef(false);

  useEffect(() => {
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
    loaded.current = true;
  }, [pubId]);

  return null;
}
