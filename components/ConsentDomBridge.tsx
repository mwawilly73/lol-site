// components/ConsentDomBridge.tsx
"use client";

import { useEffect } from "react";
import { isConsentDecided, subscribeConsent } from "@/lib/consent";

export default function ConsentDomBridge() {
  useEffect(() => {
    const html = document.documentElement;

    const apply = () => {
      const decided = isConsentDecided();
      if (decided) html.setAttribute("data-consent-decided", "true");
      else html.removeAttribute("data-consent-decided");
    };

    apply();
    const unsub = subscribeConsent(() => apply());
    window.addEventListener("storage", apply);

    return () => {
      unsub();
      window.removeEventListener("storage", apply);
    };
  }, []);

  return null;
}
