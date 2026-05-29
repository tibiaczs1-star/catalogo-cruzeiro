#!/usr/bin/env node
"use strict";

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const DEFAULT_TIMEOUT_MS = 30_000;

function nowIso() {
  return new Date().toISOString();
}

function bytesToGb(value) {
  const number = Number(value || 0);
  return Math.round((number / 1024 / 1024 / 1024) * 100) / 100;
}

function run(command, args = [], options = {}) {
  const startedAt = Date.now();

  try {
    const stdout = execFileSync(command, args, {
      encoding: "utf8",
      timeout: options.timeoutMs || DEFAULT_TIMEOUT_MS,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"]
    });

    return {
      ok: true,
      command: [command, ...args].join(" "),
      durationMs: Date.now() - startedAt,
      stdout: stdout.trim(),
      stderr: ""
    };
  } catch (error) {
    return {
      ok: false,
      command: [command, ...args].join(" "),
      durationMs: Date.now() - startedAt,
      stdout: String(error.stdout || "").trim(),
      stderr: String(error.stderr || error.message || "").trim(),
      exitCode: error.status ?? null
    };
  }
}

function powershell(script, timeoutMs = DEFAULT_TIMEOUT_MS) {
  return run(
    "powershell.exe",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
    { timeoutMs }
  );
}

function parseJsonCommand(result, fallback) {
  if (!result.ok || !result.stdout) return fallback;

  try {
    return JSON.parse(result.stdout);
  } catch {
    return fallback;
  }
}

function commandPath(name) {
  const result = powershell(
    `$cmd = Get-Command ${JSON.stringify(name)} -ErrorAction SilentlyContinue; ` +
      `if ($cmd) { $cmd.Source }`
  );

  return result.ok && result.stdout ? result.stdout : null;
}

function runResolvedCommand(name, resolvedPath, args = [], timeoutMs = 10_000) {
  const target = resolvedPath || name;
  const ext = path.extname(target).toLowerCase();

  if (ext === ".ps1") {
    return run(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", target, ...args],
      { timeoutMs }
    );
  }

  if (ext === ".cmd" || ext === ".bat") {
    const quotedTarget = target.replace(/'/g, "''");
    const quotedArgs = args.map((arg) => `'${String(arg).replace(/'/g, "''")}'`).join(" ");
    return powershell(`& '${quotedTarget}' ${quotedArgs}`, timeoutMs);
  }

  return run(target, args, { timeoutMs });
}

function commandVersion(name, resolvedPath, args = ["--version"], timeoutMs = 10_000) {
  const result = runResolvedCommand(name, resolvedPath, args, timeoutMs);

  return {
    ok: result.ok,
    value: result.ok ? firstLine(result.stdout) : null,
    error: result.ok ? null : compactError(result)
  };
}

function firstLine(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean) || "";
}

function compactError(result) {
  return firstLine(result.stderr) || firstLine(result.stdout) || "command failed";
}

function detectHardware() {
  const script = [
    "$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1 Name,NumberOfCores,NumberOfLogicalProcessors,MaxClockSpeed;",
    "$gpu = Get-CimInstance Win32_VideoController | Select-Object Name,AdapterRAM,DriverVersion;",
    "$os = Get-ComputerInfo | Select-Object OsName,OsVersion,OsBuildNumber,WindowsProductName,CsName,CsTotalPhysicalMemory;",
    "$drives = Get-PSDrive -PSProvider FileSystem | Select-Object Name,Root,Used,Free;",
    "[pscustomobject]@{ os=$os; cpu=$cpu; gpu=$gpu; drives=$drives } | ConvertTo-Json -Depth 6"
  ].join(" ");

  const result = powershell(script, 45_000);
  const parsed = parseJsonCommand(result, {});
  const osInfo = parsed.os || {};
  const cpu = parsed.cpu || {};
  const gpu = Array.isArray(parsed.gpu) ? parsed.gpu : parsed.gpu ? [parsed.gpu] : [];
  const drives = Array.isArray(parsed.drives)
    ? parsed.drives
    : parsed.drives
      ? [parsed.drives]
      : [];

  return {
    ok: result.ok,
    host: osInfo.CsName || os.hostname(),
    os: {
      name: osInfo.OsName || os.type(),
      version: osInfo.OsVersion || os.release(),
      build: osInfo.OsBuildNumber || null,
      product: osInfo.WindowsProductName || null
    },
    cpu: {
      name: String(cpu.Name || os.cpus()[0]?.model || "").trim(),
      cores: Number(cpu.NumberOfCores || 0),
      logicalProcessors: Number(cpu.NumberOfLogicalProcessors || os.cpus().length || 0),
      maxClockMhz: Number(cpu.MaxClockSpeed || 0)
    },
    memory: {
      totalGb: bytesToGb(osInfo.CsTotalPhysicalMemory || os.totalmem()),
      freeGb: bytesToGb(os.freemem())
    },
    gpu: gpu.map((item) => ({
      name: item.Name || null,
      adapterRamGb: item.AdapterRAM ? bytesToGb(item.AdapterRAM) : null,
      driverVersion: item.DriverVersion || null
    })),
    drives: drives.map((drive) => ({
      name: drive.Name,
      root: drive.Root,
      usedGb: bytesToGb(drive.Used),
      freeGb: bytesToGb(drive.Free)
    })),
    error: result.ok ? null : compactError(result)
  };
}

