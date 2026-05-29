#!/usr/bin/env node
"use strict";

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

function repoRoot() {
  return path.resolve(__dirname, "..", "..");
}

function electronPath() {
  const root = repoRoot();
  const exe = process.platform === "win32" ? "electron.exe" : "electron";
  const candidate = path.join(root, "node_modules", "electron", "dist", exe);

  if (fs.existsSync(candidate)) return candidate;

  try {
    const resolved = require("electron");
    if (typeof resolved === "string" && fs.existsSync(resolved)) return resolved;
  } catch {
    return null;
  }

  return null;
}

function desktopPaths() {
  const root = repoRoot();
  return {
    electron: electronPath(),
    main: path.join(root, "rayx", "desktop", "main.js"),
    preload: path.join(root, "rayx", "desktop", "preload.js"),
    renderer: path.join(root, "rayx", "desktop", "renderer", "index.html")
  };
}

function checkDesktop() {
  const paths = desktopPaths();
  return {
    schema: "rayx.desktop.check.v1",
    ready: Boolean(paths.electron) && fs.existsSync(paths.main) && fs.existsSync(paths.preload) && fs.existsSync(paths.renderer),
    paths: {
      electron: paths.electron,
      main: paths.main,
      preload: paths.preload,
      renderer: paths.renderer
    }
  };
}

function openDesktop(options = {}) {
  const paths = desktopPaths();
  const electron = paths.electron;

  if (!electron) {
    throw new Error("Electron nao encontrado. Rode: npm install --save-dev electron");
  }

  const args = [paths.main];
  if (options.dev) args.push("--dev");

  const child = spawn(electron, args, {
    cwd: repoRoot(),
    detached: true,
    stdio: options.wait ? "inherit" : "ignore",
    windowsHide: false
  });

  if (!options.wait) child.unref();
  return { electron, main: paths.main, pid: child.pid };
}

function main() {
  if (process.argv.includes("--check") || process.argv.includes("--dry-run")) {
    process.stdout.write(`${JSON.stringify(checkDesktop(), null, 2)}\n`);
    return;
  }

  const result = openDesktop({
    wait: process.argv.includes("--wait"),
    dev: process.argv.includes("--dev")
  });
  process.stdout.write(`RayX desktop aberto. PID ${result.pid}\n`);
}

if (require.main === module) {
  main();
}

module.exports = {
  checkDesktop,
  electronPath,
  openDesktop
};
