"use client";

import { useEffect } from "react";
import { readConsentClient, subscribeConsent } from "@/lib/consent";

export default function ConsentDomBridge() {
  useEffect(() => {
    const html = document.documentElement;

    const apply = (personalized: boolean) => {
      if (personalized) html.setAttribute("data-ads-personalized", "1");
      else html.removeAttribute("data-ads-personalized");

      try {
        window.dispatchEvent(
          new CustomEvent("ads:consent-changed", {
            detail: { adsPersonalized: personalized },
          })
        );
      } catch {}
    };

    // État initial
    const snap = readConsentClient();
    const initial =
      !!(snap as any)?.adsPersonalized || !!(snap as any)?.ads; // compat ancien code
    apply(initial);

    // Mises à jour
    const unsub = subscribeConsent((c: unknown) => {
      const any = c as Record<string, unknown>;
      const v =
        typeof any?.adsPersonalized === "boolean"
          ? (any.adsPersonalized as boolean)
          : !!any?.ads;
      apply(v);
    });

    return () => {
      unsub && unsub();
    };
  }, []);

  return null;
}
