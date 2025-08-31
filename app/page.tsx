// app/page.tsx
import type { Metadata } from "next";
import HeroRotator from "@/components/HeroRotator";
import GameCard from "@/components/GameCard";

export const metadata: Metadata = {
  title: "LoL Quiz — Accueil",
  description:
    "Jeux et quiz autour des champions de League of Legends. Devine les champions et entraîne ta mémoire !",
  alternates: { canonical: "/" },
  openGraph: {
    title: "LoL Quiz — Accueil",
    description:
      "Jeux et quiz autour des champions de League of Legends. Devine les champions et entraîne ta mémoire !",
    url: "/",
    type: "website",
  },
};

export default function HomePage() {
  // JSON-LD Organization (SEO)
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LoL Quiz",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    logo: "/icon.png",
  };

  // Images pour le hero (tu peux en ajouter/retirer librement)
  const HERO_IMGS = [
    "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Aatrox_8.jpg",
    "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ahri_88.jpg",
    "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Alistar_22.jpg",
    "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Draven_4.jpg",
    "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Evelynn_31.jpg",
    "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Garen_14.jpg",
    "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Illaoi_18.jpg",
    "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Kaisa_70.jpg",
    "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Kayn_9.jpg",
    "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Lux_61.jpg",
    "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/MissFortune_32.jpg",
    "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Qiyana_21.jpg",
    "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Sett_8.jpg",
    "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Teemo_37.jpg",
    "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Volibear_6.jpg",
    "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Yasuo_56.jpg",
    "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Zyra_6.jpg",
  ];

  const CHAMPIONS_CARD_BG =
    "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ahri_27.jpg";

  return (
    <>
      {/* JSON-LD SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />

      <section className="relative">
        {/* ===== HERO ROTATIF ===== */}
        <HeroRotator images={HERO_IMGS} intervalMs={5000}>
          <div className="text-center drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Bienvenue sur <span className="text-indigo-300">LoL Quiz</span>
            </h1>
            <p className="mt-2 text-sm sm:text-lg text-white/85">
              Entraîne ta mémoire avec des mini-jeux autour des champions.
            </p>
          </div>
        </HeroRotator>

        {/* ===== SÉLECTEUR DE JEUX ===== */}
        <div className="mx-auto max-w-6xl px-3 sm:px-4 py-8 sm:py-10 cv-auto"
          style={{ contentVisibility: "auto", containIntrinsicSize: "800px" }}>
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-white/90">
              Jeux disponibles
            </h2>
            <p className="text-sm sm:text-base text-white/70">
              D’autres jeux arrivent bientôt.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            <GameCard
              href="/games/champions"
              title="Liste des champions"
              subtitle="Devine les 171 champions de LoL"
              imageUrl={CHAMPIONS_CARD_BG}
            />

            <GameCard
              href="/games/chrono"
              title="Chrono-Break"
              subtitle="Trouve un Max de champions en temps limité"
              imageUrl="https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Zilean_6.jpg"
            />


            {/* Placeholder pour futurs jeux */}
            <div className="relative overflow-hidden rounded-2xl ring-1 ring-white/10 bg-white/5 p-6 flex items-center">
              <div>
                <div className="text-white/90 font-semibold text-lg">
                  Autres jeux à venir
                </div>
                <p className="text-white/70 text-sm mt-1">
                  Reste connecté, ça arrive très vite 👀
                </p>
              </div>

              <div className="absolute inset-0 opacity-[.06] pointer-events-none">
                <div className="absolute -right-10 -bottom-10 size-40 rounded-full bg-gradient-to-tr from-indigo-500 to-teal-400 blur-2xl" />
                <div className="absolute -left-16 -top-12 size-36 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 blur-2xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
