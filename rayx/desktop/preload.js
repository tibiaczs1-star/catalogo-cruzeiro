"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("rayx", {
  getReport: () => ipcRenderer.invoke("rayx:report"),
  getState: () => ipcRenderer.invoke("rayx:state"),
  ask: (message) => ipcRenderer.invoke("rayx:chat", message),
  runCycle: () => ipcRenderer.invoke("rayx:cycle"),
  runBoot: () => ipcRenderer.invoke("rayx:boot"),
  scanCatalog: () => ipcRenderer.invoke("rayx:catalog"),
  getHermes: () => ipcRenderer.invoke("rayx:hermes"),
  getChromeBridge: () => ipcRenderer.invoke("rayx:chrome-bridge"),
  open: (target) => ipcRenderer.invoke("rayx:open", target),
  generateDashboard: () => ipcRenderer.invoke("rayx:generate-dashboard"),
  generateCompanion: () => ipcRenderer.invoke("rayx:generate-companion"),
  showPath: (file) => ipcRenderer.invoke("rayx:show-path", file)
});
