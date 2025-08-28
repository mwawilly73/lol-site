// app/legal/confidentialite/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité | LoL Quiz",
  alternates: { canonical: "/legal/confidentialite" },
};

export default function ConfidentialitePage() {
  return (
    <article className="container-lg space-y-4" itemScope itemType="https://schema.org/PrivacyPolicy">
      <h1 className="text-2xl md:text-3xl font-bold">Politique de confidentialité</h1>

      <section>
        <h2 className="text-lg font-semibold">Données collectées</h2>
        <p className="text-white/80">
          Ce site collecte un minimum de données nécessaires au bon fonctionnement (journalisation serveur, mesures
          techniques anonymisées, etc.). Aucun suivi publicitaire n’est réalisé.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Cookies</h2>
        <p className="text-white/80">
          Des cookies techniques peuvent être utilisés pour mémoriser vos préférences (ex : consentement). Vous pouvez
          les refuser à tout moment via l’interface de gestion des cookies si elle est proposée.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Contact</h2>
        <p className="text-white/80">
          Pour toute question, écrivez-nous : contact@example.com
        </p>
      </section>
    </article>
  );
}
