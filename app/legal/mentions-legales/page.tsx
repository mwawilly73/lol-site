// app/legal/mentions-legales/page.tsx
import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Mentions légales | Legends Rift",
  description:
    "Mentions légales du site Legends Rift : éditeur, contact, propriété intellectuelle et mentions relatives à Riot Games.",
  alternates: { canonical: "/legal/mentions-legales" },
  openGraph: {
    title: "Mentions légales | Legends Rift",
    description:
      "Mentions légales du site Legends Rift : éditeur, contact, propriété intellectuelle et mentions relatives à Riot Games.",
    url: "/legal/mentions-legales",
    type: "article",
  },
};

export default function MentionsLegalesPage() {
  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const crumbs = breadcrumbJsonLd([
    { name: "Accueil", item: `${SITE}/` },
    { name: "Mentions légales", item: `${SITE}/legal/mentions-legales` },
  ]);
  const LEGAL = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Mentions légales | Legends Rift",
    url: `${SITE}/legal/mentions-legales`,
    isPartOf: { "@type": "WebSite", name: "Legends Rift", url: SITE },
  };

  return (
    <section className="container-lg space-y-6">
      <JsonLd data={crumbs} />
      <JsonLd data={LEGAL} />

      <Breadcrumbs items={[{ label: "Accueil", href: "/" }, { label: "Mentions légales" }]} />

      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">Mentions légales</h1>
        <p className="text-white/80">
          Informations relatives à l’éditeur du site, la propriété intellectuelle et les
          mentions obligatoires.
        </p>
      </header>

      <article className="space-y-5 text-sm text-white/90">
        <section className="space-y-1">
          <h2 className="text-lg font-semibold text-white">Éditeur du site</h2>
          <p>
            <strong>Legends Rift</strong> — Projet fan-made, non affilié à Riot Games.
          </p>
          <p>
            <strong>Contact&nbsp;</strong> — contact.legendsrift@gmail.com
          </p>
        </section>

        <section className="space-y-1">
          <h2 className="text-lg font-semibold text-white">Hébergement</h2>
          <p>
            <strong>Hébergeur</strong> — <em>à compléter</em> (nom, adresse, téléphone de l’hébergeur
            selon votre prestataire de déploiement).
          </p>
        </section>

        <section className="space-y-1">
          <h2 className="text-lg font-semibold text-white">Propriété intellectuelle</h2>
          <p>
            Le contenu original (textes, code, interface) de ce site est protégé par le droit
            d’auteur. Toute reproduction non autorisée est interdite.
          </p>
          <p>
            League of Legends et Riot Games sont des marques ou des marques déposées de Riot
            Games, Inc. Legends Rift est un projet non officiel, non affilié et non soutenu
            par Riot Games.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">Mentions légales de Riot Games</h2>
          <p>Pour les mentions légales officielles de Riot Games, veuillez consulter&nbsp;:</p>
          <p>
            <a
              href="https://www.riotgames.com/fr/mentions-legales"
              target="_blank"
              rel="noopener nofollow"
              className="underline hover:no-underline"
            >
              https://www.riotgames.com/fr/mentions-legales
            </a>
          </p>
        </section>

        <section className="space-y-1">
          <h2 className="text-lg font-semibold text-white">Données personnelles</h2>
          <p>
            Pour en savoir plus sur le traitement des données et vos droits, consultez la{" "}
            <a href="/legal/confidentialite" className="underline hover:no-underline">
              Politique de confidentialité
            </a>{" "}
            ainsi que la page{" "}
            <a href="/cookies" className="underline hover:no-underline">
              Cookies
            </a>
            .
          </p>
        </section>
      </article>
    </section>
  );
}
