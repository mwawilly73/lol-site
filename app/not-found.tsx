// app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-3xl rounded-xl border border-white/10 bg-black/60 p-6 text-sm">
      <h1 className="text-lg font-semibold">Page introuvable</h1>
      <p className="mt-2 text-white/80">
        La page demandée n’existe pas ou plus.
      </p>
      <div className="mt-4">
        <Link
          href="/"
          className="rounded-md border border-white/15 px-3 py-2 text-white/90 hover:bg-white/10"
        >
          Retour à l’accueil
        </Link>
      </div>
    </section>
  );
}
