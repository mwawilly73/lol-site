// components/ConsentGtagBridge.tsx
"use client";

/**
 * Écoute les changements de consentement (lib/consent)
 * et met à jour Google Consent Mode si `window.gtag` est présent.
 * - Aucun script inline, aucun chargement GA : ici on ne fait qu'UPDATER si gtag existe.
 */

import { useEffect } from "react";
import { readConsentClient, type ConsentSnapshot } from "@/lib/consent";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

const CHANGE_EVT = "cookie:change" as const;

function applyConsentToGtag(c: ConsentSnapshot | null) {
  if (!window.gtag) return; // no-op si pas de gtag
  const analytics = c?.analytics ? "granted" : "denied";
  const ads = c?.adsPersonalized ? "granted" : "denied";

  window.gtag("consent", "update", {
    analytics_storage: analytics,
    ad_storage: ads,
    ad_user_data: ads,
    ad_personalization: ads,
  });
}

export default function ConsentGtagBridge() {
  useEffect(() => {
    // 1) Applique l’état actuel au montage
    const snapshot = readConsentClient();
    applyConsentToGtag(snapshot);

    // 2) Écoute les changements
    const onChange = (ev: Event) => {
      try {
        const detail = (ev as CustomEvent<ConsentSnapshot>).detail ?? null;
        applyConsentToGtag(detail);
      } catch {
        // no-op
      }
    };
    window.addEventListener(CHANGE_EVT, onChange as EventListener);
    return () => window.removeEventListener(CHANGE_EVT, onChange as EventListener);
  }, []);

  return null;
}
