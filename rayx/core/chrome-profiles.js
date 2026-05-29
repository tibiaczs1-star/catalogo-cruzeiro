#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { buildReport } = require("./doctor");

function rayxConfigDir() {
  const base = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
  return path.join(base, "RayX", "config");
}

function profileConfigPath() {
  return path.join(rayxConfigDir(), "chrome-profiles.local.json");
}

function readExistingConfig(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return {
      schema: "rayx.chromeProfiles.v1",
      updatedAt: null,
      profiles: []
    };
  }
}

function writeJson(file, payload) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function mergeProfiles(detected, existing) {
  const existingByName = new Map((existing.profiles || []).map((profile) => [profile.name, profile]));

  return detected.map((profile) => {
    const previous = existingByName.get(profile.name) || {};

    return {
      name: profile.name,
      alias: previous.alias || profile.name,
      path: profile.path,
      permission: previous.permission || "ask",
      purpose: previous.purpose || "",
      lastWriteTime: profile.lastWriteTime,
      lastSeenAt: new Date().toISOString(),
      notes: previous.notes || ""
    };
  });
}

function syncProfiles() {
  const report = buildReport();
  const file = profileConfigPath();
  const existing = readExistingConfig(file);
  const profiles = mergeProfiles(report.chrome?.profiles || [], existing);
  const payload = {
    schema: "rayx.chromeProfiles.v1",
    updatedAt: new Date().toISOString(),
    chromeExePath: report.chrome?.exePath || null,
    chromeUserData: report.chrome?.userData || null,
    defaultPolicy: "ask",
    profiles
  };

  writeJson(file, payload);

  return { file, payload };
}

function listProfiles(payload) {
  const lines = [
    "RayX Chrome Profiles",
    "",
    `Chrome: ${payload.chromeExePath || "nao encontrado"}`,
    `User data: ${payload.chromeUserData || "nao encontrado"}`,
    `Perfis: ${payload.profiles.length}`,
    "",
    ...payload.profiles.map((profile) =>
      `${profile.name.padEnd(10)} alias=${profile.alias} permissao=${profile.permission}${profile.purpose ? ` uso=${profile.purpose}` : ""}`
    )
  ];

  return lines.join("\n");
}

function parseArgs(argv) {
  return {
    json: argv.includes("--json"),
    pathOnly: argv.includes("--path")
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const { file, payload } = syncProfiles();

  if (args.pathOnly) {
    process.stdout.write(`${file}\n`);
    return;
  }

  if (args.json) {
    process.stdout.write(`${JSON.stringify({ file, ...payload }, null, 2)}\n`);
    return;
  }

  process.stdout.write(`${listProfiles(payload)}\n\nArquivo: ${file}\n`);
}

if (require.main === module) {
  main();
}

module.exports = {
  profileConfigPath,
  syncProfiles,
  listProfiles
};
