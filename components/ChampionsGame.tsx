// app/games/champions/ChampionsGame.tsx
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";
import type { ChampionMeta } from "@/lib/champions";
import ChampionCard from "@/components/ChampionCard";
import { getChampionLoreFromCDN } from "@/lib/ddragon";

/* ------------------------------ Utils ------------------------------ */
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
  const shortKeys = new Set<string>();
  for (const c of champions) {
    for (const k of aliasKeysForChampion(c)) {
      lookup.set(k, c);
      if (k.length >= 2 && k.length <= 3) shortKeys.add(k);
    }
  }
  return { lookup, shortKeys };
}

/* ----------------------- Helpers Indice visuel --------------------- */
function revealName(name: string, lettersToShow: number) {
  if (lettersToShow <= 0) return name.replace(/[A-Za-zÀ-ÖØ-öø-ÿ]/g, "•");
  let left = lettersToShow;
  const chars = Array.from(name);
  return chars
    .map((ch) => {
      if (/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(ch)) {
        if (left > 0) { left -= 1; return ch; }
        return "•";
      }
      return ch;
    })
    .join("");
}
function countLetters(name: string) {
  return (name.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/g) || []).length;
}

/* ----------------------------- Props -------------------------------- */
type Props = {
  initialChampions: ChampionMeta[];
  targetTotal: number;
};

