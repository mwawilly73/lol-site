"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Props = {
  /** "desktop" = bouton avec dropdown absolu ; "mobile" = liste repliable dans le burger */
  variant: "desktop" | "mobile";
  /** Classe utilitaire si besoin (optionnel) */
  className?: string;
};

export default function GamesMenu({ variant, className = "" }: Props) {
  if (variant === "mobile") {
    return <MobileGames className={className} />;
  }
  return <DesktopGames className={className} />;
}

/* ---------- Desktop dropdown ---------- */
function DesktopGames({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm bg-white/5 ring-1 ring-white/10 hover:bg-white/10 focus:outline-none"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="games-menu-popover"
      >
        Jeux ▾
      </button>

      {open && (
        <div
          id="games-menu-popover"
          role="menu"
          className="absolute z-50 mt-2 w-56 rounded-lg border border-white/10 bg-zinc-900/95 shadow-xl p-1"
        >
          <Link
            href="/games/champions"
            role="menuitem"
            className="block rounded-md px-3 py-2 text-sm hover:bg-white/10"
          >
            Liste des champions
          </Link>
          <Link
            href="/games/chrono"
            role="menuitem"
            className="block rounded-md px-3 py-2 text-sm hover:bg-white/10"
          >
            Chrono des champions
          </Link>
        </div>
      )}
    </div>
  );
}

/* ---------- Mobile collapsible (dans le burger) ---------- */
function MobileGames({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-md ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left rounded-md px-3 py-2 text-sm hover:bg-white/10"
        aria-expanded={open}
        aria-controls="games-mobile-sublist"
      >
        Jeux ▾
      </button>
      {open && (
        <div id="games-mobile-sublist" className="pl-3 pb-1">
          <Link
            href="/games/champions"
            className="block rounded-md px-3 py-2 text-sm hover:bg-white/10"
          >
            Liste des champions
          </Link>
          <Link
            href="/games/chrono"
            className="block rounded-md px-3 py-2 text-sm hover:bg-white/10"
          >
            Chrono des champions
          </Link>
        </div>
      )}
    </div>
  );
}
