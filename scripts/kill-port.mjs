// scripts/kill-port.mjs
// -------------------------------------------------------------
// Tue le process qui écoute sur un port donné (Windows/macOS/Linux).
// Usage :
//   - npm run stop:port -- 3001   → tue ce qui écoute sur 3001
//   - npm run stop:3000           → alias pratique pour 3000
//   - npm run stop:3001           → alias pratique pour 3001
//
// Détails :
//  - Sous Windows : utilise PowerShell + taskkill /T /F pour tuer l'arbre de process.
//  - Sous Unix : tente lsof, sinon fuser ; kill -9 si nécessaire.
// -------------------------------------------------------------

import { spawn } from "node:child_process";

const port = Number(process.argv[2] || 3000); // par défaut : 3000

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { shell: true, stdio: "pipe" });
    let out = "", err = "";
    child.stdout.on("data", (d) => (out += d.toString()));
    child.stderr.on("data", (d) => (err += d.toString()));
    child.on("exit", (code) => (code === 0 ? resolve(out.trim()) : reject(new Error(err || `${cmd} exited ${code}`))));
  });
}

async function killWindows(p) {
  // Récupère le PID via Get-NetTCPConnection, puis taskkill /T /F (tue toute l'arborescence)
  const ps = `$p=(Get-NetTCPConnection -LocalPort ${p} -ErrorAction SilentlyContinue | Select-Object -Expand OwningProcess -Unique); if($p){ taskkill /PID $p /T /F | Out-Null; Write-Host $p }`;
  const out = await run("powershell", ["-NoProfile", "-Command", ps]).catch(() => "");
  return out; // renvoie le PID tué (ou "" si rien à tuer)
}

async function killUnix(p) {
  // Essaie lsof, sinon fuser ; puis kill -9
  let pid = await run("bash", ["-lc", `lsof -ti tcp:${p} 2>/dev/null || true`]).catch(() => "");
  if (!pid) {
    pid = await run("bash", ["-lc", `fuser -n tcp ${p} 2>/dev/null | awk '{print $1}' || true`]).catch(() => "");
  }
  if (pid) {
    await run("bash", ["-lc", `kill -9 ${pid} 2>/dev/null || true`]).catch(() => {});
  }
  return pid;
}

(async () => {
  try {
    const isWin = process.platform === "win32";
    const killed = isWin ? await killWindows(port) : await killUnix(port);
    if (killed) {
      console.log(`✅ Killed PID ${killed} on port ${port}`);
    } else {
      console.log(`ℹ️  No process on port ${port}`);
    }
  } catch (e) {
    console.error(`⛔ kill-port failed: ${e.message || e}`);
    process.exit(1);
  }
})();
