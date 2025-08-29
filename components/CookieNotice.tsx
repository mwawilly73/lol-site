// components/CookieNotice.tsx
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Consent = {
  necessary: true;      // toujours actif
  analytics: boolean;   // mesure d’audience anonyme
  ads: boolean;         // publicité personnalisée (opt-in)
};

const LS_KEY = "cookie-consent-v2";
const OPEN_EVT = "cookie:open";
const CHANGE_EVT = "cookie:change";

function readConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Consent> & Record<string, unknown>;
    const analytics = typeof parsed.analytics === "boolean" ? parsed.analytics : false;
    const ads = typeof parsed.ads === "boolean" ? parsed.ads : false;
    return { necessary: true, analytics, ads };
  } catch {
    return null;
  }
}

function writeConsent(c: Consent) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(c));
    window.dispatchEvent(new CustomEvent(CHANGE_EVT, { detail: c }));
  } catch {}
}

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
      onClick={() => window.dispatchEvent(new Event(OPEN_EVT))}
      className={`inline-flex items-center justify-center rounded-md px-3 py-2 ring-1 ring-white/15 bg-white/10 hover:bg-white/15 text-white ${className}`}
    >
      {label}
    </button>
  );
}

/** Bandeau cookies — Client only (évite les soucis d’hydratation). */
export default function CookieNotice() {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [open, setOpen] = useState(false);
  const [customize, setCustomize] = useState(false);

  // Focus par défaut sur “Tout accepter”
  const acceptRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const saved = readConsent();
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
    const onOpen = () => { setCustomize(true); setOpen(true); };
    window.addEventListener(OPEN_EVT, onOpen);
    return () => window.removeEventListener(OPEN_EVT, onOpen);
  }, []);

  const acceptAll = () => {
    const c: Consent = { necessary: true, analytics: true, ads: true };
    writeConsent(c);
    setConsent(c);
    setOpen(false);
    setCustomize(false);
  };

  const rejectAll = () => {
    const c: Consent = { necessary: true, analytics: false, ads: false };
    writeConsent(c);
    setConsent(c);
    setOpen(false);
    setCustomize(false);
  };

  const saveCustom = () => {
    const c: Consent = {
      necessary: true,
      analytics: !!consent?.analytics,
      ads: !!consent?.ads,
    };
    writeConsent(c);
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
            Vous pouvez en option activer la <em>mesure d’audience</em> (statistiques anonymes) et la
            <em> publicité personnalisée</em>. À défaut de consentement à la pub personnalisée, des
            publicités <em>non personnalisées</em> (contextuelles) peuvent être affichées.
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

              <label className="flex items-center gap-2 rounded-md bg-white/5 ring-1 ring-white/10 px-2 py-1.5">
                <input
                  type="checkbox"
                  id="cookie-analytics"
                  name="analytics"
                  checked={!!consent?.analytics}
                  onChange={(e) =>
                    setConsent({ ...(consent ?? { necessary: true, analytics: false, ads: false }), analytics: e.target.checked })
                  }
                />
                <span>Mesure d’audience (anonyme)</span>
              </label>

              <label className="flex items-center gap-2 rounded-md bg-white/5 ring-1 ring-white/10 px-2 py-1.5">
                <input
                  type="checkbox"
                  id="cookie-ads"
                  name="ads"
                  checked={!!consent?.ads}
                  onChange={(e) =>
                    setConsent({ ...(consent ?? { necessary: true, analytics: false, ads: false }), ads: e.target.checked })
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
                  onClick={() => { setCustomize(true); setConsent((c) => c ?? { necessary: true, analytics: false, ads: false }); }}
                >
                  Personnaliser…
                </button>

                {/* Lien discret : continuer sans accepter (équivalent “tout refuser”) */}
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

                {/* Lien discret aussi en mode personnalisation */}
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
