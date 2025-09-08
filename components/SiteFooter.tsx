// components/SiteFooter.tsx
import Link from "next/link";

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative isolate mt-10 text-xs sm:text-sm" role="contentinfo">
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
        aria-hidden="true"
      />
      <div className="relative z-10 bg-[#0e1117]">
        <div className="mx-auto max-w-6xl px-3 sm:px-4 py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-white/70">
              © {year} Legends Rift. Projet fan-made non affilié à Riot Games.
            </div>
            <nav aria-label="Liens de pied de page" className="flex flex-wrap items-center gap-3">
              <Link className="hover:text-white transition-colors" href="/">Accueil</Link>
              <Link className="hover:text-white transition-colors" href="/legal/mentions-legales">Mentions légales</Link>
              <Link className="hover:text-white transition-colors" href="/legal/confidentialite">Confidentialité</Link>
              <Link className="hover:text-white transition-colors" href="/cookies">Cookies</Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
