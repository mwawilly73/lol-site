// components/AnalyticsBridge.tsx
"use client";

import { useEffect } from "react";
import { subscribeConsent } from "@/lib/consent";
import { isProdLike } from "@/lib/runtime";

/**
 * Relaye les changements de consentement analytics
 * vers une CustomEvent du DOM, uniquement en prod-like.
 */
export default function AnalyticsBridge() {
  useEffect(() => {
    if (!isProdLike()) return; // pas la peine en dev
    const unsub = subscribeConsent((c) => {
      try {
        window.dispatchEvent(
          new CustomEvent("analytics:consent-changed", {
            detail: { analytics: !!c.analytics },
          })
        );
      } catch {}
    });
    return () => unsub();
  }, []);
  return null;
}
