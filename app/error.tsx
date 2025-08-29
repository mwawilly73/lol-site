// app/error.tsx
"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-4 py-10">
      <h1 className="text-2xl font-bold">Oups… une erreur est survenue.</h1>
      <p className="mt-2 text-white/80">
        Essaie de recharger la page. Si le souci persiste, reviens à l’accueil.
      </p>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md bg-white/10 hover:bg-white/15 ring-1 ring-white/15 px-3 py-2"
        >
          Réessayer
        </button>
        <Link
          href="/"
          className="rounded-md bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2"
        >
          Accueil
        </Link>
      </div>

      {/* détail (dev) */}
      {process.env.NODE_ENV === "development" && (
        <pre className="mt-6 text-xs text-white/60 whitespace-pre-wrap">
          {error?.digest ?? error?.message}
        </pre>
      )}
    </div>
  );
}
