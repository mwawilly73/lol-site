"use client";

export default function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // Pas d’interpolation : on sérialise tel quel
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
