// components/SiteHeader.tsx
// ───────────────────────────────────────────────────────────────
// Header responsive, non-sticky, avec menu mobile accessible.
// - Plus de warning "aria-hidden avec descendant focus" : on utilise `inert`
//   quand le menu est fermé et on renvoie le focus sur le bouton burger.
// - Compatible CSP (aucun script inline).
// - Fermeture : ESC, clic en dehors, clic sur un lien, changement de route.
// ───────────────────────────────────────────────────────────────

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/* Lien desktop avec état actif */
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

/* Lien mobile (plein largeur) */
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

  // Refs utiles
  const panelRef = useRef<HTMLDivElement | null>(null);      // panneau (carte)
  const overlayRef = useRef<HTMLDivElement | null>(null);    // overlay/backdrop (pour inert)
  const burgerBtnRef = useRef<HTMLButtonElement | null>(null);

  // Fermer le menu à chaque changement de route
  useEffect(() => {
    if (open) setOpen(false);
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Gérer ESC + clic outside (sur overlay)
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (panelRef.current && !panelRef.current.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [open]);

  // Empêcher le scroll de la page quand le menu est ouvert
  useEffect(() => {
    const html = document.documentElement;
    if (open) {
      html.style.overflow = "hidden";
    } else {
      html.style.overflow = "";
    }
    return () => {
      html.style.overflow = "";
    };
  }, [open]);

  // ✅ IMPORTANT : appliquer/retirer `inert` quand fermé + replacer le focus sur le burger
  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;

    if (!open) {
      // applique l’attribut inert (empêche focus/interactions)
      el.setAttribute("inert", "");
      // renvoie le focus vers le bouton burger pour éviter que le focus reste "caché"
      // (utilise un micro délais pour laisser React poser les classes CSS)
      setTimeout(() => burgerBtnRef.current?.focus(), 0);
    } else {
      el.removeAttribute("inert");
      // focus sur le premier lien du panneau si tu veux (optionnel) :
      // panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
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

        {/* Bouton burger (mobile) */}
        <div className="ml-auto md:hidden">
          <button
            ref={burgerBtnRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            aria-controls="mobile-menu-panel"
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

      {/* Overlay + panneau mobile */}
      <div
        ref={overlayRef}
        id="mobile-menu-panel"
        className={`md:hidden fixed inset-0 z-50 transition-opacity duration-200
          ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
        // ⚠️ plus de aria-hidden ici : c'est `inert` qui empêche focus + interaction quand fermé
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        {/* Panneau */}
        <div
          ref={panelRef}
          className={`absolute left-0 right-0 top-0 mx-2 mt-16 rounded-2xl ring-1 ring-white/10 bg-[#12141a]/95 shadow-2xl overflow-hidden
            transition-transform duration-200 ${open ? "translate-y-0" : "-translate-y-3"}
          `}
          role="dialog"
          aria-modal="true"
          aria-label="Menu principal"
        >
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

          <div className="px-4 py-3 border-t border-white/10 text-xs text-white/60">
            Projet fan-made non affilié à Riot Games.
          </div>
        </div>
      </div>
    </header>
  );
}
