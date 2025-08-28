// components/CookieNotice.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type ConsentV1 = {
  v: 1;
  essential: true;
  analytics: boolean;
};

const STORAGE_KEY = "cookie-consent.v1";
const OPEN_EVENT = "cookie:open-prefs";

function readConsent(): ConsentV1 | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentV1;
    if (parsed && parsed.v === 1 && typeof parsed.analytics === "boolean") {
      return parsed;
    }
  } catch {}
  return null;
}
function writeConsent(c: ConsentV1) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  } catch {}
}

export default function CookieNotice() {
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  // Au montage : si pas de consentement => afficher la bannière
  useEffect(() => {
    const c = readConsent();
    if (!c) {
      setVisible(true);
      setShowPrefs(false);
      setAnalytics(false);
    }
  }, []);

  // Permet d’ouvrir la modale “Préférences” depuis n’importe où
  useEffect(() => {
    const onOpen = () => {
      const c = readConsent();
      setAnalytics(Boolean(c?.analytics));
      setVisible(true);
      setShowPrefs(true);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  const acceptAll = () => {
    writeConsent({ v: 1, essential: true, analytics: true });
    setVisible(false);
  };
  const refuseAll = () => {
    writeConsent({ v: 1, essential: true, analytics: false });
    setVisible(false);
  };
  const savePrefs = () => {
    writeConsent({ v: 1, essential: true, analytics });
    setVisible(false);
  };

  // Si déjà consenti => ne rien afficher
  const alreadyConsented = useMemo(() => !!readConsent(), []);
  if (!visible && alreadyConsented) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Consentement aux cookies"
      className={`fixed inset-x-0 bottom-0 z-[60] px-3 sm:px-4 pb-3 transition-opacity ${
        visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl ring-1 ring-white/10 bg-[#0e1117]/95 backdrop-blur-md shadow-2xl overflow-hidden">
          <div className="p-3 sm:p-4">
            {!showPrefs ? (
              <>
                <div className="text-sm sm:text-base text-white/90">
                  Nous utilisons des cookies techniques indispensables et (optionnels) de mesure d’audience anonymisée.
                  Vous pouvez accepter, refuser ou personnaliser.
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={acceptAll}
                    className="px-3 py-1.5 rounded-md bg-green-600 hover:bg-green-500 text-white text-sm font-semibold"
                  >
                    Accepter tout
                  </button>
                  <button
                    type="button"
                    onClick={refuseAll}
                    className="px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-sm"
                  >
                    Refuser
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPrefs(true)}
                    className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/15 ring-1 ring-white/15 text-white text-sm"
                  >
                    Personnaliser
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-sm sm:text-base font-semibold">Préférences des cookies</div>
                <div className="mt-2 space-y-2 text-sm text-white/90">
                  <label className="flex items-start gap-2">
                    <input type="checkbox" checked disabled className="mt-1" />
                    <span>
                      <strong>Essentiels</strong> — nécessaires au fonctionnement du site. Toujours actifs.
                    </span>
                  </label>
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={analytics}
                      onChange={(e) => setAnalytics(e.target.checked)}
                    />
                    <span>
                      <strong>Mesure d’audience</strong> — statistiques anonymisées (sans pub ciblée).
                    </span>
                  </label>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={savePrefs}
                    className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold"
                  >
                    Enregistrer
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPrefs(false)}
                    className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/15 ring-1 ring-white/15 text-white text-sm"
                  >
                    Retour
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Bouton à placer n’importe où pour rouvrir la modale de préférences */
export function CookieManageButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      onClick={(e) => {
        props.onClick?.(e);
        window.dispatchEvent(new Event(OPEN_EVENT));
      }}
    >
      Gérer les cookies
    </button>
  );
}
