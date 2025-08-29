// components/CookiePrefs.tsx
"use client";

import { useEffect, useState } from "react";
import {
  readConsentClient,
  saveConsent,
  type ConsentSnapshot,
} from "@/lib/consent";

export default function CookiePrefs() {
  const [mounted, setMounted] = useState(false);
  const [adsPersonalized, setAdsPersonalized] = useState(false);
  const [snapshot, setSnapshot] = useState<ConsentSnapshot | null>(null);

  useEffect(() => {
    setMounted(true);
    const saved = readConsentClient();
    if (saved) {
      setSnapshot(saved);
      setAdsPersonalized(!!saved.adsPersonalized);
    }
  }, []);

  if (!mounted) return null;

  const onSave = () => {
    // Si pubs perso activées → "all" (analytics = ON) ; sinon → "necessary".
    const updated =
      saveConsent(adsPersonalized ? "all" : "necessary", adsPersonalized) ??
      ({
        necessary: true,
        analytics: !!adsPersonalized,
        adsPersonalized: !!adsPersonalized,
      } as ConsentSnapshot);

    setSnapshot(updated);
    alert("Préférences enregistrées.");
  };

  const status =
    snapshot?.adsPersonalized ? (
      <span className="inline-flex items-center rounded-full bg-emerald-600/20 text-emerald-300 px-2 py-0.5 text-xs ring-1 ring-emerald-400/30">
        Pubs personnalisées : ON
      </span>
    ) : (
      <span className="inline-flex items-center rounded-full bg-white/10 text-white/70 px-2 py-0.5 text-xs ring-1 ring-white/20">
        Pubs personnalisées : OFF
      </span>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Préférences cookies</h2>
        {status}
      </div>

      <div className="rounded-lg border border-white/10 bg-black/40 p-4">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={adsPersonalized}
            onChange={(e) => setAdsPersonalized(e.target.checked)}
            className="size-4"
          />
          <span className="text-sm">
            Autoriser les <strong>publicités personnalisées</strong>.{" "}
            Sans cela, vous verrez des publicités non personnalisées.
          </span>
        </label>
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
            onClick={() => window.dispatchEvent(new Event("cookie:open"))}
            className="text-sm text-white/80 underline underline-offset-2 hover:text-white"
          >
            Ouvrir le bandeau
          </button>
        </div>
      </div>

      <div className="prose prose-invert max-w-none">
        <h3>Rappels</h3>
        <ul>
          <li>Les cookies essentiels au fonctionnement du site sont toujours actifs.</li>
          <li>Vous pouvez activer/désactiver les publicités personnalisées ici.</li>
          <li>
            Sans consentement, des publicités <em>non personnalisées</em> peuvent
            s’afficher.
          </li>
        </ul>
      </div>
    </div>
  );
}
