"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChampionMeta } from "@/lib/champions";

// DDragon Splash docs: /cdn/img/champion/splash/{Id}_{num}.jpg
// (num = skins[].num dans champion/{Id}.json) — voir Data Dragon docs. 
const DDRAGON_SPLASH = "https://ddragon.leagueoflegends.com/cdn/img/champion/splash";

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

// Petit switch visuel (même style que Chrono)
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

/* ------------------------------ Types ------------------------------ */
type Lang = "fr_FR" | "en_US";
type ChampionDetail = {
  data: Record<string, { id: string; name: string; skins: Array<{ id: number; name: string; num: number }> }>;
};

/* --------- Fetch helpers (versions + champion detail par langue) --------- */
// version la + récente
async function getLatestVersion(): Promise<string> {
  const res = await fetch("https://ddragon.leagueoflegends.com/api/versions.json", { cache: "force-cache" });
  const arr = (await res.json()) as string[];
  return arr[0]!;
}
// detail champion pour une langue
async function getChampionDetail(version: string, champId: string, lang: Lang): Promise<ChampionDetail> {
  const url = `https://ddragon.leagueoflegends.com/cdn/${version}/data/${lang}/champion/${champId}.json`;
  const res = await fetch(url, { cache: "force-cache" });
  return (await res.json()) as ChampionDetail;
}

