"use client";

import { useEffect } from "react";
import { readConsentClient, subscribeConsent, type ConsentSnapshot } from "@/lib/consent";
import { isProdLike } from "@/lib/runtime";

/**
 * Alimente <html> en attributs data-* pour la pub :
 *  - data-ads-enabled: "true" (pub non personnalisée autorisée par défaut)
 *  - data-ads-personalized: "true" | "false" selon le consentement
 */
export default function AdsConsentBridge() {
  useEffect(() => {
    if (!isProdLike()) return;

    const apply = (c: ConsentSnapshot | null | undefined) => {
      const root = document.documentElement;
      const personalized = !!c?.adsPersonalized;

      // Par défaut on autorise l’affichage non personnalisé.
      root.setAttribute("data-ads-enabled", "true");
      root.setAttribute("data-ads-personalized", personalized ? "true" : "false");
    };

    apply(readConsentClient());
    const unsub = subscribeConsent((c) => apply(c));
    return () => unsub();
  }, []);

  return null;
}
