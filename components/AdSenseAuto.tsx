// components/AdSenseAuto.tsx
"use client";

import { useEffect, useRef } from "react";
import { readConsentClient, subscribeConsent } from "@/lib/consent";

/**
 * Charge AdSense Auto ads et gère la personnalisation selon le consentement.
 * Utilise NEXT_PUBLIC_ADSENSE_PUB_ID = "ca-pub-XXXXXXXXXXXXXXX"
 */
export default function AdSenseAuto() {
  const injectedRef = useRef(false);
  const pubId = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID;

  useEffect(() => {
    if (!pubId) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "[AdSenseAuto] NEXT_PUBLIC_ADSENSE_PUB_ID manquant. Ajoute-le dans .env.local (ex: ca-pub-XXXXXXXXXXXXXXX)."
        );
      }
      return;
    }

    // 1) Appliquer le mode (NPA ou personnalisé) AVANT de charger le script
    const snap = readConsentClient(); // {adsPersonalized?: boolean}
    const personalized = !!snap?.adsPersonalized;
    const g: any = (window as any);
    g.adsbygoogle = g.adsbygoogle || [];
    // 1 = NON personnalisées, 0 = personnalisées
    g.adsbygoogle.requestNonPersonalizedAds = personalized ? 0 : 1;

    // 2) Injecter le script une seule fois
    if (!injectedRef.current) {
      if (!document.querySelector('script[data-adsbygoogle-loaded="1"]')) {
        const s = document.createElement("script");
        s.async = true;
        s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(pubId)}`;
        s.crossOrigin = "anonymous";
        s.setAttribute("data-adsbygoogle-loaded", "1");
        document.head.appendChild(s);
      }
      injectedRef.current = true;
    }

    // 3) Écouter les changements de consentement pour ajuster NPA
    const unsubscribe = subscribeConsent((consent) => {
      // compat: soit { ads }, soit { adsPersonalized }
      const wantsPersonalized =
        (consent as any).ads === true ||
        (consent as any).adsPersonalized === true;

      const g2: any = (window as any);
      g2.adsbygoogle = g2.adsbygoogle || [];
      g2.adsbygoogle.requestNonPersonalizedAds = wantsPersonalized ? 0 : 1;

      // Optionnel : on “poke” le moteur auto-ads.
      // Ça ne rechange pas instantanément les annonces déjà affichées,
      // mais oriente les prochains chargements.
      try {
        g2.adsbygoogle.push({});
      } catch {}
    });

    return () => unsubscribe();
  }, [pubId]);

  return null;
}
