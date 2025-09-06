// scripts/predeploy.mjs
// -------------------------------------------------------------
// Pré-déploiement Next.js (Windows-friendly, sitemap-aware)
// 1) Lint + Typecheck
// 2) Build prod
// 3) Start prod local sur un PORT LIBRE
//    - --reserve-3000 => scan 3001..3010 (laisse 3000 libre)
//    - sinon           => scan 3000..3010
// 4) Auto-découverte des routes via sitemap.xml (+ fallback)
// 5) Vérif CSP + "ping" de TOUTES les pages
// 6) Lighthouse sur toutes les pages HTML → reports/*.html
// 7) Arrêt PROPRE (Windows: taskkill /T /F) + logs PID
// -------------------------------------------------------------

import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import net from "node:net";

const REPORTS_DIR = path.join(process.cwd(), "reports");
const USE_LIGHTHOUSE = !process.argv.includes("--no-lighthouse");
const LIGHTHOUSE_ONLY = process.argv.includes("--lighthouse-only");
const RESERVE_3000 = process.argv.includes("--reserve-3000");

// Endpoints non-HTML à ignorer pour Lighthouse (et parfois pour les pings LH)
const EXCLUDE_PATTERNS = [
  /\/opengraph-image(?:\.png)?$/i,
  /\/twitter-image(?:\.png)?$/i,
  /\/icon(?:\.png|\.ico)?$/i,
  /\/apple-touch-icon(?:\.png)?$/i,
  /\/apple-icon(?:\.png)?$/i,
  /\/manifest\.webmanifest$/i,
];

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
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${cmd} ${args.join(" ")} exited with ${code}`))
    );
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
  // Vérif légère (non bloquante) : on signale juste des oublis fréquents
  const issues = [];

  const img = map.get("img-src");
  const needImgs = [
    "'self'",
    "data:",
    "blob:",
    "https://ddragon.leagueoflegends.com",
    "https://raw.communitydragon.org",
  ];
  if (!img) issues.push("CSP: img-src manquant.");
  else for (const d of needImgs)
    if (!img.includes(d)) issues.push(`CSP: img-src devrait inclure ${d}`);

  const conn = map.get("connect-src");
  const needConn = [
    "'self'",
    "https://ddragon.leagueoflegends.com",
    "https://raw.communitydragon.org",
  ];
  if (!conn) issues.push("CSP: connect-src manquant.");
  else for (const d of needConn)
    if (!conn.includes(d)) issues.push(`CSP: connect-src devrait inclure ${d}`);

  return issues;
}

function startNextProd(port) {
  const child = spawn("npm", ["run", "start", "--", "-p", String(port)], {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, NODE_ENV: "production" },
  });
  info(`Serveur Next lancé (PID ${child.pid}) sur http://localhost:${port}`);
  return child;
}

