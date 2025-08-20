// app/games/champions/ChampionsGame.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Version demandée :
//  - PAS d'“Objectif”
//  - À droite : Trouvés + Timer + Pause/Reprendre + Réinitialiser tout
//  - Réinitialiser tout = remise à zéro (timer, input, derniers résultats, cartes révélées)
//  - Pause/Reprendre = stoppe/relance uniquement le timer
//  - Saisie : accents optionnels + 1 faute tolérée (Levenshtein)
//  - Grille des cartes identique
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  KeyboardEvent,
} from "react";
import type { ChampionMeta } from "@/lib/champions";
import ChampionCard from "@/components/ChampionCard";

/* Normalisation (accents -> enlevés, minuscule) */
function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/* Levenshtein simple (distance d’édition) */
function lev(a: string, b: string) {
  if (a === b) return 0;
  const m = a.length,
    n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    const ai = a[i - 1];
    for (let j = 1; j <= n; j++) {
      const cost = ai === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[m][n];
}

type Props = {
  initialChampions: ChampionMeta[];
  targetTotal: number; // ignoré pour l’affichage, gardé si tu le réutilises plus tard
};

export default function ChampionsGame({ initialChampions }: Props) {
  // Cartes trouvées (par slug)
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  // Champ de saisie + feedback
  const [value, setValue] = useState("");
  const [lastTry, setLastTry] = useState<string>("");
  const [lastResult, setLastResult] = useState<string>("—");
  const inputRef = useRef<HTMLInputElement>(null);

  // Timer
  const [elapsed, setElapsed] = useState(0); // en secondes
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Index nom normalisé -> champion
  const index = useMemo(() => {
    const m = new Map<string, ChampionMeta>();
    for (const c of initialChampions) m.set(norm(c.name), c);
    return m;
  }, [initialChampions]);

  // Progression (trouvés)
  const found = revealed.size;
  const totalPlayable = initialChampions.length;

  // Démarrer/mettre à jour le timer selon l’état "paused"
  useEffect(() => {
    if (!paused) {
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  // Pause / Reprendre
  const togglePause = () => setPaused((p) => !p);

  // Réinitialiser TOUT (timer + input + feedback + cartes)
  const resetAll = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setElapsed(0);
    setPaused(false);
    setValue("");
    setLastTry("");
    setLastResult("—");
    setRevealed(new Set());
    inputRef.current?.focus();
  };

  // Validation de l’entrée utilisateur
  const tryReveal = useCallback(
    (raw: string) => {
      const query = norm(raw.trim());
      setLastTry(raw.trim());

      if (!query) {
        setLastResult("⛔ Saisie vide");
        return;
      }

      // a) Match direct
      const direct = index.get(query);
      if (direct) {
        if (!revealed.has(direct.slug)) {
          setRevealed((prev) => new Set(prev).add(direct.slug));
          setLastResult(`✅ ${direct.name} trouvé`);
        } else {
          setLastResult(`ℹ️ ${direct.name} était déjà révélé`);
        }
        return;
      }

      // b) Meilleur match à distance ≤ 1
      let best: ChampionMeta | undefined;
      let bestD = Infinity;
      for (const c of initialChampions) {
        const d = lev(query, norm(c.name));
        if (d < bestD) {
          bestD = d;
          best = c;
          if (d === 0) break;
        }
      }

      if (best && bestD <= 1) {
        if (!revealed.has(best.slug)) {
          setRevealed((prev) => new Set(prev).add(best!.slug));
          setLastResult(`✅ ${best.name} (faute tolérée)`);
        } else {
          setLastResult(`ℹ️ ${best.name} était déjà révélé`);
        }
      } else {
        setLastResult("❌ Aucun champion correspondant");
      }
    },
    [index, revealed, initialChampions],
  );

  const validate = () => {
    if (!value.trim()) return;
    tryReveal(value);
    setValue("");
    inputRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      validate();
    }
  };

  return (
    <div className="space-y-6">
      {/* Ligne d’infos : on pousse tout à droite */}
      <div className="info-row">
        <div /> {/* vide à gauche */}
        <div style={{ marginLeft: "auto", display: "flex", gap: ".5rem", alignItems: "center" }}>
          <div className="badge">Trouvés : {found}/{totalPlayable}</div>
          <div className="badge">⏱ {mm}:{ss}</div>
          <button type="button" onClick={togglePause} title={paused ? "Reprendre" : "Mettre en pause"}>
            {paused ? "Reprendre" : "Pause"}
          </button>
          <button type="button" onClick={resetAll} title="Réinitialiser tout">
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Saisie */}
      <div className="form-row" style={{ display: "flex", gap: ".75rem", alignItems: "center" }}>
        <label htmlFor="championName" className="sr-only">
          Nom du champion
        </label>
        <input
          id="championName"
          name="championName"
          ref={inputRef}
          type="text"
          autoComplete="off"
          placeholder="Tape un nom (ex: Aatrox)…"
          className="w-full md:flex-1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          aria-describedby="rulesHelp"
        />
        <button type="button" onClick={validate}>
          Valider
        </button>
      </div>

      {/* Règles + dernier essai/feedback */}
      <div className="space-y-2">
        <div id="rulesHelp" className="text-sm text-white/80 flex flex-wrap gap-x-3 justify-between">
          <span>Règles : 1 faute tolérée • accents optionnels</span>
          <span>Cartes : {totalPlayable} chargées</span>
        </div>

        <div
          className="panel p-3"
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: ".75rem",
          }}
        >
          <div className="text-sm text-white/80">Dernier essai :</div>
          <div className="text-base" style={{ color: "#fff" }}>
            {lastTry || "—"}
          </div>
          <div className="mt-1 text-sm">{lastResult}</div>
        </div>
      </div>

      {/* Grille des cartes */}
      <div className="cards-grid">
        {initialChampions.map((c) => (
          <ChampionCard key={c.slug} champ={c} isRevealed={revealed.has(c.slug)} />
        ))}
      </div>

      {/* Message fin (optionnel) */}
      {found >= totalPlayable && totalPlayable > 0 && (
        <div
          className="panel p-4 text-center"
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: ".75rem",
          }}
        >
          🎉 GG ! Tu as trouvé les {totalPlayable} champions.
        </div>
      )}
    </div>
  );
}
