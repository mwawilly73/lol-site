// components/AdsConsentBridge.tsx
"use client";

import { useEffect } from "react";
import { readConsentClient, subscribeConsent } from "@/lib/consent";

/**
 * Expose l'état de consentement "pubs personnalisées" :
 * - ajoute/retire l’attribut data-ads-personalized sur <html>
 * - émet l’event "ads:consent-changed" { detail: { personalized: boolean } }
 * Tes futurs scripts/régies pourront lire l’attribut ou écouter l’event.
 */
export default function AdsConsentBridge() {
  useEffect(() => {
    const apply = () => {
      const personalized = !!readConsentClient()?.adsPersonalized;
      document.documentElement.toggleAttribute("data-ads-personalized", personalized);
      window.dispatchEvent(
        new CustomEvent("ads:consent-changed", { detail: { personalized } })
      );
    };
    apply();
    return subscribeConsent(() => apply());
  }, []);
  return null;
}
