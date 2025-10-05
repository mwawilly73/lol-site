// app/quiz-lol/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";

const PAGE_TITLE = "Quiz LoL (League of Legends) — FR | Legends Rift";
const PAGE_DESC =
  "Quiz LoL en français : devine les champions, révise le lore et les rôles. Fautes mineures tolérées, indices et chrono. Jouable sur mobile et PC.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: { canonical: "/quiz-lol" },
  openGraph: {
    title: "Quiz LoL — Legends Rift",
    description: "Teste tes connaissances League of Legends : champions, lore, rôles, chrono.",
    url: "/quiz-lol",
    type: "website",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Legends Rift" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Quiz LoL — Legends Rift",
    description: "Teste tes connaissances League of Legends : champions, lore, rôles, chrono.",
    images: ["/og.jpg"],
  },
};

// Optionnel : revalidation SSG quotidienne
export const revalidate = 86_400; // 24h

export default function QuizLolPage() {
  // FAQ JSON-LD (FAQPage)
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Le quiz LoL est-il gratuit ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui, 100% gratuit et disponible sur mobile et PC.",
        },
      },
      {
        "@type": "Question",
        name: "Dois-je créer un compte pour jouer ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Non. Tu peux lancer un quiz immédiatement, sans inscription.",
        },
      },
      {
        "@type": "Question",
        name: "Les fautes d’orthographe et accents sont-ils tolérés ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui, les fautes mineures et les accents sont ignorés pour ne pas casser le rythme.",
        },
      },
      {
        "@type": "Question",
        name: "Quels modes de quiz sont disponibles ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Jeu des Champions (deviner les champions), Chrono Breaker (comparer les vitesses) et Skin Finder (trouver des skins).",
        },
      },
    ],
  } as const;

  return (
    <div className="mx-auto max-w-3xl">
      {/* JSON-LD FAQ */}
      <JsonLd data={faq} />

      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">
          Quiz LoL (League of Legends) en français
        </h1>
        <p className="mt-2 text-white/80">
          Envie d’un <strong>quiz LoL</strong> rapide et fun ? Sur Legends Rift, devine les
          <em> champions</em>, révise le <em>lore</em>, teste les <em>rôles</em> et défie le{" "}
          <em>chrono</em>. Les fautes mineures sont tolérées et les accents ignorés pour garder le flow.
        </p>
      </header>

      <section className="space-y-4 sm:space-y-5">
        <div className="rounded-2xl ring-1 ring-white/10 bg-white/5 p-4 sm:p-5">
          <h2 className="text-lg sm:text-xl font-semibold">Commence un quiz maintenant</h2>
          <ul className="mt-3 list-disc list-inside space-y-2 text-white/90">
            <li>
              <Link className="underline underline-offset-2 hover:text-white" href="/games/champions">
                Jeu des Champions
              </Link>{" "}
              — Devine les champions (indices, fautes tolérées, lore FR).
            </li>
            <li>
              <Link className="underline underline-offset-2 hover:text-white" href="/games/chrono">
                Chrono Breaker
              </Link>{" "}
              — Qui est le plus rapide ? Compare et enchaîne les bonnes réponses.
            </li>
            <li>
              <Link className="underline underline-offset-2 hover:text-white" href="/games/skins">
                Skin Finder
              </Link>{" "}
              — Retrouve des skins par champion, thème ou rareté.
            </li>
          </ul>
        </div>

        <div className="rounded-2xl ring-1 ring-white/10 bg-white/5 p-4 sm:p-5">
          <h2 className="text-lg sm:text-xl font-semibold">Comment ça marche ?</h2>
          <p className="mt-2 text-white/80">
            Tape une réponse et valide. En cas d’erreur légère, ta réponse peut être acceptée. Sur mobile, le
            clavier se ferme automatiquement après un succès pour enchaîner plus vite. Tu peux aussi demander
            un indice pour révéler progressivement le nom du champion.
          </p>
        </div>

        <div className="rounded-2xl ring-1 ring-white/10 bg-white/5 p-4 sm:p-5">
          <h2 className="text-lg sm:text-xl font-semibold">FAQ</h2>
          <div className="mt-2 space-y-3 text-white/90">
            <div>
              <p className="font-medium">Le quiz LoL est-il gratuit ?</p>
              <p className="text-white/80">Oui, 100% gratuit et disponible sur mobile et PC.</p>
            </div>
            <div>
              <p className="font-medium">Faut-il créer un compte ?</p>
              <p className="text-white/80">Non. Joue immédiatement, sans inscription.</p>
            </div>
            <div>
              <p className="font-medium">Les fautes sont-elles tolérées ?</p>
              <p className="text-white/80">
                Oui, les fautes mineures et les accents sont ignorés pour ne pas casser le rythme.
              </p>
            </div>
            <div>
              <p className="font-medium">Quels modes existent ?</p>
              <p className="text-white/80">
                Jeu des Champions, Chrono Breaker et Skin Finder. D’autres arrivent bientôt.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Maillage interne complémentaire */}
      <nav aria-label="Navigation connexe" className="mt-6 sm:mt-8">
        <ul className="flex flex-wrap gap-2">
          <li>
            <Link
              className="inline-flex items-center rounded-md bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-sm font-semibold text-white"
              href="/games/champions"
            >
              Lancer le Jeu des Champions
            </Link>
          </li>
          <li>
            <Link
              className="inline-flex items-center rounded-md bg-gray-700 hover:bg-gray-600 px-3 py-2 text-sm font-semibold text-white"
              href="/"
            >
              Retour à l’accueil
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
