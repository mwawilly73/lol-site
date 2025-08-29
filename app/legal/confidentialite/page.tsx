// app/legal/confidentialite/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de confidentialité | LoL Quiz",
  description:
    "Comment nous traitons vos données, les cookies essentiels, et l'option de publicités personnalisées.",
  alternates: { canonical: "/legal/confidentialite" },
};

export default function ConfidentialitePage() {
  return (
    <section className="container-lg prose prose-invert">
      <h1>Politique de confidentialité</h1>

      <h2>Ce que nous faisons</h2>
      <p>
        Nous utilisons des cookies essentiels afin d’assurer le bon fonctionnement du site (sécurité,
        anti-abus, préférences techniques). Ces cookies ne sont pas optionnels.
      </p>

      <h2>Publicités</h2>
      <p>
        Par défaut, des <strong>publicités non personnalisées</strong> peuvent être affichées.
        Avec votre consentement explicite, nous pouvons activer des <strong>publicités personnalisées</strong>.
        Vous pouvez modifier votre choix à tout moment depuis la page{" "}
        <Link href="/cookies">Cookies</Link>.
      </p>

      <h2>Vos choix</h2>
      <ul>
        <li>
          Maintenir des publicités non personnalisées (aucun cookie publicitaire : option par défaut si vous
          choisissez “continuer sans accepter”).
        </li>
        <li>
          Activer les publicités personnalisées (cookies publicitaires activés) en cliquant sur
          “Tout accepter” ou via la page <Link href="/cookies">Cookies</Link>.
        </li>
      </ul>

      <h2>Contact</h2>
      <p>
        Pour toute question liée à la confidentialité :{" "}
        <a href="mailto:contact@example.com">contact@example.com</a>.
      </p>
    </section>
  );
}
