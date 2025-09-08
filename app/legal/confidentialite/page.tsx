// app/legal/confidentialite/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Politique de confidentialité | Legends Rift",
  description:
    "Comment nous traitons vos données, les cookies essentiels, et l'option de publicités personnalisées.",
  alternates: { canonical: "/legal/confidentialite" },
};

export default function ConfidentialitePage() {
  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const crumbs = breadcrumbJsonLd([
    { name: "Accueil", item: `${SITE}/` },
    { name: "Confidentialité", item: `${SITE}/legal/confidentialite` },
  ]);
  const PRIVACY = {
    "@context": "https://schema.org",
    "@type": "PrivacyPolicy",
    name: "Politique de confidentialité | Legends Rift",
    url: `${SITE}/legal/confidentialite`,
    isPartOf: { "@type": "WebSite", name: "Legends Rift", url: SITE },
  };

  return (
    <section className="container-lg prose prose-invert">
      <JsonLd data={crumbs} />
      <JsonLd data={PRIVACY} />

      <Breadcrumbs items={[{ label: "Accueil", href: "/" }, { label: "Confidentialité" }]} />

      <h1>Politique de confidentialité</h1>

      {/* ... ton contenu existant inchangé ... */}
      <h2>Ce que nous faisons</h2>
      <p>
        Nous utilisons des cookies essentiels afin d’assurer le bon fonctionnement du site (sécurité,
        anti-abus, préférences techniques). Ces cookies ne sont pas optionnels.
      </p>
      <h2>Publicités</h2>
      <p>
        Par défaut, des <strong>publicités non personnalisées</strong> peuvent être affichées.
        Avec votre consentement explicite, nous pouvons activer des <strong>publicités personnalisées</strong>.
        Vous pouvez modifier votre choix à tout moment depuis la page <Link href="/cookies">Cookies</Link>.
      </p>
      <h2>Vos choix</h2>
      <ul>
        <li>Maintenir des publicités non personnalisées…</li>
        <li>Activer les publicités personnalisées…</li>
      </ul>
      <h2>Contact</h2>
      <p>
        Pour toute question liée à la confidentialité :{" "}
        <a href="mailto:contact.legendsrift@gmail.com">contact.legendsrift@gmail.com</a>.
      </p>
    </section>
  );
}
