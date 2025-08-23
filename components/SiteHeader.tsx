// components/SiteHeader.tsx
// Header + navigation responsive avec menu mobile accessible.
// - Ferme au clic sur le backdrop et à Échap.
// - Focus management : ouverture → focus 1er lien ; fermeture → focus burger.
// - Quand le panneau est FERMÉ → hidden + inert (empêche le focus).
// - Pas d'opacity sur le header (fond opaque), pas de "any".

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function NavLink({
  href,
  children,
  forwardedRef,
  onSelect,
}: {
  href: string;
  children: React.ReactNode;
  forwardedRef?: React.Ref<HTMLAnchorElement>;
  onSelect?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      ref={forwardedRef}
      href={href}
      className={`block rounded-lg px-4 py-2 text-sm md:text-base transition-colors
        ${active ? "bg-white/15 text-white" : "text-white/90 hover:text-white hover:bg-white/10"}
      `}
      aria-current={active ? "page" : undefined}
      onClick={onSelect}
    >
      {children}
    </Link>
  );
}

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  const burgerRef = useRef<HTMLButtonElement | null>(null);
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);
  const mobilePanelRef = useRef<HTMLDivElement | null>(null);

  // Empêche le scroll du body quand le menu est ouvert + focus 1er lien
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => firstLinkRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
    };
  }, [open]);

  // Applique/retire l'attribut inert au panneau quand fermé (évite TypeScript sur JSX)
  useEffect(() => {
    const panel = mobilePanelRef.current;
    if (!panel) return;
    if (!open) {
      panel.setAttribute("inert", "");
      panel.setAttribute("aria-hidden", "true");
    } else {
      panel.removeAttribute("inert");
      panel.removeAttribute("aria-hidden");
    }
  }, [open]);

  // Si on ferme alors qu’un élément du panel avait le focus → blur + retour focus burger
  useEffect(() => {
    if (open) return;
    const panel = mobilePanelRef.current;
    if (!panel) return;
    const active = document.activeElement as HTMLElement | null;
    if (active && panel.contains(active)) {
      try {
        active.blur();
      } catch {}
      window.setTimeout(() => burgerRef.current?.focus(), 0);
    }
  }, [open]);

  // Échap pour fermer
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="w-full border-b border-white/10 bg-[#0e1117]">
      <div className="mx-auto max-w-6xl px-3 sm:px-4 py-3 md:py-4 flex items-center justify-between">
        {/* Logo / Titre du site */}
        <Link href="/" className="text-white font-semibold tracking-wide">
          LoL Quiz
        </Link>

        {/* Nav desktop */}
        <nav aria-label="Navigation principale" className="hidden md:flex items-center gap-1">
          <NavLink href="/">Accueil</NavLink>
          <NavLink href="/games/champions">Jeu : Champions</NavLink>
          <NavLink href="/a-propos">À propos</NavLink>
        </nav>

        {/* Burger mobile */}
        <button
          ref={burgerRef}
          type="button"
          className="md:hidden inline-flex items-center justify-center rounded-lg px-3 py-2 ring-1 ring-white/15 hover:ring-white/25 bg-white/10 hover:bg-white/15"
          aria-label="Ouvrir le menu"
          aria-controls="mobile-menu-panel"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          ☰
        </button>
      </div>

      {/* Panneau mobile */}
      <div
        id="mobile-menu-panel"
        ref={mobilePanelRef}
        hidden={!open}
        className="md:hidden fixed inset-0 z-50"
        role="dialog"
        aria-modal="true"
      >
        {/* Backdrop : ferme au clic */}
        <div
          className="absolute inset-0 bg-black/55 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />

        {/* Drawer (panneau) */}
        <div className="absolute left-0 right-0 top-0 mx-2 mt-16 rounded-2xl ring-1 ring-white/10 bg-[#0e1117] shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
            <div className="font-medium">Menu</div>
            <button
              type="button"
              aria-label="Fermer le menu"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center rounded-lg px-3 py-2 ring-1 ring-white/15 hover:ring-white/25 bg-white/10 hover:bg-white/15"
            >
              ✕
            </button>
          </div>

          <nav aria-label="Navigation mobile" className="p-2">
            <NavLink href="/" forwardedRef={firstLinkRef} onSelect={() => setOpen(false)}>
              Accueil
            </NavLink>
            <NavLink href="/games/champions" onSelect={() => setOpen(false)}>
              Jeu : Champions
            </NavLink>
            <NavLink href="/a-propos" onSelect={() => setOpen(false)}>
              À propos
            </NavLink>
          </nav>
        </div>
      </div>
    </header>
  );
}
