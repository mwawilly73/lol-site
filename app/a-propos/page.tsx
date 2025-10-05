// app/a-propos/page.tsx
import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Quiz LoL : À propos — Legends Rift",
  description: "En savoir plus sur le projet Legends Rift et notre projet communautaire.",
  alternates: { canonical: "/a-propos" },
};

export default function AProposPage() {
  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const crumbs = breadcrumbJsonLd([
    { name: "Accueil", item: `${SITE}/` },
    { name: "À propos", item: `${SITE}/a-propos` },
  ]);
  const ABOUT = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: " Quiz LoL : À propos — Legends Rift",
    url: `${SITE}/a-propos`,
    isPartOf: { "@type": "WebSite", name: "Legends Rift", url: SITE },
    description:
      "En savoir plus sur le projet Legends Rift et notre projet communautaire.",
  };

  return (
    <section className="container-lg space-y-6">
      <JsonLd data={crumbs} />
      <JsonLd data={ABOUT} />

      <Breadcrumbs items={[{ label: "Accueil", href: "/" }, { label: "À propos" }]} />

      <div className="prose prose-invert max-w-none">
        <h2>Quiz LoL : À propos</h2>
        <p>
          Legends Rift est un projet communautaire visant à proposer des mini-jeux
          amusants autour de League of Legends. Notre objectif est de créer une
          plateforme où les fans de LoL peuvent tester et améliorer leurs connaissances
          des champions tout en s’amusant. Nous croyons en la puissance de la
          communauté et nous nous efforçons de fournir un espace convivial et engageant
          pour tous les joueurs. Que vous soyez un vétéran de LoL ou un nouveau venu, nous espérons que
          vous trouverez quelque chose à apprécier sur Legends Rift.
        </p>
      </div>
    </section>
  );
}
