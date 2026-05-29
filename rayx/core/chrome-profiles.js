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

function updateProfile(args) {
  const { file, payload } = syncProfiles();
  const target = String(args.set || "").trim();

  if (!target) {
    throw new Error("Use --set \"Profile Name\" para escolher um perfil.");
  }

  const profile = payload.profiles.find((item) => item.name === target || item.alias === target);

  if (!profile) {
    throw new Error(`Perfil nao encontrado: ${target}`);
  }

  if (args.alias) profile.alias = String(args.alias).trim();
  if (args.permission) profile.permission = normalizePermission(args.permission);
  if (args.purpose !== undefined) profile.purpose = String(args.purpose).trim();
  if (args.notes !== undefined) profile.notes = String(args.notes).trim();

  payload.updatedAt = new Date().toISOString();
  writeJson(file, payload);

  return { file, profile, payload };
}

function normalizePermission(value) {
  const permission = String(value || "").trim().toLowerCase();
  const allowed = new Set(["ask", "allow", "deny", "observe"]);

  if (!allowed.has(permission)) {
    throw new Error("Permissao invalida. Use: ask, allow, deny ou observe.");
  }

  return permission;
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
  const args = {
    json: argv.includes("--json"),
    pathOnly: argv.includes("--path"),
    set: null,
    alias: null,
    permission: null,
    purpose: undefined,
    notes: undefined
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--set") {
      args.set = argv[index + 1] || "";
      index += 1;
      continue;
    }

    if (token === "--alias") {
      args.alias = argv[index + 1] || "";
      index += 1;
      continue;
    }

    if (token === "--permission") {
      args.permission = argv[index + 1] || "";
      index += 1;
      continue;
    }

    if (token === "--purpose") {
      args.purpose = argv[index + 1] || "";
      index += 1;
      continue;
    }

    if (token === "--notes") {
      args.notes = argv[index + 1] || "";
      index += 1;
    }
  }

  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = args.set ? updateProfile(args) : syncProfiles();
  const { file, payload } = result;

  if (args.pathOnly) {
    process.stdout.write(`${file}\n`);
    return;
  }

  if (args.json) {
    process.stdout.write(`${JSON.stringify({ file, updatedProfile: result.profile || null, ...payload }, null, 2)}\n`);
    return;
  }

  if (result.profile) {
    process.stdout.write(
      `Perfil atualizado: ${result.profile.name} alias=${result.profile.alias} permissao=${result.profile.permission}\n\n`
    );
  }

  process.stdout.write(`${listProfiles(payload)}\n\nArquivo: ${file}\n`);
}

if (require.main === module) {
  main();
}

module.exports = {
  profileConfigPath,
  syncProfiles,
  updateProfile,
  listProfiles
};
