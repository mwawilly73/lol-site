// components/CookieNotice.tsx
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  loadConsent,
  saveConsent,
  openConsentBanner,
  subscribeConsent,
  type Consent,
} from "@/lib/consent";

// Bouton réutilisable pour rouvrir le bandeau (si besoin ailleurs)
export function CookieManageButton({
  className = "",
  label = "Personnaliser les cookies",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => openConsentBanner()}
      className={`inline-flex items-center justify-center rounded-md px-3 py-2 ring-1 ring-white/15 bg-white/10 hover:bg-white/15 text-white ${className}`}
    >
      {label}
    </button>
  );
}

export default function CookieNotice() {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [open, setOpen] = useState(false);
  const [customize, setCustomize] = useState(false);
  const acceptRef = useRef<HTMLButtonElement | null>(null);

  // init
  useEffect(() => {
    const c = loadConsent();
    setConsent(c);
    setOpen(!c); // ouvre si aucun choix
  }, []);

  // focus CTA si bandeau ouvert (vue simple)
  useEffect(() => {
    if (open && !customize) {
      const t = window.setTimeout(() => acceptRef.current?.focus(), 40);
      return () => window.clearTimeout(t);
    }
  }, [open, customize]);

  // permettre la ré-ouverture (depuis /cookies)
  useEffect(() => {
    const onOpen = () => {
      setCustomize(true);
      setOpen(true);
    };
    window.addEventListener("cookie:open", onOpen);
    return () => window.removeEventListener("cookie:open", onOpen);
  }, []);

  // synchro inter-onglets + autres composants
  useEffect(() => {
    const unsub = subscribeConsent((c) => {
      setConsent(c);
      // si un consent est enregistré ailleurs, on ferme le bandeau
      setOpen(false);
      setCustomize(false);
    });
    return unsub;
  }, []);

  /* Actions */
  const acceptAll = () => {
    saveConsent({ necessary: true, analytics: true, ads: true });
    setConsent({ necessary: true, analytics: true, ads: true });
    setOpen(false);
    setCustomize(false);
  };

  const rejectAll = () => {
    saveConsent({ necessary: true, analytics: false, ads: false });
    setConsent({ necessary: true, analytics: false, ads: false });
    setOpen(false);
    setCustomize(false);
  };

  const saveCustom = () => {
    const c: Consent = {
      necessary: true,
      analytics: !!consent?.analytics,
      ads: !!consent?.ads,
    };
    saveConsent(c);
    setConsent(c);
    setOpen(false);
    setCustomize(false);
  };

  if (!open && consent) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 mx-2 mb-2 transition-opacity duration-200
      ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      aria-hidden={!open}
      role="region"
      aria-label="Information cookies"
    >
      <div className="mx-auto max-w-4xl rounded-xl border border-white/10 bg-black/80 backdrop-blur-md shadow-2xl p-3 sm:p-4">
        <div className="flex flex-col gap-3 text-white/90 text-sm">
          <div id="cookie-blurb">
            <strong>Cookies</strong> — Nous utilisons des cookies nécessaires au bon fonctionnement du site.
            En option : <em>mesure d’audience (anonyme)</em> et <em>publicité personnalisée</em> (avec consentement).
            À défaut, des publicités <em>non personnalisées</em> peuvent être affichées.
            <br />
            <Link href="/legal/confidentialite" className="underline underline-offset-2">
              En savoir plus
            </Link>
            {" · "}
            <Link href="/cookies" className="underline underline-offset-2">
              Gérer mes préférences
            </Link>
          </div>

          {customize && (
            <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-2" aria-labelledby="cookie-options-legend">
              <legend id="cookie-options-legend" className="sr-only">Options de consentement</legend>

              <label htmlFor="cookie-analytics" className="flex items-center gap-2 rounded-md bg-white/5 ring-1 ring-white/10 px-2 py-1.5">
                <input
                  type="checkbox"
                  id="cookie-analytics"
                  name="analytics"
                  checked={!!consent?.analytics}
                  onChange={(e) =>
                    setConsent({
                      ...(consent ?? { necessary: true, analytics: false, ads: false }),
                      analytics: e.target.checked,
                    })
                  }
                />
                <span>Mesure d’audience (anonyme)</span>
              </label>

              <label htmlFor="cookie-ads" className="flex items-center gap-2 rounded-md bg-white/5 ring-1 ring-white/10 px-2 py-1.5">
                <input
                  type="checkbox"
                  id="cookie-ads"
                  name="ads"
                  checked={!!consent?.ads}
                  onChange={(e) =>
                    setConsent({
                      ...(consent ?? { necessary: true, analytics: false, ads: false }),
                      ads: e.target.checked,
                    })
                  }
                />
                <span>Publicité personnalisée (profilage)</span>
              </label>
            </fieldset>
          )}

          <div className="flex flex-wrap items-center gap-2" aria-describedby="cookie-blurb">
            {!customize ? (
              <>
                {/* CTA principal, très mis en avant */}
                <button
                  ref={acceptRef}
                  type="button"
                  onClick={acceptAll}
                  className="inline-flex items-center justify-center rounded-xl px-5 py-3
                             text-white font-semibold text-base sm:text-[15px]
                             bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500
                             hover:from-emerald-500 hover:via-emerald-400 hover:to-teal-400
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80
                             ring-1 ring-emerald-400/40 shadow-[0_10px_30px_rgba(16,185,129,0.35)]
                             transition-transform active:translate-y-[1px]"
                >
                  ✓ Tout accepter
                </button>

                <button
                  type="button"
                  className="rounded-md bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2"
                  onClick={() => {
                    setCustomize(true);
                    setConsent((c) => c ?? { necessary: true, analytics: false, ads: false });
                  }}
                >
                  Personnaliser…
                </button>

                {/* Lien discret, pas encadré : “continuer sans accepter” */}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={rejectAll}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); rejectAll(); } }}
                  className="ml-auto text-xs sm:text-[13px] text-white/60 hover:text-white/80 underline underline-offset-2 cursor-pointer select-none focus:outline-none"
                >
                  continuer sans accepter
                </span>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="rounded-md bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2"
                  onClick={saveCustom}
                >
                  Enregistrer
                </button>
                <button
                  type="button"
                  className="rounded-md bg-white/10 hover:bg-white/15 ring-1 ring-white/15 text-white px-3 py-2"
                  onClick={() => setCustomize(false)}
                >
                  Annuler
                </button>

                <span
                  role="button"
                  tabIndex={0}
                  onClick={rejectAll}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); rejectAll(); } }}
                  className="ml-auto text-xs sm:text-[13px] text-white/60 hover:text-white/80 underline underline-offset-2 cursor-pointer select-none focus:outline-none"
                >
                  continuer sans accepter
                </span>
              </>
            )}
          </div>

          {!customize && (
            <p className="text-white/70 text-xs">
              “Tout accepter” active aussi la publicité personnalisée. Vous pouvez retirer votre consentement à tout
              moment via <Link href="/cookies" className="underline underline-offset-2">la page Cookies</Link>.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
