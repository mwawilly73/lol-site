import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };
export const alt = "Chrono-Break — Devine les champions au chrono | LoL Quiz";

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
          {/* halos décoratifs (radial uniquement) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(60% 45% at 50% 22%, rgba(99,102,241,.28), rgba(16,185,129,.16) 45%, rgba(0,0,0,0) 80%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 30,
              top: 30,
              width: 220,
              height: 220,
              borderRadius: 999,
              background:
                "radial-gradient(60% 60% at 50% 50%, rgba(34,211,238,.22), rgba(0,0,0,0) 70%)",
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
              LQ
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontSize: 24,
                  letterSpacing: 1,
                  opacity: 0.9,
                }}
              >
                LoL Quiz
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
                fontSize: 88,
                fontWeight: 900,
                lineHeight: 1.05,
                letterSpacing: -1,
                textShadow: "0 10px 32px rgba(0,0,0,.55)",
              }}
            >
              Chrono-Break
            </div>
            <div
              style={{
                marginTop: 12,
                fontSize: 32,
                opacity: 0.95,
              }}
            >
              Devine les champions au chrono
            </div>

            {/* badges features */}
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
                { txt: "Skins & Splashes", bg: "rgba(16,185,129,.18)" },
                { txt: "Tolérance fautes", bg: "rgba(99,102,241,.20)" },
                { txt: "4 durées", bg: "rgba(245,158,11,.22)" },
                { txt: "RGPD ready", bg: "rgba(20,184,166,.20)" },
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

            {/* durées */}
            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 18,
                opacity: 0.9,
                fontSize: 22,
              }}
            >
              {["1:30", "5:00", "10:00", "15:00"].map((t) => (
                <div
                  key={t}
                  style={{
                    display: "flex",
                    padding: "8px 14px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,.12)",
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02))",
                  }}
                >
                  ⏱ {t}
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
                  "linear-gradient(90deg, #f43f5e 0%, #f59e0b 50%, #10b981 100%)",
                boxShadow: "0 8px 32px rgba(244,63,94,.35)",
              }}
            />
            <div style={{ fontSize: 20, opacity: 0.9 }}>lol-quiz.app</div>
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
            fontSize: 48,
            fontFamily: "Arial, sans-serif",
          }}
        >
          Chrono-Break — LoL Quiz
        </div>
      ),
      { ...size }
    );
  }
}
