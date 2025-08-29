// components/CookiePrefs.tsx
"use client";

import { useEffect, useState } from "react";
import { readConsentClient, saveConsent, openConsentBanner } from "@/lib/consent";

export default function CookiePrefs() {
  const [mounted, setMounted] = useState(false);
  const [adsPersonalized, setAdsPersonalized] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = readConsentClient();
    if (saved) setAdsPersonalized(!!saved.ads); // ✅ propriété correcte
  }, []);

  if (!mounted) return null;

  const onSave = () => {
    // Préserver l'état actuel d’analytics, ne changer que la pub perso
    const current = readConsentClient();
    saveConsent({
      necessary: true,
      analytics: !!current?.analytics,
      ads: !!adsPersonalized,
    });

    alert("Préférences enregistrées.");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-white/10 bg-black/40 p-4">
        <div className="flex items-center gap-3">
          <input
            id="ads-personalized"
            name="ads-personalized"
            type="checkbox"
            checked={adsPersonalized}
            onChange={(e) => setAdsPersonalized(e.target.checked)}
            className="size-4"
          />
        <label htmlFor="ads-personalized" className="text-sm">
            Autoriser les <strong>publicités personnalisées</strong>.{" "}
            <span className="text-white/70">
              Sans cela, vous verrez des publicités non personnalisées.
            </span>
          </label>
        </div>

        <p className="mt-2 text-xs text-white/70">
          Vous pouvez changer d’avis à tout moment sur cette page.
        </p>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={onSave}
            className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold"
          >
            Enregistrer
          </button>

          <button
            type="button"
            onClick={openConsentBanner}
            className="text-sm text-white/80 underline underline-offset-2 hover:text-white"
          >
            Ouvrir le bandeau
          </button>
        </div>
      </div>

      <div className="prose prose-invert max-w-none">
        <h2>Rappels</h2>
        <ul>
          <li>Les cookies essentiels au fonctionnement du site sont toujours actifs.</li>
          <li>Vous pouvez décider d’activer ou non les publicités personnalisées.</li>
          <li>En l’absence de consentement, des publicités non personnalisées peuvent s’afficher.</li>
        </ul>
      </div>
    </div>
  );
}
