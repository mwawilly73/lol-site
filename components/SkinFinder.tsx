"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChampionMeta } from "@/lib/champions";

/* ========================= Constantes & utils ========================= */

const DDRAGON_SPLASH = "https://ddragon.leagueoflegends.com/cdn/img/champion/splash";

type Lang = "fr_FR" | "en_US";
type ChampionDetail = {
  data: Record<
    string,
    {
      id: string;
      name: string;
      skins: Array<{ id: number; name: string; num: number }>;
    }
  >;
};

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’`´^~\-_.:()&,+/\\\s]/g, "")
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
    const ai = a[i - 1]!;
    for (let j = 1; j <= n; j++) {
      const cost = ai === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
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

// Supprime les mentions du champion dans une chaîne normalisée (id, nom FR, nom EN).
function stripChampionTokensNormalized(
  sNorm: string,
  champId: string,
  champNameFR: string,
  champNameEN: string
) {
  let out = sNorm;
  const tokens = new Set<string>([
    norm(champId),
    norm(champNameFR),
    norm(champNameEN),
  ]);
  for (const t of tokens) {
    if (!t) continue;
    out = out.replaceAll(t, "");
  }
  return out;
}

// Skins par défaut ?
function isDefaultSkin(frName: string, enName: string, num: number) {
  if (num === 0) return true;
  const fr = norm(frName);
  const en = norm(enName);
  const def = new Set(["default", "classique", "original", "base", "classic"]);
  return def.has(fr) || def.has(en);
}

function allowedErrorsStrict(len: number) {
  // beaucoup plus strict que la précédente
  if (len <= 4) return 0;
  return Math.max(0, Math.floor((len - 1) / 2) - 1);
}
const MIN_LEN_RATIO = 0.7; // 70% de la longueur de la clé minimum

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

/* ========================= Chrono ========================= */
type GameMode = "libre" | "chrono";

const CHRONO_OPTIONS = [
  { ms: 90_000,  label: "1:30" },
  { ms: 300_000, label: "5:00" },
  { ms: 600_000, label: "10:00" },
  { ms: 900_000, label: "15:00" },
] as const;

function ChronoBoxDropdown({
  mode,
  started,
  ms,
  duration,
  onChangeDuration,
}: {
  mode: GameMode;
  started: boolean;
  ms: number;
  duration: number;
  onChangeDuration: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

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
  const timerWidth = "min-w-[118px] sm:min-w-[128px] lg:min-w-[144px]";

  const fmt = (t: number) => {
    const val = Math.max(0, t);
    const s = Math.floor(val / 1000);
    const mm = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    const ds = Math.floor((val % 1000) / 100).toString();
    return `${mm}:${ss}.${ds}`;
  };
  const currentLabel = CHRONO_OPTIONS.find(o => o.ms === duration)?.label ?? "1:30";

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(v => !v)}
        className={`rounded-md bg-white/5 ring-1 ring-white/10 px-2.5 py-1 font-mono tabular-nums text-center ${timerWidth}
          inline-flex items-center justify-center gap-1
          ${disabled ? "" : "hover:bg-white/10"}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={mode === "chrono" ? (disabled ? "Changer la durée (désactivé pendant la partie)" : "Cliquer pour changer la durée") : "Indisponible en mode Libre"}
        style={{ touchAction: "manipulation" }}
      >
        <span className="whitespace-nowrap">⏱ {fmt(ms)}</span>
        <span className={`text-white/70 ${disabled ? "opacity-60" : ""}`} aria-hidden>▾</span>
      </button>

      {open && !disabled && (
        <div
          className="absolute z-30 mt-1 min-w-[8rem] max-w-[calc(100vw-2rem)] rounded-md bg-[#0e1117] ring-1 ring-white/15 shadow-xl overflow-hidden"
          role="listbox"
        >
          <div className="px-3 py-2 text-[11px] uppercase tracking-wide text-white/50">
            Durée (actuelle : {currentLabel})
          </div>
          {CHRONO_OPTIONS.map((o) => {
            const active = o.ms === duration;
            return (
              <button
                key={o.ms}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => { onChangeDuration(o.ms); setOpen(false); }}
                className={`block w-full text-left px-3 py-1.5 text-sm ${
                  active ? "bg-emerald-500/20 text-emerald-300" : "text-white/90 hover:bg-white/10"
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

/* ========================= Fetch DDragon ========================= */

async function getLatestVersion(): Promise<string> {
  const res = await fetch("https://ddragon.leagueoflegends.com/api/versions.json", { cache: "force-cache" });
  const arr = (await res.json()) as string[];
  return arr[0]!;
}
async function getChampionDetail(version: string, champId: string, lang: Lang): Promise<ChampionDetail> {
  const url = `https://ddragon.leagueoflegends.com/cdn/${version}/data/${lang}/champion/${champId}.json`;
  const res = await fetch(url, { cache: "force-cache" });
  return (await res.json()) as ChampionDetail;
}

/* ========================= Composant ========================= */

export default function SkinFinder({ initialChampions }: { initialChampions: ChampionMeta[] }) {
  // Roster unique + shuffle
  const roster = useMemo(() => {
    const uniq = new Map<string, ChampionMeta>();
    for (const c of initialChampions) if (c?.id) uniq.set(c.id, c);
    const arr = Array.from(uniq.values());
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    }
    return arr;
  }, [initialChampions]);

  const [mode, setMode] = useState<GameMode>("chrono");
  const [chronoDuration, setChronoDuration] = useState<number>(CHRONO_OPTIONS[0].ms);
  const chronoLabel = useMemo(
    () => CHRONO_OPTIONS.find(o => o.ms === chronoDuration)?.label ?? "1:30",
    [chronoDuration]
  );
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [ms, setMs] = useState(chronoDuration);
  const timerRef = useRef<number | null>(null);

  const [idx, setIdx] = useState(0);
  const current = roster[idx];

  // Détails courants
  const [version, setVersion] = useState<string>("");
  const [skinNum, setSkinNum] = useState<number | null>(null);
  const [nameFR, setNameFR] = useState<string>("");
  const [nameEN, setNameEN] = useState<string>("");
  const [champNameFR, setChampNameFR] = useState<string>("");
  const [champNameEN, setChampNameEN] = useState<string>("");
  const [splashUrl, setSplashUrl] = useState<string>("");

  // UI
  const [lettersShown, setLettersShown] = useState(0);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [focusHalo, setFocusHalo] = useState(false);
  const [endModal, setEndModal] = useState<{ title: string; message: string } | null>(null);

  // Confettis
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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

  /* ------------ Version DDragon ------------ */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const v = await getLatestVersion();
        if (alive) setVersion(v);
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  /* ------------ Pick skin pour le champion courant (exclut default) ------------ */
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!started || !current?.id || !version) return;
      try {
        const [fr, en] = await Promise.all([
          getChampionDetail(version, current.id, "fr_FR"),
          getChampionDetail(version, current.id, "en_US"),
        ]);

        const frData = fr.data[current.id];
        const enData = en.data[current.id];
        if (!frData?.skins?.length || !enData?.skins?.length) return;

        // Exclure skins par défaut
        const candidates = frData.skins
          .filter(s => {
            const enSkin = enData.skins.find(e => e.num === s.num);
            const enName = enSkin?.name ?? "";
            return !isDefaultSkin(s.name, enName, s.num);
          })
          .map(s => s.num);

        if (!candidates.length) {
          setIdx(i => (i + 1) % roster.length);
          return;
        }

        const pick = candidates[Math.floor(Math.random() * candidates.length)]!;
        const frName = frData.skins.find(s => s.num === pick)?.name ?? "";
        const enName = enData.skins.find(s => s.num === pick)?.name ?? "";

        if (!alive) return;
        setSkinNum(pick);
        setNameFR(frName);
        setNameEN(enName);
        setChampNameFR(frData.name);
        setChampNameEN(enData.name);
        setSplashUrl(`${DDRAGON_SPLASH}/${current.id}_${pick}.jpg`);
        setLettersShown(0);
        setInput("");
        setTimeout(() => inputRef.current?.focus(), 0);
      } catch (e) {
        console.error("[SkinFinder] fetch champion detail failed", e);
      }
    })();
    return () => { alive = false; };
  }, [started, current?.id, version, roster.length]);

  /* ------------ Chrono ------------ */
  const formatTime = useCallback((t: number) => {
    const val = mode === "chrono" ? Math.max(0, t) : t;
    const s = Math.floor(val / 1000);
    const mm = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    const ds = Math.floor((val % 1000) / 100).toString();
    return `${mm}:${ss}.${ds}`;
  }, [mode]);

  const resetRun = useCallback(() => {
    setIdx(0);
    setInput("");
    setLettersShown(0);
    setStreak(0);
    setScore(0);
    setEndModal(null);
  }, []);

  const start = useCallback(() => {
    if (started) return;
    setStarted(true);
    setPaused(false);
    resetRun();
    setMs(mode === "chrono" ? chronoDuration : 0);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [started, mode, chronoDuration, resetRun]);

  const togglePause = useCallback(() => {
    if (mode === "chrono") return;
    setPaused(p => !p);
  }, [mode]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const stop = useCallback(() => {
    setStarted(false);
    setPaused(false);
    stopTimer();
  }, [stopTimer]);

  const abandon = useCallback(() => {
    stop();
    setEndModal({
      title: "🛑 Abandon",
      message: `En ${chronoLabel}, tu as trouvé ${score} skins.`,
    });
  }, [stop, chronoLabel, score]);

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
          stopTimer();
          setEndModal({
            title: "⏱ Temps écoulé !",
            message: `En ${chronoLabel}, tu as trouvé ${score} skins.`,
          });
          return 0;
        }
        return next;
      });
    }, 100) as unknown as number;

    return () => stopTimer();
  }, [started, paused, mode, score, chronoLabel, stopTimer]);

  useEffect(() => {
    if (!started) setMs(mode === "chrono" ? chronoDuration : 0);
  }, [mode, chronoDuration, started]);

  const onChangeChronoDuration = useCallback((v: number) => {
    setChronoDuration(v);
    if (!started) setMs(v);
  }, [started]);

  /* ------------ Validation stricte ------------ */
