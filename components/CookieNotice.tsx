// components/CookieNotice.tsx
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  readConsentClient,
  saveConsent,
  OPEN_EVENT,
  CHANGE_EVENT,
  type ConsentSnapshot,
} from "@/lib/consent";

/** Bouton réutilisable pour rouvrir le bandeau (ex: sur /cookies). */
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
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
      className={`inline-flex items-center justify-center rounded-md px-3 py-2 ring-1 ring-white/15 bg-white/10 hover:bg-white/15 text-white ${className}`}
    >
      {label}
    </button>
  );
}

/** Bandeau cookies — Client only (évite les soucis d’hydratation). */
export default function CookieNotice() {
  const [consent, setConsent] = useState<ConsentSnapshot | null>(null);
  const [open, setOpen] = useState(false);
  const [customize, setCustomize] = useState(false);

  // Focus par défaut sur “Tout accepter”
  const acceptRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const saved = readConsentClient();
    setConsent(saved);
    setOpen(!saved); // ouvre si aucun choix
  }, []);

  useEffect(() => {
    if (open && !customize) {
      const t = window.setTimeout(() => acceptRef.current?.focus(), 50);
      return () => window.clearTimeout(t);
    }
  }, [open, customize]);

  // Permettre d’ouvrir depuis /cookies
  useEffect(() => {
    const onOpen = () => {
      setCustomize(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  // Synchronise si une autre tab change le consentement
  useEffect(() => {
    const onChange = () => setConsent(readConsentClient());
    window.addEventListener(CHANGE_EVENT, onChange as EventListener);
    return () => window.removeEventListener(CHANGE_EVENT, onChange as EventListener);
  }, []);

  const DEFAULT_SNAPSHOT: ConsentSnapshot = {
    necessary: true,
    analytics: false,
    adsPersonalized: false,
  };

  const acceptAll = () => {
    // "Tout accepter" = analytics ON + pubs personnalisées ON
    saveConsent("all", true);
    setConsent({ necessary: true, analytics: true, adsPersonalized: true });
    setOpen(false);
    setCustomize(false);
  };

  const rejectAll = () => {
    // lien discret "continuer sans accepter" (équiv. tout refuser)
    saveConsent("necessary", false);
    setConsent({ necessary: true, analytics: false, adsPersonalized: false });
    setOpen(false);
    setCustomize(false);
  };

  const saveCustom = () => {
    const snap = consent ?? DEFAULT_SNAPSHOT;
    const next: ConsentSnapshot = {
      necessary: true,
      analytics: !!snap.analytics,
      adsPersonalized: !!snap.adsPersonalized,
    };
    saveConsent(next);
    setConsent(next);
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
            Vous pouvez en option activer la <em>mesure d’audience</em> (statistiques anonymes) et la
            <em> publicité personnalisée</em>. Sans consentement à la pub personnalisée, des publicités
            <em> non personnalisées</em> (contextuelles) peuvent s’afficher.
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
              <legend id="cookie-options-legend" className="sr-only">
                Options de consentement
              </legend>

              <label
                htmlFor="cookie-analytics"
                className="flex items-center gap-2 rounded-md bg-white/5 ring-1 ring-white/10 px-2 py-1.5"
              >
                <input
                  id="cookie-analytics"
                  name="analytics"
                  type="checkbox"
                  checked={!!consent?.analytics}
                  onChange={(e) =>
                    setConsent((prev) => ({
                      ...(prev ?? DEFAULT_SNAPSHOT),
                      analytics: e.target.checked,
                    }))
                  }
                />
                <span>Mesure d’audience (anonyme)</span>
              </label>

              <label
                htmlFor="cookie-ads"
                className="flex items-center gap-2 rounded-md bg-white/5 ring-1 ring-white/10 px-2 py-1.5"
              >
                <input
                  id="cookie-ads"
                  name="adsPersonalized"
                  type="checkbox"
                  checked={!!consent?.adsPersonalized}
                  onChange={(e) =>
                    setConsent((prev) => ({
                      ...(prev ?? DEFAULT_SNAPSHOT),
                      adsPersonalized: e.target.checked,
                    }))
                  }
                />
                <span>Publicité personnalisée (profilage)</span>
              </label>
            </fieldset>
          )}

          <div className="flex flex-wrap items-center gap-2" aria-describedby="cookie-blurb">
            {/* ——— CTA principal “Tout accepter” très mis en avant ——— */}
            {!customize ? (
              <>
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

                {/* Personnaliser : bouton secondaire sobre */}
                <button
                  type="button"
                  className="rounded-md bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2"
                  onClick={() => {
                    setCustomize(true);
                    setConsent((prev) => prev ?? DEFAULT_SNAPSHOT);
                  }}
                >
                  Personnaliser…
                </button>

                {/* Lien discret : continuer sans accepter (équivalent “tout refuser”) */}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={rejectAll}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      rejectAll();
                    }
                  }}
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

                {/* Lien discret aussi en mode personnalisation */}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={rejectAll}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      rejectAll();
                    }
                  }}
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
