// app/a-propos/page.tsx
// Rôle : exemple de page "marketing" avec metadata locale (utile pour SEO).
import type { Metadata } from 'next';
import Breadcrumbs from '@/components/Breadcrumbs';

export const metadata: Metadata = {
  title: 'À propos — LoL Quiz',
  description: 'En savoir plus sur le projet LoL Quiz et notre mission communautaire.',
  alternates: { canonical: '/a-propos' },
  openGraph: {
    title: 'À propos — LoL Quiz',
    description: 'En savoir plus sur le projet LoL Quiz et notre mission communautaire.',
    url: '/a-propos',
    type: 'website',
  },
};

export default function AProposPage() {
  // JSON-LD breadcrumb
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: '/' },
      { '@type': 'ListItem', position: 2, name: 'À propos' },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-6xl px-3 sm:px-4 pt-4">
        <Breadcrumbs items={[{ label: 'Accueil', href: '/' }, { label: 'À propos' }]} />
      </div>

      <section className="prose prose-invert max-w-none">
        <h2>À propos</h2>
        <p>
          LoL Quiz est un projet communautaire visant à proposer des mini-jeux amusants autour de League of Legends.
          Performance, accessibilité et SEO sont au cœur du site.
        </p>
      </section>
    </>
  );
}
