// components/JsonLd.tsx
"use client";

type JsonLdProps = {
  data: unknown;
};

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // On sérialise tel quel, sans any ni transformation
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
