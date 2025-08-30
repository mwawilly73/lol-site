// components/CookiePrefs.tsx
"use client";

import { useEffect, useState } from "react";
import { readConsentClient, saveConsent } from "@/lib/consent";

export default function CookiePrefs() {
  const [mounted, setMounted] = useState(false);
  const [adsPersonalized, setAdsPersonalized] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = readConsentClient();
    if (saved) setAdsPersonalized(!!saved.adsPersonalized);
  }, []);

  if (!mounted) return null;

  const onSave = () => {
    // S’il active la personnalisation → "all", sinon "necessary"
    saveConsent(adsPersonalized ? "all" : "necessary", adsPersonalized);
    alert("Préférences enregistrées.");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-white/10 bg-black/40 p-4">
        {/* Associe le label au champ via htmlFor/id et ajoute name */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="ads-personalized"              // ✅ id ajouté
            name="adsPersonalized"             // ✅ name ajouté (utile pour autofill/form)
            checked={adsPersonalized}
            onChange={(e) => setAdsPersonalized(e.target.checked)}
            className="size-4"
            aria-describedby="ads-personalized-help"
          />
          <label htmlFor="ads-personalized" className="text-sm">
            Autoriser les <strong>publicités personnalisées</strong>.
            {` `}Sans cela, vous verrez des publicités non personnalisées.
          </label>
        </div>

        <p id="ads-personalized-help" className="mt-2 text-xs text-white/70">
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
            onClick={() => window.dispatchEvent(new Event("cookie:open"))}
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
          <li>Sans consentement, seules des pubs non personnalisées peuvent s’afficher.</li>
        </ul>
      </div>
    </div>
  );
}
