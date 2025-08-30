// components/AnalyticsLoader.tsx
"use client";

import { useEffect, useRef } from "react";
import {
  readConsentClient,
  subscribeConsent,
  type ConsentSnapshot,
} from "@/lib/consent";

export default function AnalyticsLoader() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!domain) return;

    const loadScript = () => {
      if (loadedRef.current) return;
      const c = readConsentClient();
      if (!c?.analytics) return;

      const s = document.createElement("script");
      s.src = "https://plausible.io/js/script.js";
      s.defer = true;
      s.setAttribute("data-domain", domain);
      document.head.appendChild(s);
      loadedRef.current = true;
    };

    // Planifie après l'idle (ou setTimeout en fallback) sans redéclarer Window
    const scheduleIdle = (work: () => void, timeout = 1500) => {
      if (
        typeof window !== "undefined" &&
        typeof window.requestIdleCallback === "function"
      ) {
        // IdleRequestCallback attend un param (deadline) -> on l’ignore ici
        window.requestIdleCallback(() => work(), { timeout });
      } else {
        window.setTimeout(work, Math.min(timeout, 1600));
      }
    };

    scheduleIdle(loadScript);

    const unsub = subscribeConsent((c: ConsentSnapshot) => {
      if (c.analytics) loadScript();
    });
    return () => unsub();
  }, [domain]);

  return null;
}
