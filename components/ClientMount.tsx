// components/ClientMount.tsx
"use client";
import { useEffect, useState } from "react";

export default function ClientMount({
  children,
  delayMs = 1200,
}: { children: React.ReactNode; delayMs?: number }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), delayMs); return () => clearTimeout(t); }, [delayMs]);
  return ready ? <>{children}</> : null;
}
