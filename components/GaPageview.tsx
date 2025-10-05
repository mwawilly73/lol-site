// components/GaPageview.tsx
"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

type GtagFn = (command: string, idOrEvent: string, params?: Record<string, unknown>) => void;

/** Wrapper qui met le composant “router hooks” dans un Suspense */
export default function GaPageview() {
  return (
    <Suspense fallback={null}>
      <GaPageviewInner />
    </Suspense>
  );
}

function GaPageviewInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_ID || !pathname) return;

    const w = window as unknown as { gtag?: GtagFn };
    if (typeof w.gtag !== "function") return;

    const query = searchParams?.toString();
    const pathWithQuery = `${pathname}${query ? `?${query}` : ""}`;

    w.gtag("event", "page_view", {
      page_location: `${window.location.origin}${pathWithQuery}`,
      page_path: pathname,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}
