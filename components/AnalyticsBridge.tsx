// components/AnalyticsBridge.tsx
"use client";

import { useEffect } from "react";
import type { ConsentSnapshot } from "@/lib/consent";

declare global {
  interface Window {
    plausible?: (...args: unknown[]) => void;
  }
}

/** Monte/descend Plausible en fonction du consentement analytics. */
export default function AnalyticsBridge() {
  useEffect(() => {
    const apply = (enabled: boolean) => {
      const id = "plausible-script";
      const existing = document.getElementById(id) as HTMLScriptElement | null;

      if (enabled) {
        if (existing) return;
        const s = document.createElement("script");
        s.id = id;
        s.defer = true;
        s.setAttribute("data-domain", (process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ?? "").trim());
        s.src = "https://plausible.io/js/script.js";
        document.head.appendChild(s);
      } else if (existing) {
        existing.remove();
      }
    };

    const onConsent = (e: Event) => {
      const evt = e as CustomEvent<ConsentSnapshot>;
      apply(!!evt.detail?.analytics);
    };

    window.addEventListener("cookie-consent", onConsent);
    return () => window.removeEventListener("cookie-consent", onConsent);
  }, []);

  return null;
}
