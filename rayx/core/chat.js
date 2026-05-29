#!/usr/bin/env node
"use strict";

const readline = require("node:readline");
const { renderMissionResult, runMission } = require("./mission");

function routeChatMessage(message) {
  const text = String(message || "").toLowerCase();
  if (/hermes/.test(text)) return { intent: "hermes", useMission: true };
  if (/chrome|browser|navegador|cdp/.test(text)) return { intent: "chrome-bridge", useMission: true };
  if (/boot|inicia|ligar|startup/.test(text)) return { intent: "boot", useMission: true };
  if (/ferrament|catalog|skill|cli|herdou|agentes/.test(text)) return { intent: "catalog", useMission: true };
  if (/status|pc|sistema|memoria|cpu/.test(text)) return { intent: "status", useMission: true };
  return { intent: "llm", useMission: true };
}

function buildChatPrompt(message, context = {}) {
  return {
    schema: "rayx.chat.prompt.v1",
    outputLanguage: "pt-BR",
    internalPromptLanguage: "en-US",
    system: [
      "RayX is a local unified multi-agent execution flow.",
      "Codex, Hermes, Ollama, Chrome/CDP, shell tools, skills and external CLIs are lanes of the same mission bus.",
      "Collect local evidence first, divide work by lane, then return one clear answer in Portuguese."
    ].join(" "),
    message: String(message || "").trim(),
    history: context.history || []
  };
}

async function askRayX(message, options = {}) {
  const route = routeChatMessage(message);
  const prompt = buildChatPrompt(message, options);
  const mission = await runMission(message, {
    id: options.id,
    skipLlm: options.skipLlm
  });

  return {
    schema: "rayx.chat.turn.v1",
    createdAt: new Date().toISOString(),
    route,
    prompt,
    mission,
    answer: renderMissionResult(mission)
  };
}

function printAnswer(turn, json) {
  process.stdout.write(json ? `${JSON.stringify(turn, null, 2)}\n` : `${turn.answer}\n`);
}

async function startChat() {
  process.stdout.write("RayX chat unificado\nDigite sua missao ou /exit.\n\n");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "rayx chat> "
  });

  rl.prompt();
  rl.on("line", async (line) => {
    const message = String(line || "").trim();
    if (message === "/exit" || message === "/quit") {
      rl.close();
      return;
    }

    if (!message) {
      rl.prompt();
      return;
    }

    try {
      const turn = await askRayX(message);
      process.stdout.write(`\n${turn.answer}\n\n`);
    } catch (error) {
      process.stdout.write(`\nFalha RayX chat: ${error.message}\n\n`);
    }
    rl.prompt();
  });
}

async function main() {
  const json = process.argv.includes("--json");
  const noLlm = process.argv.includes("--no-llm");
  const message = process.argv.slice(2).filter((arg) => arg !== "--json" && arg !== "--no-llm").join(" ").trim();

  if (!message) {
    await startChat();
    return;
  }

  const turn = await askRayX(message, { skipLlm: noLlm });
  printAnswer(turn, json);
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = {
  askRayX,
  buildChatPrompt,
  routeChatMessage,
  startChat
};
