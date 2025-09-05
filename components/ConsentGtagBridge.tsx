"use client";

import { useEffect } from "react";
import { readConsentClient, subscribeConsent, type ConsentSnapshot } from "@/lib/consent";
import { isProdLike } from "@/lib/runtime";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Propage le consentement à gtag si présent.
 * - adsPersonalized = true -> tout granted
 * - adsPersonalized = false -> tout denied (pub non personnalisée)
 */
export default function ConsentGtagBridge() {
  useEffect(() => {
    if (!isProdLike()) return;

    const updateGtag = (c: ConsentSnapshot | null | undefined) => {
      if (typeof window.gtag !== "function") return;

      const analytics = !!c?.analytics;
      const adsPers = !!c?.adsPersonalized;

      const ad_storage = adsPers ? "granted" : "denied";
      const analytics_storage = analytics ? "granted" : "denied";
      const ad_user_data = adsPers ? "granted" : "denied";
      const ad_personalization = adsPers ? "granted" : "denied";

      try {
        window.gtag!("consent", "update", {
          ad_storage,
          analytics_storage,
          ad_user_data,
          ad_personalization,
        });
      } catch {
        // silencieux
      }
    };

    updateGtag(readConsentClient());
    const unsub = subscribeConsent((c) => updateGtag(c));
    return () => unsub();
  }, []);

  return null;
}
