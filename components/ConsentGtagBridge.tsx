// components/ConsentGtagBridge.tsx
"use client";

import { useEffect } from "react";
import type { ConsentSnapshot } from "@/lib/consent";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Exemple de passerelle gtag pour consentement (si tu utilises GA4 plus tard). */
export default function ConsentGtagBridge() {
  useEffect(() => {
    const onConsent = (e: Event) => {
      const evt = e as CustomEvent<ConsentSnapshot>;
      const analytics = !!evt.detail?.analytics;
      if (typeof window.gtag === "function") {
        window.gtag("consent", "update", {
          analytics_storage: analytics ? "granted" : "denied",
        });
      }
    };
    window.addEventListener("cookie-consent", onConsent);
    return () => window.removeEventListener("cookie-consent", onConsent);
  }, []);

  return null;
}
