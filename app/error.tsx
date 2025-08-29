"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <html lang="fr">
      <body className="min-h-dvh bg-[#0e1117] text-white antialiased">
        <section className="mx-auto max-w-6xl px-3 sm:px-4 py-14 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold">Oups, un problème…</h1>
          <p className="mt-2 text-white/70">Une erreur est survenue. Essaie de recharger la page.</p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button onClick={() => reset()} className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2">
              Réessayer
            </button>
            <a href="/" className="rounded-lg ring-1 ring-white/20 hover:bg-white/10 px-4 py-2">Accueil</a>
          </div>
          {/* En dev ça peut aider */}
          {process.env.NODE_ENV !== "production" && (
            <pre className="mt-6 mx-auto max-w-xl text-left text-xs text-white/70 whitespace-pre-wrap">
              {error?.message}
            </pre>
          )}
        </section>
      </body>
    </html>
  );
}
