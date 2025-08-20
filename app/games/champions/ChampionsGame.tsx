// app/games/champions/ChampionsGame.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Matching intelligent des noms :
//  - casse/accents/apostrophes/espaces/ponctuation ignorés
//  - romains ⇄ chiffres (IV -> 4)
//  - alias explicites (Maitre Yi -> Master Yi, Wukong <-> MonkeyKing, ...)
//  - alias automatiques par **tokens du nom** (>=3 lettres) → ex :
//      "Nunu & Willump" => "nunu", "willump"
//      "Renata Glasc"   => "renata", "glasc"
//  - secours Levenshtein (<= 1) seulement si saisie >= 4 lettres
//  - règle entrées 2–3 lettres : **exact uniquement** (pas de fuzzy)
// Conserve : timer, pause/reprendre, reset total, UI, etc.
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

/* 1) Normalisation agressive :
   - minuscules
   - supprime accents
   - supprime espaces, apostrophes, tirets, points et tout non alphanumérique
   -> "K'Santé" => "ksante", "Le Blanc" => "leblanc", "Jarvan IV" => "jarvaniv"
*/
function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")      // accents
    .replace(/['’`´^~\-_.\s]/g, "")       // séparateurs mous
    .replace(/[^a-z0-9]/g, "");           // garde a-z0-9
}

/* 2) Levenshtein (secours) */
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

/* 3) Alias explicites (après norm()) : clés & valeurs déjà normalisées */
const EXPLICIT_ALIASES: Record<string, string> = {
  // MonkeyKing / Wukong
  monkeyking: "wukong",
  wukong: "wukong",

  // Master Yi — Maître/Maitre Yi
  maitreyi: "masteryi",
  masteryi: "masteryi",

  // Jarvan IV — "jarvan", "jarvan4", "jarvan iv"
  jarvan: "jarvaniv",
  jarvan4: "jarvaniv",
  jarvaniv: "jarvaniv",

  // LeBlanc — "le blanc"
  leblanc: "leblanc",

  // K'Santé — toutes variantes reviennent à "ksante"
  ksante: "ksante",
};

/* Utilitaire : retire un suffixe numérique final (ex: "jarvan4" -> "jarvan") */
function stripTrailingNumber(s: string) {
  const m = s.match(/^(.*?)(\d+)$/);
  return m ? m[1] : s;
}

/* 4) Génère les alias utiles par champion (retourne un tableau de clés normalisées)
      - name normalisé
      - alias explicites (si concerné)
      - **tokens du nom** (>=3 lettres), ex :
          "Nunu & Willump"  → "nunu", "willump"
          "Renata Glasc"    → "renata", "glasc"
*/
function aliasKeysForChampion(c: ChampionMeta): string[] {
  const keys = new Set<string>();

  // clé principale (nom complet normalisé)
  const nName = norm(c.name);
  if (nName) keys.add(nName);

  // alias explicites connus
  if (EXPLICIT_ALIASES[nName]) {
    keys.add(EXPLICIT_ALIASES[nName]); // map vers canon
  }

  // tokens du nom (>=3 lettres), split sur non alphanum
  const rawTokens = (c.name || "")
    .split(/[^A-Za-z0-9]+/g)
    .map((t) => norm(t))
    .filter((t) => t && t.length >= 3);

  for (const t of rawTokens) keys.add(t);

  // Cas particuliers supplémentaires déjà couverts par tokens,
  // mais on “assure” pour les exemples demandés :
  // - "Nunu & Willump" : tokens donnent "nunu", "willump"
  // - "Renata Glasc" : tokens donnent "renata", "glasc"

  // Jarvan : si le nom contient IV, on ajoute "jarvan" et "jarvan4"
  if (nName === "jarvaniv") {
    keys.add("jarvan");
    keys.add("jarvan4");
  }

  // Master Yi : ajoute aussi "maitreyi"
  if (nName === "masteryi") {
    keys.add("maitreyi");
  }

  // Wukong/MonkeyKing : déjà couverts par EXPLICIT_ALIASES, on ajoute l’autre si besoin
  if (nName === "wukong") keys.add("monkeyking");
  if (nName === "monkeyking") keys.add("wukong");

  return Array.from(keys);
}

/* 5) Prépare les index de recherche :
   - lookup : Map<clé normalisée, ChampionMeta>
   - shortKeys: Set des **clés ajoutées** qui font 2–3 lettres (ex: "vi", "jax", "lux", "zed")
     (sert à bloquer la tolérance pour ces cibles)
*/
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

export default function ChampionsGame({ initialChampions }: Props) {
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

  /* 6) Tente de révéler :
        - direct via lookup (noms, alias, tokens)
        - sinon fuzzy avec seuil dépendant de la longueur de la **saisie**
          * si saisie < 4 chars => seuil = 0 (AUCUNE faute tolérée)
          * si saisie >= 4 => seuil = 1
        - en fuzzy, on évite les **cibles** dont la clé est courte (2–3)
          pour empêcher "v" => "vex", etc.
  */
  const tryReveal = useCallback(
    (raw: string) => {
      const q = norm(raw.trim());
      setLastTry(raw.trim());

      if (!q) {
        setLastResult("⛔ Saisie vide");
        return;
      }

      // 1) Direct match (noms + alias + tokens)
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

      // 2) Fuzzy (seuil selon la longueur de la **requête**)
      const threshold = q.length >= 4 ? 1 : 0;
      if (threshold === 0) {
        setLastResult("❌ Aucun champion correspondant");
        return;
      }

      // 3) Recherche du meilleur candidat (éviter cibles à clé courte)
      let best: ChampionMeta | undefined;
      let bestD = Infinity;

      for (const [key, champ] of lookup) {
        if (shortKeys.has(key)) continue; // évite faux positifs vers noms courts
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

  return (
    <div className="space-y-6">
      {/* Ligne d’infos */}
      <div className="info-row">
        <div /> {/* spacer */}
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

      {/* Grille des cartes */}
      <div className="cards-grid">
        {initialChampions.map((c) => (
          <ChampionCard key={c.slug} champ={c} isRevealed={revealed.has(c.slug)} />
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
