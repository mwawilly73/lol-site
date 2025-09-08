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

/* ========================= Switch visuel ========================= */
function SwitchButton({
  on, onToggle, ariaLabel,
  onColor = "bg-green-500/90 border-green-400/80",
  offColor = "bg-rose-500/90 border-rose-400/80",
  className = "",
}: {
  on: boolean; onToggle: () => void; ariaLabel: string;
  onColor?: string; offColor?: string; className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-7 w-14 sm:h-8 sm:w-16 items-center rounded-full border transition-colors duration-300 focus:outline-none ${
        on ? onColor : offColor
      } ${className}`}
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      style={{ touchAction: "manipulation" }}
    >
      <span
        className={`absolute left-1 top-1 bg-white rounded-full shadow-md transform transition-transform duration-300
        h-5 w-5 sm:h-6 sm:w-6 ${on ? "translate-x-7 sm:translate-x-8" : ""}`}
      />
      <span className="sr-only">{ariaLabel}</span>
    </button>
  );
}

/* ========================= Durées & format ========================= */
const CHRONO_OPTIONS = [
  { ms: 90_000,  label: "1:30" },
  { ms: 300_000, label: "5:00" },
  { ms: 600_000, label: "10:00" },
  { ms: 900_000, label: "15:00" },
] as const;

/* ====== Boîte Chrono cliquable (dropdown intégré dans la case du chrono) ====== */
function ChronoBoxDropdown({
  mode,
  started,
  ms,
  duration,
  onChangeDuration,
}: {
  mode: "libre" | "chrono";
  started: boolean;
  ms: number;
  duration: number;
  onChangeDuration: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  // Fermer au clic extérieur / Échap
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onClick = (e: MouseEvent) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const disabled = mode !== "chrono" || started;
  const caret = "▾";

  // Largeur fixe identique à l’ancienne box pour éviter tout décalage
  const timerWidth = "min-w-[118px] sm:min-w-[128px] lg:min-w-[144px]";

  function fmt(t: number) {
    const s = Math.floor(Math.max(0, t) / 1000);
    const mm = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    const ds = Math.floor((Math.max(0, t) % 1000) / 100).toString();
    return `${mm}:${ss}.${ds}`;
  }
  const currentLabel = CHRONO_OPTIONS.find(o => o.ms === duration)?.label ?? "1:30";

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`rounded-md bg-white/5 ring-1 ring-white/10 px-2.5 py-1 font-mono tabular-nums text-center ${timerWidth}
          inline-flex items-center justify-center gap-1
          ${disabled ? "" : "hover:bg-white/10"}
        `}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={mode === "chrono" ? (disabled ? "Changer la durée (désactivé pendant la partie)" : "Cliquer pour changer la durée") : "Indisponible en mode Libre"}
        style={{ touchAction: "manipulation" }}
      >
        <span className="whitespace-nowrap">⏱ {fmt(ms)}</span>
        <span className={`text-white/70 ${disabled ? "opacity-60" : ""}`} aria-hidden>{caret}</span>
      </button>

      {open && !disabled && (
        <div
          className="absolute z-30 mt-1 min-w-[8rem] max-w-[calc(100vw-2rem)] rounded-md bg-[#0e1117] ring-1 ring-white/15 shadow-xl overflow-hidden"
          role="listbox"
        >
          <div className="px-3 py-2 text-[11px] uppercase tracking-wide text-white/50">
            Durée (actuelle&nbsp;: {currentLabel})
          </div>
          {CHRONO_OPTIONS.map((o) => {
            const active = o.ms === duration;
            return (
              <button
                key={o.ms}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChangeDuration(o.ms);
                  setOpen(false);
                }}
                className={`block w-full text-left px-3 py-1.5 text-sm ${
                  active
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "text-white/90 hover:bg-white/10"
                }`}
                style={{ touchAction: "manipulation" }}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
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

  // Ordre unique + shuffle une fois
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

  // Par défaut : Chrono + Skin ON
  const [mode, setMode] = useState<GameMode>("chrono");
  const [useSkin, setUseSkin] = useState<boolean>(true);

  const [chronoDuration, setChronoDuration] = useState<number>(CHRONO_OPTIONS[0].ms);
  const chronoLabel = useMemo(
    () => CHRONO_OPTIONS.find(o => o.ms === chronoDuration)?.label ?? "1:30",
    [chronoDuration]
  );

  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false); // seulement “libre”
  const [ms, setMs] = useState(chronoDuration);

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

  const [endModal, setEndModal] = useState<{ title: string; message: string } | null>(null);

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

  /* ---------- confetti ultra light ---------- */
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChampion?.id, useSkin, skinsLoaded, started]);

  // Reset d’une run
  const resetRunState = useCallback(() => {
    setIdx(0);
    setInput("");
    setLettersShown(0);
    setStreak(0);
    setSolved(0);
    setEndModal(null);
    setFocusHalo(true);
  }, []);

  // Démarrage / Pause / Stop / Abandon
  const start = useCallback(() => {
    if (started) return;
    setStarted(true);
    setPaused(false);
    resetRunState();
    setMs(mode === "chrono" ? chronoDuration : 0);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [started, mode, chronoDuration, resetRunState]);

  const togglePause = useCallback(() => {
    if (mode === "chrono") return;
    setPaused((p) => !p);
  }, [mode]);

  const stop = useCallback(() => {
    setStarted(false);
    setPaused(false);
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const abandon = useCallback(() => {
    stop();
    setEndModal({
      title: "🛑 Abandonné",
      message: `En ${chronoLabel}, tu as trouvé ${solved} champions sur ${order.length}.`,
    });
  }, [stop, chronoLabel, solved, order.length]);

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
          setEndModal({
            title: "⏱ Temps écoulé !",
            message: `En ${chronoLabel}, tu as trouvé ${solved} champions sur ${order.length}.`,
          });
          return 0;
        }
        return next;
      });
    }, 100) as unknown as number;

    return () => {
      if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [started, paused, mode, solved, order.length, chronoLabel]);

  // Refléter la durée quand on change de mode / valeur (si non démarré)
  useEffect(() => {
    if (!started) setMs(mode === "chrono" ? chronoDuration : 0);
  }, [mode, chronoDuration, started]);

  const onChangeChronoDuration = useCallback((v: number) => {
    setChronoDuration(v);
    if (!started) setMs(v);
  }, [started]);

  const formatTime = useCallback((t: number) => {
    const val = mode === "chrono" ? Math.max(0, t) : t;
    const s = Math.floor(val / 1000);
    const mm = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    const ds = Math.floor((val % 1000) / 100).toString();
    return `${mm}:${ss}.${ds}`;
  }, [mode]);

  const validateInput = useCallback((raw: string) => {
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
  }, [currentChampion]);

  const burstAndNext = useCallback(() => {
    setSolved((s) => s + 1);
    setStreak((st) => st + 1);
    setInput("");
    setLettersShown(0);
    burstConfetti();
    setIdx((i) => i + 1);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [burstConfetti]);

  const onSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!currentChampion) return;
    if (validateInput(input)) burstAndNext();
    else setStreak(0);
  }, [input, currentChampion, burstAndNext, validateInput]);

  const onReveal = useCallback(() => {
    if (!currentChampion) return;
    const totalLetters = countLetters(currentChampion.name);
    setLettersShown((n) => Math.min(totalLetters, n + 1));
  }, [currentChampion]);

  const onShare = useCallback(async () => {
    const base = mode === "chrono" ? "au chrono" : "en mode libre";
    // ⬇️ Corrigé : temps écoulé en mode chrono = chronoDuration - ms
    const elapsed = mode === "chrono" ? (chronoDuration - ms) : ms;
    const text = `J’ai fait ${solved} ${base} en ${formatTime(elapsed)} sur Legends Rift !`;
    try {
      if (navigator.share) {
        await navigator.share({ text, url: window.location.href, title: "Legends Rift — Chrono-Break" });
      } else {
        await navigator.clipboard.writeText(`${text} ${window.location.href}`);
        alert("Score copié dans le presse-papiers !");
      }
    } catch {}
  }, [solved, ms, mode, formatTime, chronoDuration]);

  const isFirstImage = started && idx === 0;

  const progressPercent =
    mode === "chrono"
      ? (ms / chronoDuration) * 100
      : order.length > 0
      ? (solved / order.length) * 100
      : 0;

  const ctaWidth = "min-w-[118px] sm:min-w-[128px]";

  return (
    <div className="space-y-4 sm:space-y-5 overflow-x-hidden max-w-full">
      {/* Ligne(s) de commandes */}
      <div className="flex flex-col gap-2 sm:gap-3 max-w-full">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full">
          {/* Gauche */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Mode (switch) */}
            <div className="flex items-center gap-1.5">
              <span className="text-white/80 text-xs sm:text-sm">Mode :</span>
              <SwitchButton
                on={mode === "chrono"}
                onToggle={() => {
                  const toChrono = !(mode === "chrono");
                  setMode(toChrono ? "chrono" : "libre");
                  setMs(toChrono ? chronoDuration : 0);
                  setStarted(false);
                  setPaused(false);
                  setEndModal(null);
                }}
                ariaLabel="Basculer le mode (Chrono/Libre)"
              />
              <span
                className={`ml-1 inline-block w-12 text-center text-xs sm:text-sm font-semibold ${
                  mode === "chrono" ? "text-emerald-300" : "text-rose-300"
                }`}
              >
                {mode === "chrono" ? "Chrono" : "Libre"}
              </span>
            </div>

            {/* Skin (switch) */}
            <div className="flex items-center gap-1.5">
              <span className="text-white/80 text-xs sm:text-sm">Skin :</span>
              <SwitchButton
                on={useSkin}
                onToggle={() => setUseSkin((v) => !v)}
                ariaLabel="Activer les skins"
                onColor="bg-green-500/90 border-green-400/80"
                offColor="bg-zinc-600/90 border-zinc-500/80"
              />
              <span
                className={`ml-1 inline-block w-10 text-center text-xs sm:text-sm font-semibold ${
                  useSkin ? "text-emerald-300" : "text-zinc-300"
                }`}
              >
                {useSkin ? "Oui" : "Non"}
              </span>
            </div>

            {/* Partager : desktop à gauche */}
            <button
              type="button"
              onClick={onShare}
              className="hidden md:inline-flex rounded-md bg-white/10 hover:bg-white/15 ring-1 ring-white/15 px-3 py-1.5"
              title="Partager mon score"
              style={{ touchAction: "manipulation" }}
            >
              Partager
            </button>
          </div>

          {/* Milieu (centré) — desktop only */}
          <div className="hidden md:flex flex-1 items-center justify-center gap-3">
            {/* Boîte chrono cliquable (ouvre le menu) */}
            <ChronoBoxDropdown
              mode={mode}
              started={started}
              ms={ms}
              duration={chronoDuration}
              onChangeDuration={onChangeChronoDuration}
            />

            <div className="rounded-md bg-white/5 ring-1 ring-white/10 px-2.5 py-1">
              Score : <span className="font-semibold">{solved}</span> / {order.length}
            </div>
            <div className="rounded-md bg-white/5 ring-1 ring-white/10 px-2.5 py-1">
              Série : <span className="font-semibold">{streak}</span>
            </div>
          </div>

          {/* Droite — desktop/tablette */}
          <div className="ml-auto hidden md:flex items-center gap-2 sm:gap-3">
            {!started ? (
              <button
                type="button"
                onClick={start}
                className={`rounded-md bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-white font-semibold ${ctaWidth}`}
                style={{ touchAction: "manipulation" }}
              >
                Démarrer
              </button>
            ) : mode === "libre" ? (
              <button
                type="button"
                onClick={togglePause}
                className={`rounded-md ${paused ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-white/10 hover:bg-white/15 ring-1 ring-white/15"} px-3 py-1.5 font-semibold ${ctaWidth}`}
                style={{ touchAction: "manipulation" }}
              >
                {paused ? "Reprendre" : "Pause"}
              </button>
            ) : (
              <button
                type="button"
                onClick={abandon}
                className={`rounded-md bg-rose-600 hover:bg-rose-500 px-3 py-1.5 text-white font-semibold ${ctaWidth}`}
                title="Abandonner la partie"
                style={{ touchAction: "manipulation" }}
              >
                Abandonner
              </button>
            )}
          </div>
        </div>

        {/* Mobile L2: ⏱ (cliquable) + Score + Partager */}
        <div className="md:hidden flex flex-wrap items-center justify-center gap-2 w-full">
          <ChronoBoxDropdown
            mode={mode}
            started={started}
            ms={ms}
            duration={chronoDuration}
            onChangeDuration={onChangeChronoDuration}
          />
          <div className="rounded-md bg-white/5 ring-1 ring-white/10 px-2.5 py-1">
            Score : <span className="font-semibold">{solved}</span> / {order.length}
          </div>
          <button
            type="button"
            onClick={onShare}
            className="rounded-md bg-white/10 hover:bg-white/15 ring-1 ring-white/15 px-3 py-1.5"
            title="Partager mon score"
            style={{ touchAction: "manipulation" }}
          >
            Partager
          </button>
        </div>

        {/* Mobile L3: CTA + Série */}
        <div className="md:hidden flex items-center justify-center gap-2 w-full">
          {!started ? (
            <button
              type="button"
              onClick={start}
              className={`rounded-md bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-white font-semibold ${ctaWidth}`}
              style={{ touchAction: "manipulation" }}
            >
              Démarrer
            </button>
          ) : mode === "libre" ? (
            <button
              type="button"
              onClick={togglePause}
              className={`rounded-md ${paused ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-white/10 hover:bg-white/15 ring-1 ring-white/15"} px-3 py-1.5 font-semibold ${ctaWidth}`}
              style={{ touchAction: "manipulation" }}
            >
              {paused ? "Reprendre" : "Pause"}
            </button>
          ) : (
            <button
              type="button"
              onClick={abandon}
              className={`rounded-md bg-rose-600 hover:bg-rose-500 px-3 py-1.5 text-white font-semibold ${ctaWidth}`}
              title="Abandonner la partie"
              style={{ touchAction: "manipulation" }}
            >
              Abandonner
            </button>
          )}

          <div className="rounded-md bg-white/5 ring-1 ring-white/10 px-2.5 py-1">
            Série : <span className="font-semibold">{streak}</span>
          </div>
        </div>
      </div>

      {/* Barre visuelle */}
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
          {!started ? (
            <>
              <div className="absolute inset-0 rounded-xl">
                <div className="absolute inset-0 rounded-xl bg-[radial-gradient(120%_80%_at_50%_0%,rgba(99,102,241,0.20),rgba(16,185,129,0.18)_40%,rgba(0,0,0,0.55)_75%)]" />
                <div className="absolute inset-6 rounded-xl bg-gradient-to-br from-white/10 via-white/5 to-transparent ring-1 ring-white/10" />
              </div>
              <div className="absolute inset-0 grid place-items-center pointer-events-none">
                <button
                  type="button"
                  onClick={start}
                  className="pointer-events-auto rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-white font-bold text-lg shadow-2xl ring-1 ring-emerald-400/40"
                  style={{ touchAction: "manipulation" }}
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

          {/* Overlay bas (PC/Tablette) */}
          {started && currentChampion && (
            <div className="hidden md:block pointer-events-none absolute inset-x-0 bottom-0">
              <div className="pointer-events-auto mx-2 mb-2 rounded-lg bg-black/55 backdrop-blur-sm ring-1 ring-white/10 p-2 sm:p-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="hidden lg:block text-white/90 font-semibold truncate max-w-[40%]">
                    {revealName(currentChampion.name, lettersShown)}
                  </div>

                  <form
                    onSubmit={onSubmit}
                    className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3"
                  >
                    <label htmlFor="answer-overlay" className="sr-only">Votre réponse</label>
                    <input
                      id="answer-overlay"
                      name="answer-overlay"
                      ref={inputRef}
                      autoComplete="off"
                      enterKeyHint="done"
                      autoCapitalize="none"
                      spellCheck={false}
                      disabled={(mode === "libre" && paused)}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className={`min-w-0 w-full rounded-md bg-white/5 ring-1 ring-white/10 px-3 py-2 text-[16px] sm:text-[15px] text-white placeholder:text-white/40 outline-none
                        ${focusHalo ? "focus:ring-2 focus:ring-emerald-400/80" : ""}`}
                      placeholder="Tape le nom du champion…"
                      onFocus={() => setFocusHalo(true)}
                      onBlur={() => setFocusHalo(false)}
                    />
                    <button
                      type="button"
                      onClick={onReveal}
                      disabled={(mode === "libre" && paused)}
                      className="rounded-md bg-white/10 hover:bg-white/15 ring-1 ring-white/15 px-3 py-2 text-[16px] sm:text-sm"
                      style={{ touchAction: "manipulation" }}
                    >
                      Aide
                    </button>
                    <button
                      type="submit"
                      disabled={(mode === "libre" && paused)}
                      className="rounded-md bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-[16px] sm:text-sm font-semibold text-white"
                      style={{ touchAction: "manipulation" }}
                    >
                      Valider
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nom masqué (Mobile) */}
      <div className="md:hidden text-center text-base sm:text-lg lg:text-xl font-semibold text-white/90">
        {started && currentChampion ? revealName(currentChampion.name, lettersShown) : "—"}
      </div>

      {/* Formulaire (Mobile) */}
      <form
        onSubmit={onSubmit}
        className="md:hidden flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 max-w-full"
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
          className={`min-w-0 w-full sm:flex-1 rounded-md bg-white/5 ring-1 ring-white/10 px-3 py-2.5 text-[16px] sm:text-[15px] text-white placeholder:text-white/40 outline-none
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
            className="w-full sm:w-auto rounded-md bg-white/10 hover:bg-white/15 ring-1 ring-white/15 px-3 py-2.5 text-[16px] sm:text-sm"
            style={{ touchAction: "manipulation" }}
          >
            Aide (révéler)
          </button>
          <button
            type="submit"
            disabled={!started || (mode === "libre" && paused) || !currentChampion}
            className="w-full sm:w-auto rounded-md bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-[16px] sm:text-sm font-semibold text-white"
            style={{ touchAction: "manipulation" }}
          >
            Valider
          </button>
        </div>
      </form>

      {/* Bandeau de fin */}
      {endModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setEndModal(null)}
            aria-hidden
          />
          <div className="relative z-10 w-[min(92vw,560px)] rounded-2xl border border-white/10 bg-zinc-900/95 p-6 text-center shadow-2xl">
            <div className="text-xl font-bold text-white mb-1">{endModal.title}</div>
            <div className="text-white/90">{endModal.message}</div>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setEndModal(null)}
                className="rounded-md bg-white/10 hover:bg-white/15 ring-1 ring-white/15 px-4 py-2 text-[16px] sm:text-sm"
                style={{ touchAction: "manipulation" }}
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={start}
                className="rounded-md bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-[16px] sm:text-sm font-semibold text-white"
                style={{ touchAction: "manipulation" }}
              >
                Rejouer
              </button>
              <button
                type="button"
                onClick={onShare}
                className="rounded-md bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-[16px] sm:text-sm font-semibold text-white"
                style={{ touchAction: "manipulation" }}
              >
                Partager
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
