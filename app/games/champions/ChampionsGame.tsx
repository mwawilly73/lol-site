// app/games/champions/ChampionsGame.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Jeu des champions avec :
//  - matching intelligent (accents/espaces ignorés, alias, Levenshtein)
//  - HEADER PLEIN (non-sticky) en haut
//  - BARRE COMPACTE FIXE (overlay) qui s'affiche UNIQUEMENT après le header
//    => pas de changement de hauteur collé au top, donc pas de saccade
//  - barre compacte : cadre arrondi, très transparente, blur
//  - progress bar translucide, switch coloré, timer stable (tabular-nums)
//  - champ de saisie + bouton Valider toujours accessibles dans la barre compacte
//  - grille de cartes : preview flou (mode Facile) ou aucune image (mode Normal)
//  - bouton ▲ pour remonter
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  KeyboardEvent,
} from "react";
import type { ChampionMeta } from "@/lib/champions";
import ChampionCard from "@/components/ChampionCard";

/* ------------------ 1) Normalisation agressive ------------------ */
function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")      // accents
    .replace(/['’`´^~\-_.\s]/g, "")       // séparateurs mous
    .replace(/[^a-z0-9]/g, "");           // garde a-z0-9
}

/* ------------------ 2) Levenshtein (secours) ------------------ */
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

/* ------------------ 3) Alias explicites ------------------ */
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

/* ------------------ 4) Clés par champion (nom + tokens + cas spé) ------------------ */
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

  if (nName === "jarvaniv") { keys.add("jarvan"); keys.add("jarvan4"); }
  if (nName === "masteryi") keys.add("maitreyi");
  if (nName === "wukong") keys.add("monkeyking");
  if (nName === "monkeyking") keys.add("wukong");

  return Array.from(keys);
}

/* ------------------ 5) Index de recherche ------------------ */
function buildLookup(champions: ChampionMeta[]) {
  const lookup = new Map<string, ChampionMeta>();
  const shortKeys = new Set<string>(); // ex: "vi", "jax", "lux", "zed"
  for (const c of champions) {
    const keys = aliasKeysForChampion(c);
    for (const k of keys) {
      lookup.set(k, c);
      if (k.length >= 2 && k.length <= 3) shortKeys.add(k);
    }
  }
  return { lookup, shortKeys };
}

/* ------------------ 6) Props ------------------ */
type Props = {
  initialChampions: ChampionMeta[];
  targetTotal: number;
};

/* ================================================================== */

