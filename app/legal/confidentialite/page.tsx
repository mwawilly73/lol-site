// app/legal/confidentialite/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de confidentialité | LoL Quiz",
  description:
    "Informations sur le traitement de vos données, les cookies utilisés et vos droits (RGPD/CNIL).",
  alternates: { canonical: "/legal/confidentialite" },
  openGraph: {
    title: "Politique de confidentialité | LoL Quiz",
    description:
      "Données, cookies, publicité personnalisée (opt-in) et vos droits.",
    url: "/legal/confidentialite",
    type: "article",
  },
};

export default function ConfidentialitePage() {
  return (
    <section className="container-lg space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">Politique de confidentialité</h1>
        <p className="text-white/80">
          Cette page explique quelles données nous traitons, pour quelles finalités, et vos droits (RGPD/CNIL).
        </p>
      </header>

      <article className="prose prose-invert max-w-none text-white/90">
        <h2>1. Responsable de traitement</h2>
        <p>
          LoL Quiz (site fan-made non affilié à Riot Games). Voir aussi les{" "}
          <Link href="/legal/mentions-legales">Mentions légales</Link>.
        </p>

        <h2>2. Données traitées</h2>
        <ul>
          <li>Données techniques nécessaires au fonctionnement (ex. sécurité, prévention d’abus).</li>
          <li>
            <strong>Mesure d’audience (anonyme)</strong> si vous l’acceptez.
          </li>
          <li>
            <strong>Publicité personnalisée</strong> uniquement si vous y consentez explicitement.
          </li>
        </ul>

        <h2>3. Cookies et consentement</h2>
        <p>
          Nous utilisons des cookies nécessaires (toujours actifs). Vous pouvez en option activer la{" "}
          mesure d’audience (statistiques anonymes) et la <strong>publicité personnalisée</strong> (profilage).
          Sans consentement à la personnalisation, des publicités <em>non personnalisées</em> (contextuelles) peuvent
          être affichées.
        </p>
        <p>
          Vous pouvez modifier vos choix à tout moment via la page{" "}
          <Link href="/cookies">Cookies</Link> (bouton “Personnaliser les cookies”).
        </p>

        <h2>4. Publicité</h2>
        <p>
          Par défaut, les publicités affichées sont <strong>non personnalisées</strong>. Si vous consentez à la
          publicité personnalisée, nous pouvons activer des partenaires publicitaires susceptibles de déposer des
          traceurs à des fins de profilage pour personnaliser les annonces.
        </p>
        <p>
          À tout moment, vous pouvez retirer votre consentement à la publicité personnalisée et revenir à des
          publicités non personnalisées via la page <Link href="/cookies">Cookies</Link>.
        </p>

        <h2>5. Hébergement & transferts</h2>
        <p>
          Le site est hébergé auprès de services pouvant être situés dans l’UE/EEE. Si des services situés hors UE
          sont utilisés, nous veillons à l’existence de garanties adéquates conformément au RGPD.
        </p>

        <h2>6. Vos droits</h2>
        <p>
          Vous disposez des droits d’accès, rectification, effacement, limitation, opposition et portabilité (dans
          les conditions légales). Vous pouvez également introduire une réclamation auprès de la CNIL.
        </p>
        <p>
          Pour exercer vos droits, contactez-nous via les informations figurant dans les{" "}
          <Link href="/legal/mentions-legales">Mentions légales</Link>.
        </p>

        <h2>7. Mises à jour</h2>
        <p>Cette politique pourra évoluer. Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}.</p>
      </article>
    </section>
  );
}
