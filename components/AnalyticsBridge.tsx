"use client";

import { useEffect } from "react";
import { readConsentClient, subscribeConsent } from "@/lib/consent";

function ensurePlausibleLoaded(domain: string) {
  if (document.querySelector('script[data-plausible="true"]')) return;
  const s = document.createElement("script");
  s.setAttribute("data-plausible", "true");
  s.defer = true;
  s.src = "https://plausible.io/js/script.js";
  // domaine sans protocole/chemin
  s.setAttribute(
    "data-domain",
    domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "")
  );
  document.head.appendChild(s);
}

export default function AnalyticsBridge() {
  useEffect(() => {
    const domain =
      (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000")
        .replace(/^https?:\/\//, "")
        .replace(/\/.*$/, "");

    // État initial
    const snap = readConsentClient();
    if ((snap as any)?.analytics) ensurePlausibleLoaded(domain);

    // Mises à jour
    const unsub = subscribeConsent((c: unknown) => {
      const a = !!(c as any)?.analytics;
      if (a) ensurePlausibleLoaded(domain);
      // si l’utilisateur retire son consentement après coup,
      // on s’abstient de recharger (pas d’envoi supplémentaire).
    });

    return () => {
      unsub && unsub();
    };
  }, []);

  return null;
}
