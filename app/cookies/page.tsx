// app/cookies/page.tsx
import type { Metadata } from "next";
import { CookieManageButton } from "@/components/CookieNotice";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookies | LoL Quiz",
  description:
    "Gérez vos préférences de cookies : nécessaires, mesure d’audience et publicité personnalisée.",
  alternates: { canonical: "/cookies" },
  openGraph: {
    title: "Cookies | LoL Quiz",
    description:
      "Gérez vos préférences de cookies : nécessaires, mesure d’audience et publicité personnalisée.",
    url: "/cookies",
    type: "article",
  },
};

export default function CookiesPage() {
  return (
    <section className="container-lg space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">Cookies</h1>
        <p className="text-white/80">
          Vous pouvez revoir et modifier vos préférences de cookies à tout moment.
        </p>
      </header>

      <article className="space-y-5 text-sm text-white/90">
        <section className="space-y-1">
          <h2 className="text-lg font-semibold text-white">Catégories</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Nécessaires</strong> — indispensables au bon fonctionnement du site (toujours actifs).
            </li>
            <li>
              <strong>Mesure d’audience</strong> — statistiques anonymes pour améliorer le site (opt-in).
            </li>
            <li>
              <strong>Publicité personnalisée</strong> — personnalisation des annonces (profilage, opt-in).
              Sans consentement, des publicités <em>non personnalisées</em> peuvent être affichées.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">Modifier mes préférences</h2>
          <p>Rouvrez le bandeau pour personnaliser votre consentement :</p>
          <CookieManageButton className="mt-1" label="Personnaliser les cookies" />
          <p className="text-white/70">
            Voir aussi notre <Link href="/legal/confidentialite" className="underline underline-offset-2">Politique de confidentialité</Link>.
          </p>
        </section>
      </article>
    </section>
  );
}
