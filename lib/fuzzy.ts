// lib/fuzzy.ts
// Normalisation FR stricte, alias explicites + fautes usuelles,
// Levenshtein, et helpers pour comparer un input à UN champion.
//
// Utilisé par le mode Chrono, et compatible avec le style de ton “liste des champions”.

export type FuzzyChampion = { id: string; name: string };

/* ------------------------------ Utils ------------------------------ */
export function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")      // accents
    .replace(/['’`´^~\-_.\s]/g, "")       // ponctuation douce & espaces
    .replace(/[^a-z0-9]/g, "");           // sécurité
}

export function lev(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    const ai = a[i - 1];
    for (let j = 1; j <= n; j++) {
      const cost = ai === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,     // delete
        dp[i][j - 1] + 1,     // insert
        dp[i - 1][j - 1] + cost // replace
      );
    }
  }
  return dp[m][n];
}

/* ------------------------- Alias explicites ------------------------ */
// alias -> canon normalisé (ex: "monkeyking" => "wukong")
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

// fautes fréquentes par canon normalisé
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
export function aliasKeysForChampion(c: FuzzyChampion): string[] {
  const keys = new Set<string>();
  const nName = norm(c.name);
  if (nName) keys.add(nName);

  // mots (évite d louper "Miss Fortune", "Lee Sin", etc.)
  (c.name || "")
    .split(/[^A-Za-z0-9]+/g)
    .map((t) => norm(t))
    .filter((t) => t && t.length >= 3)
    .forEach((t) => keys.add(t));

  // équivalences explicites
  if (EXPLICIT_ALIASES[nName]) keys.add(EXPLICIT_ALIASES[nName]);
  if (nName === "jarvaniv") { keys.add("jarvan"); keys.add("jarvan4"); }
  if (nName === "masteryi") keys.add("maitreyi");
  if (nName === "wukong") keys.add("monkeyking");

  // fautes fréquentes
  const extras = SPECIAL_ALIASES_BY_CANON[nName];
  if (extras) extras.forEach((a) => keys.add(a));

  return Array.from(keys);
}

/* ----------------------- Comparaison unique ------------------------ */
// true si l'input correspond au champion c (exact, alias ou lev <= 1)
export function goodGuess(input: string, c: FuzzyChampion): boolean {
  const nIn = norm(input);
  if (!nIn) return false;

  const keys = aliasKeysForChampion(c);
  for (const k of keys) {
    if (nIn === k) return true;        // exact après normalisation
    if (lev(nIn, k) <= 1) return true; // petite faute tolérée
  }
  return false;
}
