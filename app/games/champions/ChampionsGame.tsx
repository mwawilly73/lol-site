// app/games/champions/ChampionsGame.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Points clés :
// - Sticky compact : fondu fluide (opacity = compactProgress).
// - Images carrées HD (dans ChampionCard).
// - Lore à la demande via Data Dragon.
// - Auto-focus : quand le header n’est plus visible, on transfère le focus
//   vers l’input sticky compact sans remonter la page.
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
/* fautes usuelles par champion */
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
  const compactInputRef = useRef<HTMLInputElement>(null);

  const [lastTry, setLastTry] = useState<string>("");
  const [lastResult, setLastResult] = useState<string>("—");

  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [easyMode, setEasyMode] = useState(false);

  // Sticky progress lisse
  const headerEndRef = useRef<HTMLDivElement | null>(null);
  const headerEndY = useRef(0);
  const [compactProgress, setCompactProgress] = useState(0); // 0..1
  const isCompactVisible = compactProgress > 0.5;
  const FADE_RANGE_PX = 160;

  const panelRef = useRef<HTMLDivElement | null>(null);

  // Lore à la demande (cache)
  const [loreBySlug, setLoreBySlug] = useState<Record<string, string>>({});
  const [loreLoading, setLoreLoading] = useState<Record<string, boolean>>({});
  const [loreError, setLoreError] = useState<Record<string, string>>({});
  const loreAbortRef = useRef<AbortController | null>(null);

  // 🆕 Hystérésis & seuil pour auto-focus sticky
  const COMPACT_FOCUS_THRESHOLD = 0.95; // quand sticky est vraiment “active”
  const focusForcedOnceRef = useRef(false); // évite les re-focus en boucle

  /* ---------------------- Mesure + scroll (sticky) ------------------ */
  useLayoutEffect(() => {
    const measure = () => {
      const el = headerEndRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      headerEndY.current = Math.floor(rect.top + window.scrollY);
      const y = Math.max(0, window.scrollY - headerEndY.current);
      const t = Math.min(1, y / FADE_RANGE_PX);
      setCompactProgress(t);
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
        const y = Math.max(0, window.scrollY - headerEndY.current);
        const t = Math.min(1, y / FADE_RANGE_PX);
        setCompactProgress((prev) => (prev !== t ? t : prev));
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* 🆕 Auto-focus quand le header sort de l’écran
     - Si l’input “fixe” (header) a le focus et que la sticky est pleinement visible,
       on bascule le focus vers l’input sticky (compact) sans scroll.
     - On ne vole PAS le focus si tu tapes dans le PAD (panneau bas).
  */
  const padInputRef = useRef<HTMLInputElement>(null); // (déclaré ici pour l’effet ci-dessous)
  useEffect(() => {
    const active = document.activeElement as HTMLElement | null;

    // Si sticky est active et que le focus est sur le champ header → basculer vers compact
    if (
      compactProgress >= COMPACT_FOCUS_THRESHOLD &&
      headerInputRef.current &&
      active === headerInputRef.current &&
      !focusForcedOnceRef.current // évite de refaire 50 fois si on reste en bas
    ) {
      // ne pas voler le focus au PAD si tu es en train de deviner une carte
      if (padInputRef.current && active === padInputRef.current) return;

      try {
        // On blur d’abord pour éviter que le navigateur tente de “le garder visible”
        headerInputRef.current.blur();
      } catch {}
      try {
        compactInputRef.current?.focus?.({ preventScroll: true });
      } catch {
        compactInputRef.current?.focus?.();
      }
      focusForcedOnceRef.current = true;
      return;
    }

    // Reset du drapeau quand on remonte suffisamment (re-autorise un futur transfert)
    if (compactProgress < 0.2) {
      focusForcedOnceRef.current = false;
    }
  }, [compactProgress]);

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

      // 2) Fuzzy
      const threshold = q.length >= 4 ? 1 : 0;
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
          setRevealed((prev) => new Set(prev).add(best!.slug));
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

  // Valider depuis header/sticky (input global)
  const validate = (from?: "header" | "compact") => {
    if (!value.trim()) return;
    const didReveal = tryReveal(value);
    setValue("");

    const wantCompact = from === "compact" || isCompactVisible;
    const target = wantCompact ? compactInputRef.current : headerInputRef.current;
    try { target?.focus?.({ preventScroll: true }); } catch { target?.focus?.(); }
  };

  const onKeyDownHeader = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); validate("header"); }
  };
  const onKeyDownCompact = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); validate("compact"); }
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

  // Focus PAD quand carte sélectionnée NON révélée
  useEffect(() => {
    if (selectedChampion && !revealed.has(selectedChampion.slug)) {
      const id = requestAnimationFrame(() => {
        try { padInputRef.current?.focus?.({ preventScroll: true }); }
        catch { padInputRef.current?.focus?.(); }
      });
      return () => cancelAnimationFrame(id);
    }
  }, [selectedChampion, revealed]);

  // ⚡️ Lore on-demand pour carte révélée
  useEffect(() => {
    if (!selectedChampion || !selectedIsRevealed) return;
    const slug = selectedChampion.slug;
    if (loreBySlug[slug]) return;

    if (loreAbortRef.current) loreAbortRef.current.abort();
    const controller = new AbortController();
    loreAbortRef.current = controller;

    setLoreLoading((m) => ({ ...m, [slug]: true }));
    setLoreError((m) => { const { [slug]: _, ...rest } = m; return rest; });

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

  // Indice (révèle une lettre) + re-focus PAD
  const [padGuess, setPadGuess] = useState("");
  const showOneMoreLetter = () => {
    if (!selectedChampion) return;
    const totalLetters = countLetters(selectedChampion.name);
    setHintBySlug((prev) => {
      const current = prev[selectedChampion.slug] ?? 0;
      const next = Math.min(totalLetters, current + 1);
      return { ...prev, [selectedChampion.slug]: next };
    });
    setTimeout(() => {
      try { padInputRef.current?.focus?.({ preventScroll: true }); }
      catch { padInputRef.current?.focus?.(); }
    }, 0);
  };

  const validateFromPad = () => {
    if (!padGuess.trim()) {
      try { padInputRef.current?.focus?.({ preventScroll: true }); }
      catch { padInputRef.current?.focus?.(); }
      return;
    }
    const didReveal = tryReveal(padGuess);
    setPadGuess("");

    if (didReveal) {
      const target = isCompactVisible ? compactInputRef.current : headerInputRef.current;
      try { target?.focus?.({ preventScroll: true }); } catch { target?.focus?.(); }
    } else {
      try { padInputRef.current?.focus?.({ preventScroll: true }); }
      catch { padInputRef.current?.focus?.(); }
    }
  };

  /* ----------------------- Click-outside & Escape ------------------- */
  useEffect(() => {
    if (!selectedChampion) return;
    const onPointerDown = (e: PointerEvent) => {
      const panel = panelRef.current;
      const target = e.target as HTMLElement | null;
      if (!panel || !target) return;
      if (panel.contains(target)) return;
      const isCardClick = !!target.closest("[data-champion-card]");
      if (isCardClick) return;
      setSelectedSlug(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedSlug(null); };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [selectedChampion]);

  /* ----------------------- Victoire & overlay ----------------------- */
  const hasWon = found >= totalPlayable && totalPlayable > 0;
  useEffect(() => { if (hasWon) setPaused(true); }, [hasWon]);

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

          {/* Switch + Timer + Actions */}
          <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
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
                    h-5 w-5 sm:h-6 sm:w-6 ${easyMode ? "translate-x-7 sm:translate-x-8" : ""}
                  `}
                />
                <span className="sr-only">Facile</span>
              </button>
              <span className={`text-xs sm:text-sm font-medium ${easyMode ? "text-green-300" : "text-rose-300"}`}>
                {easyMode ? "Facile" : "Normal"}
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-2 ml-auto shrink-0">
              <div
                className="rounded px-2 py-1 text-white/90 bg-white/10"
                style={{ width: 84, textAlign: "center" }}
              >
                <span className="font-mono [font-variant-numeric:tabular-nums] text-xs sm:text-sm">⏱ {mm}:{ss}</span>
              </div>

              {/* largeur fixe pour éviter tout décalage */}
              <button
                type="button"
                onClick={togglePause}
                title={paused ? "Reprendre" : "Mettre en pause"}
                className="w-[112px] px-2 sm:px-3 py-1.5 rounded-md bg-gray-700/70 hover:bg-gray-600/70 text-white text-xs sm:text-sm text-center"
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
            </div>
          </div>

          {/* Règles + feedback */}
          <div className="mt-3 text-xs sm:text-sm text-white/80 flex flex-wrap gap-x-3 justify-between" id="rulesHelp">
            <span className="sm:hidden">Faute d&apos;orthographe tolérés</span>
            <span className="hidden sm:inline">
              Règles : Légères faute d&apos;orthographe tolérés • Accents / Espaces / Points / Apostrophes - ignorés •
            </span>
            <span className="shrink-0">Cartes : {totalPlayable} chargées</span>
          </div>

          <div className="mt-2 p-3 rounded-md border border-white/5 bg-white/5">
            <div className="text-xs sm:text-sm text-white/80">Dernier essai :</div>
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
              autoComplete="off"
              placeholder="Tape un nom ( ex: Baron Nashor , Rift Herald ... )"
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

        {/* SENTINEL */}
        <div ref={headerEndRef} className="h-px" aria-hidden="true" />
      </div>

      {/* ===== BARRE COMPACTE FIXE (overlay) — apparition FLUIDE ===== */}
      <div
        className="fixed top-[max(0.5rem,env(safe-area-inset-top))] left-0 right-0 z-40 px-2 sm:px-4 transition-all duration-300 ease-out will-change-[transform,opacity]"
        style={{
          opacity: compactProgress,
          transform: `translateY(${(-8 * (1 - compactProgress)).toFixed(2)}px)`,
          pointerEvents: compactProgress > 0 ? "auto" : "none",
        }}
      >
        <div className="mx-auto max-w-6xl">
          <div
            className="rounded-2xl ring-1 ring-white/10 shadow-lg"
            style={{
              backgroundColor: `rgba(0,0,0,${(0.80 * compactProgress).toFixed(3)})`,
              backdropFilter: `blur(${(2 + 2 * compactProgress).toFixed(1)}px)`,
              WebkitBackdropFilter: `blur(${(2 + 2 * compactProgress).toFixed(1)}px)`,
            }}
          >
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
                    className="rounded px-2 py-1 text-white/90"
                    style={{
                      width: 70,
                      textAlign: "center",
                      backgroundColor: "rgba(255,255,255,0.08)",
                    }}
                  >
                    <span className="font-mono [font-variant-numeric:tabular-nums] text-xs">⏱ {mm}:{ss}</span>
                  </div>
                  {/* largeur fixe */}
                  <button
                    type="button"
                    onClick={togglePause}
                    title={paused ? "Reprendre" : "Mettre en pause"}
                    className="w-[44px] px-0 py-1 rounded-md bg-gray-700/70 hover:bg-gray-600/70 text-white text-xs text-center"
                  >
                    {paused ? "▶" : "⏸"}
                  </button>
                </div>
              </div>

              {/* Dernier essai — compact */}
              <div className="mt-2 rounded-md border border-white/10" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} aria-live="polite">
                <div className="px-2 py-1.5">
                  <div className="text-[11px] text-white/70">Dernier essai :</div>
                  <div className="text-xs sm:text-sm text-white truncate" title={lastTry || "—"}>
                    {lastTry || "—"}
                  </div>
                  <div className="mt-0.5 text-[11px] sm:text-xs">{lastResult}</div>
                </div>
              </div>

              {/* Champ compact + Valider */}
              <div className="mt-2 flex items-stretch gap-2 min-w-0">
                <label htmlFor="championName-compact" className="sr-only">Nom du champion</label>
                <input
                  id="championName-compact"
                  ref={compactInputRef}
                  type="text"
                  autoComplete="off"
                  placeholder="Tape un nom ( ex: Baron Nashor , Rift Herald ... )"
                  className="w-full min-w-0 rounded-md border bg-black/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 px-3 py-1.5 text-sm
                             ring-2 ring-indigo-400/60 shadow-[0_0_0_3px_rgba(99,102,241,0.15)]"
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

      {/* 🟣 PANNEAU FLOTTANT (en bas d'écran) */}
      {selectedChampion && (
        <div
          ref={panelRef}
          className="fixed left-1/2 -translate-x-1/2 bottom-4 z-40 w-[min(760px,94vw)] rounded-2xl ring-1 ring-white/10 bg-black/70 backdrop-blur-md shadow-2xl px-3 sm:px-4 py-3"
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
                  autoComplete="off"
                  placeholder="Écris le nom ici…"
                  className="w-full min-w-0 px-3 py-2 rounded-md border bg-black/30 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm
                             ring-2 ring-indigo-400/60 shadow-[0_0_0_3px_rgba(99,102,241,0.15)]"
                  value={padGuess}
                  onChange={(e) => setPadGuess(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); validateFromPad(); } }}
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
                  onClick={validateFromPad}
                  className="px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shrink-0"
                >
                  Valider
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <div className="text-sm sm:text-base font-semibold">
                {selectedChampion.name} <span className="text-white/70">— {selectedChampion.title}</span>
              </div>
              <div className="text-xs sm:text-sm text-white/80 flex flex-wrap gap-x-3 gap-y-1">
                <span><strong>Rôles :</strong> {selectedChampion.roles?.join(" • ") || "—"}</span>
                {selectedChampion.partype && (<span><strong>Ressource :</strong> {selectedChampion.partype}</span>)}
              </div>
              <div className="rounded-md border border-white/10 bg-white/5 p-3 text-xs sm:text-sm text-white/90 whitespace-pre-line max-h-64 sm:max-h-72 overflow-y-auto">
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
      )}

      {/* 🏁 OVERLAY DE FIN */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center px-3 sm:px-4 transition-opacity duration-200
          ${found >= totalPlayable && totalPlayable > 0 ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
        aria-hidden={!(found >= totalPlayable && totalPlayable > 0)}
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
