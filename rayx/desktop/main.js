"use strict";

const path = require("node:path");
const { app, BrowserWindow, ipcMain, shell } = require("electron");
const { syncProfiles } = require("../core/chrome-profiles");
const { generateCompanion } = require("../core/companion");
const { generateDashboard } = require("../core/dashboard");
const { buildReport } = require("../core/doctor");
const { openRayX } = require("../core/open");
const { getOperationalState, runCycle } = require("../core/orchestrator");
const { renderStatus } = require("../core/status");

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 980,
    minHeight: 680,
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
  const report = buildReport();
  const profiles = syncProfiles().payload;

  return {
    report,
    profiles,
    statusText: renderStatus(report)
  };
});

ipcMain.handle("rayx:state", async () => {
  const state = getOperationalState();

  return {
    ...state,
    statusText: renderStatus(state.report)
  };
});

ipcMain.handle("rayx:cycle", async () => {
  const state = runCycle();

  return {
    ...state,
    statusText: renderStatus(state.report)
  };
});

ipcMain.handle("rayx:open", async (_event, target) => {
  return openRayX(target || "dashboard");
});

ipcMain.handle("rayx:generate-dashboard", async () => {
  const result = generateDashboard();
  return { file: result.file };
});

ipcMain.handle("rayx:generate-companion", async () => {
  const result = generateCompanion();
  return { file: result.file };
});

ipcMain.handle("rayx:show-path", async (_event, file) => {
  if (!file) return false;
  shell.showItemInFolder(file);
  return true;
});