// 🔻 Arrêt ROBUSTE de l’arborescence de process
function killProcTree(proc) {
  return new Promise((resolve) => {
    if (!proc || proc.killed) return resolve();
    const pid = proc.pid;

    info(`Arrêt du serveur Next (PID ${pid})…`);

    if (process.platform === "win32") {
      const killer = spawn("taskkill", ["/PID", String(pid), "/T", "/F"], {
        stdio: "ignore",
        shell: true,
      });
      killer.on("exit", () => {
        ok(`Serveur arrêté (PID ${pid})`);
        resolve();
      });
      killer.on("error", () => {
        try {
          proc.kill("SIGINT");
        } catch {}
        setTimeout(() => resolve(), 1000);
      });
    } else {
      try {
        process.kill(pid, "SIGTERM");
      } catch {}
      setTimeout(() => {
        try {
          process.kill(pid, "SIGKILL");
        } catch {}
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
    const chrome = await launch({
      chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"],
    });
    const result = await lighthouse(url, {
      port: chrome.port,
      output: "html",
      logLevel: "error",
      onlyCategories: [
        "performance",
        "accessibility",
        "best-practices",
        "seo",
      ],
    });

    const report = Array.isArray(result.report) ? result.report[0] : result.report;
    await writeFile(outHtml, report);

    const scores = Object.fromEntries(
      Object.entries(result.lhr.categories).map(([k, v]) => [
        k,
        (v.score * 100).toFixed(0) + "%",
      ])
    );
    await chrome.kill();
    return { ok: true, scores };
  } catch (e) {
    return { ok: false, error: e };
  }
}

function sanitizeForFile(u) {
  return u
    .replace(/^https?:\/\//i, "")
    .replace(/[^a-z0-9\-._/]/gi, "-")
    .replace(/[\/]+/g, "_");
}

// Filtre heuristique des URLs HTML (pattern + exclusion connue)
function isHtmlLike(u) {
  if (EXCLUDE_PATTERNS.some((re) => re.test(u))) return false;
  if (/\/api\//i.test(u)) return false;
  if (/\.(ico|png|jpg|jpeg|svg|webp|avif|txt|xml|json|js|css)$/i.test(u)) return false;
  return true;
}

/** Auto-découverte des routes via sitemap (avec fallback statique). */
async function getRoutesToAudit(baseUrl) {
  try {
    const indexRes = await fetch(`${baseUrl}/sitemap.xml`, { cache: "no-store" });
    if (!indexRes.ok) throw new Error("no sitemap");
    const indexXml = await indexRes.text();
    const locsIndex = [...indexXml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);

    const sitemapXmls = locsIndex.filter((u) => u.endsWith(".xml"));
    let pages = [];

    if (sitemapXmls.length > 0) {
      for (const sm of sitemapXmls) {
        const smUrlLocal = sm.replace(/^https?:\/\/[^/]+/i, baseUrl);
        const xml = await (await fetch(smUrlLocal, { cache: "no-store" })).text();
        const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
        pages.push(...locs.map((u) => u.replace(/^https?:\/\/[^/]+/i, baseUrl)));
      }
    } else {
      // sitemap unique listant directement les pages
      pages.push(
        ...locsIndex.map((u) => u.replace(/^https?:\/\/[^/]+/i, baseUrl))
      );
    }

    // Dé-duplique
    pages = Array.from(new Set(pages));

    // Ajoute robots/sitemap aux “pings” (mais pas pour Lighthouse)
    const extra = [`${baseUrl}/robots.txt`, `${baseUrl}/sitemap.xml`];
    const all = Array.from(new Set([...pages, ...extra]));

    return { pagesAll: all, pagesHtml: pages.filter(isHtmlLike) };
  } catch {
    // Fallback statique si le sitemap n’est pas dispo
    const fallback = [
      `${baseUrl}/`,
      `${baseUrl}/games`,
      `${baseUrl}/games/champions`,
      `${baseUrl}/games/chrono`,
      `${baseUrl}/a-propos`,
      `${baseUrl}/legal`,
      `${baseUrl}/legal/mentions-legales`,
      `${baseUrl}/legal/confidentialite`,
      `${baseUrl}/cookies`,
    ];
    const all = Array.from(
      new Set([...fallback, `${baseUrl}/robots.txt`, `${baseUrl}/sitemap.xml`])
    );
    return { pagesAll: all, pagesHtml: fallback.filter(isHtmlLike) };
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
      const BASE = `http://localhost:${port}`;
      serverProc = startNextProd(port);

      info(`Attente du serveur sur ${BASE}…`);
      const up = await waitFor(BASE);
      if (!up) throw new Error("Le serveur Next ne répond pas.");

      // Vérif CSP (home)
      const res = await fetch(`${BASE}/`, { cache: "no-store" });
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

      // Auto-découverte via sitemap
      const { pagesAll, pagesHtml } = await getRoutesToAudit(BASE);

      // Ping de TOUTES les pages (y compris robots/sitemap)
      for (const u of pagesAll) {
        try {
          const r = await fetch(u, { cache: "no-store" });
          if (r.ok) ok(`Page OK · ${u}`);
          else {
            warnings++;
            warn(`Page KO (${r.status}) · ${u}`);
          }
        } catch {
          warnings++;
          warn(`Page KO (fetch error) · ${u}`);
        }
      }

      // Lighthouse sur toutes les pages HTML
      if (USE_LIGHTHOUSE) {
        info("Étape 5/5 · Audit Lighthouse (toutes les pages HTML)…");
        let sum = { perf: 0, a11y: 0, bp: 0, seo: 0 };
        let n = 0;

        for (const u of pagesHtml) {
          // Double garde : on HEAD la page pour s’assurer que c’est du HTML
          try {
            const head = await fetch(u, { method: "HEAD", cache: "no-store" });
            const ct = (head.headers.get("content-type") || "").toLowerCase();
            if (!ct.startsWith("text/html")) {
              info(`(skip LH) ${u} — content-type=${ct || "n/a"}`);
              continue;
            }
          } catch {
            info(`(skip LH) ${u} — HEAD failed`);
            continue;
          }

          const out = path.join(
            REPORTS_DIR,
            `lighthouse-${Date.now()}-${sanitizeForFile(u)}.html`
          );
          const { ok: okLH, scores, error } = await runLighthouse(u, out);
          if (okLH) {
            ok(`Lighthouse OK · ${u}`);
            info(`  Scores: ${JSON.stringify(scores)}`);
            // Agrégat
            sum.perf += parseInt(scores.performance);
            sum.a11y += parseInt(scores["accessibility"]);
            sum.bp += parseInt(scores["best-practices"]);
            sum.seo += parseInt(scores.seo);
            n++;
          } else {
            warnings++;
            warn(`Lighthouse KO · ${u}`);
            if (error?.message) info(error.message);
          }
        }

        if (n > 0) {
          const avg = {
            performance: `${Math.round(sum.perf / n)}%`,
            accessibility: `${Math.round(sum.a11y / n)}%`,
            "best-practices": `${Math.round(sum.bp / n)}%`,
            seo: `${Math.round(sum.seo / n)}%`,
          };
          info(`Scores moyens: ${JSON.stringify(avg)}`);
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
    if (serverProc) {
      await killProcTree(serverProc);
      await delay(300);
    }
  }
})();
