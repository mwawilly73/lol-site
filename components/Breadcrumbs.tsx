// components/Breadcrumbs.tsx
// Fil d’Ariane réutilisable (schema.org), à mettre sur toutes les pages sauf l'accueil.

import Link from "next/link";

export type Crumb = { label: string; href?: string };

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (!items?.length) return null;

  return (
    <nav
      aria-label="Fil d'Ariane"
      className="pt-4"
      itemScope
      itemType="https://schema.org/BreadcrumbList"
    >
      <ol className="flex flex-wrap items-center gap-2 text-sm text-white/70">
        {items.map((it, i) => {
          const pos = i + 1;
          const isLast = i === items.length - 1;
          return (
            <li
              key={i}
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
              className="flex items-center gap-2"
            >
              {it.href && !isLast ? (
                <Link href={it.href} itemProp="item" className="hover:underline">
                  <span itemProp="name">{it.label}</span>
                </Link>
              ) : (
                <span itemProp="name" className={isLast ? "text-white/85" : ""}>
                  {it.label}
                </span>
              )}
              <meta itemProp="position" content={String(pos)} />
              {!isLast && <span aria-hidden="true">›</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
