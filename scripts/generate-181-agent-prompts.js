const fs = require("fs");
const path = require("path");

const root = process.cwd();
const registryPath = path.join(root, ".codex-agents", "registry.json");
const outputDir = path.join(root, "docs");
const outputMd = path.join(outputDir, "cheffe-call-181-prompts.md");
const outputJson = path.join(outputDir, "cheffe-call-181-prompts.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function trimList(values, size) {
  return unique(values).slice(0, size);
}

function buildGlobalPrompt(registry) {
  const officeSummary = registry.offices.map((item) => `${item.office} (${item.agents})`).join(", ");
  const roleSummary = registry.roles.map((item) => `${item.role} (${item.agents})`).join(", ");

  return [
    "CHEFFE CALL SUPREMO",
    "",
    "Você está coordenando uma reunião com os 181 agentes reais do projeto.",
    `Equipe total: ${registry.totalAgents} agentes.`,
    `Escritórios: ${officeSummary}.`,
    `Funções: ${roleSummary}.`,
    "",
    "Objetivo:",
    "Entregar o acabamento mais fino, tecnológico, legível e premium possível para o site inteiro, sem perder clareza, confiança editorial e utilidade real.",
    "",
    "Regras da rodada:",
    "1. Cada agente responde a partir da sua especialidade real.",
    "2. Toda ideia precisa melhorar leitura, hierarquia, confiança ou sensação tecnológica.",
    "3. Efeito visual sem função deve ser cortado.",
    "4. O resultado final deve parecer produto premium, não protótipo decorado.",
    "",
    "Formato de resposta exigido:",
    "- Diagnóstico breve do bloco analisado",
    "- 3 melhorias de alto impacto",
    "- 2 riscos a evitar",
    "- 1 proposta final pronta para execução",
    "",
    "Blocos prioritários:",
    "- Home e hero principal",
    "- Trending & Buzz",
    "- Mural de fundadores",
    "- Cheffe Call",
    "- Dashboard admin",
    "- Sistema visual compartilhado",
    "",
    "Síntese final que o CEO deve devolver:",
    "- O que cortar",
    "- O que reforçar",
    "- O que unificar",
    "- O que vira assinatura visual do produto"
  ].join("\n");
}

function buildOfficePrompt(office, agents) {
  const roles = trimList(agents.map((item) => item.role), 12).join(", ");
  const names = trimList(agents.map((item) => item.name), 10).join(", ");
  const specialties = trimList(
    agents.flatMap((item) => [item.specialty, ...(item.skills || []), ...(item.capabilities || [])]),
    16
  ).join(", ");

  return [
    `CHEFFE CALL DO ${office.office.toUpperCase()}`,
    "",
    `Você está conduzindo o escritório ${office.office} com ${office.agents} agentes.`,
    `Funções presentes: ${roles}.`,
    `Alguns nomes deste escritório: ${names}.`,
    `Território de especialidade: ${specialties}.`,
    "",
    "Missão:",
    "Gerar ideias de acabamento ultrafino e tecnológico para o site, mantendo legibilidade forte, contraste controlado e identidade premium.",
    "",
    "Entregue:",
    "1. Diagnóstico do que esse escritório enxerga no produto",
    "2. 5 ideias de melhoria que só esse escritório saberia propor",
    "3. 3 decisões práticas para execução imediata",
    "4. 1 frase de tese visual/técnica do escritório"
  ].join("\n");
}

function buildAgentPrompt(agent) {
  const skills = trimList([...(agent.skills || []), ...(agent.capabilities || []), ...(agent.monitoringFocus || [])], 12);
  const deliverables = trimList(agent.deliverables || [], 8);

  return {
    id: agent.id,
    slug: agent.slug || slugify(agent.name),
    name: agent.name,
    office: agent.officeLabel,
    role: agent.role,
    specialty: agent.specialty || "",
    prompt: [
      `PROMPT DO AGENTE: ${agent.name.toUpperCase()}`,
      "",
      `Você é ${agent.name}, agente real do ${agent.officeLabel}.`,
      `Função: ${agent.role}.`,
      `Especialidade: ${agent.specialty || "especialidade operacional do escritório"}.`,
      `Título: ${agent.title || "agente do sistema"}.`,
      "",
      "Missão nesta Cheffe Call:",
      "Analisar o site inteiro e propor acabamento mais fino, tecnológico e premium já feito, sem sacrificar leitura e clareza de produto.",
      "",
      `Seus repertórios prioritários: ${skills.join(", ") || "leitura visual, clareza e operação"}.`,
      `Saídas esperadas: ${deliverables.join(", ") || "direção, ajuste, proposta, validação"}.`,
      "",
      "Formato obrigatório da sua resposta:",
      "- O que está fraco hoje",
      "- O que você faria para elevar o nível",
      "- Um detalhe de acabamento que quase ninguém perceberia, mas mudaria tudo",
      "- Um prompt curto para orientar implementação",
      "",
      "Nunca proponha efeito só por efeito. O acabamento precisa parecer tecnologia elegante, produto forte e leitura imediata."
    ].join("\n")
  };
}

function buildMarkdown(registry, officePrompts, agentPrompts) {
  const lines = [];
  lines.push("# Cheffe Call • Prompts dos 181 Agentes");
  lines.push("");
  lines.push(`Gerado automaticamente a partir de \`.codex-agents/registry.json\` em ${new Date().toISOString()}.`);
  lines.push("");
  lines.push(`- Total de agentes: ${registry.totalAgents}`);
  lines.push(`- Escritórios: ${registry.offices.map((item) => `${item.office} (${item.agents})`).join(", ")}`);
  lines.push(`- Funções: ${registry.roles.map((item) => `${item.role} (${item.agents})`).join(", ")}`);
  lines.push("");
  lines.push("## Prompt Supremo");
  lines.push("");
  lines.push("```text");
  lines.push(buildGlobalPrompt(registry));
  lines.push("```");
  lines.push("");
  lines.push("## Prompts por Escritório");
  lines.push("");

  officePrompts.forEach((item) => {
    lines.push(`### ${item.office}`);
    lines.push("");
    lines.push("```text");
    lines.push(item.prompt);
    lines.push("```");
    lines.push("");
  });

  lines.push("## Prompts Individuais");
  lines.push("");

  agentPrompts.forEach((item) => {
    lines.push(`### ${item.name} • ${item.office} • ${item.role}`);
    lines.push("");
    lines.push("```text");
    lines.push(item.prompt);
    lines.push("```");
    lines.push("");
  });

  return lines.join("\n");
}

function main() {
  const registry = readJson(registryPath);
  const agents = Array.isArray(registry.agents) ? registry.agents : [];
  const offices = Array.isArray(registry.offices) ? registry.offices : [];

  const officePrompts = offices.map((office) => ({
    office: office.office,
    prompt: buildOfficePrompt(
      office,
      agents.filter((agent) => agent.officeLabel === office.office)
    )
  }));

  const agentPrompts = agents.map(buildAgentPrompt);

  const payload = {
    generatedAt: new Date().toISOString(),
    totalAgents: registry.totalAgents,
    globalPrompt: buildGlobalPrompt(registry),
    offices: officePrompts,
    agents: agentPrompts
  };

  ensureDir(outputDir);
  fs.writeFileSync(outputJson, JSON.stringify(payload, null, 2));
  fs.writeFileSync(outputMd, buildMarkdown(registry, officePrompts, agentPrompts));

  console.log(`Generated ${agentPrompts.length} agent prompts.`);
  console.log(`Markdown: ${outputMd}`);
  console.log(`JSON: ${outputJson}`);
}

main();
