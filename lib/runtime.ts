// lib/runtime.ts
export const isBrowser = typeof window !== "undefined";

export function isLocalhostHost(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".local")
  );
}

export function isLocalhost() {
  if (!isBrowser) return false;
  try {
    return isLocalhostHost(window.location.hostname);
  } catch {
    return false;
  }
}

/** Prod “réelle” = build prod ET pas localhost. */
export function isProdLike() {
  return process.env.NODE_ENV === "production" && !isLocalhost();
}