/* ------------------------------ Jeu ------------------------------ */
export default function SkinFinder({ initialChampions }: { initialChampions: ChampionMeta[] }) {
  // Liste de champions unique + shuffle pour sessions variées
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

  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const current = roster[idx];

  // Données du skin courant
  const [version, setVersion] = useState<string>("");
  const [skinNum, setSkinNum] = useState<number | null>(null);
  const [nameFR, setNameFR] = useState<string>("");
  const [nameEN, setNameEN] = useState<string>("");
  const [splashUrl, setSplashUrl] = useState<string>("");

  // UI état
  const [lettersShown, setLettersShown] = useState(0);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showChampion, setShowChampion] = useState(true); // Afficher le nom du champion
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [focusHalo, setFocusHalo] = useState(false);

  // Confettis simple
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

  // Initialiser la version une fois
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

  // Choisir un skin pour le champion courant (après start et version OK)
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!started || !current?.id || !version) return;
      try {
        // On récupère le détail FR et EN pour CE champion uniquement
        const [fr, en] = await Promise.all([
          getChampionDetail(version, current.id, "fr_FR"),
          getChampionDetail(version, current.id, "en_US"),
        ]);
        const frData = fr.data[current.id];
        const enData = en.data[current.id];

        if (!frData?.skins?.length || !enData?.skins?.length) return;

        // Choisir un skin au hasard dans la liste du champion
        const candidates = frData.skins.map(s => s.num);
        const pick = candidates[Math.floor(Math.random() * candidates.length)]!;

        // Nom FR / EN (même num)
        const frName = frData.skins.find(s => s.num === pick)?.name ?? "";
        const enName = enData.skins.find(s => s.num === pick)?.name ?? "";

        if (!alive) return;
        setSkinNum(pick);
        setNameFR(frName);
        setNameEN(enName);
        setSplashUrl(`${DDRAGON_SPLASH}/${current.id}_${pick}.jpg`);
        setLettersShown(0);
        setInput("");
        setTimeout(() => inputRef.current?.focus(), 0);
      } catch (e) {
        console.error("[SkinFinder] fetch champion detail failed", e);
      }
    })();
    return () => { alive = false; };
  }, [started, current?.id, version]);

  const maskedFR = nameFR ? revealName(nameFR, lettersShown) : "";
  const maskedEN = nameEN ? revealName(nameEN, lettersShown) : "";

  const validate = useCallback((raw: string) => {
    const s = norm(raw.trim());
    if (!s) return false;
    const keys = [norm(nameFR), norm(nameEN)].filter(Boolean);
    if (keys.includes(s)) return true;
    // Tolérance edit-distance légère
    let best = Infinity;
    for (const k of keys) best = Math.min(best, lev(s, k));
    const L = Math.max(s.length, ...keys.map(k => k.length));
    return best <= (L <= 6 ? 1 : L <= 10 ? 2 : 3);
  }, [nameFR, nameEN]);

  const onSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!nameFR && !nameEN) return;
    if (validate(input)) {
      setScore(s => s + 1);
      setStreak(t => t + 1);
      burstConfetti();
      setIdx(i => (i + 1) % roster.length); // next
    } else {
      setStreak(0);
    }
  }, [input, nameFR, nameEN, validate, roster.length, burstConfetti]);

  const onReveal = useCallback(() => {
    const total = Math.max(countLetters(nameFR), countLetters(nameEN));
    setLettersShown(n => Math.min(total, n + 1));
  }, [nameFR, nameEN]);

  const start = useCallback(() => {
    setStarted(true);
    setIdx(0);
    setScore(0);
    setStreak(0);
  }, []);

  const isFirst = started && idx === 0;

  return (
    <div className="space-y-4 sm:space-y-5 overflow-x-hidden max-w-full">
      {/* Ligne commandes */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="rounded-md bg-white/5 ring-1 ring-white/10 px-2.5 py-1">
          Score : <span className="font-semibold">{score}</span>
        </div>
        <div className="rounded-md bg-white/5 ring-1 ring-white/10 px-2.5 py-1">
          Série : <span className="font-semibold">{streak}</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-white/80 text-xs sm:text-sm">Afficher champion :</span>
            <SwitchButton
              on={showChampion}
              onToggle={() => setShowChampion(v => !v)}
              ariaLabel="Afficher/Masquer le nom du champion"
              onColor="bg-indigo-500/90 border-indigo-400/80"
              offColor="bg-zinc-600/90 border-zinc-500/80"
            />
          </div>

          {!started ? (
            <button
              type="button"
              onClick={start}
              className="rounded-md bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-white font-semibold min-w-[118px]"
              style={{ touchAction: "manipulation" }}
            >
              Démarrer
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIdx(i => (i + 1) % roster.length)}
              className="rounded-md bg-white/10 hover:bg-white/15 ring-1 ring-white/15 px-3 py-1.5 font-semibold min-w-[118px]"
              title="Passer"
              style={{ touchAction: "manipulation" }}
            >
              Passer
            </button>
          )}
        </div>
      </div>

      {/* Zone image */}
      <div className="relative w-full max-w-full overflow-hidden rounded-xl ring-1 ring-white/10 bg-black/40">
        <div className="relative mx-auto aspect-[1215/717] w-full">
          {!started ? (
            <div className="absolute inset-0 grid place-items-center">
              <button
                type="button"
                onClick={start}
                className="rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-white font-bold text-lg shadow-2xl ring-1 ring-emerald-400/40"
                style={{ touchAction: "manipulation" }}
              >
                Démarrer
              </button>
            </div>
          ) : splashUrl ? (
            <Image
              src={splashUrl}
              alt={current?.name ? `Skin de ${current.name}` : "Skin LoL"}
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

          {/* Confetti canvas */}
          <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" aria-hidden />

          {/* Overlay bas (desktop/tablette) */}
          {started && (
            <div className="hidden md:block pointer-events-none absolute inset-x-0 bottom-0">
              <div className="pointer-events-auto mx-2 mb-2 rounded-lg bg-black/55 backdrop-blur-sm ring-1 ring-white/10 p-2 sm:p-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  {/* Nom du champion (optionnel) */}
                  {showChampion && current?.name && (
                    <div className="hidden lg:block text-white/90 font-semibold truncate max-w-[40%]">
                      {current.name}
                    </div>
                  )}

                  {/* Masque FR/EN pour aider visuellement */}
                  <div className="hidden lg:block text-white/80 text-sm">
                    <span className="opacity-80">FR:</span> {maskedFR || "—"} &nbsp;|&nbsp; 
                    <span className="opacity-80">EN:</span> {maskedEN || "—"}
                  </div>

                  <form onSubmit={onSubmit} className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3">
                    <label htmlFor="answer-overlay" className="sr-only">Nom du skin</label>
                    <input
                      id="answer-overlay"
                      ref={inputRef}
                      autoComplete="off"
                      enterKeyHint="done"
                      autoCapitalize="none"
                      spellCheck={false}
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
                      className="rounded-md bg-white/10 hover:bg-white/15 ring-1 ring-white/15 px-3 py-2 text-[16px] sm:text-sm"
                      style={{ touchAction: "manipulation" }}
                    >
                      Aide
                    </button>
                    <button
                      type="submit"
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

      {/* Mobile : infos + formulaire */}
      {started && current && (
        <>
          {/* Nom champion (optionnel) */}
          {showChampion && (
            <div className="md:hidden text-center text-base sm:text-lg font-semibold text-white/90">
              {current.name}
            </div>
          )}

          {/* Masques FR/EN */}
          <div className="md:hidden text-center text-sm text-white/70">
            <span className="opacity-80">FR:</span> {maskedFR || "—"} &nbsp;|&nbsp; 
            <span className="opacity-80">EN:</span> {maskedEN || "—"}
          </div>

          <form onSubmit={onSubmit} className="md:hidden flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 max-w-full">
            <label htmlFor="answer" className="sr-only">Nom du skin</label>
            <input
              id="answer"
              ref={inputRef}
              autoComplete="off"
              enterKeyHint="done"
              autoCapitalize="none"
              spellCheck={false}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className={`min-w-0 w-full sm:flex-1 rounded-md bg-white/5 ring-1 ring-white/10 px-3 py-2.5 text-[16px] sm:text-[15px] text-white placeholder:text-white/40 outline-none ${
                focusHalo ? "focus:ring-2 focus:ring-emerald-400/80" : ""
              }`}
              placeholder="Tape le nom du skin (FR ou EN)…"
              onFocus={() => setFocusHalo(true)}
              onBlur={() => setFocusHalo(false)}
            />

            <div className="flex gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onReveal}
                className="w-full sm:w-auto rounded-md bg-white/10 hover:bg-white/15 ring-1 ring-white/15 px-3 py-2.5 text-[16px] sm:text-sm"
                style={{ touchAction: "manipulation" }}
              >
                Aide
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto rounded-md bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-[16px] sm:text-sm font-semibold text-white"
                style={{ touchAction: "manipulation" }}
              >
                Valider
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
