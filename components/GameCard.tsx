// components/GameCard.tsx
"use client";

import Link from "next/link";
import Image from "next/image";

type Props = {
  href: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  priority?: boolean;
};

export default function GameCard({ href, title, subtitle, imageUrl, priority = false }: Props) {
  return (
    <Link
      href={href}
      aria-label={title}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e1117] rounded-2xl"
    >
      <article
        className="
          relative overflow-hidden rounded-2xl ring-1 ring-white/10 bg-white/5
          shadow-[0_6px_20px_rgba(0,0,0,.25)]
          transition-all duration-300 ease-out will-change-transform
          hover:translate-y-[-2px] hover:shadow-[0_10px_30px_rgba(0,0,0,.35)] hover:ring-white/20
          motion-reduce:transition-none motion-reduce:hover:translate-y-0
        "
      >
        {/* Image de fond (opaque) */}
        <div className="absolute inset-0">
          <Image
            src={imageUrl}
            alt={`Illustration : ${title}`}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="
              object-cover
              transition-transform duration-300 ease-out
              group-hover:scale-[1.03]
              motion-reduce:transition-none motion-reduce:group-hover:scale-100
            "
          />
          {/* Voile pour lisibilité du texte */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-transparent" />
          {/* Lueur discrète au hover */}
          <div className="
              pointer-events-none absolute -inset-10 opacity-0
              group-hover:opacity-20 transition-opacity duration-300
              bg-[radial-gradient(120px_120px_at_70%_30%,rgba(255,255,255,.6),transparent)]
              motion-reduce:transition-none
            "
          />
        </div>

        {/* Contenu sémantique */}
        <div className="relative p-5 sm:p-6 min-h-[180px] flex items-end">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-white drop-shadow">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-1 text-sm text-white/80 drop-shadow-[0_1px_8px_rgba(0,0,0,.6)]">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
