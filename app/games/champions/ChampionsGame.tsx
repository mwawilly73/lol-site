// app/games/champions/ChampionsGame.tsx
// (fichier complet avec le sélecteur "Facile")
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

/* ... (toute ta logique norm/lev/aliases inchangée) ... */

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’`´^~\-_.\s]/g, "")
    .replace(/[^a-z0-9]/g, "");
}
function lev(a: string, b: string) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
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
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}
const EXPLICIT_ALIASES: Record<string, string> = {
  monkeyking: "wukong",
  wukong: "wukong",
  maitreyi: "masteryi",
  masteryi: "masteryi",
  jarvan: "jarvaniv",
  jarvan4: "jarvaniv",
  jarvaniv: "jarvaniv",
  leblanc: "leblanc",
  ksante: "ksante",
};
function stripTrailingNumber(s: string) {
  const m = s.match(/^(.*?)(\d+)$/);
  return m ? m[1] : s;
}
function aliasKeysForChampion(c: ChampionMeta): string[] {
  const keys = new Set<string>();
  const nName = norm(c.name);
  if (nName) keys.add(nName);
  if (EXPLICIT_ALIASES[nName]) keys.add(EXPLICIT_ALIASES[nName]);
  const rawTokens = (c.name || "")
    .split(/[^A-Za-z0-9]+/g)
    .map((t) => norm(t))
    .filter((t) => t && t.length >= 3);
  for (const t of rawTokens) keys.add(t);
  if (nName === "jarvaniv") {
    keys.add("jarvan");
    keys.add("jarvan4");
  }
  if (nName === "masteryi") keys.add("maitreyi");
  if (nName === "wukong") keys.add("monkeyking");
  if (nName === "monkeyking") keys.add("wukong");
  return Array.from(keys);
}
function buildLookup(champions: ChampionMeta[]) {
  const lookup = new Map<string, ChampionMeta>();
  const shortKeys = new Set<string>();
  for (const c of champions) {
    const keys = aliasKeysForChampion(c);
    for (const k of keys) {
      lookup.set(k, c);
      if (k.length >= 2 && k.length <= 3) shortKeys.add(k);
    }
  }
  return { lookup, shortKeys };
}

type Props = {
  initialChampions: ChampionMeta[];
  targetTotal: number;
};

export default function ChampionsGame({ initialChampions, targetTotal }: Props) {
  // Cartes trouvées (par slug)
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  // Saisie + feedback
  const [value, setValue] = useState("");
  const [lastTry, setLastTry] = useState<string>("");
  const [lastResult, setLastResult] = useState<string>("—");
  const inputRef = useRef<HTMLInputElement>(null);

  // Timer
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 🔀 Mode Facile (aperçu flouté) vs Normal (aucune image avant découverte)
  const [easyMode, setEasyMode] = useState(false);

  // Indexes (lookup + petites clés)
  const { lookup, shortKeys } = useMemo(
    () => buildLookup(initialChampions),
    [initialChampions]
  );

  const found = revealed.size;
  const totalPlayable = initialChampions.length;

  // Timer
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

  const togglePause = () => setPaused((p) => !p);

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

  // Essai de révélation
  const tryReveal = useCallback(
    (raw: string) => {
      const q = norm(raw.trim());
      setLastTry(raw.trim());

      if (!q) {
        setLastResult("⛔ Saisie vide");
        return;
      }

      // 1) Direct match
      const direct = lookup.get(q);
      if (direct) {
        if (!revealed.has(direct.slug)) {
          setRevealed((prev) => new Set(prev).add(direct.slug));
          setLastResult(`✅ ${direct.name} trouvé`);
        } else {
          setLastResult(`ℹ️ ${direct.name} était déjà révélé`);
        }
        return;
      }

      // 2) Fuzzy (tolérance selon taille requête)
      const threshold = q.length >= 4 ? 1 : 0;
      if (threshold === 0) {
        setLastResult("❌ Aucun champion correspondant");
        return;
      }

      // 3) Meilleur candidat (évite cibles à clé courte)
      let best: ChampionMeta | undefined;
      let bestD = Infinity;

      for (const [key, champ] of lookup) {
        if (shortKeys.has(key)) continue;
        const d = lev(q, key);
        if (d < bestD) {
          bestD = d;
          best = champ;
          if (d === 0) break;
        }
      }

      if (best && bestD <= threshold) {
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
    [lookup, revealed, shortKeys]
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

  // UI: petit switch "Facile" avec bulle qui glisse
  const Switch = (
    <button
      type="button"
      onClick={() => setEasyMode((v) => !v)}
      className="relative inline-flex h-6 w-12 items-center rounded-full border border-white/15 bg-white/10 transition focus:outline-none"
      role="switch"
      aria-checked={easyMode}
      aria-label="Activer le mode Facile"
      title={`Facile : ${easyMode ? "Oui" : "Non"}`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
          easyMode ? "translate-x-6" : "translate-x-0"
        }`}
      />
      <span className="sr-only">Facile</span>
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Ligne d’infos */}
      <div className="info-row flex items-center gap-3">
        {/* Switch Facile */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/70">Facile</span>
          {Switch}
          <span className="text-sm text-white/70">{easyMode ? "Oui" : "Non"}</span>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: ".5rem", alignItems: "center" }}>
          <div className="badge">Trouvés : {found}/{totalPlayable}</div>
          <div className="badge">🎯 Objectif : {targetTotal}</div>
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
        <label htmlFor="championName" className="sr-only">Nom du champion</label>
        <input
          id="championName"
          name="championName"
          ref={inputRef}
          type="text"
          autoComplete="off"
          placeholder="Tape un nom (ex: Nunu, Willump, Renata, Glasc, Jarvan...)"
          className="w-full md:flex-1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          aria-describedby="rulesHelp"
        />
        <button type="button" onClick={validate}>Valider</button>
      </div>

      {/* Règles + feedback */}
      <div className="space-y-2">
        <div id="rulesHelp" className="text-sm text-white/80 flex flex-wrap gap-x-3 justify-between">
          <span>
            Règles : 1 faute tolérée (≥ 4 lettres) • accents/espaces/apostrophes ignorés •
          </span>
          <span>Cartes : {totalPlayable} chargées</span>
        </div>

        <div className="panel p-3" style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: ".75rem" }}>
          <div className="text-sm text-white/80">Dernier essai :</div>
          <div className="text-base" style={{ color: "#fff" }}>{lastTry || "—"}</div>
          <div className="mt-1 text-sm">{lastResult}</div>
        </div>
      </div>

      {/* Grille des cartes : image visible en mode Facile (floutée), sinon invisible.
          -> on transmet previewMode="blur" en Facile et "none" en Normal */}
      <div className="cards-grid grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {initialChampions.map((c) => (
          <ChampionCard
            key={c.slug}
            champion={c}
            isRevealed={revealed.has(c.slug)}
            previewMode={easyMode ? "blur" : "none"}
          />
        ))}
      </div>

      {/* Fin */}
      {found >= totalPlayable && totalPlayable > 0 && (
        <div className="panel p-4 text-center" style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: ".75rem" }}>
          🎉 GG ! Tu as tout trouvé.
        </div>
      )}
    </div>
  );
}
