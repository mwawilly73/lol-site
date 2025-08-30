// components/LocalScores.tsx
"use client";

import { useEffect, useState } from "react";

type ScoreEntry = { date: number; score: number };
type Props = { storageKey: string; title?: string; limit?: number };

export default function LocalScores({ storageKey, title = "Meilleurs scores", limit = 5 }: Props) {
  const [items, setItems] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ScoreEntry[];
      setItems(parsed.slice(0, limit));
    } catch {}
  }, [storageKey, limit]);

  if (items.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <h3 className="font-semibold text-white/90">{title}</h3>
      <ol className="mt-2 space-y-1 text-sm">
        {items.map((it, i) => (
          <li key={i} className="flex items-center justify-between text-white/80">
            <span>#{i + 1}</span>
            <span className="tabular-nums">{it.score} pts</span>
            <span className="text-white/60">{new Date(it.date).toLocaleDateString()}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// helpers
export function pushScore(storageKey: string, score: number, keep = 10) {
  try {
    const raw = localStorage.getItem(storageKey);
    const arr: ScoreEntry[] = raw ? JSON.parse(raw) : [];
    arr.push({ date: Date.now(), score });
    arr.sort((a, b) => b.score - a.score);
    localStorage.setItem(storageKey, JSON.stringify(arr.slice(0, keep)));
  } catch {}
}
