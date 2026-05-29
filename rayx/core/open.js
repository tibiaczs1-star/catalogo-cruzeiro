#!/usr/bin/env node
"use strict";

const { spawn } = require("node:child_process");
const { generateCompanion } = require("./companion");
const { generateDashboard } = require("./dashboard");

function openFile(file, options = {}) {
  if (options.dryRun) {
    return { file, opened: false, command: "dry-run" };
  }

  if (process.platform === "win32") {
    const child = spawn("cmd.exe", ["/c", "start", "", file], {
      detached: true,
      stdio: "ignore",
      windowsHide: true
    });
    child.unref();
    return { file, opened: true, command: "cmd.exe /c start" };
  }

  if (process.platform === "darwin") {
    const child = spawn("open", [file], { detached: true, stdio: "ignore" });
    child.unref();
    return { file, opened: true, command: "open" };
  }

  const child = spawn("xdg-open", [file], { detached: true, stdio: "ignore" });
  child.unref();
  return { file, opened: true, command: "xdg-open" };
}

function openRayX(target = "dashboard", options = {}) {
  const normalized = String(target || "dashboard").toLowerCase();
  const results = [];

  if (normalized === "dashboard" || normalized === "all") {
    const generated = generateDashboard();
    results.push({ target: "dashboard", ...openFile(generated.file, options) });
  }

  if (normalized === "companion" || normalized === "all") {
    const generated = generateCompanion();
    results.push({ target: "companion", ...openFile(generated.file, options) });
  }

  if (!results.length) {
    throw new Error("Alvo invalido. Use: dashboard, companion ou all.");
  }

  return results;
}

function parseArgs(argv) {
  return {
    target: argv.find((item) => !item.startsWith("--")) || "dashboard",
    dryRun: argv.includes("--dry-run"),
    json: argv.includes("--json")
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const results = openRayX(args.target, { dryRun: args.dryRun });

  if (args.json) {
    process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
    return;
  }

  for (const result of results) {
    const verb = result.opened ? "aberto" : "preparado";
    process.stdout.write(`${result.target} ${verb}: ${result.file}\n`);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  openRayX,
  openFile
};
