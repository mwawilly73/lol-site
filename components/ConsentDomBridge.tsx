// components/ConsentDomBridge.tsx
"use client";

import { useEffect } from "react";
import type { ConsentSnapshot } from "@/lib/consent";

/** Reflète le consentement dans <html data-ads-personalized="true|false"> */
export default function ConsentDomBridge() {
  useEffect(() => {
    const apply = (snap: ConsentSnapshot) => {
      document.documentElement.dataset.adsPersonalized = snap.adsPersonalized ? "true" : "false";
    };

    const onConsent = (e: Event) => {
      const evt = e as CustomEvent<ConsentSnapshot>;
      if (evt.detail) apply(evt.detail);
    };

    window.addEventListener("cookie-consent", onConsent);
    return () => window.removeEventListener("cookie-consent", onConsent);
  }, []);

  return null;
}