const validate = useCallback((raw: string) => {
  const s = norm(raw.trim());
  if (!s) return false;

  const keyFR = norm(nameFR);
  const keyEN = norm(nameEN);

  // clés sans le champion
  const keyFR_wo = stripChampionTokensNormalized(keyFR, current?.id ?? "", champNameFR, champNameEN);
  const keyEN_wo = stripChampionTokensNormalized(keyEN, current?.id ?? "", champNameFR, champNameEN);

  // saisie sans le champion
  const s_wo = stripChampionTokensNormalized(s, current?.id ?? "", champNameFR, champNameEN);

  // candidates (on garde aussi les versions complètes au cas où les skins n’incluent pas le nom du champion)
  const keys = [keyFR, keyEN, keyFR_wo, keyEN_wo].filter(Boolean);
  const inputs = [s, s_wo].filter(Boolean);

  // 1) égalité stricte d'abord
  for (const inp of inputs) {
    for (const k of keys) {
      if (inp === k) return true;
    }
  }

  // 2) ratio de longueur minimal + distance d'édition <= seuil strict
  for (const inp of inputs) {
    for (const k of keys) {
      // On travaille uniquement sur la "vraie" clé (si _wo est vide, on utilise k)
      const key = k;
      // Longueur minimale : empêche de valider avec trop peu de lettres
      const minLen = Math.ceil(key.length * MIN_LEN_RATIO);
      if (inp.length < minLen) continue;

      const d = lev(inp, key);
      const tol = allowedErrorsStrict(key.length);
      if (d <= tol) return true;
    }
  }

  return false;
}, [nameFR, nameEN, champNameFR, champNameEN, current?.id]);







  const maskedFR = nameFR ? revealName(nameFR, lettersShown) : "";
  const maskedEN = nameEN ? revealName(nameEN, lettersShown) : "";

  const onSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!nameFR && !nameEN) return;
    if (validate(input)) {
      setScore(s => s + 1);
      setStreak(t => t + 1);
      burstConfetti();
      setIdx(i => (i + 1) % roster.length);
      setLettersShown(0);
      setInput("");
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setStreak(0);
    }
  }, [input, nameFR, nameEN, validate, roster.length, burstConfetti]);

  const onReveal = useCallback(() => {
    const total = Math.max(countLetters(nameFR), countLetters(nameEN));
    setLettersShown(n => Math.min(total, n + 1));
  }, [nameFR, nameEN]);

  /* ------------ UI dérivées ------------ */
  const isFirst = started && idx === 0;
  const progressPercent =
    mode === "chrono"
      ? (ms / chronoDuration) * 100
      : roster.length > 0
      ? (score / roster.length) * 100
      : 0;

  const ctaWidth = "min-w-[118px] sm:min-w-[128px]";

  /* ========================= Rendu ========================= */
  return (
    <div
      className="space-y-4 sm:space-y-5 overflow-hidden max-w-full"
      style={{ scrollbarGutter: "stable both-edges" }}
    >
      {/* Commandes */}
      <div className="flex flex-col gap-2 sm:gap-3 max-w-full">
        {/* Rangée (desktop): comme avant — mobile: mode + score */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full">
          {/* Gauche : Mode + Score (à côté sur mobile) */}
          <div className="flex items-center gap-3 sm:gap-4">
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

            {/* Score (largeur fixée pour éviter les décalages) */}
            <div className="rounded-md bg-white/5 ring-1 ring-white/10 px-2.5 py-1 min-w-[110px] text-center">
              Score : <span className="font-semibold">{score}</span>
            </div>
          </div>

          {/* Centre (desktop) : chrono */}
          <div className="hidden md:flex flex-1 items-center justify-center">
            <ChronoBoxDropdown
              mode={mode}
              started={started}
              ms={ms}
              duration={chronoDuration}
              onChangeDuration={onChangeChronoDuration}
            />
          </div>

          {/* Droite : CTA (desktop) — largeur fixe */}
          <div className="ml-auto hidden md:flex items-center gap-2 sm:gap-3">
            {!started ? (
              <button
                type="button"
                onClick={start}
                className={`rounded-md bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-white font-semibold ${ctaWidth} min-w-[130px]`}
                style={{ touchAction: "manipulation" }}
              >
                Démarrer
              </button>
            ) : mode === "libre" ? (
              <button
                type="button"
                onClick={togglePause}
                className={`rounded-md ${paused ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-white/10 hover:bg-white/15 ring-1 ring-white/15"} px-3 py-1.5 font-semibold ${ctaWidth} min-w-[130px]`}
                style={{ touchAction: "manipulation" }}
              >
                {paused ? "Reprendre" : "Pause"}
              </button>
            ) : (
              <button
                type="button"
                onClick={abandon}
                className={`rounded-md bg-rose-600 hover:bg-rose-500 px-3 py-1.5 text-white font-semibold ${ctaWidth} min-w-[130px]`}
                title="Abandonner la partie"
                style={{ touchAction: "manipulation" }}
              >
                Abandonner
              </button>
            )}
          </div>
        </div>

        {/* Rangée mobile : CTA + Chrono côte à côte (largeurs fixes) */}
        <div className="md:hidden flex flex-wrap items-center justify-center gap-2 w-full">
          {!started ? (
            <button
              type="button"
              onClick={start}
              className={`rounded-md bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-white font-semibold ${ctaWidth} min-w-[130px]`}
              style={{ touchAction: "manipulation" }}
            >
              Démarrer
            </button>
          ) : mode === "libre" ? (
            <button
              type="button"
              onClick={togglePause}
              className={`rounded-md ${paused ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-white/10 hover:bg-white/15 ring-1 ring-white/15"} px-3 py-1.5 font-semibold ${ctaWidth} min-w-[130px]`}
              style={{ touchAction: "manipulation" }}
            >
              {paused ? "Reprendre" : "Pause"}
            </button>
          ) : (
            <button
              type="button"
              onClick={abandon}
              className={`rounded-md bg-rose-600 hover:bg-rose-500 px-3 py-1.5 text-white font-semibold ${ctaWidth} min-w-[130px]`}
              title="Abandonner la partie"
              style={{ touchAction: "manipulation" }}
            >
              Abandonner
            </button>
          )}

          <div className="min-w-[140px]">
            <ChronoBoxDropdown
              mode={mode}
              started={started}
              ms={ms}
              duration={chronoDuration}
              onChangeDuration={onChangeChronoDuration}
            />
          </div>

          <div className="rounded-md bg-white/5 ring-1 ring-white/10 px-2.5 py-1 min-w-[100px] text-center">
            Série : <span className="font-semibold">{streak}</span>
          </div>
        </div>
      </div>

      {/* Barre de progression */}
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

      {/* Zone image + Infos */}
      <div className="relative w-full max-w-full overflow-hidden rounded-xl ring-1 ring-white/10 bg-black/40">
        <div className="relative mx-auto aspect-[1215/717] w-full">
          {!started ? (
            <div className="absolute inset-0 grid place-items-center">
              <button
                type="button"
                onClick={start}
                className="rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-white font-bold text-lg shadow-2xl ring-1 ring-emerald-400/40 min-w-[160px]"
                style={{ touchAction: "manipulation" }}
              >
                Démarrer
              </button>
            </div>
          ) : splashUrl ? (
            <Image
              src={splashUrl}
              alt="Skin de champion LoL"
              fill
              sizes="(min-width:1536px) 1152px, (min-width:1280px) 1024px, (min-width:1024px) 928px, (min-width:768px) 704px, 96vw"
              className="object-contain object-center"
              priority={isFirst}
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                if (current?.id && skinNum != null) {
                  img.src = `${DDRAGON_SPLASH}/${current.id}_${skinNum}.jpg`;
                }
              }}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-white/70">
              <span>Chargement…</span>
            </div>
          )}

          {/* Confettis */}
          <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" aria-hidden />

          {/* Overlay bas (desktop/tablette) */}
          {started && (
            <div className="hidden md:block pointer-events-none absolute inset-x-0 bottom-0">
              <div className="pointer-events-auto mx-2 mb-2 rounded-lg bg-black/55 backdrop-blur-sm ring-1 ring-white/10 p-2 sm:p-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  {/* Nom du champion (fixe) */}
                  <div className="hidden lg:block text-white/90 font-semibold truncate max-w-[40%]">
                    {champNameFR || current?.name || "—"}
                  </div>

                  {/* FR/EN (desktop côte à côte) */}
                  <div className="hidden lg:block text-white/80 text-sm min-w-[220px]">
                    <div><span className="opacity-80">FR :</span> {maskedFR || "—"}</div>
                    <div><span className="opacity-80">EN :</span> {maskedEN || "—"}</div>
                  </div>

                  <form
                    onSubmit={onSubmit}
                    className="flex-1 min-w-0 max-w-full flex items-center gap-2 sm:gap-3"
                    autoComplete="off"
                  >
                    <label htmlFor="answer-overlay" className="sr-only">Nom du skin (FR ou EN)</label>
                    <input
                      id="answer-overlay"
                      ref={inputRef}
                      name="sf-guess"
                      autoComplete="off"
                      inputMode="search"
                      enterKeyHint="done"
                      autoCapitalize="none"
                      spellCheck={false}
                      aria-autocomplete="none"
                      disabled={(mode === "libre" && paused)}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className={`min-w-0 w-full rounded-md bg-white/5 ring-1 ring-white/10 px-3 py-2 text-[16px] sm:text-[15px] text-white placeholder:text-white/40 outline-none ${
                        focusHalo ? "focus:ring-2 focus:ring-emerald-400/80" : ""
                      }`}
                      placeholder="Tape le nom du skin (FR ou EN)…"
                      onFocus={() => setFocusHalo(true)}
                      onBlur={() => setFocusHalo(false)}
                    />
                    <button
                      type="button"
                      onClick={onReveal}
                      disabled={(mode === "libre" && paused)}
                      className="rounded-md bg-white/10 hover:bg-white/15 ring-1 ring-white/15 px-3 py-2 text-[16px] sm:text-sm min-w-[90px] text-center"
                      style={{ touchAction: "manipulation" }}
                    >
                      Aide
                    </button>
                    <button
                      type="submit"
                      disabled={(mode === "libre" && paused)}
                      className="rounded-md bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-[16px] sm:text-sm font-semibold text-white min-w-[96px] text-center"
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

      {/* Mobile : champion + FR/EN empilés */}
      {started && (
        <>
          <div className="md:hidden text-center text-base sm:text-lg font-semibold text-white/90">
            {champNameFR || current?.name || "—"}
          </div>
          <div className="md:hidden text-center text-sm text-white/80 space-y-1">
            <div><span className="opacity-80">FR :</span> {maskedFR || "—"}</div>
            <div><span className="opacity-80">EN :</span> {maskedEN || "—"}</div>
          </div>

          <form
            onSubmit={onSubmit}
            className="md:hidden flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 max-w-full"
            autoComplete="off"
          >
            <label htmlFor="answer" className="sr-only">Nom du skin (FR ou EN)</label>
            <input
              id="answer"
              ref={inputRef}
              name="sf-guess"
              autoComplete="off"
              inputMode="search"
              enterKeyHint="done"
              autoCapitalize="none"
              spellCheck={false}
              aria-autocomplete="none"
              disabled={(mode === "libre" && paused)}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className={`min-w-0 w-full sm:flex-1 rounded-md bg-white/5 ring-1 ring-white/10 px-3 py-2.5 text-[16px] sm:text-[15px] text-white placeholder:text-white/40 outline-none ${
                focusHalo ? "focus:ring-2 focus:ring-emerald-400/80" : ""
              }`}
              placeholder="Nom du skin (FR ou EN)…"
              onFocus={() => setFocusHalo(true)}
              onBlur={() => setFocusHalo(false)}
            />

            <div className="flex gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onReveal}
                disabled={(mode === "libre" && paused)}
                className="w-full sm:w-auto rounded-md bg-white/10 hover:bg-white/15 ring-1 ring-white/15 px-3 py-2.5 text-[16px] sm:text-sm min-w-[90px] text-center"
                style={{ touchAction: "manipulation" }}
              >
                Aide
              </button>
              <button
                type="submit"
                disabled={(mode === "libre" && paused)}
                className="w-full sm:w-auto rounded-md bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-[16px] sm:text-sm font-semibold text-white min-w-[96px] text-center"
                style={{ touchAction: "manipulation" }}
              >
                Valider
              </button>
            </div>
          </form>
        </>
      )}

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
                className="rounded-md bg-white/10 hover:bg-white/15 ring-1 ring-white/15 px-4 py-2 text-[16px] sm:text-sm min-w-[100px]"
                style={{ touchAction: "manipulation" }}
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={start}
                className="rounded-md bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-[16px] sm:text-sm font-semibold text-white min-w-[110px]"
                style={{ touchAction: "manipulation" }}
              >
                Rejouer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
