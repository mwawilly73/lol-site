// lib/consent.ts
export type Consent = {
  necessary: true;      // toujours true
  analytics: boolean;   // opt-in
};

const KEY = "cookie:consent:v2";
const DEFAULT: Consent = { necessary: true, analytics: false };

export function loadConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.analytics === "boolean") {
      return { necessary: true, analytics: parsed.analytics };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveConsent(c: Consent) {
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
    // Notifie l’app qu’un changement a eu lieu
    window.dispatchEvent(new CustomEvent<Consent>("cookie-consent", { detail: c }));
  } catch {}
}

export function getConsentOrDefault(): Consent {
  return loadConsent() ?? DEFAULT;
}

export function hasConsent(kind: "analytics"): boolean {
  const c = loadConsent();
  if (!c) return false;
  if (kind === "analytics") return !!c.analytics;
  return false;
}
