import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };
export const alt = "Legends Rift — Jeux & quiz sur les champions";

export default function OG() {
  const W = size.width;
  const H = size.height;

  try {
    return new ImageResponse(
      (
        <div
          style={{
            width: W,
            height: H,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "stretch",
            background:
              "linear-gradient(135deg, #0e1117 0%, #1f2937 55%, #0b1220 100%)",
            color: "#fff",
            position: "relative",
            fontFamily: "Inter, Arial, 'Segoe UI', sans-serif",
          }}
        >
          {/* halos décoratifs (radial uniquement → 100% compatible Satori) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(60% 45% at 50% 22%, rgba(99,102,241,.26), rgba(34,197,94,.16) 45%, rgba(0,0,0,0) 80%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 24,
              bottom: 24,
              width: 260,
              height: 260,
              borderRadius: 999,
              background:
                "radial-gradient(60% 60% at 50% 50%, rgba(6,182,212,.22), rgba(0,0,0,0) 70%)",
            }}
          />

          {/* header brand */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "38px 56px 0 56px",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                width: 56,
                height: 56,
                borderRadius: 12,
                background:
                  "linear-gradient(135deg, #6366f1 0%, #22d3ee 100%)",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 30,
                fontWeight: 800,
                boxShadow: "0 8px 40px rgba(99,102,241,.35)",
              }}
            >
              LR
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontSize: 24,
                  letterSpacing: 1,
                  opacity: 0.9,
                }}
              >
                Legends Rift
              </div>
              <div style={{ fontSize: 16, opacity: 0.7 }}>
                Jeux & quiz sur les champions
              </div>
            </div>
          </div>

          {/* bloc central */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              padding: "0 56px",
            }}
          >
            <div
              style={{
                fontSize: 86,
                fontWeight: 900,
                lineHeight: 1.05,
                letterSpacing: -1,
                textShadow: "0 10px 32px rgba(0,0,0,.55)",
              }}
            >
              Bienvenue sur Legends Rift
            </div>
            <div
              style={{
                marginTop: 12,
                fontSize: 32,
                opacity: 0.95,
              }}
            >
              Entraîne ta mémoire avec des mini-jeux autour des champions
            </div>

            {/* badges features principaux */}
            <div
              style={{
                display: "flex",
                gap: 12,
                marginTop: 20,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {[
                { txt: "Chrono-Break", bg: "rgba(244,63,94,.18)" },
                { txt: "Liste des champions", bg: "rgba(99,102,241,.20)" },
                { txt: "Skins & Splashes", bg: "rgba(16,185,129,.18)" },
                { txt: "Accents/typos tolérées", bg: "rgba(6,182,212,.20)" },
              ].map((b) => (
                <div
                  key={b.txt}
                  style={{
                    display: "flex",
                    fontSize: 20,
                    padding: "10px 16px",
                    borderRadius: 999,
                    background: b.bg,
                    border: "1px solid rgba(255,255,255,.14)",
                  }}
                >
                  {b.txt}
                </div>
              ))}
            </div>
          </div>

          {/* footer strip */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 56px 42px 56px",
            }}
          >
            <div
              style={{
                height: 10,
                width: 520,
                borderRadius: 999,
                background:
                  "linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #06b6d4 100%)",
                boxShadow: "0 8px 32px rgba(99,102,241,.35)",
              }}
            />
            <div style={{ fontSize: 20, opacity: 0.9 }}>Legends Rift.app</div>
          </div>
        </div>
      ),
      { ...size }
    );
  } catch {
    return new ImageResponse(
      (
        <div
          style={{
            width: W,
            height: H,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#111827",
            color: "#fff",
            fontSize: 44,
            fontFamily: "Arial, sans-serif",
          }}
        >
          Legends Rift — Jeux & quiz
        </div>
      ),
      { ...size }
    );
  }
}
