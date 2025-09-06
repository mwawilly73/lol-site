// app/a-propos/page.tsx
import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "À propos — LoL Quiz",
  description: "En savoir plus sur le projet LoL Quiz et notre mission communautaire.",
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
    name: "À propos — LoL Quiz",
    url: `${SITE}/a-propos`,
    isPartOf: { "@type": "WebSite", name: "LoL Quiz", url: SITE },
    description:
      "En savoir plus sur le projet LoL Quiz et notre mission communautaire.",
  };

  return (
    <section className="container-lg space-y-6">
      <JsonLd data={crumbs} />
      <JsonLd data={ABOUT} />

      <Breadcrumbs items={[{ label: "Accueil", href: "/" }, { label: "À propos" }]} />

      <div className="prose prose-invert max-w-none">
        <h2>À propos</h2>
        <p>
          LoL Quiz est un projet communautaire visant à proposer des mini-jeux
          amusants autour de League of Legends. Performance, accessibilité et
          SEO sont au cœur du site.
        </p>
      </div>
    </section>
  );
}
