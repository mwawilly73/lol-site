// components/ChampionsChrono.tsx
"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChampionMeta } from "@/lib/champions";

const DDRAGON_SPLASH =
  "https://ddragon.leagueoflegends.com/cdn/img/champion/splash";

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

/* -------------------------- Composant --------------------------- */
type GameMode = "libre" | "chrono";

export default function ChampionsChrono({
  initialChampions,
  targetTotal,
}: {
  initialChampions: ChampionMeta[];
  targetTotal?: number;
}) {
  const total = targetTotal ?? initialChampions.length;

  // Ordre unique + shuffle une fois (pas de doublons pendant la run)
  const order = useMemo(() => {
    const uniq = new Map<string, ChampionMeta>();
    for (const c of initialChampions) if (c?.id) uniq.set(c.id, c);
    const arr = Array.from(uniq.values());
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    }
    return arr.slice(0, total);
  }, [initialChampions, total]);

  // ⏱️ Par défaut : Chrono + Skin ON
  const [mode, setMode] = useState<GameMode>("chrono");
  const [useSkin, setUseSkin] = useState<boolean>(true);

  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false); // seulement pour "libre"

  const CHRONO_START_MS = 90_000;
  const [ms, setMs] = useState(CHRONO_START_MS); // par défaut chrono → temps restant

  const timerRef = useRef<number | null>(null);

  const [idx, setIdx] = useState(0);
  const currentChampion = order[idx];

  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [focusHalo, setFocusHalo] = useState(false);

  const [lettersShown, setLettersShown] = useState(0);
  const [streak, setStreak] = useState(0);
  const [solved, setSolved] = useState(0);

  const [skinsMap, setSkinsMap] = useState<Record<string, number[]>>({});
  const [skinsLoaded, setSkinsLoaded] = useState(false);
  const [splashUrl, setSplashUrl] = useState<string>("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Charger la map des skins une fois
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/skins", { cache: "force-cache" });
        const map = (await r.json()) as Record<string, number[]>;
        if (alive) {
          setSkinsMap(map);
          setSkinsLoaded(true);
        }
      } catch {
        if (alive) setSkinsLoaded(true);
      }
    })();
    return () => { alive = false; };
  }, []);

  /* ---------- confetti ultra light (ctx typé) ---------- */
  const burstConfetti = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const _ctx = canvas.getContext("2d");
    if (!_ctx) return;
    const ctx = _ctx as CanvasRenderingContext2D;

    const W = (canvas.width = canvas.clientWidth);
    const H = (canvas.height = canvas.clientHeight);
    const N = 80;
    const parts = Array.from({ length: N }, () => ({
      x: W / 2,
      y: H / 2,
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * -6 - 2,
      g: 0.18 + Math.random() * 0.1,
      life: 700 + Math.random() * 400,
      size: 2 + Math.random() * 3,
    }));

    const startT = performance.now();
    function tick(now: number) {
      const t = now - startT;
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.vy += p.g;
        p.x += p.vx;
        p.y += p.vy;
        ctx.globalAlpha = Math.max(0, 1 - t / p.life);
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      if (t < 900) requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, W, H);
    }
    requestAnimationFrame(tick);
  }, []);

  function pickSplashNum(champId: string, wantAlt: boolean): number {
    if (!wantAlt) return 0;
    const list = skinsMap[champId];
    if (!list || list.length === 0) return 0;
    const i = Math.floor(Math.random() * list.length);
    return list[i]!;
  }
  function buildSplashUrl(champId: string, wantAlt: boolean): string {
    const num = pickSplashNum(champId, wantAlt);
    return `${DDRAGON_SPLASH}/${champId}_${num}.jpg`;
  }

  // Image (affichée seulement après démarrage)
  useEffect(() => {
    if (!currentChampion) return;
    if (!started) { setSplashUrl(""); return; }
    setSplashUrl(`${DDRAGON_SPLASH}/${currentChampion.id}_0.jpg`);
    if (useSkin && skinsLoaded) setSplashUrl(buildSplashUrl(currentChampion.id, true));
  }, [currentChampion?.id, useSkin, skinsLoaded, started]); // eslint-disable-line react-hooks/exhaustive-deps

  // Démarrage / Pause / Stop
  const start = useCallback(() => {
    if (started) return;
    setStarted(true);
    setPaused(false);
    setIdx(0);
    setInput("");
    setLettersShown(0);
    setStreak(0);
    setSolved(0);
    setFocusHalo(true);
    setMs(mode === "chrono" ? CHRONO_START_MS : 0);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [started, mode]);

  const togglePause = useCallback(() => {
    if (mode === "chrono") return; // pas de pause en chrono
    setPaused((p) => !p);
  }, [mode]);

  const stop = useCallback(() => {
    setStarted(false);
    setPaused(false);
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  // Tick 100ms
  useEffect(() => {
    if (!started) return;
    if (mode === "libre" && paused) return;

    timerRef.current = window.setInterval(() => {
      setMs((t) => {
        if (mode === "libre") return t + 100;
        const next = t - 100;
        if (next <= 0) {
          setStarted(false);
          setPaused(false);
          if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
          return 0;
        }
        return next;
      });
    }, 100) as unknown as number;

    return () => {
      if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [started, paused, mode]);

  useEffect(() => {
    if (mode === "libre" && started && idx >= order.length) {
      stop();
    }
  }, [idx, order.length, started, stop, mode]);

  function formatTime(t: number) {
    const val = mode === "chrono" ? Math.max(0, t) : t;
    const s = Math.floor(val / 1000);
    const mm = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    const ds = Math.floor((val % 1000) / 100).toString();
    return `${mm}:${ss}.${ds}`;
  }

  const validateInput = useCallback(
    (raw: string) => {
      if (!currentChampion) return false;
      const nInput = norm(raw.trim());
      if (!nInput) return false;

      const keys = aliasKeysForChampion(currentChampion);
      const exact = keys.some((k) => nInput === k);
      if (exact) return true;

      let best = Number.POSITIVE_INFINITY;
      for (const k of keys) {
        const d = lev(nInput, k);
        if (d < best) best = d;
        if (best === 0) break;
      }
      const L = Math.max(nInput.length, norm(currentChampion.name).length);
      return best <= (L <= 5 ? 1 : L <= 8 ? 2 : 3);
    },
    [currentChampion]
  );

  const acceptCorrect = useCallback(() => {
    setSolved((s) => s + 1);
    setStreak((st) => st + 1);
    setInput("");
    setLettersShown(0);
    burstConfetti();
    setIdx((i) => i + 1);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [burstConfetti]);

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentChampion) return;
      if (validateInput(input)) acceptCorrect();
      else setStreak(0);
    },
    [input, currentChampion, acceptCorrect, validateInput]
  );

  const onReveal = useCallback(() => {
    if (!currentChampion) return;
    const totalLetters = countLetters(currentChampion.name);
    setLettersShown((n) => Math.min(totalLetters, n + 1));
  }, [currentChampion?.name]);

  const onShare = useCallback(async () => {
    const base = mode === "chrono" ? "au chrono" : "en mode libre";
    const text = `J’ai fait ${solved} ${base} en ${formatTime(mode === "chrono" ? CHRONO_START_MS - ms : ms)} sur LoL Quiz !`;
    try {
      if (navigator.share) {
        await navigator.share({ text, url: window.location.href, title: "LoL Quiz — Chrono" });
      } else {
        await navigator.clipboard.writeText(`${text} ${window.location.href}`);
        alert("Score copié dans le presse-papiers !");
      }
    } catch {}
  }, [solved, ms, mode]);

  const maskedName =
    currentChampion && lettersShown > 0
      ? revealName(currentChampion.name, lettersShown)
      : currentChampion?.name.replace(/[A-Za-zÀ-ÖØ-öø-ÿ]/g, "•");

  const isFirstImage = started && idx === 0;
  const timerWidth = "min-w-[112px] sm:min-w-[128px] lg:min-w-[144px]";
  const ctaWidth = "min-w-[112px] sm:min-w-[128px]";

  /* ------ % barre visuelle haut (chrono: temps restant, libre: progression) ------ */
  const progressPercent =
    mode === "chrono"
      ? (ms / CHRONO_START_MS) * 100
      : order.length > 0
      ? (solved / order.length) * 100
      : 0;

  /* ---------------------- UI Toggles (segmentés) ---------------------- */
  const ModeToggle = (
    <div className="flex items-center gap-2">
      <span className="text-white/80 text-xs sm:text-sm">Mode :</span>
      <div
        role="tablist"
        aria-label="Choisir le mode"
        className="flex overflow-hidden rounded-full ring-1 ring-white/15 bg-white/5"
      >
        <button
          role="tab"
          aria-selected={mode === "chrono"}
          onClick={() => {
            setMode("chrono");
            setMs(CHRONO_START_MS);
            setStarted(false);
            setPaused(false);
          }}
          className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold transition
            ${mode === "chrono" ? "bg-emerald-500 text-black" : "text-white/80 hover:bg-white/10"}`}
        >
          Chrono
        </button>
        <button
          role="tab"
          aria-selected={mode === "libre"}
          onClick={() => {
            setMode("libre");
            setMs(0);
            setStarted(false);
            setPaused(false);
          }}
          className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold transition
            ${mode === "libre" ? "bg-zinc-600 text-white" : "text-white/80 hover:bg-white/10"}`}
        >
          Libre
        </button>
      </div>
    </div>
  );

  const SkinToggle = (
    <div className="flex items-center gap-2">
      <span className="text-white/80 text-xs sm:text-sm">Skin :</span>
      <div
        role="tablist"
        aria-label="Activer les skins"
        className="flex overflow-hidden rounded-full ring-1 ring-white/15 bg-white/5"
      >
        <button
          role="tab"
          aria-selected={useSkin}
          onClick={() => setUseSkin(true)}
          className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold transition
            ${useSkin ? "bg-emerald-500 text-black" : "text-white/80 hover:bg-white/10"}`}
        >
          Oui
        </button>
        <button
          role="tab"
          aria-selected={!useSkin}
          onClick={() => setUseSkin(false)}
          className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold transition
            ${!useSkin ? "bg-zinc-600 text-white" : "text-white/80 hover:bg-white/10"}`}
        >
          Non
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Barre d’infos */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[13px] sm:text-sm">
        {/* Toggles côte à côte */}
        <div className="flex items-center gap-3 sm:gap-4">
          {ModeToggle}
          {SkinToggle}
        </div>

        {/* Timer / Score / Série */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto sm:ml-4">
          <div className={`rounded-md bg-white/5 ring-1 ring-white/10 px-2.5 py-1 font-mono tabular-nums text-center ${timerWidth}`}>
            {formatTime(ms)}
          </div>
          <div className="rounded-md bg-white/5 ring-1 ring-white/10 px-2.5 py-1">
            Score : <span className="font-semibold">{solved}</span> / {order.length}
          </div>
          <div className="rounded-md bg-white/5 ring-1 ring-white/10 px-2.5 py-1">
            Série : <span className="font-semibold">{streak}</span>
          </div>
        </div>

        {/* Actions à droite */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          <button
            type="button"
            onClick={onShare}
            className="rounded-md bg-white/10 hover:bg-white/15 ring-1 ring-white/15 px-3 py-1.5"
            title="Partager mon score"
          >
            Partager
          </button>

          {!started ? (
            <button
              type="button"
              onClick={start}
              className={`rounded-md bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-white font-semibold ${ctaWidth}`}
            >
              Démarrer
            </button>
          ) : mode === "libre" ? (
            <button
              type="button"
              onClick={togglePause}
              className={`rounded-md ${paused ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-white/10 hover:bg-white/15 ring-1 ring-white/15"} px-3 py-1.5 font-semibold ${ctaWidth}`}
            >
              {paused ? "Reprendre" : "Pause"}
            </button>
          ) : (
            <button
              type="button"
              disabled
              className={`rounded-md bg-white/10 ring-1 ring-white/15 px-3 py-1.5 opacity-60 ${ctaWidth}`}
              title="Pas de pause en mode chrono"
            >
              Chrono en cours
            </button>
          )}
        </div>
      </div>

      {/* Barre visuelle (au-dessus de l’image) */}
      <div className="relative">
        <div className="h-2 rounded-full bg-white/10 overflow-hidden ring-1 ring-white/10">
          <div
            className={`h-full ${mode === "chrono" ? "bg-gradient-to-r from-rose-500 to-yellow-400" : "bg-gradient-to-r from-emerald-500 to-teal-400"}`}
            style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
            aria-hidden
          />
        </div>
        <span className="sr-only">
          {mode === "chrono"
            ? `Temps restant ${Math.round(progressPercent)}%`
            : `Progression ${Math.round(progressPercent)}%`}
        </span>
      </div>

      {/* Zone image / placeholder */}
      <div className="relative w-full max-w-full overflow-hidden rounded-xl ring-1 ring-white/10 bg-black/40">
        <div className="relative mx-auto aspect-[1215/717] w-full">
          {/* Avant démarrage : carte statique pleine surface */}
          {!started ? (
            <>
              <div className="absolute inset-0 rounded-xl">
                {/* sobre + statique */}
                <div className="absolute inset-0 rounded-xl bg-[radial-gradient(120%_80%_at_50%_0%,rgba(99,102,241,0.20),rgba(16,185,129,0.18)_40%,rgba(0,0,0,0.55)_75%)]" />
                <div className="absolute inset-6 rounded-xl bg-gradient-to-br from-white/10 via-white/5 to-transparent ring-1 ring-white/10" />
              </div>
              <div className="absolute inset-0 grid place-items-center pointer-events-none">
                <button
                  type="button"
                  onClick={start}
                  className="pointer-events-auto rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-white font-bold text-lg shadow-2xl ring-1 ring-emerald-400/40"
                >
                  Démarrer
                </button>
              </div>
            </>
          ) : splashUrl ? (
            <Image
              src={splashUrl}
              alt={currentChampion?.name || "Champion LoL"}
              fill
              sizes="(min-width:1536px) 1152px, (min-width:1280px) 1024px, (min-width:1024px) 928px, (min-width:768px) 704px, 96vw"
              className="object-contain object-center"
              priority={isFirstImage}
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                if (currentChampion?.id) {
                  img.src = `${DDRAGON_SPLASH}/${currentChampion.id}_0.jpg`;
                }
              }}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-white/70">
              <span>Chargement…</span>
            </div>
          )}

          {/* Canvas confettis */}
          <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" aria-hidden />
        </div>
      </div>

      {/* Nom masqué / Aide */}
      <div className="text-center text-base sm:text-lg lg:text-xl font-semibold text-white/90">
        {started && currentChampion ? maskedName : "—"}
      </div>

      {/* Formulaire (validation via bouton/Entrée) */}
      <form
        onSubmit={onSubmit}
        className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3"
      >
        <label htmlFor="answer" className="sr-only">Votre réponse</label>
        <input
          id="answer"
          name="answer"
          ref={inputRef}
          autoComplete="off"
          enterKeyHint="done"
          autoCapitalize="none"
          spellCheck={false}
          disabled={!started || (mode === "libre" && paused) || !currentChampion}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className={`min-w-0 w-full sm:flex-1 rounded-md bg-white/5 ring-1 ring-white/10 px-3 py-2.5 text-[15px] text-white placeholder:text-white/40 outline-none
            ${focusHalo ? "focus:ring-2 focus:ring-emerald-400/80" : ""}`}
          placeholder="Tape le nom du champion…"
          onFocus={() => setFocusHalo(true)}
          onBlur={() => setFocusHalo(false)}
        />

        <div className="flex gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onReveal}
            disabled={!started || (mode === "libre" && paused) || !currentChampion}
            className="w-full sm:w-auto rounded-md bg-white/10 hover:bg-white/15 ring-1 ring-white/15 px-3 py-2.5 text-sm"
          >
            Aide (révéler)
          </button>
          <button
            type="submit"
            disabled={!started || (mode === "libre" && paused) || !currentChampion}
            className="w-full sm:w-auto rounded-md bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-white font-semibold"
          >
            Valider
          </button>
        </div>
      </form>

      {/* Fin de run */}
      {(!started && (mode === "chrono" ? ms === 0 : idx >= order.length)) && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
          <div className="text-base sm:text-lg font-semibold">
            {mode === "chrono" ? "Temps écoulé !" : "Terminé !"} {solved} / {order.length} en{" "}
            {mode === "chrono" ? "1:30.0" : formatTime(ms)} 🎉
          </div>
          <div className="mt-2 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={start}
              className="rounded-md bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-white font-semibold"
            >
              Rejouer
            </button>
            <button
              type="button"
              onClick={onShare}
              className="rounded-md bg-white/10 hover:bg-white/15 ring-1 ring-white/15 px-3 py-1.5"
            >
              Partager
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
