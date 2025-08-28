// components/CookieStatus.tsx
"use client";

import { useEffect, useState } from "react";

type ConsentV1 = { v: 1; essential: true; analytics: boolean };

export default function CookieStatus() {
  const [consent, setConsent] = useState<ConsentV1 | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("cookie-consent.v1");
      setConsent(raw ? (JSON.parse(raw) as ConsentV1) : null);
    } catch {
      setConsent(null);
    }
  }, []);

  if (!consent) {
    return <p className="text-white/80">Aucune préférence enregistrée pour le moment.</p>;
  }

  return (
    <div className="text-white/90 space-y-1">
      <div>Essentiels : <strong>toujours actifs</strong></div>
      <div>Mesure d’audience : <strong>{consent.analytics ? "activée" : "désactivée"}</strong></div>
    </div>
  );
}
