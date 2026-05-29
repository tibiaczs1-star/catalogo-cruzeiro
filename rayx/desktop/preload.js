"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("rayx", {
  getReport: () => ipcRenderer.invoke("rayx:report"),
  getState: () => ipcRenderer.invoke("rayx:state"),
  runCycle: () => ipcRenderer.invoke("rayx:cycle"),
  open: (target) => ipcRenderer.invoke("rayx:open", target),
  generateDashboard: () => ipcRenderer.invoke("rayx:generate-dashboard"),
  generateCompanion: () => ipcRenderer.invoke("rayx:generate-companion"),
  showPath: (file) => ipcRenderer.invoke("rayx:show-path", file)
});
