// lib/fuzzy.ts
// Normalisation FR (accents), alias champions usuels, fuzzy-match léger (distance ≤ 1)

export function normalizeName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// Aliases usuels → canonical
const ALIASES_RAW: Record<string, string[]> = {
  AurelionSol: ["asol", "aurelion", "aurelionsol"],
  ChoGath: ["chogath", "cho", "choghat"],
  KhaZix: ["khazix", "khaz", "k6"],
  LeBlanc: ["leblanc", "lb"],
  VelKoz: ["velkoz", "velkoze"],
  KogMaw: ["kogmaw", "kog"],
  RekSai: ["reksai", "reksay"],
  Wukong: ["monkeyking", "wu", "wukong"],
  DrMundo: ["drmundo", "mundo"],
  Nunu: ["nunu", "nunuetwillump", "nunuwillump", "nunu&willump"],
  JarvanIV: ["jarvan", "j4"],
  TwistedFate: ["tf", "twisted"],
  MissFortune: ["mf"],
  TahmKench: ["tahm", "kench", "tahmkench"],
};

const aliasMap = new Map<string, string>(); // normalized alias -> canonical
for (const [canon, list] of Object.entries(ALIASES_RAW)) {
  aliasMap.set(normalizeName(canon), canon);
  for (const a of list) aliasMap.set(normalizeName(a), canon);
}

export function resolveAlias(input: string): string {
  const norm = normalizeName(input);
  return aliasMap.get(norm) ?? input;
}

// Levenshtein distance (early-exit > max)
export function levenshtein(a: string, b: string, max = 1): number {
  if (a === b) return 0;
  const la = a.length, lb = b.length;
  if (Math.abs(la - lb) > max) return max + 1;

  const dp = new Array(lb + 1);
  for (let j = 0; j <= lb; j++) dp[j] = j;

  for (let i = 1; i <= la; i++) {
    let prev = dp[0];
    dp[0] = i;
    let minRow = dp[0];
    for (let j = 1; j <= lb; j++) {
      const temp = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
      prev = temp;
      if (dp[j] < minRow) minRow = dp[j];
    }
    if (minRow > max) return max + 1;
  }
  return dp[lb];
}

export function fuzzyEq(a: string, b: string): boolean {
  const A = normalizeName(resolveAlias(a));
  const B = normalizeName(resolveAlias(b));
  if (A === B) return true;
  return levenshtein(A, B, 1) <= 1; // tolère 1 faute
}
