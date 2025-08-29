// components/AnalyticsLoader.tsx
"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { readConsentClient, subscribeConsent } from "@/lib/consent";

/**
 * Charge Plausible uniquement si l'utilisateur a accepté "analytics".
 * Mets NEXT_PUBLIC_PLAUSIBLE_DOMAIN dans .env.local (ex: NEXT_PUBLIC_PLAUSIBLE_DOMAIN=lol-quiz.example.com)
 */
export default function AnalyticsLoader() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // état initial
    setEnabled(!!readConsentClient()?.analytics);
    // mise à jour live si l’utilisateur change d’avis
    return subscribeConsent((c) => setEnabled(!!c.analytics));
  }, []);

  if (!enabled) return null;

  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return null; // évite les erreurs si variable absente en dev

  return (
    <Script
      src="https://plausible.io/js/script.js"
      data-domain={domain}
      strategy="afterInteractive"
    />
  );
}
