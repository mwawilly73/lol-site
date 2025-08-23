// components/CssGuard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Filet de sécurité si le CSS (globals.css) ne se charge pas.
// - Vérifie la présence de la var CSS --bg (thème).
// - Si absente → affiche un overlay lisible avec styles inline (pas besoin du CSS global).
// - Bouton "Recharger" force un reload.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useEffect, useState } from "react";

/** Vérifie si la variable CSS --bg est définie (donc globals.css chargé) */
function isCssHealthy(): boolean {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue("--bg");
    return typeof v === "string" && v.trim().length > 0;
  } catch {
    return true; // par défaut ne rien afficher pour éviter un faux positif
  }
}

export default function CssGuard() {
  const [noCss, setNoCss] = useState(false);

  useEffect(() => {
    // 1) test immédiat
    const healthyNow = isCssHealthy();
    if (!healthyNow) {
      // 2) re-teste après un micro-delay (le temps que le CSS arrive).
      const id = setTimeout(() => {
        const healthyLate = isCssHealthy();
        setNoCss(!healthyLate);
      }, 200);
      return () => clearTimeout(id);
    }
    // healthy: ne rien faire
  }, []);

  if (!noCss) return null;

  // Overlay minimaliste avec styles inline (pour fonctionner sans CSS global)
  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: "fixed",
        zIndex: 9999,
        inset: 0,
        background: "rgba(0,0,0,0.92)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          maxWidth: "560px",
          width: "100%",
          background: "rgba(20,20,24,0.95)",
          border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
          textAlign: "center",
        }}
      >
        <h2 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>Feuilles de style indisponibles</h2>
        <p style={{ margin: "0 0 12px 0", lineHeight: 1.4, color: "rgba(255,255,255,0.85)" }}>
          Il semble que la feuille de style ne se soit pas chargée correctement.
          <br />
          Tu peux continuer (site fonctionnel mais non stylé) ou recharger la page.
        </p>
        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
          <button
            type="button"
            onClick={() => location.reload()}
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.22)",
              background: "#4f46e5",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Recharger la page
          </button>
          <a
            href="/games/champions"
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.22)",
              background: "rgba(255,255,255,0.06)",
              color: "#fff",
              textDecoration: "none",
            }}
          >
            Aller au jeu
          </a>
        </div>
        <p style={{ marginTop: "10px", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
          Si le problème persiste, vide le cache navigateur et réessaie.
        </p>
      </div>
    </div>
  );
}