"use client";

import { useEffect } from "react";
import { readConsentClient, subscribeConsent, type ConsentSnapshot } from "@/lib/consent";
import { isProdLike } from "@/lib/runtime";

/**
 * Ajoute des classes sur <html> pour stylage conditionnel :
 *  - consent-analytics-on / off
 *  - consent-ads-on (toujours on car pub non perso OK par défaut)
 *  - consent-ads-pers-on / off
 */
export default function ConsentDomBridge() {
  useEffect(() => {
    if (!isProdLike()) return;

    const root = document.documentElement;
    const setFlag = (on: boolean, onCls: string, offCls: string) => {
      root.classList.toggle(onCls, on);
      root.classList.toggle(offCls, !on);
    };

    const apply = (c: ConsentSnapshot | null | undefined) => {
      const analytics = !!c?.analytics;
      const adsPers = !!c?.adsPersonalized;

      setFlag(analytics, "consent-analytics-on", "consent-analytics-off");

      // Affichage pub non personnalisée autorisé par défaut → toujours "on"
      setFlag(true, "consent-ads-on", "consent-ads-off");

      setFlag(adsPers, "consent-ads-pers-on", "consent-ads-pers-off");
    };

    apply(readConsentClient());
    const unsub = subscribeConsent((c) => apply(c));
    return () => unsub();
  }, []);

  return null;
}
