// components/AnalyticsBridge.tsx
"use client";

import { useEffect } from "react";
import { subscribeConsent } from "@/lib/consent";

export default function AnalyticsBridge() {
  useEffect(() => {
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
