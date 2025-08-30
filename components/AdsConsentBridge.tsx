// components/AdsConsentBridge.tsx
"use client";

import { useEffect } from "react";
import {
  readConsentClient,
  subscribeConsent,
  type ConsentSnapshot,
} from "@/lib/consent";

/**
 * Réplique le consentement pub dans l'attribut
 * data-ads-personalized sur <html> (utile pour les slots).
 */
export default function AdsConsentBridge() {
  useEffect(() => {
    const root = document.documentElement;

    const apply = (c: ConsentSnapshot) => {
      if (c.adsPersonalized) {
        root.setAttribute("data-ads-personalized", "");
      } else {
        root.removeAttribute("data-ads-personalized");
      }
    };

    // État initial
    const initial = readConsentClient();
    if (initial) apply(initial);

    // Mises à jour (typées)
    const unsub = subscribeConsent((c) => {
      // c: ConsentSnapshot & { ads: boolean }
      apply({
        necessary: c.necessary,
        analytics: c.analytics,
        adsPersonalized: c.adsPersonalized,
      });
    });

    return () => unsub();
  }, []);

  return null;
}
