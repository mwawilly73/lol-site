// lib/consent.ts
// Consent v2 : necessary (toujours true), analytics (opt-in), ads (pub personnalisée, opt-in).
// - Stockage : localStorage + cookies (lecture SSR possible via header)
// - Évènements : "cookie-consent" (CustomEvent), "cookie:open" (ouvrir le bandeau)
// - Compat : export readConsentClient; saveConsent surchargé (objet OU 'all'|'necessary').

export type Consent = {
  necessary: true;
  analytics: boolean;
  ads: boolean;
};

export type ConsentKind = "analytics" | "ads";

export const CONSENT_VERSION = 2;
const LS_KEY = `cookie:consent:v${CONSENT_VERSION}`;
const COOKIE_ANALYTICS = "analytics";       // "1" | "0"
const COOKIE_ADS = "ads";                   // "1" | "0"
const COOKIE_DECIDED = "consent_decided";   // "1" si un choix a été fait

const DEFAULT: Consent = { necessary: true, analytics: false, ads: false };

/* ───────────────── Cookies helpers ───────────────── */
function setCookie(name: string, value: string, maxAgeDays = 365) {
  if (typeof document === "undefined") return;
  try {
    const maxAge = maxAgeDays * 24 * 60 * 60;
    document.cookie = `${name}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
  } catch {}
}
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  try {
    const parts = document.cookie.split(";").map((p) => p.trim());
    for (const p of parts) {
      if (!p) continue;
      const [k, ...rest] = p.split("=");
      if (k === name) return rest.join("=") || "";
    }
    return null;
  } catch {
    return null;
  }
}
function parseCookieHeader(header: string | null | undefined): Record<string, string> {
  const map: Record<string, string> = {};
  if (!header) return map;
  header.split(";").forEach((part) => {
    const [k, ...rest] = part.split("=");
    const key = (k || "").trim();
    if (!key) return;
    map[key] = (rest.join("=") || "").trim();
  });
  return map;
}

/* ──────────────── LocalStorage helpers ─────────────── */
function readLS(): Consent | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const analytics = typeof parsed?.analytics === "boolean" ? parsed.analytics : false;
    const ads = typeof parsed?.ads === "boolean" ? parsed.ads : false;
    return { necessary: true, analytics, ads };
  } catch {
    return null;
  }
}
function writeLS(c: Consent) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(c));
  } catch {}
}

/* ──────────────── API publique (client) ─────────────── */
export function loadConsent(): Consent | null {
  const fromLS = readLS();
  if (fromLS) return fromLS;
  const decided = getCookie(COOKIE_DECIDED) === "1";
  if (!decided) return null;
  const analytics = getCookie(COOKIE_ANALYTICS) === "1";
  const ads = getCookie(COOKIE_ADS) === "1";
  return { necessary: true, analytics, ads };
}

// Alias pour compatibilité avec ton import existant
export const readConsentClient = loadConsent;

/** Surcharges : objet OU ('all'|'necessary', adsPersonalized?) */
export function saveConsent(c: Consent): void;
export function saveConsent(mode: "all" | "necessary", adsPersonalized?: boolean): void;
export function saveConsent(arg1: any, arg2?: any): void {
  let c: Consent;
  if (typeof arg1 === "string") {
    // compat: saveConsent('all'|'necessary', adsPersonalized?)
    const analytics = arg1 === "all";
    const ads = !!arg2;
    c = { necessary: true, analytics, ads };
  } else {
    c = arg1 as Consent;
  }
  writeLS(c);
  setCookie(COOKIE_ANALYTICS, c.analytics ? "1" : "0");
  setCookie(COOKIE_ADS, c.ads ? "1" : "0");
  setCookie(COOKIE_DECIDED, "1");
  try {
    window.dispatchEvent(new CustomEvent<Consent>("cookie-consent", { detail: c }));
  } catch {}
}

export function getConsentOrDefault(): Consent {
  return loadConsent() ?? DEFAULT;
}
export function isConsentDecided(): boolean {
  const c = loadConsent();
  if (c) return true;
  return getCookie(COOKIE_DECIDED) === "1";
}
export function hasConsent(kind: ConsentKind): boolean {
  const c = loadConsent();
  if (!c) return false;
  return !!c[kind];
}
export function openConsentBanner() {
  try {
    window.dispatchEvent(new Event("cookie:open"));
  } catch {}
}
export function subscribeConsent(cb: (c: Consent) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onCustom = (e: Event) => {
    const evt = e as CustomEvent<Consent>;
    if (evt?.detail) cb(evt.detail);
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key !== LS_KEY) return;
    cb(loadConsent() ?? DEFAULT);
  };
  window.addEventListener("cookie-consent", onCustom as EventListener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("cookie-consent", onCustom as EventListener);
    window.removeEventListener("storage", onStorage);
  };
}

/* ───────────────── Lecture SSR ───────────────── */
export function readConsentFromCookieHeader(cookieHeader: string | null | undefined): Consent | null {
  const map = parseCookieHeader(cookieHeader);
  const decided = map[COOKIE_DECIDED] === "1";
  if (!decided) return null;
  const analytics = map[COOKIE_ANALYTICS] === "1";
  const ads = map[COOKIE_ADS] === "1";
  return { necessary: true, analytics, ads };
}

/* ───────────────── Helpers ergonomiques ───────────────── */
export function ensureDefaultConsent() {
  if (!loadConsent()) saveConsent(DEFAULT);
}
export function setAnalytics(enabled: boolean) {
  const curr = getConsentOrDefault();
  saveConsent({ ...curr, analytics: !!enabled });
}
export function setAds(enabled: boolean) {
  const curr = getConsentOrDefault();
  saveConsent({ ...curr, ads: !!enabled });
}
