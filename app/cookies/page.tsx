// app/cookies/page.tsx
import type { Metadata } from "next";
import CookieStatus from "@/components/CookieStatus";
import { CookieManageButton } from "@/components/CookieNotice";

export const metadata: Metadata = {
  title: "Cookies | LoL Quiz",
  alternates: { canonical: "/cookies" },
};

export default function CookiesPage() {
  return (
    <section className="container-lg space-y-4">
      <h1 className="text-2xl md:text-3xl font-bold">Cookies</h1>
      <p className="text-white/80">
        Ici, vous pouvez consulter et modifier vos préférences de cookies.
      </p>

      <div className="rounded-lg border border-white/10 bg-white/5 p-3 sm:p-4">
        <h2 className="text-lg font-semibold">État actuel</h2>
        <div className="mt-2">
          <CookieStatus />
        </div>
        <div className="mt-3">
          <CookieManageButton className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold" />
        </div>
      </div>

      <div className="text-sm text-white/70">
        Les cookies essentiels sont toujours actifs, car nécessaires au fonctionnement du site.
      </div>
    </section>
  );
}
