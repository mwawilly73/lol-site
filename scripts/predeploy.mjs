// scripts/predeploy.mjs
// -------------------------------------------------------------
// Pré-déploiement Next.js (Windows-friendly, auto-port, stop robuste)
// 1) Lint + Typecheck
// 2) Build prod
// 3) Start prod local sur un PORT LIBRE
//    - --reserve-3000 => scan 3001..3010 (laisse 3000 pour prod:local)
//    - sinon           => scan 3000..3010
// 4) Vérif CSP + pages clés
// 5) (Optionnel) Lighthouse -> reports/*.html
// 6) Arrêt PROPRE (Windows: taskkill /T /F) + logs PID
// -------------------------------------------------------------

import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import net from "node:net";

const PAGES = ["/", "/games/champions"];
const REPORTS_DIR = path.join(process.cwd(), "reports");
const USE_LIGHTHOUSE = !process.argv.includes("--no-lighthouse");
const LIGHTHOUSE_ONLY = process.argv.includes("--lighthouse-only");
const RESERVE_3000 = process.argv.includes("--reserve-3000");

const ok = (m) => console.log(`✅ ${m}`);
const info = (m) => console.log(`ℹ️  ${m}`);
const warn = (m) => console.warn(`⚠️  ${m}`);
const err = (m) => console.error(`⛔ ${m}`);

function runCmd(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
      ...opts,
    });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(" ")} exited with ${code}`))));
  });
}

async function isPortFree(port) {
  return new Promise((resolve) => {
    const srv = net
      .createServer()
      .once("error", () => resolve(false))
      .once("listening", () => srv.close(() => resolve(true)))
      .listen(port, "0.0.0.0");
  });
}
async function findFreePort(start, end) {
  for (let p = start; p <= end; p++) {
    if (await isPortFree(p)) return p;
  }
  throw new Error(`Aucun port libre entre ${start} et ${end}.`);
}

async function waitFor(url, timeoutMs = 15000, intervalMs = 400) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(url, { cache: "no-store" });
      if (r.ok || r.status === 404) return true;
    } catch {}
    await delay(intervalMs);
  }
  return false;
}

function parseCSP(value) {
  const map = new Map();
  if (!value) return map;
  for (const part of value.split(";")) {
    const t = part.trim();
    if (!t) continue;
    const [dir, ...vals] = t.split(/\s+/);
    map.set(dir, vals);
  }
  return map;
}
function checkCSP(map) {
  const issues = [];
  const script = map.get("script-src");
  if (!script) issues.push("CSP: script-src manquant.");
  else if (!script.includes("'unsafe-inline'")) issues.push("CSP: script-src sans 'unsafe-inline' (sinon mettre un nonce).");

  const img = map.get("img-src");
  const needImgs = ["'self'", "data:", "blob:", "https://ddragon.leagueoflegends.com", "https://raw.communitydragon.org"];
  if (!img) issues.push("CSP: img-src manquant.");
  else for (const d of needImgs) if (!img.includes(d)) issues.push(`CSP: img-src devrait inclure ${d}`);

  const conn = map.get("connect-src");
  const needConn = ["'self'", "https://ddragon.leagueoflegends.com", "https://raw.communitydragon.org"];
  if (!conn) issues.push("CSP: connect-src manquant.");
  else for (const d of needConn) if (!conn.includes(d)) issues.push(`CSP: connect-src devrait inclure ${d}`);

  return issues;
}

function startNextProd(port) {
  // -p est cross-plateforme
  const child = spawn("npm", ["run", "start", "--", "-p", String(port)], {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, NODE_ENV: "production" },
  });
  info(`Serveur Next lancé (PID ${child.pid}) sur http://localhost:${port}`);
  return child;
}

// 🔴 Arrêt ROBUSTE de l’arborescence de process
function killProcTree(proc) {
  return new Promise((resolve) => {
    if (!proc || proc.killed) return resolve();
    const pid = proc.pid;

    info(`Arrêt du serveur Next (PID ${pid})…`);

    if (process.platform === "win32") {
      // Windows : taskkill tue TOUTE l’arborescence (/T) et force (/F)
      const killer = spawn("taskkill", ["/PID", String(pid), "/T", "/F"], {
        stdio: "ignore",
        shell: true,
      });
      killer.on("exit", () => {
        ok(`Serveur arrêté (PID ${pid})`);
        resolve();
      });
      killer.on("error", () => {
        // fallback (rare)
        try { proc.kill("SIGINT"); } catch {}
        setTimeout(() => resolve(), 1000);
      });
    } else {
      // Unix-like
      try { process.kill(pid, "SIGTERM"); } catch {}
      setTimeout(() => {
        try { process.kill(pid, "SIGKILL"); } catch {}
        ok(`Serveur arrêté (PID ${pid})`);
        resolve();
      }, 1500);
    }
  });
}

