// app/legal/mentions-legales/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales | LoL Quiz",
  alternates: { canonical: "/legal/mentions-legales" },
};

export default function MentionsLegalesPage() {
  return (
    <article className="container-lg space-y-4" itemScope itemType="https://schema.org/Legislation">
      <h1 className="text-2xl md:text-3xl font-bold">Mentions légales</h1>

      <section>
        <h2 className="text-lg font-semibold">Éditeur du site</h2>
        <p className="text-white/80">
          Site fan-made, non affilié à Riot Games.
          <br />
          Contact : <span itemProp="legislationIdentifier">contact@example.com</span>
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Hébergement</h2>
        <p className="text-white/80">
          Hébergeur : à compléter (nom / adresse / pays).
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Propriété intellectuelle</h2>
        <p className="text-white/80">
          League of Legends et Riot Games sont des marques de Riot Games, Inc. Ce site est un projet non officiel.
        </p>
      </section>
    </article>
  );
}
