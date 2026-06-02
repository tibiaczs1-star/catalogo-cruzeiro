"use strict";

const { execFile } = require("node:child_process");
const path = require("node:path");
const { app, BrowserWindow, ipcMain, shell } = require("electron");

let mainWindow = null;

function repoRoot() {
  return path.resolve(__dirname, "..", "..");
}

function rayxCliPath() {
  return path.join(repoRoot(), "rayx", "bin", "rayx.js");
}

function runRayx(args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      [rayxCliPath(), ...args],
      {
        cwd: repoRoot(),
        windowsHide: true,
        timeout: options.timeoutMs || 180_000,
        maxBuffer: options.maxBuffer || 1024 * 1024 * 12
      },
      (error, stdout, stderr) => {
        const text = String(stdout || "");
        if (error) {
          error.stdout = text;
          error.stderr = String(stderr || "");
          reject(error);
          return;
        }

        if (options.json !== false) {
          try {
            resolve(JSON.parse(text));
            return;
          } catch {
            resolve({ stdout: text, stderr: String(stderr || "") });
            return;
          }
        }

        resolve({ stdout: text, stderr: String(stderr || "") });
      }
    );
  });
}

function renderStatusFromState(state) {
  const report = state.report || {};
  const hardware = report.hardware || {};
  const hermes = report.hermes || {};
  const chrome = report.chrome || {};
  const ollama = report.ollama || {};

  return [
    "RAYX LOCAL STATUS",
    "",
    `PC: ${hardware.host || "?"} | ${hardware.cpu?.name || "CPU ?"} | ${hardware.memory?.totalGb || "?"} GB RAM`,
    `Modo: ${state.mode || report.recommendation?.mode || "?"}`,
    `Hermes: ${hermes.found ? "detectado" : "nao encontrado"} | gateway ${hermes.status?.gateway || "?"}`,
    `Codex: ${report.codex?.found ? "ok" : "nao encontrado"} | ${report.codex?.version || "?"}`,
    `Ollama: ${ollama.found ? "ok" : "nao encontrado"} | ${ollama.models?.length || 0} modelos`,
    `Chrome: ${chrome.found ? "ok" : "nao encontrado"} | ${chrome.profileCount || 0} perfis`,
    state.catalog
      ? `Catalogo: ${state.catalog.toolsFound}/${state.catalog.toolsTotal} ferramentas, ${state.catalog.skills} skills`
      : ""
  ].filter(Boolean).join("\n");
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 1040,
    minHeight: 720,
    title: "RayX",
    backgroundColor: "#f4f6f8",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("rayx:report", async () => {
  const report = await runRayx(["doctor"]);

  return {
    report,
    statusText: renderStatusFromState({ report })
  };
});

ipcMain.handle("rayx:state", async () => {
  const state = await runRayx(["orchestrator"]);

  return {
    ...state,
    statusText: renderStatusFromState(state)
  };
});

ipcMain.handle("rayx:cycle", async () => {
  const state = await runRayx(["orchestrator", "cycle"]);

  return {
    ...state,
    statusText: renderStatusFromState(state)
  };
});

ipcMain.handle("rayx:chat", async (_event, message) => {
  return runRayx(["chat", message || "", "--json"], { timeoutMs: 240_000 });
});

ipcMain.handle("rayx:boot", async () => {
  return runRayx(["boot", "--json"], { timeoutMs: 240_000 });
});

ipcMain.handle("rayx:catalog", async () => {
  return runRayx(["catalog"], { timeoutMs: 180_000 });
});

ipcMain.handle("rayx:hermes", async () => {
  return runRayx(["hermes", "status", "--json"], { timeoutMs: 120_000 });
});

ipcMain.handle("rayx:chrome-bridge", async () => {
  return runRayx(["chrome-bridge", "status", "--json"], { timeoutMs: 120_000 });
});

ipcMain.handle("rayx:open", async (_event, target) => {
  return runRayx(["open", target || "dashboard", "--json"], { timeoutMs: 60_000 });
});

ipcMain.handle("rayx:generate-dashboard", async () => {
  return runRayx(["dashboard"], { json: false, timeoutMs: 60_000 });
});

ipcMain.handle("rayx:generate-companion", async () => {
  return runRayx(["companion"], { json: false, timeoutMs: 60_000 });
});

ipcMain.handle("rayx:show-path", async (_event, file) => {
  if (!file) return false;
  shell.showItemInFolder(file);
  return true;
});
