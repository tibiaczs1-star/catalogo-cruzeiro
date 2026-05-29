#!/usr/bin/env node
"use strict";

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { buildReport } = require("./doctor");

const TOOL_GROUPS = [
  {
    id: "llm-cli",
    title: "LLM CLIs",
    tools: ["codex", "hermes", "ollama", "opencode", "kilo", "kiro", "freebuff", "claude", "gemini"]
  },
  {
    id: "dev-core",
    title: "Dev core",
    tools: ["node", "npm", "git", "python", "py", "code", "gh"]
  },
  {
    id: "browser",
    title: "Browser",
    tools: ["chrome", "msedge"]
  }
];

function nowIso() {
  return new Date().toISOString();
}

function powershell(script, timeoutMs = 10_000) {
  try {
    return execFileSync(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
      {
        encoding: "utf8",
        timeout: timeoutMs,
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"]
      }
    ).trim();
  } catch {
    return "";
  }
}

function commandPath(name) {
  const escaped = String(name).replace(/'/g, "''");
  return powershell(`$cmd = Get-Command '${escaped}' -ErrorAction SilentlyContinue; if ($cmd) { $cmd.Source }`);
}

function commandVersion(name, foundPath) {
  if (!foundPath) return null;

  try {
    const command = foundPath.toLowerCase().endsWith(".ps1")
      ? ["powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", foundPath, "--version"]]
      : [foundPath, ["--version"]];
    const stdout = execFileSync(command[0], command[1], {
      encoding: "utf8",
      timeout: 10_000,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"]
    });
    return String(stdout || "").split(/\r?\n/).find(Boolean) || null;
  } catch {
    return null;
  }
}

function scanSkillRoot(root) {
  const skills = [];
  if (!fs.existsSync(root)) return skills;

  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      if (entry.name === "SKILL.md") {
        skills.push({
          name: path.basename(path.dirname(fullPath)),
          path: fullPath
        });
      }
    }
  }

  return skills;
}

function scanPrompts() {
  const promptDir = path.join(os.homedir(), "AppData", "Roaming", "Code", "User", "prompts");
  if (!fs.existsSync(promptDir)) {
    return { directory: promptDir, total: 0, files: [] };
  }

  const files = fs
    .readdirSync(promptDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();

  return { directory: promptDir, total: files.length, files };
}

function mergeToolFromReport(name, reportTool) {
  const foundPath = reportTool?.path || commandPath(name);
  return {
    name,
    found: Boolean(reportTool?.found || foundPath),
    path: foundPath || null,
    version: reportTool?.version || commandVersion(name, foundPath),
    source: reportTool ? "doctor" : "catalog"
  };
}

function scanCatalog(options = {}) {
  const report = options.report || buildReport();
  const reportTools = new Map((report.tools || []).map((tool) => [tool.name, tool]));
  const names = [...new Set(TOOL_GROUPS.flatMap((group) => group.tools))];
  const tools = names.map((name) => mergeToolFromReport(name, reportTools.get(name)));
  const skillRoots = [
    path.join(os.homedir(), ".codex", "skills"),
    path.join(os.homedir(), ".codex", "plugins", "cache")
  ];
  const skillList = skillRoots.flatMap((root) => scanSkillRoot(root));
  const prompts = scanPrompts();

  return {
    schema: "rayx.catalog.v1",
    generatedAt: nowIso(),
    tools,
    groups: TOOL_GROUPS.map((group) => ({
      ...group,
      found: group.tools.filter((name) => tools.find((tool) => tool.name === name && tool.found)).length
    })),
    skills: {
      roots: skillRoots,
      total: skillList.length,
      sample: skillList.slice(0, 30)
    },
    prompts
  };
}

function main() {
  const catalog = scanCatalog();
  process.stdout.write(`${JSON.stringify(catalog, null, 2)}\n`);
}

if (require.main === module) {
  main();
}

module.exports = {
  scanCatalog
};
