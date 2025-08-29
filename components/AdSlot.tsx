// components/AdSlot.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { readConsentClient, subscribeConsent } from "@/lib/consent";

type Props = {
  /** Identifiant libre pour ton usage (ex: "home-top") */
  id?: string;
  /** Libellé accessible de la zone */
  label?: string;
  /** Taille visuelle du placeholder */
  size?: "banner" | "rectangle" | "skyscraper" | "responsive";
  /** Classes utilitaires (marges, positionnement…) */
  className?: string;
  /** Masquer sur mobile si besoin (ex: true => caché < sm) */
  hideOnMobile?: boolean;
};

// Utilitaire : extrait le booléen "pubs personnalisées" quelle que soit la forme
function extractPersonalized(x: unknown): boolean {
  if (!x || typeof x !== "object") return false;
  const any = x as Record<string, unknown>;
  if (typeof any.adsPersonalized === "boolean") return any.adsPersonalized;
  if (typeof any.ads === "boolean") return any.ads; // compat ancien code
  // cas d'un CustomEvent/detail
  if (any.detail && typeof (any.detail as any).adsPersonalized === "boolean") {
    return (any.detail as any).adsPersonalized as boolean;
  }
  if (any.detail && typeof (any.detail as any).ads === "boolean") {
    return (any.detail as any).ads as boolean;
  }
  return false;
}

/**
 * Placeholder publicitaire réactif au consentement.
 * - Affiche "Personnalisée" vs "Non personnalisée"
 * - Se met à jour quand le consentement change (cookie-consent / storage)
 * - Compatible avec un event personnalisé "ads:consent-changed" { detail: { adsPersonalized: boolean } }
 *
 * Quand tu intégreras un réseau pub, remplace ce placeholder par l'appel au tag
 * et ne charge le script qu'en fonction de `personalized`.
 */
export default function AdSlot({
  id,
  label = "Zone publicitaire",
  size = "responsive",
  className = "",
  hideOnMobile = false,
}: Props) {
  const [personalized, setPersonalized] = useState<boolean | null>(null);

  // Dimensions "placeholder" par défaut
  const sizeClasses = useMemo(() => {
    switch (size) {
      case "banner":
        return "w-full h-[90px] sm:h-[120px]"; // 728x90 / 970x90 adaptatif
      case "rectangle":
        return "w-full sm:w-[336px] h-[280px]"; // 300x250 / 336x280
      case "skyscraper":
        return "w-[160px] h-[600px]"; // 160x600
      default:
        return "w-full h-[200px] sm:h-[250px]"; // responsive
    }
  }, [size]);

  useEffect(() => {
    // 1) Essaye d'abord l'attribut sur <html>
    let initial = false;
    try {
      if (typeof document !== "undefined") {
        initial = document.documentElement.hasAttribute("data-ads-personalized");
      }
    } catch {}

    // 2) Sinon, lis le consentement local
    if (!initial) {
      const snap = readConsentClient();
      initial = extractPersonalized(snap);
    }
    setPersonalized(initial);

    // 3) Écoute les changements via l’API consent (cookie-consent + storage)
    const unsub = subscribeConsent((c: unknown) => {
      setPersonalized(extractPersonalized(c));
    });

    // 4) Écoute optionnelle d’un event custom (si tu l’emploies)
    const onAdsEvt = (e: Event) => setPersonalized(extractPersonalized(e as unknown));
    window.addEventListener("ads:consent-changed", onAdsEvt as EventListener);

    return () => {
      unsub && unsub();
      window.removeEventListener("ads:consent-changed", onAdsEvt as EventListener);
    };
  }, []);

  const isLoading = personalized === null;

  return (
    <aside
      role="complementary"
      aria-label={label}
      data-ad-slot={id || undefined}
      data-ad-personalized={personalized ? "1" : "0"}
      className={[
        "relative overflow-hidden rounded-xl ring-1 ring-white/10",
        "bg-[#0d1117] text-white/90",
        "flex items-center justify-center",
        sizeClasses,
        hideOnMobile ? "hidden sm:flex" : "flex",
        className,
      ].join(" ")}
    >
      {/* Fond décoratif léger (non intrusif) */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden="true">
        <div className="absolute -right-10 -bottom-10 size-40 rounded-full bg-gradient-to-tr from-indigo-500 to-teal-400 blur-2xl" />
        <div className="absolute -left-16 -top-12 size-36 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 blur-2xl" />
      </div>

      {/* Contenu placeholder */}
      <div className="relative z-10 text-center px-3">
        <div className="text-[11px] uppercase tracking-wider text-white/60">
          {isLoading ? "Chargement…" : "Publicité"}
        </div>
        {!isLoading && (
          <div className="mt-1 text-sm font-medium">
            {personalized ? "Personnalisée" : "Non personnalisée"}
          </div>
        )}
        <div className="mt-1 text-[11px] text-white/50">— démo —</div>
      </div>
    </aside>
  );
}