export default function ChampionsGame({ initialChampions, targetTotal }: Props) {
  // État des cartes trouvées (par slug)
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  // Champ de saisie
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Feedback dernier essai
  const [lastTry, setLastTry] = useState<string>("");
  const [lastResult, setLastResult] = useState<string>("—");

  // Timer
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 🔀 Mode Facile (aperçu flouté) vs Normal (aucune image avant découverte)
  const [easyMode, setEasyMode] = useState(false);

  // 📍 Seuil d’apparition de la barre compacte (bas du header plein)
  const headerEndRef = useRef<HTMLDivElement | null>(null);
  const [showCompactBar, setShowCompactBar] = useState(false);
  const headerEndY = useRef(0);

  // Mesure du bas du header "plein"
  useLayoutEffect(() => {
    const measure = () => {
      const el = headerEndRef.current;
      if (!el) return;
      // Position absolue (du document) du "bas" du header plein
      const rect = el.getBoundingClientRect();
      headerEndY.current = Math.floor(rect.top + window.scrollY);
      setShowCompactBar(window.scrollY >= headerEndY.current);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Suivi du scroll (stable, amorti)
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const visible = window.scrollY >= headerEndY.current;
        setShowCompactBar((prev) => (prev !== visible ? visible : prev));
        ticking = false;
      });
    };
    onScroll(); // sync initial (si revisite avec scroll)
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Indexes de recherche
  const { lookup, shortKeys } = useMemo(
    () => buildLookup(initialChampions),
    [initialChampions]
  );

  const found = revealed.size;
  const totalPlayable = initialChampions.length;
  const progress = totalPlayable > 0 ? (found / totalPlayable) * 100 : 0;

  /* ------------------ Timer ------------------ */
  useEffect(() => {
    if (!paused) {
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ------------------ Validation ------------------ */
  const tryReveal = useCallback(
    (raw: string) => {
      const q = norm(raw.trim());
      setLastTry(raw.trim());

      if (!q) { setLastResult("⛔ Saisie vide"); return; }

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

      // 2) Fuzzy
      const threshold = q.length >= 4 ? 1 : 0;
      if (threshold === 0) { setLastResult("❌ Aucun champion correspondant"); return; }

      // 3) Meilleur candidat (évite cibles à clé courte)
      let best: ChampionMeta | undefined;
      let bestD = Infinity;
      for (const [key, champ] of lookup) {
        if (shortKeys.has(key)) continue;
        const d = lev(q, key);
        if (d < bestD) { bestD = d; best = champ; if (d === 0) break; }
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
    if (e.key === "Enter") { e.preventDefault(); validate(); }
  };

  /* ================================================================== */
  /* ============================== RENDU ============================== */
  /* ================================================================== */

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────
          HEADER PLEIN (non-sticky) : propre, sans gros cadre noir
          ───────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 pt-4">
        {/* Progress + switch + timer + actions */}
        <div className="rounded-2xl ring-1 ring-white/5 bg-black/10 backdrop-blur-sm px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Progression */}
            <div className="flex-1">
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-600 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                  aria-label="Progression"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progress)}
                  role="progressbar"
                />
              </div>
              <div className="mt-1 text-xs text-white/70">
                Trouvés : <span className="font-mono [font-variant-numeric:tabular-nums]">{found}</span>/
                <span className="font-mono [font-variant-numeric:tabular-nums]">{totalPlayable}</span>
                {" — "}Objectif : <span className="font-mono [font-variant-numeric:tabular-nums]">{targetTotal}</span>
              </div>
            </div>

            {/* Switch Facile/Normal */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/80">Mode :</span>
              <button
                type="button"
                onClick={() => setEasyMode((v) => !v)}
                className={`relative inline-flex h-8 w-16 items-center rounded-full border transition-colors duration-300 focus:outline-none
                  ${easyMode ? "bg-green-500/90 border-green-400/80" : "bg-rose-500/90 border-rose-400/80"}
                `}
                role="switch"
                aria-checked={easyMode}
                aria-label="Activer le mode Facile"
                title={`Facile : ${easyMode ? "Oui" : "Non"}`}
              >
                <span
                  className={`absolute left-1 top-1 h-6 w-6 bg-white rounded-full shadow-md transform transition-transform duration-300
                    ${easyMode ? "translate-x-8" : ""}
                  `}
                />
                <span className="sr-only">Facile</span>
              </button>
              <span className={`text-sm font-medium ${easyMode ? "text-green-300" : "text-rose-300"}`}>
                {easyMode ? "Facile" : "Normal"}
              </span>
            </div>

            {/* Timer + actions */}
            <div className="flex items-center gap-2">
              <div
                className="rounded px-2 py-1 text-white/90 bg-white/10"
                style={{ minWidth: 84, textAlign: "center" }}
              >
                <span className="font-mono [font-variant-numeric:tabular-nums]">⏱ {mm}:{ss}</span>
              </div>
              <button
                type="button"
                onClick={togglePause}
                title={paused ? "Reprendre" : "Mettre en pause"}
                className="px-3 py-1.5 rounded-md bg-gray-700/70 hover:bg-gray-600/70 text-white"
              >
                {paused ? "Reprendre" : "Pause"}
              </button>
              <button
                type="button"
                onClick={resetAll}
                title="Réinitialiser tout"
                className="px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white"
              >
                Réinitialiser
              </button>
            </div>
          </div>

          {/* Champ + règles + feedback */}
          <div className="mt-3 flex gap-3 items-center">
            <label htmlFor="championName" className="sr-only">Nom du champion</label>
            <input
              id="championName"
              name="championName"
              ref={inputRef}
              type="text"
              autoComplete="off"
              placeholder="Tape un nom ( ex: Baron Nashor , Rift Herald ... )"
              className="w-full px-3 py-2 rounded-md border border-white/10 bg-black/15 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKeyDown}
              aria-describedby="rulesHelp"
            />
            <button
              type="button"
              onClick={validate}
              className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
            >
              Valider
            </button>
          </div>

          <div className="mt-2 text-sm text-white/80 flex flex-wrap gap-x-3 justify-between" id="rulesHelp">
            <span>Règles : 1 faute tolérée (≥ 4 lettres) • accents/espaces/apostrophes ignorés •</span>
            <span>Cartes : {totalPlayable} chargées</span>
          </div>
          <div className="mt-2 p-3 rounded-md border border-white/5 bg-white/5">
            <div className="text-sm text-white/80">Dernier essai :</div>
            <div className="text-base text-white">{lastTry || "—"}</div>
            <div className="mt-1 text-sm">{lastResult}</div>
          </div>
        </div>

        {/* SENTINEL : position de bas du header plein */}
        <div ref={headerEndRef} className="h-px" aria-hidden="true" />
      </div>

      {/* ─────────────────────────────────────────────────────────
          BARRE COMPACTE FIXE (overlay) — s'affiche uniquement après le header
          - arrondie, très transparente, blur, centrée
         ───────────────────────────────────────────────────────── */}
      <div
        className={`fixed top-2 left-0 right-0 z-40 px-2 sm:px-4 transition-opacity duration-200
          ${showCompactBar ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
        style={{ willChange: "opacity, transform" }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl ring-1 ring-white/10 bg-black/20 backdrop-blur-md shadow-lg">
            <div className="px-3 py-2">
              <div className="flex items-center gap-3">
                {/* Progress mini */}
                <div className="flex-1">
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-emerald-600 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                      aria-label="Progression"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(progress)}
                      role="progressbar"
                    />
                  </div>
                </div>

                {/* Switch compact */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEasyMode((v) => !v)}
                    className={`relative inline-flex h-6 w-12 items-center rounded-full border transition-colors duration-300 focus:outline-none
                      ${easyMode ? "bg-green-500/90 border-green-400/80" : "bg-rose-500/90 border-rose-400/80"}
                    `}
                    role="switch"
                    aria-checked={easyMode}
                    aria-label="Activer le mode Facile"
                    title={`Facile : ${easyMode ? "Oui" : "Non"}`}
                  >
                    <span
                      className={`absolute left-1 top-1 h-4 w-4 bg-white rounded-full shadow-md transform transition-transform duration-300
                        ${easyMode ? "translate-x-6" : ""}
                      `}
                    />
                    <span className="sr-only">Facile</span>
                  </button>
                  <span className={`text-xs font-medium ${easyMode ? "text-green-300" : "text-rose-300"}`} style={{ width: 48, textAlign: "center" }}>
                    {easyMode ? "Facile" : "Normal"}
                  </span>
                </div>

                {/* Timer compact + pause */}
                <div className="flex items-center gap-2">
                  <div
                    className="rounded px-2 py-1 text-white/90 bg-white/10"
                    style={{ minWidth: 70, textAlign: "center" }}
                  >
                    <span className="font-mono [font-variant-numeric:tabular-nums]">⏱ {mm}:{ss}</span>
                  </div>
                  <button
                    type="button"
                    onClick={togglePause}
                    title={paused ? "Reprendre" : "Mettre en pause"}
                    className="px-2 py-1 rounded-md bg-gray-700/70 hover:bg-gray-600/70 text-white"
                  >
                    {paused ? "▶" : "⏸"}
                  </button>
                </div>
              </div>

              {/* Champ + Valider (compact) */}
              <div className="mt-2 flex gap-2 items-center">
                <label htmlFor="championName-compact" className="sr-only">Nom du champion</label>
                <input
                  id="championName-compact"
                  name="championName-compact"
                  type="text"
                  autoComplete="off"
                  placeholder="Tape un nom ( ex: Baron Nashor , Rift Herald ... )"
                  className="w-full rounded-md border border-white/10 bg-black/15 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 px-3 py-1.5 text-sm"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); validate(); }
                  }}
                />
                <button
                  type="button"
                  onClick={validate}
                  className="px-3 py-1.5 text-sm rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Valider
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          GRILLE DES CARTES
         ───────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {initialChampions.map((c) => (
            <ChampionCard
              key={c.slug}
              champion={c}
              isRevealed={revealed.has(c.slug)}
              previewMode={easyMode ? "blur" : "none"}
            />
          ))}
        </div>
      </div>

      {/* FIN */}
      {found >= totalPlayable && totalPlayable > 0 && (
        <div className="panel p-4 text-center mx-auto max-w-6xl">
          🎉 GG ! Tu as tout trouvé.
        </div>
      )}

      {/* Bouton ▲ pour remonter */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg z-40"
        title="Remonter en haut"
        aria-label="Remonter en haut"
      >
        ▲
      </button>
    </div>
  );
}
