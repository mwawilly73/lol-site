"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

type GtagFn = (command: string, idOrEvent: string, params?: Record<string, unknown>) => void;

export default function GaPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_ID || !pathname) return;

    // ✅ pas de any : on caste window localement et on garde l’optional chaining
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
