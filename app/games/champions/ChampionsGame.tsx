// app/games/champions/ChampionsGame.tsx
// Mobile-first + double-barre stable (header plein + barre compacte fixed).
// Validation: focus ciblé + preventScroll (ne remonte jamais la page).
// Win overlay centré + timer stoppé à la victoire.
// Tolérance alias spé pour noms difficiles (Shyvana, Qiyana, Taliyah, Tryndamere, Xin Zhao, Tahm Kench).
// ─────────────────────────────────────────────────────────────────────────────
// DEMO: Tous les blocs “mode démo (Simuler victoire)” sont **commentés** mais
//       conservés. Pour réactiver, supprime les commentaires des sections
//       repérées par “// DEMO:” ci-dessous.
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";
// DEMO: importer si tu réactives le paramètre d’URL ?win=1&t=SECONDES
// import { useSearchParams } from "next/navigation";

import type { ChampionMeta } from "@/lib/champions";
import ChampionCard from "@/components/ChampionCard";

/* ------------------------------ Utils ------------------------------ */
// Normalisation agressive pour matcher les noms
function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’`´^~\-_.\s]/g, "")
    .replace(/[^a-z0-9]/g, "");
}
// Levenshtein (secours)
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

/* ------------------------- Alias explicites ------------------------ */
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

/* Fautes usuelles par champion (après norm()) */
const SPECIAL_ALIASES_BY_CANON: Record<string, string[]> = {
  shyvana: ["shivana", "shyvanna", "shivanna", "shyvana"],
  qiyana: ["qiana", "quiana", "kiyana", "kiana", "qiyanna", "qyiana"],
  taliyah: ["talia", "taliya", "talya", "talyah"],
  tryndamere: ["trindamer", "trindamere", "trynda", "trynd", "tryndam"],
  xinzhao: ["xinzao", "xinzaho"],
  tahmkench: ["tahmken", "tamkench", "tahmkenh", "tahmkench"],
  kassadin: ["kasadin"],
  katarina: ["katarena", "katarine"],
  velkoz: ["velcoz", "velkoz"],
};

/* ---------------------- Clés par champion -------------------------- */
function aliasKeysForChampion(c: ChampionMeta): string[] {
  const keys = new Set<string>();
  const nName = norm(c.name);

  if (nName) keys.add(nName);
  if (EXPLICIT_ALIASES[nName]) keys.add(EXPLICIT_ALIASES[nName]);

  (c.name || "")
    .split(/[^A-Za-z0-9]+/g)
    .map((t) => norm(t))
    .filter((t) => t && t.length >= 3)
    .forEach((t) => keys.add(t));

  if (nName === "jarvaniv") { keys.add("jarvan"); keys.add("jarvan4"); }
  if (nName === "masteryi") keys.add("maitreyi");
  if (nName === "wukong") keys.add("monkeyking");
  if (nName === "monkeyking") keys.add("wukong");

  const extras = SPECIAL_ALIASES_BY_CANON[nName];
  if (extras) extras.forEach((a) => keys.add(a));

  return Array.from(keys);
}

/* ------------------------- Index de recherche ---------------------- */
function buildLookup(champions: ChampionMeta[]) {
  const lookup = new Map<string, ChampionMeta>();
  const shortKeys = new Set<string>(); // "vi","jax",...
  for (const c of champions) {
    for (const k of aliasKeysForChampion(c)) {
      lookup.set(k, c);
      if (k.length >= 2 && k.length <= 3) shortKeys.add(k);
    }
  }
  return { lookup, shortKeys };
}

/* ----------------------------- Props -------------------------------- */
type Props = {
  initialChampions: ChampionMeta[];
  targetTotal: number;
};

/* ============================ Composant ============================= */
export default function ChampionsGame({ initialChampions, targetTotal }: Props) {
  // DEMO: si tu réactives le bouton DEV ou ?win=1, tu peux aussi remettre isDev et useSearchParams
  // const isDev = process.env.NODE_ENV !== "production";
  // const searchParams = useSearchParams();

  // ÉTATS DE JEU
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [value, setValue] = useState("");

  // Inputs (header plein & barre compacte)
  const headerInputRef = useRef<HTMLInputElement>(null);
  const compactInputRef = useRef<HTMLInputElement>(null);

  const [lastTry, setLastTry] = useState<string>("");
  const [lastResult, setLastResult] = useState<string>("—");

  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [easyMode, setEasyMode] = useState(false);

  // DEMO: badge “Mode démo”
  // const [isDemo, setIsDemo] = useState(false);

  // Barre compacte visible après avoir scrollé
  const headerEndRef = useRef<HTMLDivElement | null>(null);
  const [showCompactBar, setShowCompactBar] = useState(false);
  const headerEndY = useRef(0);

  /* -------- Mesure du bas du header plein + scroll performant ------- */
  useLayoutEffect(() => {
    const measure = () => {
      const el = headerEndRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      headerEndY.current = Math.floor(rect.top + window.scrollY);
      setShowCompactBar(window.scrollY >= headerEndY.current);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
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
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* -------------------- Index de recherche en mémo ------------------- */
  const { lookup, shortKeys } = useMemo(
    () => buildLookup(initialChampions),
    [initialChampions]
  );

  /* -------------------------- Progression --------------------------- */
  const found = revealed.size;
  const totalPlayable = initialChampions.length;
  const progress = totalPlayable > 0 ? (found / totalPlayable) * 100 : 0;

  /* ----------------------------- Timer ------------------------------ */
  useEffect(() => {
    if (!paused) {
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paused]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  const togglePause = () => setPaused((p) => !p);

  const resetAll = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setElapsed(0);
    setPaused(false);
    setValue("");
    setLastTry("");
    setLastResult("—");
    setRevealed(new Set());
    // setIsDemo(false); // DEMO
    window.scrollTo({ top: 0, behavior: "smooth" });
    headerInputRef.current?.focus({ preventScroll: true });
  };

  /* ---------------------------- Validation -------------------------- */
  const tryReveal = useCallback(
    (raw: string) => {
      const q = norm(raw.trim());
      setLastTry(raw.trim());

      if (!q) { setLastResult("⛔ Saisie vide"); return; }

      // 1) Direct
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

      // 2) Fuzzy (tolère 1 faute si saisie >= 4)
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

  // from = "header" | "compact"
  const validate = (from?: "header" | "compact") => {
    if (!value.trim()) return;
    tryReveal(value);
    setValue("");

    // focus sans scroll sur l'input visible
    const wantCompact = from === "compact" || showCompactBar;
    const target = wantCompact ? compactInputRef.current : headerInputRef.current;
    if (target?.focus) {
      try { target.focus({ preventScroll: true }); }
      catch { target.focus(); }
    }
  };

  const onKeyDownHeader = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); validate("header"); }
  };
  const onKeyDownCompact = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); validate("compact"); }
  };

  /* -------------------------- MODE DÉMO WIN ------------------------- */
  // DEMO: fonction de simulation
  // const debugWin = useCallback((elapsedSeconds: number = 321) => {
  //   const all = new Set(initialChampions.map((c) => c.slug));
  //   setRevealed(all);
  //   setElapsed(Math.max(0, Math.floor(elapsedSeconds)));
  //   setPaused(true);
  //   setLastTry("—");
  //   setLastResult("🎯 Mode démo : victoire simulée");
  //   setIsDemo(true);
  // }, [initialChampions]);

  // DEMO: ?win=1 (&t=SECONDES)
  // useEffect(() => {
  //   if (searchParams?.get("win") === "1") {
  //     const tRaw = searchParams.get("t");
  //     const t = tRaw != null && !Number.isNaN(Number(tRaw)) ? Math.max(0, parseInt(tRaw!, 10)) : 285;
  //     debugWin(t);
  //   }
  // }, [searchParams, debugWin]);

  // DEMO: Raccourci clavier Ctrl/Cmd + Shift + W
  // useEffect(() => {
  //   const handler = (e: any) => {
  //     const isAccel = e.ctrlKey || e.metaKey;
  //     if (isAccel && e.shiftKey && (e.key === "w" || e.key === "W")) {
  //       e.preventDefault();
  //       debugWin(); // 321s par défaut
  //     }
  //   };
  //   window.addEventListener("keydown", handler, { passive: false } as any);
  //   return () => window.removeEventListener("keydown", handler as any);
  // }, [debugWin]);

  /* ----------------------- Victoire & overlay ----------------------- */
  const hasWon = found >= totalPlayable && totalPlayable > 0;
  useEffect(() => {
    if (hasWon) setPaused(true); // stoppe le timer sur vraie victoire
  }, [hasWon]);

  /* ================================ UI =============================== */
  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* ===== HEADER PLEIN (non-sticky) ===== */}
      <div className="mx-auto max-w-6xl px-3 sm:px-4 pt-4">
        <div className="rounded-2xl ring-1 ring-white/5 bg-black/10 backdrop-blur-sm px-3 sm:px-4 py-3">
          {/* Progress */}
          <div className="min-w-0">
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-emerald-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
                aria-label="Progression"
              />
            </div>
            <div className="mt-1 text-[11px] sm:text-xs text-white/70 truncate">
              Trouvés : <span className="font-mono [font-variant-numeric:tabular-nums]">{found}</span>/
              <span className="font-mono [font-variant-numeric:tabular-nums]">{totalPlayable}</span>
              {" — "}Objectif : <span className="font-mono [font-variant-numeric:tabular-nums]">{targetTotal}</span>
            </div>
          </div>

          {/* Switch + Timer + Actions */}
          <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
            {/* Switch */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline text-sm text-white/80">Mode :</span>
              <button
                type="button"
                onClick={() => setEasyMode((v) => !v)}
                className={`relative inline-flex h-7 w-14 sm:h-8 sm:w-16 items-center rounded-full border transition-colors duration-300 focus:outline-none
                  ${easyMode ? "bg-green-500/90 border-green-400/80" : "bg-rose-500/90 border-rose-400/80"}
                `}
                role="switch"
                aria-checked={easyMode}
                aria-label="Activer le mode Facile"
                title={`Facile : ${easyMode ? "Oui" : "Non"}`}
              >
                <span
                  className={`absolute left-1 top-1 bg-white rounded-full shadow-md transform transition-transform duration-300
                    h-5 w-5 sm:h-6 sm:w-6 ${easyMode ? "translate-x-7 sm:translate-x-8" : "" }
                  `}
                />
                <span className="sr-only">Facile</span>
              </button>
              <span className={`text-xs sm:text-sm font-medium ${easyMode ? "text-green-300" : "text-rose-300"}`}>
                {easyMode ? "Facile" : "Normal"}
              </span>
            </div>

            {/* Timer + actions */}
            <div className="flex items-center gap-2 sm:gap-2 ml-auto shrink-0">
              <div
                className="rounded px-2 py-1 text-white/90 bg-white/10"
                style={{ width: 84, textAlign: "center" }}
              >
                <span className="font-mono [font-variant-numeric:tabular-nums] text-xs sm:text-sm">⏱ {mm}:{ss}</span>
              </div>
              <button
                type="button"
                onClick={togglePause}
                title={paused ? "Reprendre" : "Mettre en pause"}
                className="px-2 sm:px-3 py-1.5 rounded-md bg-gray-700/70 hover:bg-gray-600/70 text-white text-xs sm:text-sm"
              >
                {paused ? "Reprendre" : "Pause"}
              </button>
              <button
                type="button"
                onClick={resetAll}
                title="Réinitialiser tout"
                className="px-2 sm:px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm"
              >
                Réinitialiser
              </button>

              {/* DEMO: Bouton DEV “Simuler victoire” */}
              {/*
              {isDev && (
                <button
                  type="button"
                  onClick={() => debugWin()}
                  className="px-2 sm:px-3 py-1.5 rounded-md border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs sm:text-sm"
                  title="Simuler une victoire (Ctrl/Cmd + Shift + W) ou via ?win=1&t=SECONDES"
                >
                  Simuler victoire
                </button>
              )}
              */}
            </div>
          </div>

          {/* Input + Valider */}
          <div className="mt-3 flex items-stretch gap-2 sm:gap-3 min-w-0">
            <label htmlFor="championName" className="sr-only">Nom du champion</label>
            <input
              id="championName"
              ref={headerInputRef}
              type="text"
              autoComplete="off"
              placeholder="Tape un nom ( ex: Baron Nashor , Rift Herald ... )"
              className="w-full min-w-0 px-3 py-2 rounded-md border border-white/10 bg-black/15 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKeyDownHeader}
              aria-describedby="rulesHelp"
            />
            <button
              type="button"
              onClick={() => validate("header")}
              className="px-3 sm:px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm sm:text-base shrink-0"
            >
              Valider
            </button>
          </div>

          {/* Règles + feedback */}
          <div className="mt-2 text-xs sm:text-sm text-white/80 flex flex-wrap gap-x-3 justify-between" id="rulesHelp">
            <span className="truncate">Règles : 1 faute tolérée (≥ 4 lettres) • accents/espaces/apostrophes ignorés •</span>
            <span className="shrink-0">Cartes : {totalPlayable} chargées</span>
          </div>
          <div className="mt-2 p-3 rounded-md border border-white/5 bg-white/5">
            <div className="text-xs sm:text-sm text-white/80">Dernier essai :</div>
            <div className="text-sm sm:text-base text-white truncate">{lastTry || "—"}</div>
            <div className="mt-1 text-xs sm:text-sm">{lastResult}</div>
          </div>
        </div>

        {/* SENTINEL : bas du header plein */}
        <div ref={headerEndRef} className="h-px" aria-hidden="true" />
      </div>

      {/* ===== BARRE COMPACTE FIXE (overlay) ===== */}
      <div
        className={`fixed top-[max(0.5rem,env(safe-area-inset-top))] left-0 right-0 z-40 px-2 sm:px-4 transition-opacity duration-200
          ${showCompactBar ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      >
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl ring-1 ring-white/10 bg-black/20 backdrop-blur-md shadow-lg">
            <div className="px-3 sm:px-4 py-2">
              {/* Progress mini */}
              <div className="min-w-0">
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-600 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progress)}
                    aria-label="Progression"
                  />
                </div>
              </div>

              {/* Switch + Timer */}
              <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
                <div className="flex items-center gap-2 shrink-0">
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

                <div className="flex items-center gap-2 ml-auto shrink-0">
                  <div
                    className="rounded px-2 py-1 text-white/90 bg-white/10"
                    style={{ width: 70, textAlign: "center" }}
                  >
                    <span className="font-mono [font-variant-numeric:tabular-nums] text-xs">⏱ {mm}:{ss}</span>
                  </div>
                  <button
                    type="button"
                    onClick={togglePause}
                    title={paused ? "Reprendre" : "Mettre en pause"}
                    className="px-2 py-1 rounded-md bg-gray-700/70 hover:bg-gray-600/70 text-white text-xs"
                  >
                    {paused ? "▶" : "⏸"}
                  </button>
                </div>
              </div>

              {/* Input + Valider compacts */}
              <div className="mt-2 flex items-stretch gap-2 min-w-0">
                <label htmlFor="championName-compact" className="sr-only">Nom du champion</label>
                <input
                  id="championName-compact"
                  ref={compactInputRef}
                  type="text"
                  autoComplete="off"
                  placeholder="Tape un nom ( ex: Baron Nashor , Rift Herald ... )"
                  className="w/full min-w-0 rounded-md border border-white/10 bg-black/15 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 px-3 py-1.5 text-sm"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={onKeyDownCompact}
                />
                <button
                  type="button"
                  onClick={() => validate("compact")}
                  className="px-3 py-1.5 text-sm rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shrink-0"
                >
                  Valider
                </button>
              </div>

              {/* Dernier essai — compact */}
              <div className="mt-2 rounded-md border border-white/10 bg-white/5 px-2 py-1.5" aria-live="polite">
                <div className="text-[11px] text-white/70">Dernier essai :</div>
                <div className="text-xs sm:text-sm text-white truncate" title={lastTry || "—"}>
                  {lastTry || "—"}
                </div>
                <div className="mt-0.5 text-[11px] sm:text-xs">{lastResult}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== GRILLE DES CARTES ===== */}
      <div className="mx-auto max-w-6xl px-3 sm:px-4">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
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

      {/* 🏁 OVERLAY DE FIN (centré, responsive) */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center px-3 sm:px-4 transition-opacity duration-200
          ${hasWon ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
        aria-hidden={!hasWon}
        role="dialog"
        aria-modal="true"
        aria-label="Fin de partie"
      >
        {/* Fond assombri + blur */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        {/* Panneau */}
        <div className="relative w-full max-w-md rounded-2xl ring-1 ring-white/10 bg-gray-900 text-white shadow-2xl p-5 sm:p-6 text-center">
          {/* DEMO: Badge “Mode démo” */}
          {/*
          {isDemo && (
            <div className="absolute -top-2 right-4">
              <span className="inline-flex items-center rounded-full bg-amber-500/90 text-black text-[11px] font-semibold px-2 py-0.5 shadow">
                Mode démo
              </span>
            </div>
          )}
          */}
          <div className="text-3xl sm:text-4xl">🎉</div>
          <h2 className="mt-2 text-xl sm:text-2xl font-bold">Félicitations !</h2>
          <p className="mt-2 text-sm sm:text-base text-white/90">
            Tu as trouvé tous les{" "}
            <span className="font-semibold">{totalPlayable}</span>{" "}
            champions en{" "}
            <span className="font-semibold">
              {minutes}min/{String(seconds).padStart(2, "0")}sec
            </span>.
          </p>

          {/* Bouton rejouer */}
          <div className="mt-4">
            <button
              type="button"
              onClick={resetAll}
              className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
            >
              Rejouer
            </button>
          </div>
        </div>
      </div>

      {/* Bouton ▲ remonter */}
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