/* ============================ Composant ============================= */
export default function ChampionsGame({ initialChampions, targetTotal }: Props) {
  // ÉTATS
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [value, setValue] = useState("");

  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [hintBySlug, setHintBySlug] = useState<Record<string, number>>({});

  const headerInputRef = useRef<HTMLInputElement>(null);
  const compactInputRef = useRef<HTMLInputElement>(null); // gardé si réutilisé
  const padInputRef = useRef<HTMLInputElement>(null);     // input du panneau

  const [lastTry, setLastTry] = useState<string>("");
  const [lastResult, setLastResult] = useState<string>("—");

  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [easyMode, setEasyMode] = useState(false);

  // Sticky progress (via IntersectionObserver)
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [compactProgress, setCompactProgress] = useState(0); // 0 ou 1 (binaire)

  const panelRef = useRef<HTMLDivElement | null>(null);

  // Lore cache
  const [loreBySlug, setLoreBySlug] = useState<Record<string, string>>({});
  const [loreLoading, setLoreLoading] = useState<Record<string, boolean>>({});
  const [loreError, setLoreError] = useState<Record<string, string>>({});
  const loreAbortRef = useRef<AbortController | null>(null);

  // PAD (saisie dans le panneau)
  const [padGuess, setPadGuess] = useState("");

  /* --------- Nouveaux états d’environnement : mobile & orientation -- */
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const updateEnv = () => {
      const mobile =
        typeof window !== "undefined" &&
        window.matchMedia("(pointer: coarse)").matches;
      const landscape =
        typeof window !== "undefined" &&
        window.matchMedia("(orientation: landscape)").matches;
      setIsMobile(mobile);
      setIsLandscape(landscape);
    };
    updateEnv();
    window.addEventListener("resize", updateEnv);
    window.addEventListener("orientationchange", updateEnv);
    return () => {
      window.removeEventListener("resize", updateEnv);
      window.removeEventListener("orientationchange", updateEnv);
    };
  }, []);

  // Fermer tous les inputs (masquer le clavier mobile)
  const blurAllInputs = useCallback((): void => {
    try { headerInputRef.current?.blur?.(); } catch {}
    try { compactInputRef.current?.blur?.(); } catch {}
    try { padInputRef.current?.blur?.(); } catch {}
    try { (document.activeElement as HTMLElement | null)?.blur?.(); } catch {}
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
    setSelectedSlug(null);
    setHintBySlug({});
    setLoreBySlug({});
    setLoreLoading({});
    setLoreError({});
    if (loreAbortRef.current) {
      loreAbortRef.current.abort();
      loreAbortRef.current = null;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    headerInputRef.current?.focus({ preventScroll: true });
  };

  /* ---------------------------- Validation -------------------------- */
  const tryReveal = useCallback(
    (raw: string): boolean => {
      let didReveal = false;
      const q = norm(raw.trim());
      setLastTry(raw.trim());

      if (!q) { setLastResult("⛔ Saisie vide"); return didReveal; }

      // 1) Direct
      const direct = lookup.get(q);
      if (direct) {
        if (!revealed.has(direct.slug)) {
          didReveal = true;
          setRevealed((prev) => new Set(prev).add(direct.slug));
          setLastResult(`✅ ${direct.name} trouvé`);
        } else {
          setLastResult(`ℹ️ ${direct.name} était déjà révélé`);
        }
        return didReveal;
      }

      // 2) Fuzzy minimal (plus strict sur courts)
      const threshold = q.length >= 5 ? 1 : 0;
      if (threshold === 0) { setLastResult("❌ Aucun champion correspondant"); return didReveal; }

      let best: ChampionMeta | undefined;
      let bestD = Infinity;
      for (const [key, champ] of lookup) {
        if (shortKeys.has(key)) continue;
        const d = lev(q, key);
        if (d < bestD) { bestD = d; best = champ; if (d === 0) break; }
      }
      if (best && bestD <= threshold) {
        if (!revealed.has(best.slug)) {
          didReveal = true;
          setRevealed((prev) => new Set(prev).add(best.slug));
          setLastResult(`✅ ${best.name} (faute tolérée)`);
        } else {
          setLastResult(`ℹ️ ${best.name} était déjà révélé`);
        }
      } else {
        setLastResult("❌ Aucun champion correspondant");
      }
      return didReveal;
    },
    [lookup, revealed, shortKeys]
  );

  // ✅ Ne pas remonter + fermer le clavier mobile après succès
  const validate = (from?: "header" | "compact") => {
    if (!value.trim()) return;
    const success = tryReveal(value);

    if (success) {
      if (isMobile) {
        blurAllInputs(); // masque clavier mobile
      } else {
        if (from === "header") {
          try { headerInputRef.current?.focus?.({ preventScroll: true }); } catch { headerInputRef.current?.focus?.(); }
        } else if (from === "compact") {
          try { compactInputRef.current?.focus?.({ preventScroll: true }); } catch { compactInputRef.current?.focus?.(); }
        }
      }
    } else {
      if (from === "compact" || compactProgress >= 1) {
        try { compactInputRef.current?.focus?.({ preventScroll: true }); }
        catch { compactInputRef.current?.focus?.(); }
      } else {
        try { headerInputRef.current?.focus?.({ preventScroll: true }); }
        catch { headerInputRef.current?.focus?.(); }
      }
    }
    setValue("");
  };

  const onKeyDownHeader = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); validate("header"); }
  };

  /* -------------------------- Saisie panneau (PAD) ------------------ */
  // Remplace validateFromPad (qui n'existe pas) par une version locale sûre
  const handlePadValidate = () => {
    const raw = padGuess;
    if (!raw.trim()) {
      try { padInputRef.current?.focus?.({ preventScroll: true }); }
      catch { padInputRef.current?.focus?.(); }
      return;
    }
    const success = tryReveal(raw);

    if (success) {
      if (isMobile) {
        blurAllInputs(); // ferme le clavier mobile
      } else {
        // Desktop : rester sur le PAD pour enchaîner, sans remonter
        try { padInputRef.current?.focus?.({ preventScroll: true }); }
        catch { padInputRef.current?.focus?.(); }
      }
    } else {
      try { padInputRef.current?.focus?.({ preventScroll: true }); }
      catch { padInputRef.current?.focus?.(); }
    }
    setPadGuess("");
  };

  /* -------------------------- Sélection carte ----------------------- */
  const handleCardClick = (slug: string) => {
    setSelectedSlug((curr) => (curr === slug ? null : slug));
  };

  const selectedChampion = useMemo(
    () => initialChampions.find((c) => c.slug === selectedSlug) || null,
    [selectedSlug, initialChampions]
  );
  const selectedIsRevealed = selectedSlug ? revealed.has(selectedSlug) : false;

  // Focus PAD quand carte non révélée
  useEffect(() => {
    if (selectedChampion && !revealed.has(selectedChampion.slug)) {
      const id = requestAnimationFrame(() => {
        try { padInputRef.current?.focus?.({ preventScroll: true }); }
        catch { padInputRef.current?.focus?.(); }
      });
      return () => cancelAnimationFrame(id);
    }
  }, [selectedChampion, revealed]);

  /* -------------------------- Lore on-demand ------------------------ */
  useEffect(() => {
    if (!selectedChampion || !selectedIsRevealed) return;
    const slug = selectedChampion.slug;
    if (loreBySlug[slug]) return;

    if (loreAbortRef.current) loreAbortRef.current.abort();
    const controller = new AbortController();
    loreAbortRef.current = controller;

    setLoreLoading((m) => ({ ...m, [slug]: true }));
    setLoreError((m) => { const next = { ...m }; delete next[slug]; return next; });

    (async () => {
      try {
        const lore = await getChampionLoreFromCDN(selectedChampion.id, "fr_FR");
        if (controller.signal.aborted) return;
        if (lore && lore.trim().length > 0) {
          setLoreBySlug((m) => ({ ...m, [slug]: lore }));
        } else {
          setLoreError((m) => ({ ...m, [slug]: "Lore indisponible." }));
        }
      } catch {
        if (!controller.signal.aborted) {
          setLoreError((m) => ({ ...m, [slug]: "Erreur de chargement du lore." }));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoreLoading((m) => ({ ...m, [slug]: false }));
          loreAbortRef.current = null;
        }
      }
    })();

    return () => {
      controller.abort();
      loreAbortRef.current = null;
    };
  }, [selectedChampion, selectedIsRevealed, loreBySlug]);

  // Indice + re-focus PAD
  const showOneMoreLetter = () => {
    if (!selectedChampion) return;
    const totalLetters = countLetters(selectedChampion.name);
    setHintBySlug((prev) => {
      const next = Math.min(totalLetters, (prev[selectedChampion.slug] ?? 0) + 1);
      return { ...prev, [selectedChampion.slug]: next };
    });
    setTimeout(() => {
      try { padInputRef.current?.focus?.({ preventScroll: true }); }
      catch { padInputRef.current?.focus?.(); }
    }, 0);
  };

  /* --------------------- Sticky via IntersectionObserver ------------- */
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    // Apparition brutale : binaire 0/1. En paysage, seuil plus haut pour retarder l'affichage.
    const appearOffset = isLandscape ? 0.55 : 0.20;

    const obs = new IntersectionObserver(
      ([entry]) => {
        const ratio = entry?.intersectionRatio ?? 0;
        const raw = (1 - ratio - appearOffset) / Math.max(0.0001, (1 - appearOffset));
        const next = raw >= 1 ? 1 : 0; // binaire
        setCompactProgress((prev) => (prev !== next ? next : prev));
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: Array.from({ length: 21 }, (_, i) => i / 20),
      }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [isLandscape]);

  const showSticky = compactProgress >= 1;

  /* ================================ UI =============================== */
  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* ===== HEADER PLEIN (non-sticky) ===== */}
      <div className="mx-auto max-w-6xl px-3 sm:px-4 pt-4">
        <div className="rounded-2xl ring-1 ring-white/5 bg-black/10 backdrop-blur-sm px-3 sm:px-4 py-3">
          {/* Progression */}
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

          {/* Switch + Timer + Actions (desktop/tablette) */}
          <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
            {/* Mode : caché sur mobile */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <span className="text-sm text-white/80">Mode :</span>
              <button
                type="button"
                onClick={() => setEasyMode((v) => !v)}
                className={`relative inline-flex h-8 w-16 items-center rounded-full border transition-colors duration-300 focus:outline-none
                  ${easyMode ? "bg-green-500/90 border-green-400/80" : "bg-rose-500/90 border-rose-400/80"}`}
                role="switch"
                aria-checked={easyMode}
                aria-label="Activer le mode Facile"
                title={`Facile : ${easyMode ? "Oui" : "Non"}`}
              >
                <span
                  className={`absolute left-1 top-1 bg-white rounded-full shadow-md transform transition-transform duration-300
                    h-6 w-6 ${easyMode ? "translate-x-8" : ""}`}
                />
                <span className="sr-only">Facile</span>
              </button>
              <span className={`text-sm font-medium ${easyMode ? "text-green-300" : "text-rose-300"}`}>
                {easyMode ? "Facile" : "Normal"}
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-2 ml-auto shrink-0">
              <div className="rounded px-2 py-1 text-white/90 bg-white/10" style={{ width: 84, textAlign: "center" }}>
                <span className="font-mono [font-variant-numeric:tabular-nums] text-xs sm:text-sm">⏱ {mm}:{ss}</span>
              </div>

              <button
                type="button"
                onClick={togglePause}
                title={paused ? "Reprendre" : "Mettre en pause"}
                className="w-[112px] px-3 py-1.5 rounded-md bg-gray-700/70 hover:bg-gray-600/70 text-white text-xs sm:text-sm text-center"
              >
                {paused ? "Reprendre" : "Pause"}
              </button>

              <button
                type="button"
                onClick={resetAll}
                title="Réinitialiser tout"
                className="px-3 sm:px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm"
              >
                Réinitialiser
              </button>
            </div>
          </div>

          {/* Règles + feedback */}
          <div className="mt-3 text-xs sm:text-sm text-white/80 flex flex-wrap gap-x-3 justify-between" id="rulesHelp">
            <span className="sm:hidden">Fautes légères tolérées</span>
            <span className="hidden sm:inline">
              Règles : Fautes mineures tolérées • Accents / espaces / ponctuation ignorés
            </span>
            <span className="shrink-0">Cartes : {totalPlayable} chargées</span>
          </div>

          <div className="mt-2 p-3 rounded-md border border-white/5 bg-white/5">
            <div className="text-xs sm:text-sm text-white/80">Dernier essai :</div>
            <div className="sr-only" role="status" aria-live="polite">
              {lastTry ? `${lastTry}. ${lastResult}` : ""}
            </div>
            <div className="text-sm sm:text-base text-white truncate">{lastTry || "—"}</div>
            <div className="mt-1 text-xs sm:text-sm">{lastResult}</div>
          </div>

          {/* Champ global + Valider */}
          <div className="mt-3 flex items-stretch gap-2 sm:gap-3 min-w-0">
            <label htmlFor="championName" className="sr-only">Nom du champion</label>
            <input
              id="championName"
              ref={headerInputRef}
              type="text"
              name="champion-guess"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              inputMode="text"
              aria-autocomplete="none"
              enterKeyHint="done"
              data-lpignore="true"
              data-form-type="other"
              placeholder="Tape un nom (ex: Baron Nashor, Rift Herald...)"
              className="w-full min-w-0 px-3 py-2 rounded-md border bg-black/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base
                         ring-2 ring-indigo-400/60 shadow-[0_0_0_3px_rgba(99,102,241,0.15)]"
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
        </div>

        {/* SENTINEL pour l'IntersectionObserver */}
        <div ref={sentinelRef} className="h-4" aria-hidden="true" />
      </div>

      {/* ===== STICKY HEADER (compact) — apparition brutale (on/off) ===== */}
      <div
        className="fixed top-[max(0.5rem,env(safe-area-inset-top))] left-0 right-0 z-40 px-2 sm:px-4"
        style={{
          opacity: showSticky ? 1 : 0,
          visibility: showSticky ? "visible" as const : "hidden" as const,
          pointerEvents: showSticky ? "auto" as const : "none" as const,
          transform: showSticky ? "translateY(0)" : "translateY(-8px)",
        }}
        aria-hidden={showSticky ? undefined : true}
      >
        <div className="mx-auto max-w-6xl">
          <div
            className="rounded-2xl ring-1 ring-white/10 shadow-lg"
            style={{
              backgroundColor: "rgba(0,0,0,0.80)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
            }}
          >
            <div className="px-3 sm:px-4 py-2">
              {/* Progress mini */}
              <div className="min-w-0">
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-600"
                    style={{ width: `${progress}%` }}
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progress)}
                    aria-label="Progression"
                  />
                </div>
              </div>

              {/* Ligne chrono + pause alignée, SANS input */}
              <div className="mt-2 flex items-center gap-2 min-w-0">
                <div
                  className="rounded px-2 py-1 text-white/90"
                  style={{ width: 70, textAlign: "center", backgroundColor: "rgba(255,255,255,0.08)" }}
                >
                  <span className="font-mono [font-variant-numeric:tabular-nums] text-xs">⏱ {mm}:{ss}</span>
                </div>
                <button
                  type="button"
                  onClick={togglePause}
                  title={paused ? "Reprendre" : "Mettre en pause"}
                  className="w-[44px] px-0 py-1 rounded-md bg-gray-700/70 hover:bg-gray-600/70 text-white text-xs text-center"
                >
                  {paused ? "▶" : "⏸"}
                </button>

                {/* Dernier essai compact */}
                <div
                  className="ml-auto flex-1 rounded-md border border-white/10 px-2 py-1.5"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                  aria-live="polite"
                >
                  <div className="sr-only" role="status" aria-live="polite">
                    {lastTry ? `${lastTry}. ${lastResult}` : ""}
                  </div>
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
              isSelected={selectedSlug === c.slug}
              onCardClick={handleCardClick}
            />
          ))}
        </div>
      </div>

      {/* 🟣 PANNEAU FLOTTANT — Desktop */}
      {selectedChampion && (
        <div className="hidden md:block">
          <div
            ref={panelRef}
            className="fixed left-1/2 -translate-x-1/2 bottom-4 z-40 w-[min(760px,94vw)] rounded-2xl ring-1 ring-white/10 bg-black/70 backdrop-blur-md shadow-2xl px-3 sm:px-4 py-3
                       max-h-[75vh] overflow-hidden"
            role="dialog"
            aria-label={selectedIsRevealed ? `Infos ${selectedChampion.name}` : `Saisir le nom pour ${selectedChampion.name}`}
          >
            {!selectedIsRevealed ? (
              <>
                <div className="text-xs sm:text-sm text-white/80 mb-1">
                  Carte sélectionnée : <span className="font-semibold">{selectedChampion.title}</span>
                </div>
                <div className="rounded-md border border-white/10 bg-white/5 px-2 py-1.5 mb-2 text-sm sm:text-base">
                  {revealName(selectedChampion.name, hintBySlug[selectedChampion.slug] ?? 0)}
                </div>
                <div className="flex items-stretch gap-2">
                  <label htmlFor="pad-guess" className="sr-only">Proposition</label>
                  <input
                    id="pad-guess"
                    ref={padInputRef}
                    type="text"
                    name="pad-guess"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    inputMode="text"
                    aria-autocomplete="none"
                    enterKeyHint="done"
                    data-lpignore="true"
                    data-form-type="other"
                    placeholder="Écris le nom ici…"
                    className="w-full min-w-0 px-3 py-2 rounded-md border bg-black/30 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm
                               ring-2 ring-indigo-400/60 shadow-[0_0_0_3px_rgba(99,102,241,0.15)]"
                    value={padGuess}
                    onChange={(e) => setPadGuess(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handlePadValidate(); } }}
                  />
                  <button
                    type="button"
                    onClick={showOneMoreLetter}
                    className="px-3 py-2 rounded-md bg-amber-500/90 hover:bg-amber-400 text-black font-semibold text-sm shrink-0"
                    title="Révéler une lettre"
                  >
                    Indice
                  </button>
                  <button
                    type="button"
                    onClick={handlePadValidate}
                    className="px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shrink-0"
                  >
                    Valider
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2 min-h-0">
                <div className="text-sm sm:text-base font-semibold">
                  {selectedChampion.name} <span className="text-white/70">— {selectedChampion.title}</span>
                </div>
                <div className="text-xs sm:text-sm text-white/80 flex flex-wrap gap-x-3 gap-y-1">
                  <span><strong>Rôles :</strong> {selectedChampion.roles?.join(" • ") || "—"}</span>
                  {selectedChampion.partype && (<span><strong>Ressource :</strong> {selectedChampion.partype}</span>)}
                </div>
                <div
                  className="rounded-md border border-white/10 bg-white/5 p-3 text-xs sm:text-sm text-white/90 whitespace-pre-line overflow-y-auto"
                  style={{ maxHeight: "55vh", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}
                >
                  {loreLoading[selectedChampion.slug] && !loreBySlug[selectedChampion.slug] ? (
                    <span className="text-white/70">Chargement du lore…</span>
                  ) : loreError[selectedChampion.slug] ? (
                    <span className="text-rose-300">{loreError[selectedChampion.slug]}</span>
                  ) : (
                    (loreBySlug[selectedChampion.slug] || selectedChampion.lore || "Lore indisponible.")
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🟣 PANNEAU FLOTTANT — Mobile (bottom sheet) */}
      {selectedChampion && (
        <div className="md:hidden">
          <div
            className="fixed inset-x-0 bottom-0 z-40 rounded-t-2xl ring-1 ring-white/10 bg-black/80 backdrop-blur-md shadow-2xl
                       px-3 py-3 max-h-[70vh] overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label={selectedIsRevealed ? `Infos ${selectedChampion.name}` : `Saisir le nom pour ${selectedChampion.name}`}
            style={{
              paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
            }}
          >

            {!selectedIsRevealed ? (
              <>
                <div className="text-xs text-white/80 mb-1">
                  Carte : <span className="font-semibold">{selectedChampion.title}</span>
                </div>
                <div className="rounded-md border border-white/10 bg-white/5 px-2 py-1.5 mb-2 text-sm">
                  {revealName(selectedChampion.name, hintBySlug[selectedChampion.slug] ?? 0)}
                </div>

                <div className="flex items-stretch gap-2">
                  <label htmlFor="pad-guess-mobile" className="sr-only">Proposition</label>
                  <input
                    id="pad-guess-mobile"
                    ref={padInputRef}
                    type="text"
                    name="pad-guess-mobile"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    inputMode="text"
                    aria-autocomplete="none"
                    enterKeyHint="done"
                    data-lpignore="true"
                    data-form-type="other"
                    placeholder="Écris le nom ici…"
                    className="w-full min-w-0 px-3 py-2 rounded-md border bg-black/30 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm
                               ring-2 ring-indigo-400/60 shadow-[0_0_0_3px_rgba(99,102,241,0.15)]"
                    value={padGuess}
                    onChange={(e) => setPadGuess(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handlePadValidate(); } }}
                  />
                  <button
                    type="button"
                    onClick={showOneMoreLetter}
                    className="px-3 py-2 rounded-md bg-amber-500/90 hover:bg-amber-400 text-black font-semibold text-sm shrink-0"
                    title="Révéler une lettre"
                  >
                    Indice
                  </button>
                  <button
                    type="button"
                    onClick={handlePadValidate}
                    className="px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shrink-0"
                  >
                    Valider
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2 min-h-0">
                <div className="text-base font-semibold">
                  {selectedChampion.name} <span className="text-white/70">— {selectedChampion.title}</span>
                </div>
                <div className="text-xs text-white/80 flex flex-wrap gap-x-3 gap-y-1">
                  <span><strong>Rôles :</strong> {selectedChampion.roles?.join(" • ") || "—"}</span>
                  {selectedChampion.partype && (<span><strong>Ressource :</strong> {selectedChampion.partype}</span>)}
                </div>
                <div
                  className="rounded-md border border-white/10 bg-white/5 p-3 text-xs text-white/90 whitespace-pre-line overflow-y-auto"
                  style={{ maxHeight: "46vh", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}
                >
                  {loreLoading[selectedChampion.slug] && !loreBySlug[selectedChampion.slug] ? (
                    <span className="text-white/70">Chargement du lore…</span>
                  ) : loreError[selectedChampion.slug] ? (
                    <span className="text-rose-300">{loreError[selectedChampion.slug]}</span>
                  ) : (
                    (loreBySlug[selectedChampion.slug] || selectedChampion.lore || "Lore indisponible.")
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🏁 OVERLAY DE FIN */}
      {found >= totalPlayable && totalPlayable > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-3 sm:px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Fin de partie"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-2xl ring-1 ring-white/10 bg-gray-900 text-white shadow-2xl p-5 sm:p-6 text-center">
            <div className="text-3xl sm:text-4xl">🎉</div>
            <h2 className="mt-2 text-xl sm:text-2xl font-bold">Félicitations !</h2>
            <p className="mt-2 text-sm sm:text-base text-white/90">
              Tu as trouvé tous les{" "}
              <span className="font-semibold">{totalPlayable}</span>{" "}
              champions en{" "}
              <span className="font-semibold">
                {Math.floor(elapsed / 60)}min/{String(elapsed % 60).padStart(2, "0")}sec
              </span>.
            </p>
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
      )}

      {/* ▲ Remonter — masqué sur mobile */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="hidden md:flex fixed bottom-6 right-6 w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white items-center justify-center shadow-lg z-40"
        title="Remonter en haut"
        aria-label="Remonter en haut"
      >
        ▲
      </button>
    </div>
  );
}
