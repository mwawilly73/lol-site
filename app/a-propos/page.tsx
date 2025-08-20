// app/a-propos/page.tsx
// Rôle : exemple de page "marketing" avec metadata locale (utile pour SEO).
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'À propos — LoL Quiz',
  description: 'En savoir plus sur le projet LoL Quiz et notre mission communautaire.',
};

export default function AProposPage() {
  return (
    <section className="prose prose-invert max-w-none">
      <h2>À propos</h2>
      <p>
        LoL Quiz est un projet communautaire visant à proposer des mini-jeux amusants autour de League of Legends.
        Performance, accessibilité et SEO sont au cœur du site.
      </p>
    </section>
  );
}
