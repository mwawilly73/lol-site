// app/legal/page.tsx
import Link from "next/link";

export default function LegalIndexPage() {
  return (
    <section className="container-lg space-y-3">
      <h1 className="text-2xl md:text-3xl font-bold">Informations légales</h1>
      <p className="text-white/80">
        Consulte nos pages légales :
      </p>
      <ul className="list-disc pl-5 text-white/85">
        <li>
          <Link href="/legal/mentions-legales" className="text-indigo-300 hover:underline">
            Mentions légales
          </Link>
        </li>
        <li>
          <Link href="/legal/confidentialite" className="text-indigo-300 hover:underline">
            Politique de confidentialité
          </Link>
        </li>
      </ul>
    </section>
  );
}
