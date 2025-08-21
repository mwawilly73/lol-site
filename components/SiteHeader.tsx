// components/SiteHeader.tsx
// ───────────────────────────────────────────────────────────────
// Header responsive (non-sticky) avec menu mobile simple et fiable.
// - Un booléen `open` pour contrôler l'overlay.
// - Clic en dehors du panneau (backdrop pleine page) → ferme.
// - Bouton croix → ferme.
// - ESC → ferme.
// - Changement de route → ferme.
// - Overlay MONTÉ uniquement quand ouvert (pas d’aria-hidden/inert nécessaires).
// - Blocage du scroll de la page quand le menu est ouvert.
// - CSP OK (aucun inline).
// ───────────────────────────────────────────────────────────────

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** Lien desktop avec état actif */
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive =
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={`inline-flex items-center h-9 rounded-md px-3 text-sm transition-colors
        ${isActive ? "bg-white/15 text-white" : "text-white/80 hover:text-white hover:bg-white/10"}
      `}
    >
      {children}
    </Link>
  );
}

/** Lien mobile (plein largeur) */
function NavLinkMobile({
  href,
  children,
  onNavigate,
}: {
  href: string;
  children: React.ReactNode;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isActive =
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`block w-full rounded-lg px-4 py-3 text-base transition-colors
        ${isActive ? "bg-white/15 text-white" : "text-white/90 hover:text-white hover:bg-white/10"}
      `}
    >
      {children}
    </Link>
  );
}

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Refs utiles (focus)
  const panelRef = useRef<HTMLDivElement | null>(null);
  const burgerRef = useRef<HTMLButtonElement | null>(null);

  // ESC → fermer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Changement de route → fermer
  useEffect(() => {
    if (open) setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Bloquer le scroll quand le menu est ouvert
  useEffect(() => {
    const html = document.documentElement;
    if (open) html.style.overflow = "hidden";
    else html.style.overflow = "";
    return () => {
      html.style.overflow = "";
    };
  }, [open]);

  // Focus 1er lien à l’ouverture, refocus le burger à la fermeture
  useEffect(() => {
    if (open) {
      const first = panelRef.current?.querySelector<HTMLElement>('a, button:not([disabled])');
      setTimeout(() => first?.focus(), 0);
    } else {
      setTimeout(() => burgerRef.current?.focus(), 0);
    }
  }, [open]);

  return (
    <header className="relative z-40 bg-black/20 border-b border-white/10">
      <div className="mx-auto max-w-6xl px-3 sm:px-4 py-3 flex items-center gap-3">
        {/* Logo + Titre */}
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="size-8 rounded-md bg-indigo-600/90 flex items-center justify-center text-white font-bold">
            L
          </div>
          <span className="text-white font-semibold tracking-wide group-hover:opacity-90">
            LoL&nbsp;Quiz
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="ml-auto hidden md:flex items-center gap-1">
          <NavLink href="/">Accueil</NavLink>
          <NavLink href="/games/champions">Liste des champions</NavLink>
          <span
            className="inline-flex items-center h-9 rounded-md px-3 text-sm text-white/50 border border-white/10 cursor-not-allowed select-none"
            title="Bientôt…"
          >
            Autres jeux (à venir)
          </span>
        </nav>

        {/* Burger (mobile) */}
        <div className="ml-auto md:hidden">
          <button
            ref={burgerRef}
            type="button"
            onClick={() => setOpen(true)}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            aria-controls="mobile-menu-overlay"
            className="inline-flex items-center justify-center rounded-md p-2 text-white/90 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l12 12M18 6l-12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Overlay monté UNIQUEMENT quand open = true */}
      {open && (
        <div id="mobile-menu-overlay" className="md:hidden fixed inset-0 z-50">
          {/* Backdrop : clic hors panneau → FERME IMMÉDIATEMENT */}
          <button
            type="button"
            aria-label="Fermer le menu"
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panneau (slide léger) */}
          <div
            ref={panelRef}
            className="absolute left-0 right-0 top-0 mx-2 mt-16 rounded-2xl ring-1 ring-white/10 bg-[#12141a]/95 shadow-2xl overflow-hidden
                       transition-transform duration-200 translate-y-0"
            role="dialog"
            aria-modal="true"
            aria-label="Menu principal"
            onClick={(e) => e.stopPropagation()} // évite que les clics internes ferment
          >
            {/* Barre du panneau (titre + croix) */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-md bg-indigo-600/90 text-white flex items-center justify-center text-sm font-bold">
                  ☰
                </div>
                <h2 className="text-sm font-semibold tracking-wide text-white/90">Menu</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer le menu"
                className="inline-flex items-center justify-center rounded-md p-2 text-white/90 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l12 12M18 6l-12 12" />
                </svg>
              </button>
            </div>

            {/* Liens */}
            <div className="p-2">
              <NavLinkMobile href="/" onNavigate={() => setOpen(false)}>
                Accueil
              </NavLinkMobile>
              <NavLinkMobile href="/games/champions" onNavigate={() => setOpen(false)}>
                Liste des champions
              </NavLinkMobile>
              <div
                className="mt-1 block w-full rounded-lg px-4 py-3 text-base text-white/60 border border-white/10 cursor-not-allowed select-none"
                title="Bientôt…"
              >
                Autres jeux (à venir)
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-white/10 text-xs text-white/60">
              Projet fan-made non affilié à Riot Games.
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
