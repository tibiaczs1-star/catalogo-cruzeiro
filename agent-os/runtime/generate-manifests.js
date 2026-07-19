/**
 * Agent OS — Gerador de Manifestos
 *
 * Transforma as definições de especialistas em manifestos JSON prontos para o runtime.
 * Gera um arquivo por especialista + um índice consolidado.
 *
 * Uso:
 *   node generate-manifests.js
 *   node generate-manifests.js --force
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "manifests");
const SPECIALISTS_FILE = path.join(ROOT, "specialists", "specialists-manifest.md");

const DIRECTORS = {
  tecnologia: {
    id: "dir-tecnologia",
    name: "Diretor de Tecnologia",
    cargo: "CTO IA",
    description: "Responsável por todo o stack técnico.",
    manages: ["gerente-backend", "gerente-frontend", "gerente-ia", "gerente-seguranca"],
  },
  editorial: {
    id: "dir-editorial",
    name: "Diretor Editorial",
    cargo: "Editor-chefe",
    description: "Responsável por todo o conteúdo.",
    manages: ["gerente-noticias", "gerente-conteudo", "gerente-social", "gerente-pesquisa"],
  },
  design: {
    id: "dir-design",
    name: "Diretor de Design",
    cargo: "Diretor de Design",
    description: "Responsável por toda a experiência visual.",
    manages: ["gerente-visual", "gerente-motion", "gerente-criativo"],
  },
  crescimento: {
    id: "dir-crescimento",
    name: "Diretor de Crescimento",
    cargo: "Diretor de Crescimento",
    description: "Responsável por crescimento e monetização.",
    manages: ["gerente-analytics", "gerente-engajamento", "gerente-monetizacao"],
  },
  auditoria: {
    id: "auditor-geral",
    name: "Auditor Geral",
    cargo: "Auditor Geral",
    description: "Verifica tudo antes de aprovar.",
    manages: ["auditor-codigo", "auditor-editorial", "auditor-estrategico"],
  },
};

const MANAGERS = {
  "gerente-backend": { id: "gerente-backend", name: "Gerente Backend", reportsTo: "dir-tecnologia", manages: ["esp-001", "esp-002", "esp-003", "esp-004"] },
  "gerente-frontend": { id: "gerente-frontend", name: "Gerente Frontend", reportsTo: "dir-tecnologia", manages: ["esp-009", "esp-010", "esp-025", "esp-026"] },
  "gerente-ia": { id: "gerente-ia", name: "Gerente de IA", reportsTo: "dir-tecnologia", manages: ["esp-007", "esp-008"] },
  "gerente-seguranca": { id: "gerente-seguranca", name: "Gerente de Segurança", reportsTo: "dir-tecnologia", manages: ["esp-005", "esp-006"] },
  "gerente-noticias": { id: "gerente-noticias", name: "Gerente de Notícias", reportsTo: "dir-editorial", manages: ["esp-011", "esp-012", "esp-013", "esp-020"] },
  "gerente-conteudo": { id: "gerente-conteudo", name: "Gerente de Conteúdo", reportsTo: "dir-editorial", manages: ["esp-014", "esp-015", "esp-016", "esp-021"] },
  "gerente-social": { id: "gerente-social", name: "Gerente de Social", reportsTo: "dir-editorial", manages: ["esp-017", "esp-018", "esp-019"] },
  "gerente-pesquisa": { id: "gerente-pesquisa", name: "Gerente de Pesquisa", reportsTo: "dir-editorial", manages: ["esp-020", "esp-021"] },
  "gerente-visual": { id: "gerente-visual", name: "Gerente Visual", reportsTo: "dir-design", manages: ["esp-022", "esp-023", "esp-024"] },
  "gerente-motion": { id: "gerente-motion", name: "Gerente de Motion", reportsTo: "dir-design", manages: ["esp-025", "esp-026"] },
  "gerente-criativo": { id: "gerente-criativo", name: "Gerente Criativo", reportsTo: "dir-design", manages: ["esp-027", "esp-028"] },
  "gerente-analytics": { id: "gerente-analytics", name: "Gerente de Analytics", reportsTo: "dir-crescimento", manages: ["esp-029", "esp-030", "esp-031"] },
  "gerente-engajamento": { id: "gerente-engajamento", name: "Gerente de Engajamento", reportsTo: "dir-crescimento", manages: ["esp-032", "esp-033", "esp-034"] },
  "gerente-monetizacao": { id: "gerente-monetizacao", name: "Gerente de Monetização", reportsTo: "dir-crescimento", manages: ["esp-035", "esp-036", "esp-037"] },
  "auditor-codigo": { id: "auditor-codigo", name: "Auditor de Código", reportsTo: "auditor-geral", manages: [] },
  "auditor-editorial": { id: "auditor-editorial", name: "Auditor Editorial", reportsTo: "auditor-geral", manages: [] },
  "auditor-estrategico": { id: "auditor-estrategico", name: "Auditor Estratégico", reportsTo: "auditor-geral", manages: [] },
};

function parseSpecialistsFromMarkdown() {
  const content = fs.readFileSync(SPECIALISTS_FILE, "utf8");
  const specialists = [];
  const sections = content.split(/### ESP-(\d+): /);

  for (let i = 1; i < sections.length; i += 2) {
    const idNum = sections[i].trim();
    const body = sections[i + 1] || "";
    const nameMatch = body.match(/^(.+?)\n/);
    const name = nameMatch ? nameMatch[1].trim() : `Especialista ${idNum}`;

    const cargoMatch = body.match(/\*\*Cargo:\*\* (.+)/);
    const specialtyMatch = body.match(/\*\*Especialidade:\*\* (.+)/);
    const subroutines = [];
    const subRegex = /- ROTINA [A-Z0-9]+: (.+)/g;
    let subMatch;
    while ((subMatch = subRegex.exec(body)) !== null) {
      subroutines.push(subMatch[1].trim());
    }

    specialists.push({
      id: `esp-${idNum}`,
      name,
      cargo: cargoMatch ? cargoMatch[1] : name,
      specialty: specialtyMatch ? specialtyMatch[1] : "",
      subroutines,
      level: "specialist",
      llmModel: process.env.CZS_OLLAMA_MODEL || ":3b",
      temperature: 0.3,
      maxTokens: 1500,
    });
  }

  return specialists;
}

function buildManagerManifest(managerKey, manager) {
  return {
    ...manager,
    level: "manager",
    specialty: `Coordena ${manager.manages.length} especialistas`,
    subroutines: [
      "ROTINA A: Receber relatórios dos especialistas",
      "ROTINA B: Agrupar problemas similares",
      "ROTINA C: Remover duplicatas",
      "ROTINA D: Priorizar por severidade",
      "ROTINA E: Enviar relatório consolidado ao Diretor",
    ],
    llmModel: process.env.CZS_OLLAMA_MODEL || ":3b",
    temperature: 0.3,
    maxTokens: 2000,
  };
}

function buildDirectorManifest(dirKey, director) {
  return {
    ...director,
    level: "director",
    specialty: director.description,
    subroutines: [
      "ROTINA A: Receber relatórios dos gerentes",
      "ROTINA B: Consolidar informações",
      "ROTINA C: Tomar decisões estratégicas",
      "ROTINA D: Reportar ao CEO",
    ],
    llmModel: process.env.CZS_OLLAMA_MODEL || ":3b",
    temperature: 0.3,
    maxTokens: 2500,
  };
}

function buildCEOManifest() {
  return {
    id: "ceo-supervisor",
    name: "Supervisor Geral",
    cargo: "CEO da Organização IA",
    description: "Coordena toda a organização. Nunca programa. Nunca escreve conteúdo.",
    level: "ceo",
    specialty: "Estratégia, prioridades, ciclo contínuo",
    reportsTo: null,
    manages: Object.keys(DIRECTORS),
    subroutines: [
      "ROTINA 01 — Daily Brief: consultar endpoints, gerar resumo por diretor, decidir prioridades",
      "ROTINA 02 — Weekly Planning: analisar relatórios, definir 3-5 prioridades, aprovar planos",
      "ROTINA 03 — Monthly Review: consolidar métricas, ajustar estratégia, reportar ao usuário",
      "ROTINA 04 — Crisis Response: detectar queda de métrica, consultar diretor, definir ação corretiva",
      "ROTINA 05 — Strategic Questions: perguntar sobre SEO, Instagram, crescimento, bugs, melhorias",
    ],
    llmModel: process.env.CZS_OLLAMA_MODEL || ":3b",
    temperature: 0.3,
    maxTokens: 3000,
  };
}

function main() {
  const force = process.argv.includes("--force");

  if (!fs.existsSync(SPECIALISTS_FILE)) {
    console.error(`❌ Arquivo não encontrado: ${SPECIALISTS_FILE}`);
    process.exit(1);
  }

  if (!force && fs.existsSync(OUTPUT_DIR)) {
    const count = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith(".json")).length;
    if (count > 0) {
      console.log(`⚠️  Manifestos já existem (${count} arquivos). Use --force para sobrescrever.`);
      return;
    }
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log("🔨 Gerando manifestos do Agent OS...\n");

  const specialists = parseSpecialistsFromMarkdown();
  console.log(`   ${specialists.length} especialistas encontrados`);

  const manifests = [];

  // CEO
  const ceo = buildCEOManifest();
  manifests.push(ceo);
  fs.writeFileSync(path.join(OUTPUT_DIR, "ceo-supervisor.json"), JSON.stringify(ceo, null, 2));
  console.log(`   ✅ ${ceo.id} — ${ceo.name}`);

  // Diretores
  for (const [key, director] of Object.entries(DIRECTORS)) {
    const dirManifest = buildDirectorManifest(key, director);
    manifests.push(dirManifest);
    fs.writeFileSync(path.join(OUTPUT_DIR, `${key}.json`), JSON.stringify(dirManifest, null, 2));
    console.log(`   ✅ ${key} — ${director.name}`);
  }

  // Gerentes
  for (const [key, manager] of Object.entries(MANAGERS)) {
    const mgrManifest = buildManagerManifest(key, manager);
    manifests.push(mgrManifest);
    fs.writeFileSync(path.join(OUTPUT_DIR, `${key}.json`), JSON.stringify(mgrManifest, null, 2));
  }
  console.log(`   ✅ ${Object.keys(MANAGERS).length} gerentes`);

  // Especialistas
  for (const spec of specialists) {
    manifests.push(spec);
    fs.writeFileSync(path.join(OUTPUT_DIR, `${spec.id}.json`), JSON.stringify(spec, null, 2));
  }
  console.log(`   ✅ ${specialists.length} especialistas`);

  // Índice consolidado
  const index = {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    total: manifests.length,
    byLevel: {
      ceo: manifests.filter(m => m.level === "ceo").length,
      director: manifests.filter(m => m.level === "director").length,
      manager: manifests.filter(m => m.level === "manager").length,
      specialist: manifests.filter(m => m.level === "specialist").length,
    },
    manifests,
  };

  fs.writeFileSync(path.join(OUTPUT_DIR, "INDEX.json"), JSON.stringify(index, null, 2));
  console.log(`\n📦 Índice: ${index.total} manifestos (${index.byLevel.specialist} especialistas)`);
  console.log(`   Output: ${OUTPUT_DIR}\n`);
}

main();
