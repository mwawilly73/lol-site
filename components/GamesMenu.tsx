// components/GamesMenu.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function GamesMenu({ variant }: { variant: "desktop" | "mobile" }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const linkBase =
    "block rounded-lg px-4 py-2 text-sm md:text-base transition-colors text-white/90 hover:text-white hover:bg-white/10";

  if (variant === "mobile") {
    // Dans le panneau mobile : même style que les autres entrées
    return (
      <div ref={rootRef}>
        <button
          type="button"
          className={`${linkBase} w-full text-left`}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          Jeux ▾
        </button>

        {open && (
          <div role="menu" aria-label="Jeux" className="mt-1 space-y-1 px-1">
            <Link
              role="menuitem"
              href="/games/champions"
              className={`${linkBase} ${pathname === "/games/champions" ? "bg-white/15 text-white" : ""}`}
              onClick={() => setOpen(false)}
            >
              Liste des champions
            </Link>
            <Link
              role="menuitem"
              href="/games/chrono"
              className={`${linkBase} ${pathname?.startsWith("/games/chrono") ? "bg-white/15 text-white" : ""}`}
              onClick={() => setOpen(false)}
            >
              Chrono-Break
            </Link>
          </div>
        )}
      </div>
    );
  }

  // Desktop : bouton identique aux liens + dropdown
  const triggerClasses = `${linkBase} ${open ? "bg-white/15 text-white" : ""}`;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={triggerClasses}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        Jeux ▾
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Jeux"
          className="absolute right-0 mt-2 w-60 rounded-xl ring-1 ring-white/10 bg-[#0e1117] shadow-2xl p-1 z-50"
        >
          <Link
            role="menuitem"
            href="/games/champions"
            className={`${linkBase} ${pathname === "/games/champions" ? "bg-white/15 text-white" : ""}`}
            onClick={() => setOpen(false)}
          >
            Liste des champions
          </Link>
          <Link
            role="menuitem"
            href="/games/chrono"
            className={`${linkBase} ${pathname?.startsWith("/games/chrono") ? "bg-white/15 text-white" : ""}`}
            onClick={() => setOpen(false)}
          >
            Chrono-Break
          </Link>
        </div>
      )}
    </div>
  );
}
