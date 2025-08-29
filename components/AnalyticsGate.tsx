// components/AnalyticsGate.tsx
"use client";

import { useEffect, useState } from "react";
import { hasConsent } from "@/lib/consent";

export default function AnalyticsGate({ children }: { children: React.ReactNode }) {
  const [allowed, setAllowed] = useState<boolean>(() => hasConsent("analytics"));

  useEffect(() => {
    const onChange = () => setAllowed(hasConsent("analytics"));
    window.addEventListener("cookie-consent", onChange as EventListener);
    return () => window.removeEventListener("cookie-consent", onChange as EventListener);
  }, []);

  if (!allowed) return null;
  return <>{children}</>;
}