function detectTools() {
  const specs = [
    { name: "git", versionArgs: ["--version"] },
    { name: "node", versionArgs: ["--version"] },
    { name: "npm", versionArgs: ["--version"] },
    { name: "python", versionArgs: ["--version"] },
    { name: "py", versionArgs: ["--version"] },
    { name: "hermes", versionArgs: ["--version"], timeoutMs: 20_000 },
    { name: "codex", versionArgs: ["--version"] },
    { name: "ollama", versionArgs: ["--version"] },
    { name: "chrome", versionArgs: ["--version"] },
    { name: "code", versionArgs: ["--version"] }
  ];

  return specs.map((spec) => {
    const foundPath = commandPath(spec.name);
    const version = foundPath
      ? commandVersion(spec.name, foundPath, spec.versionArgs, spec.timeoutMs || 10_000)
      : { ok: false, value: null, error: "not found in PATH" };

    return {
      name: spec.name,
      found: Boolean(foundPath),
      path: foundPath,
      version: version.value,
      error: version.ok ? null : version.error
    };
  });
}

function detectHermes() {
  const hermesPath = commandPath("hermes");
  const desktopPath = path.join(
    process.env.LOCALAPPDATA || "",
    "Programs",
    "hermes-desktop",
    "hermes-agent.exe"
  );

  const status = hermesPath ? runResolvedCommand("hermes", hermesPath, ["status"], 60_000) : null;
  const version = hermesPath
    ? commandVersion("hermes", hermesPath, ["--version"], 20_000)
    : null;
  const stdout = status?.stdout || "";

  return {
    found: Boolean(hermesPath),
    cliPath: hermesPath,
    desktop: {
      found: fs.existsSync(desktopPath),
      path: desktopPath
    },
    version: version?.value || null,
    status: status
      ? {
          ok: status.ok,
          durationMs: status.durationMs,
          provider: matchLine(stdout, /Provider:\s+(.+)/),
          model: matchLine(stdout, /Model:\s+(.+)/),
          gateway: matchLine(stdout, /Status:\s+(.+)/),
          jobs: matchLine(stdout, /Jobs:\s+(.+)/),
          sessions: matchLine(stdout, /Active:\s+(.+)/),
          codexAuth: /OpenAI Codex\s+.+logged in/i.test(stdout),
          needsUpdate: /Update available/i.test(stdout),
          rawExcerpt: safeHermesExcerpt(stdout)
        }
      : null,
    error: status && !status.ok ? compactError(status) : null
  };
}

function matchLine(value, pattern) {
  const match = String(value || "").match(pattern);
  return match ? match[1].trim() : null;
}

function safeHermesExcerpt(stdout) {
  const safeLines = [];

  for (const line of String(stdout || "").split(/\r?\n/)) {
    if (/API Keys/i.test(line)) break;
    safeLines.push(line);
  }

  return safeLines.slice(0, 20).join("\n");
}

function detectOllama() {
  const ollamaPath = commandPath("ollama");
  const version = ollamaPath ? commandVersion("ollama", ollamaPath, ["--version"]) : null;
  const list = ollamaPath ? runResolvedCommand("ollama", ollamaPath, ["list"], 30_000) : null;

  return {
    found: Boolean(ollamaPath),
    path: ollamaPath,
    version: version?.value || null,
    models: list?.ok ? parseOllamaList(list.stdout) : [],
    error: list && !list.ok ? compactError(list) : null
  };
}

function parseOllamaList(stdout) {
  return String(stdout || "")
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\s{2,}/);
      return {
        name: parts[0] || null,
        id: parts[1] || null,
        size: parts[2] || null,
        modified: parts.slice(3).join(" ") || null
      };
    });
}

