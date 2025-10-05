"use client";

import { useEffect } from "react";
import { readConsentClient, subscribeConsent, type ConsentSnapshot } from "@/lib/consent";
import { isProdLike } from "@/lib/runtime";

/**
 * Déclare gtag de façon typée (sans any).
 */
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (command: string, field: string, params?: Record<string, string>) => void;
  }
}

/**
 * Propage le consentement à GA4 (Consent Mode).
 * - analytics = true  -> analytics_storage=granted
 * - adsPersonalized = true -> ad_* = granted
 * - sinon denied
 */
export default function ConsentGtagBridge() {
  useEffect(() => {
    if (!isProdLike()) return;

    const pushConsent = (c: ConsentSnapshot | null | undefined): void => {
      const gtag = window.gtag;
      if (typeof gtag !== "function") return;

      const analytics = !!c?.analytics;
      const adsPers = !!c?.adsPersonalized;

      // Valeurs conformes Consent Mode v2
      const update: Record<string, string> = {
        analytics_storage: analytics ? "granted" : "denied",
        ad_storage: adsPers ? "granted" : "denied",
        ad_user_data: adsPers ? "granted" : "denied",
        ad_personalization: adsPers ? "granted" : "denied",
      };

      try {
        gtag("consent", "update", update);
      } catch {
        // silencieux
      }
    };

    // 1) Propager l'état courant au mount
    pushConsent(readConsentClient());

    // 2) S'abonner aux changements du CMP
    const unsub = subscribeConsent((snapshot) => pushConsent(snapshot));
    return () => unsub();
  }, []);

  return null;
}
