#!/usr/bin/env node
"use strict";

const { execFileSync, spawn } = require("node:child_process");
const path = require("node:path");
const { syncProfiles } = require("../core/chrome-profiles");
const { buildReport } = require("../core/doctor");

const DEFAULT_CDP_PORT = 9222;
const SIDECAR_PROFILE_DIR = "chrome-cdp-profile";

function nowIso() {
  return new Date().toISOString();
}

function normalizeProfileName(value) {
  return String(value || "").trim();
}

function findProfile(profiles, nameOrAlias) {
  const target = normalizeProfileName(nameOrAlias);
  if (!target) {
    return profiles.find((profile) => profile.permission === "allow") || profiles[0] || null;
  }

  return profiles.find((profile) => profile.name === target || profile.alias === target) || null;
}

function listTabsSync(port = DEFAULT_CDP_PORT) {
  const uri = `http://127.0.0.1:${Number(port) || DEFAULT_CDP_PORT}/json`;
  const script = [
    "try {",
    `$response = Invoke-WebRequest -UseBasicParsing -Uri '${uri}' -TimeoutSec 2;`,
    "$response.Content",
    "} catch {",
    "\"[]\"",
    "}"
  ].join(" ");

  try {
    const stdout = execFileSync(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
      {
        encoding: "utf8",
        timeout: 5_000,
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"]
      }
    );
    const parsed = JSON.parse(stdout || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getChromeBridgeStatus(options = {}) {
  const report = options.report || buildReport();
  const profileResult = options.profileResult || syncProfiles(report);
  const payload = profileResult.payload || profileResult;
  const profiles = payload.profiles || [];
  const tabs = listTabsSync(options.port || DEFAULT_CDP_PORT);
  const allowCount = profiles.filter((profile) => profile.permission === "allow").length;
  const observeCount = profiles.filter((profile) => profile.permission === "observe").length;

  return {
    schema: "rayx.chrome.bridge.v1",
    generatedAt: nowIso(),
    found: Boolean(payload.chromeExePath),
    chromeExePath: payload.chromeExePath || null,
    chromeUserData: payload.chromeUserData || null,
    remoteDebuggingPort: options.port || DEFAULT_CDP_PORT,
    cdpReachable: tabs.length > 0,
    tabs: tabs.map((tab) => ({
      id: tab.id || null,
      type: tab.type || null,
      title: tab.title || null,
      url: tab.url || null,
      webSocketDebuggerUrl: tab.webSocketDebuggerUrl || null
    })),
    profiles,
    policy: {
      defaultPermission: payload.defaultPolicy || "ask",
      allowCount,
      observeCount,
      controlRequiresPermission: "allow"
    },
    actions: [
      {
        id: "launch-cdp",
        title: "Abrir Chrome com porta CDP",
        command: "rayx chrome-bridge launch",
        available: Boolean(payload.chromeExePath)
      },
      {
        id: "list-tabs",
        title: "Listar abas CDP",
        command: "rayx chrome-bridge tabs",
        available: true
      },
      {
        id: "profiles",
        title: "Editar permissoes de perfis",
        command: "rayx profiles set <nome> --permission allow",
        available: profiles.length > 0
      }
    ]
  };
}

function launchChromeBridge(args = {}) {
  const status = getChromeBridgeStatus(args);
  const sidecar = Boolean(args.sidecar || !args.profile);
  const profile = sidecar ? null : findProfile(status.profiles, args.profile);

  if (!status.chromeExePath) {
    throw new Error("Chrome nao encontrado.");
  }

  if (!sidecar && !profile) {
    throw new Error("Perfil Chrome nao encontrado.");
  }

  if (!sidecar && profile.permission !== "allow") {
    throw new Error(`Perfil ${profile.alias || profile.name} esta com permissao ${profile.permission}. Use rayx profiles set "${profile.name}" --permission allow.`);
  }

  const port = Number(args.port || DEFAULT_CDP_PORT);
  const userDataDir = sidecar
    ? path.join(process.env.LOCALAPPDATA || path.dirname(status.chromeExePath), "RayX", SIDECAR_PROFILE_DIR)
    : null;
  const chromeArgs = [
    `--remote-debugging-port=${port}`,
    "--new-window",
    args.url || "about:blank"
  ];

  if (sidecar) {
    chromeArgs.unshift(`--user-data-dir=${userDataDir}`);
  } else {
    chromeArgs.unshift(`--profile-directory=${profile.name}`);
  }

  const child = spawn(
    status.chromeExePath,
    chromeArgs,
    {
      cwd: path.dirname(status.chromeExePath),
      detached: true,
      stdio: "ignore",
      windowsHide: false
    }
  );
  child.unref();

  return {
    opened: true,
    pid: child.pid,
    mode: sidecar ? "sidecar" : "profile",
    profile: sidecar ? "RayX CDP" : profile.name,
    alias: sidecar ? "rayx-cdp" : profile.alias,
    userDataDir,
    remoteDebuggingPort: port
  };
}

function renderChromeBridge(status) {
  return [
    "RayX Chrome Bridge",
    "",
    `chrome: ${status.chromeExePath || "nao encontrado"}`,
    `user data: ${status.chromeUserData || "nao encontrado"}`,
    `porta CDP: ${status.remoteDebuggingPort}`,
    `CDP ativo: ${status.cdpReachable ? "sim" : "nao"}`,
    `perfis: ${status.profiles.length}`,
    `allow: ${status.policy.allowCount}`,
    `observe: ${status.policy.observeCount}`,
    `abas CDP: ${status.tabs.length}`
  ].join("\n");
}

function parseArgs(argv) {
  const args = {
    profile: null,
    port: DEFAULT_CDP_PORT,
    url: null,
    sidecar: argv.includes("--sidecar"),
    json: argv.includes("--json")
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--profile") {
      args.profile = argv[index + 1] || null;
      index += 1;
      continue;
    }
    if (token === "--port") {
      args.port = Number(argv[index + 1] || DEFAULT_CDP_PORT);
      index += 1;
      continue;
    }
    if (token === "--url") {
      args.url = argv[index + 1] || null;
      index += 1;
    }
  }

  return args;
}

function main() {
  const command = process.argv[2] || "status";
  const args = parseArgs(process.argv.slice(3));

  if (command === "launch") {
    process.stdout.write(`${JSON.stringify(launchChromeBridge(args), null, 2)}\n`);
    return;
  }

  const status = getChromeBridgeStatus(args);

  if (command === "tabs") {
    process.stdout.write(`${JSON.stringify(status.tabs, null, 2)}\n`);
    return;
  }

  if (args.json) {
    process.stdout.write(`${JSON.stringify(status, null, 2)}\n`);
    return;
  }

  process.stdout.write(`${renderChromeBridge(status)}\n`);
}

if (require.main === module) {
  main();
}

module.exports = {
  DEFAULT_CDP_PORT,
  getChromeBridgeStatus,
  launchChromeBridge,
  listTabsSync,
  renderChromeBridge
};