function detectChrome() {
  const userData = path.join(
    process.env.LOCALAPPDATA || "",
    "Google",
    "Chrome",
    "User Data"
  );
  const defaultExe = path.join(
    process.env.ProgramFiles || "C:\\Program Files",
    "Google",
    "Chrome",
    "Application",
    "chrome.exe"
  );
  const pathFromCommand = commandPath("chrome");
  const exePath = pathFromCommand || (fs.existsSync(defaultExe) ? defaultExe : null);
  const profiles = [];

  if (fs.existsSync(userData)) {
    for (const entry of fs.readdirSync(userData, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (!/^(Default|Profile \d+)$/.test(entry.name)) continue;

      const fullPath = path.join(userData, entry.name);
      const stat = fs.statSync(fullPath);
      profiles.push({
        name: entry.name,
        path: fullPath,
        lastWriteTime: stat.mtime.toISOString()
      });
    }
  }

  return {
    found: Boolean(exePath),
    inPath: Boolean(pathFromCommand),
    exePath,
    userData,
    profileCount: profiles.length,
    profiles
  };
}

function detectProcesses() {
  const script = [
    "Get-Process |",
    "Where-Object { $_.ProcessName -match '^(hermes|ollama|chrome|codex|Codex|node|python)$' } |",
    "Select-Object ProcessName,Id,@{Name='RamMb';Expression={[math]::Round($_.WorkingSet64/1MB,1)}},Path |",
    "ConvertTo-Json -Depth 4"
  ].join(" ");
  const result = powershell(script, 20_000);
  const parsed = parseJsonCommand(result, []);
  const rows = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];

  return {
    ok: result.ok,
    processes: rows.map((row) => ({
      name: row.ProcessName,
      id: row.Id,
      ramMb: row.RamMb,
      path: row.Path || null
    })),
    error: result.ok ? null : compactError(result)
  };
}

function recommendMode(hardware, ollama) {
  const totalRam = hardware.memory?.totalGb || 0;
  const freeRam = hardware.memory?.freeGb || 0;
  const localModels = ollama.models || [];
  const warnings = [];

  if (totalRam <= 16) {
    warnings.push("Limitar a um modelo local pequeno quente por vez.");
  }

  if (freeRam < 4) {
    warnings.push("Memoria livre baixa agora; preferir modo leve.");
  }

  if (!localModels.length) {
    warnings.push("Nenhum modelo Ollama detectado; fallback offline incompleto.");
  }

  let mode = "trabalho";
  if (freeRam < 4) mode = "leve";
  if (freeRam > 8 && totalRam >= 16) mode = "trabalho";

  return {
    mode,
    warnings,
    policy: {
      localHeavyConcurrency: 1,
      cloudConcurrency: 3,
      maxSilentOperationMinutes: 10,
      keepWarmLocalModels: totalRam <= 16 ? 1 : 2
    }
  };
}

function buildReport() {
  const hardware = detectHardware();
  const tools = detectTools();
  const hermes = detectHermes();
  const codexTool = tools.find((tool) => tool.name === "codex") || null;
  const ollama = detectOllama();
  const chrome = detectChrome();
  const processes = detectProcesses();
  const recommendation = recommendMode(hardware, ollama);

  return {
    schema: "rayx.doctor.v1",
    generatedAt: nowIso(),
    localFirst: true,
    hardware,
    tools,
    hermes,
    codex: {
      found: Boolean(codexTool?.found),
      path: codexTool?.path || null,
      version: codexTool?.version || null
    },
    ollama,
    chrome,
    processes,
    recommendation,
    nextSteps: [
      "Criar rayx shell usando este mesmo contrato JSON.",
      "Ligar o status ao dashboard.",
      "Adicionar apelidos e permissoes para perfis Chrome.",
      "Criar benchmarks pequenos para modelos Ollama e CLIs externas."
    ]
  };
}

function parseArgs(argv) {
  const args = { pretty: false, out: null };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--pretty") {
      args.pretty = true;
      continue;
    }

    if (token === "--out") {
      args.out = argv[index + 1] || null;
      index += 1;
      continue;
    }
  }

  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const report = buildReport();
  const json = JSON.stringify(report, null, args.pretty ? 2 : 0);

  if (args.out) {
    fs.mkdirSync(path.dirname(path.resolve(args.out)), { recursive: true });
    fs.writeFileSync(args.out, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }

  process.stdout.write(`${json}\n`);
}

if (require.main === module) {
  main();
}

module.exports = {
  buildReport
};
