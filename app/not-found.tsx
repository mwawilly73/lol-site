export default function NotFound() {
  return (
    <section className="mx-auto max-w-6xl px-3 sm:px-4 py-14 text-center">
      <h1 className="text-3xl sm:text-4xl font-extrabold">Page introuvable</h1>
      <p className="mt-2 text-white/70">Le lien est peut-être cassé ou la page a été déplacée.</p>
      <a href="/" className="inline-block mt-5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2">
        Retour à l’accueil
      </a>
    </section>
  );
}