async function runLighthouse(url, outHtml) {
  try {
    const { default: lighthouse } = await import("lighthouse");
    const { launch } = await import("chrome-launcher");
    const chrome = await launch({ chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"] });
    const result = await lighthouse(url, {
      port: chrome.port,
      output: "html",
      logLevel: "error",
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    });
    await writeFile(outHtml, result.report);
    const scores = Object.fromEntries(
      Object.entries(result.lhr.categories).map(([k, v]) => [k, (v.score * 100).toFixed(0) + "%"])
    );
    await chrome.kill();
    return { ok: true, scores };
  } catch (e) {
    return { ok: false, error: e };
  }
}

(async () => {
  let serverProc = null;
  let warnings = 0;

  try {
    await mkdir(REPORTS_DIR, { recursive: true });

    if (!LIGHTHOUSE_ONLY) {
      info("Étape 1/5 · Lint…");
      await runCmd("npm", ["run", "lint"]);
      ok("Lint OK");

      info("Étape 2/5 · Typecheck…");
      await runCmd("npm", ["run", "typecheck"]);
      ok("Types OK");

      info("Étape 3/5 · Build (prod)…");
      await runCmd("npm", ["run", "build"]);
      ok("Build OK");

      info("Étape 4/5 · Démarrage prod local…");
      const startPort = RESERVE_3000 ? 3001 : 3000;
      const port = await findFreePort(startPort, 3010);
      const base = `http://localhost:${port}`;
      serverProc = startNextProd(port);

      info(`Attente du serveur sur ${base}…`);
      const up = await waitFor(base);
      if (!up) throw new Error("Le serveur Next ne répond pas.");

      // CSP (home)
      const res = await fetch(`${base}/`, { cache: "no-store" });
      const cspRaw = res.headers.get("content-security-policy");
      if (!cspRaw) {
        warn("Aucun header Content-Security-Policy détecté (prod).");
        warnings++;
      } else {
        const issues = checkCSP(parseCSP(cspRaw));
        if (issues.length) {
          warnings += issues.length;
          issues.forEach(warn);
        } else ok("CSP (basique) OK.");
      }

      // Pages clés
      for (const p of PAGES) {
        const u = `${base}${p}`;
        const r = await fetch(u, { cache: "no-store" });
        if (r.ok) ok(`Page OK · ${u}`);
        else {
          warnings++;
          warn(`Page KO (${r.status}) · ${u}`);
        }
      }

      // Lighthouse ?
      if (USE_LIGHTHOUSE) {
        info("Étape 5/5 · Audit Lighthouse…");
        const out = path.join(REPORTS_DIR, `lighthouse-${Date.now()}.html`);
        const target = `${base}/games/champions`;
        const { ok: okLH, scores, error } = await runLighthouse(target, out);
        if (okLH) {
          ok(`Lighthouse OK · Rapport: ${out}`);
          info(`Scores: ${JSON.stringify(scores)}`);
        } else {
          warnings++;
          warn("Lighthouse indisponible (package non installé ?) — poursuite du pré-déploiement.");
          if (error?.message) info(error.message);
        }
      } else {
        info("Lighthouse désactivé (--no-lighthouse).");
      }
    } else {
      info("Mode Lighthouse seul : assure-toi que le serveur prod tourne déjà.");
    }

    if (warnings > 0) {
      warn(`Pré-déploiement terminé avec ${warnings} avertissement(s).`);
      process.exitCode = 0;
    } else {
      ok("Pré-déploiement OK sans avertissements 🎉");
    }
  } catch (e) {
    err(e.message || String(e));
    process.exitCode = 1;
  } finally {
    // 🔻 ARRÊT ROBUSTE + LOG
    if (serverProc) {
      await killProcTree(serverProc);
      // petit délai pour libérer le port proprement
      await delay(300);
    }
  }
})();
