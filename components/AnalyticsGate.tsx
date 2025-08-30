// components/AnalyticsGate.tsx
"use client";

import { useEffect, useState } from "react";
import { readConsentClient, subscribeConsent } from "@/lib/consent";

export default function AnalyticsGate({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const c = readConsentClient();
    setEnabled(!!c?.analytics);
    const unsub = subscribeConsent((s) => setEnabled(!!s.analytics));
    return () => unsub();
  }, []);

  if (!enabled) return null;
  return <>{children}</>;
}
