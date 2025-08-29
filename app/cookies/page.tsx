// app/cookies/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
// ⬇️ Import direct (CookiePrefs est un Client Component avec "use client")
import CookiePrefs from "@/components/CookiePrefs";

export const metadata: Metadata = {
  title: "Cookies | LoL Quiz",
  description:
    "Gérez vos préférences de cookies : fonctionnalités essentielles, mesure d’audience et publicité personnalisée.",
  alternates: { canonical: "/cookies" },
  openGraph: {
    title: "Cookies | LoL Quiz",
    description:
      "Gérez vos préférences de cookies : fonctionnalités essentielles, mesure d’audience et publicité personnalisée.",
    url: "/cookies",
    type: "website",
  },
};

export default function CookiesPage() {
  return (
    <section className="mx-auto max-w-6xl px-3 sm:px-4 py-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">Préférences de cookies</h1>
        <p className="text-white/80">
          Ici, vous pouvez choisir si vous autorisez la{" "}
          <strong>publicité personnalisée</strong>.
          Sans consentement, des publicités <em>non personnalisées</em> peuvent s’afficher.
        </p>
        <p className="text-white/70 text-sm">
          Pour en savoir plus sur le traitement des données, consultez la{" "}
          <Link href="/legal/confidentialite" className="underline underline-offset-2">
            page Confidentialité
          </Link>
          .
        </p>
      </header>

      {/* Panneau de préférences (client) */}
      <CookiePrefs />

      <div className="rounded-lg border border-white/10 bg-black/40 p-4 text-sm text-white/80">
        <p className="mb-2">
          <strong>Rappel :</strong> les cookies strictement nécessaires au fonctionnement du site
          sont toujours actifs et ne nécessitent pas de consentement.
        </p>
        <p>
          Vous pouvez aussi rouvrir le bandeau depuis cette page si besoin (bouton “Ouvrir le
          bandeau”), afin d’ajuster vos choix à tout moment.
        </p>
      </div>
    </section>
  );
}
