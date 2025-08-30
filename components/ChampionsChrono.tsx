// components/ChampionsChrono.tsx
"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { fuzzyEq } from "@/lib/fuzzy";
import { pushScore } from "./LocalScores";

export type ChampionMeta = {
  id: string;         // ex: "Aatrox"
  name: string;       // ex: "Aatrox"
};

type Props = {
  champions: ChampionMeta[];
  durationSec?: number; // défaut 60
};

const STORAGE_KEY = "lolquiz:chrono60:scores";

export default function ChampionsChrono({ champions, durationSec = 60 }: Props) {
  const pool = useMemo(
    () => champions.filter((c) => !!c?.id && !!c?.name),
    [champions]
  );

  const [current, setCurrent] = useState<ChampionMeta | null>(null);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(durationSec);
  const [running, setRunning] = useState(false);
  const [input, setInput] = useState("");

  const inputRef = useRef<HTMLInputElement | null>(null);
  const timerRef = useRef<number | null>(null);

  // pick aléatoire
  const nextChampion = () => {
    if (pool.length === 0) return setCurrent(null);
    const i = Math.floor(Math.random() * pool.length);
    setCurrent(pool[i]);
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // start / stop
  const start = () => {
    setScore(0);
    setLeft(durationSec);
    setRunning(true);
    nextChampion();
  };
  const stop = () => {
    setRunning(false);
    if (score > 0) pushScore(STORAGE_KEY, score);
  };

  // compte à rebours
  useEffect(() => {
    if (!running) return;
    timerRef.current = window.setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          window.clearInterval(timerRef.current!);
          timerRef.current = null;
          setTimeout(stop, 0);
          return 0;
        }
        return s - 1;
      });
    }, 1000) as unknown as number;
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [running]);

  // validation
  const tryValidate = () => {
    if (!current) return;
    if (fuzzyEq(input, current.name) || fuzzyEq(input, current.id)) {
      setScore((v) => v + 1);
      nextChampion();
    }
  };

  const splashUrl = current
    ? `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${current.id}_0.jpg`
    : null;

  return (
    <section className="space-y-4">
      <header className="text-center space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold">Mode Chrono — 60s</h1>
        <p className="text-white/70 text-sm">
          Tape le nom exact du champion. Accents/typos légères tolérées.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
        <div className="rounded-md bg-white/5 ring-1 ring-white/10 px-3 py-1.5">
          Temps restant : <span className="tabular-nums font-semibold">{left}s</span>
        </div>
        <div className="rounded-md bg-white/5 ring-1 ring-white/10 px-3 py-1.5">
          Score : <span className="tabular-nums font-semibold">{score}</span>
        </div>
        {!running ? (
          <button
            type="button"
            onClick={start}
            className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 font-semibold"
          >
            Démarrer
          </button>
        ) : (
          <button
            type="button"
            onClick={stop}
            className="rounded-lg bg-white/10 hover:bg-white/15 ring-1 ring-white/15 px-4 py-2"
          >
            Arrêter
          </button>
        )}
      </div>

      {/* Zone visuelle */}
      <div className="relative mx-auto max-w-3xl aspect-[16/9] overflow-hidden rounded-2xl ring-1 ring-white/10 bg-white/5">
        {splashUrl && (
          <Image
            src={splashUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            quality={75}
            priority={false}
            className="object-cover filter blur-[6px] grayscale-[60%] contrast-110"
          />
        )}
        {!running && (
          <div className="absolute inset-0 grid place-items-center text-center p-6">
            <p className="text-white/85">Clique “Démarrer” pour lancer le chrono.</p>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        className="mx-auto max-w-xl flex items-stretch gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          tryValidate();
        }}
      >
        <input
          ref={inputRef}
          type="text"
          name="guess"
          autoComplete="off"
          placeholder={running ? "Nom du champion…" : "Prêt ?"}
          disabled={!running}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 rounded-lg bg-black/40 ring-1 ring-white/10 px-3 py-2 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={!running}
          className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 font-semibold disabled:opacity-50"
        >
          Valider
        </button>
      </form>
    </section>
  );
}
