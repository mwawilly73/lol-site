// lib/consent.ts
// Consent v2 (unifié) :
// - necessary (toujours true)
// - analytics (opt-in)
// - adsPersonalized (opt-in)  ✅ nouveau nom canonique
//   * Compat lecture/écriture avec l’ancien "ads"
// Stockage : localStorage + cookies (lecture SSR possible via header).
// Évènements : "cookie-consent" (CustomEvent), "cookie:open" (ouvrir le bandeau).

/* ───────────────── Types ───────────────── */

export type ConsentSnapshot = {
  necessary: true;
  analytics: boolean;
  adsPersonalized: boolean;
};

// Ancienne forme (compat)
export type ConsentLegacy = {
  necessary: true;
  analytics: boolean;
  ads: boolean;
};

// Pour hasConsent()
export type ConsentKind = "analytics" | "adsPersonalized" | "ads";

/* ──────────────── Constantes ─────────────── */

export const CONSENT_VERSION = 2;
const LS_KEY = `cookie:consent:v${CONSENT_VERSION}`;

// Cookies envoyés côté client (aident pour lecture SSR)
const COOKIE_ANALYTICS = "analytics";         // "1" | "0"
const COOKIE_ADS = "ads";                     // "1" | "0"   (non-personnalisé vs personnalisé)
const COOKIE_DECIDED = "consent_decided";     // "1" si un choix a été fait

const DEFAULT: ConsentSnapshot = {
  necessary: true,
  analytics: false,
  adsPersonalized: false,
};

/* ───────────── Cookies helpers ───────────── */

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

/* ───────────── LocalStorage helpers ───────────── */

function readLS(): ConsentSnapshot | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;

    // On accepte les deux schémas (nouveau et ancien)
    const parsed = JSON.parse(raw) as Partial<ConsentSnapshot & ConsentLegacy> & Record<string, unknown>;
    const analytics = typeof parsed.analytics === "boolean" ? parsed.analytics : false;

    // Priorité au nouveau champ "adsPersonalized", sinon fallback "ads"
    const adsPersonalized =
      typeof parsed.adsPersonalized === "boolean"
        ? parsed.adsPersonalized
        : typeof parsed.ads === "boolean"
        ? parsed.ads
        : false;

    return { necessary: true, analytics, adsPersonalized };
  } catch {
    return null;
  }
}

function writeLS(s: ConsentSnapshot) {
  if (typeof localStorage === "undefined") return;
  try {
    // On sauve le nouveau schéma + un miroir "ads" pour compat
    const payload: ConsentSnapshot & { ads: boolean } = {
      ...s,
      ads: s.adsPersonalized,
    };
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
  } catch {}
}

/* ───────────── API publique (client) ───────────── */

/** Lecture du consentement côté client (LS sinon cookies si déjà décidé). */
export function loadConsent(): ConsentSnapshot | null {
  const fromLS = readLS();
  if (fromLS) return fromLS;

  // Pas de LS ? On tente les cookies (seulement si un choix a déjà été fait)
  const decided = getCookie(COOKIE_DECIDED) === "1";
  if (!decided) return null;

  const analytics = getCookie(COOKIE_ANALYTICS) === "1";
  const adsPersonalized = getCookie(COOKIE_ADS) === "1";
  return { necessary: true, analytics, adsPersonalized };
}

/** Alias demandé par ton code existant. */
export const readConsentClient = loadConsent;

/** Event names (export si besoin ailleurs). */
export const CHANGE_EVENT = "cookie-consent";
export const OPEN_EVENT = "cookie:open";

/** Surcharges : objet OU ('all'|'necessary', adsPersonalized?) */
export function saveConsent(snapshot: ConsentSnapshot | ConsentLegacy): void;
export function saveConsent(mode: "all" | "necessary", adsPersonalized?: boolean): void;
export function saveConsent(arg1: any, arg2?: any): void {
  let s: ConsentSnapshot;

  if (typeof arg1 === "string") {
    // saveConsent('all'|'necessary', adsPersonalized?)
    const analytics = arg1 === "all";
    s = { necessary: true, analytics, adsPersonalized: !!arg2 };
  } else {
    // Objet : accepte new & legacy
    const obj = arg1 as Partial<ConsentSnapshot & ConsentLegacy>;
    const analytics = !!obj.analytics;
    const adsPersonalized =
      typeof obj.adsPersonalized === "boolean" ? obj.adsPersonalized : !!obj.ads;
    s = { necessary: true, analytics, adsPersonalized };
  }

  // Persistance
  writeLS(s);
  setCookie(COOKIE_ANALYTICS, s.analytics ? "1" : "0");
  setCookie(COOKIE_ADS, s.adsPersonalized ? "1" : "0");
  setCookie(COOKIE_DECIDED, "1");

  // Broadcast (detail contient les deux clés pour compat)
  try {
    const detail: ConsentSnapshot & { ads: boolean } = { ...s, ads: s.adsPersonalized };
    window.dispatchEvent(new CustomEvent<typeof detail>(CHANGE_EVENT, { detail }));
  } catch {}
}

/** Retourne un snapshot non-null (avec valeurs par défaut). */
export function getConsentOrDefault(): ConsentSnapshot {
  return loadConsent() ?? DEFAULT;
}

/** Vrai si un choix a été fait (LS ou cookie) */
export function isConsentDecided(): boolean {
  const c = loadConsent();
  if (c) return true;
  return getCookie(COOKIE_DECIDED) === "1";
}

/** Interroge un droit précis. */
export function hasConsent(kind: ConsentKind): boolean {
  const c = loadConsent();
  if (!c) return false;
  if (kind === "ads") return !!c.adsPersonalized; // compat
  return !!c[kind];
}

/** Demande d’ouvrir le bandeau (ex: depuis /cookies). */
export function openConsentBanner() {
  try {
    window.dispatchEvent(new Event(OPEN_EVENT));
  } catch {}
}

/** Abonnement aux changements de consentement (CustomEvent + storage). */
export function subscribeConsent(cb: (c: ConsentSnapshot & { ads: boolean }) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onCustom = (e: Event) => {
    const evt = e as CustomEvent<ConsentSnapshot & { ads: boolean }>;
    if (evt?.detail) cb(evt.detail);
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key !== LS_KEY) return;
    const current = getConsentOrDefault();
    cb({ ...current, ads: current.adsPersonalized });
  };
  window.addEventListener(CHANGE_EVENT, onCustom as EventListener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onCustom as EventListener);
    window.removeEventListener("storage", onStorage);
  };
}

/* ───────────── Lecture SSR (depuis header Cookie) ───────────── */

export function readConsentFromCookieHeader(cookieHeader: string | null | undefined): ConsentSnapshot | null {
  const map = parseCookieHeader(cookieHeader);
  const decided = map[COOKIE_DECIDED] === "1";
  if (!decided) return null;

  const analytics = map[COOKIE_ANALYTICS] === "1";
  const adsPersonalized = map[COOKIE_ADS] === "1";
  return { necessary: true, analytics, adsPersonalized };
}

/* ───────────── Helpers ergonomiques ───────────── */

export function ensureDefaultConsent() {
  if (!loadConsent()) saveConsent(DEFAULT);
}

export function setAnalytics(enabled: boolean) {
  const curr = getConsentOrDefault();
  saveConsent({ ...curr, analytics: !!enabled });
}

export function setAdsPersonalized(enabled: boolean) {
  const curr = getConsentOrDefault();
  saveConsent({ ...curr, adsPersonalized: !!enabled });
}

// Compat ancien helper
export function setAds(enabled: boolean) {
  setAdsPersonalized(enabled);
}
