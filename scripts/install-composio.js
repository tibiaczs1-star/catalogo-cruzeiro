#!/usr/bin/env node
/**
 * Composio SDK Setup para Rayxpx Matrix Swarm Core
 * 
 * Uso:
 *   node scripts/install-composio.js
 * 
 * O que faz:
 *   - Verifica se @composio/core esta instalado
 *   - Cria estrutura de tool router
 *   - Mostra como usar no Hermes/Rayxpx
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COMPOSIO_PACKAGES = [
  '@composio/core',
  '@composio/node-sdk',
  'ai',
  '@ai-sdk/anthropic'
];

const WORKSPACE_DIR = path.join(__dirname, '..');

async function main() {
  console.log('=== Composio SDK Setup para Rayxpx ===\n');
  
  // 1. Verificar se esta instalado
  console.log('1. Verificando installacao atual...');
  try {
    require.resolve('@composio/core');
    console.log('   @composio/core ja instalado\n');
  } catch (e) {
    console.log('   @composio/core nao encontrado. Instalando...\n');
    try {
      execSync(`cd "${WORKSPACE_DIR}" && npm install @composio/core @composio/node-sdk ai @ai-sdk/anthropic --save`, {
        stdio: 'inherit'
      });
      console.log('   Composio SDK instalado com sucesso\n');
    } catch (err) {
      console.error('   ERRO ao instalar:', err.message);
      console.log('   Tente manualmente: npm install @composio/core @composio/node-sdk ai @ai-sdk/anthropic\n');
    }
  }
  
  // 2. Verificar COMPOSIO_API_KEY
  console.log('2. Verificando COMPOSIO_API_KEY...');
  const apiKey = process.env.COMPOSIO_API_KEY;
  if (apiKey) {
    console.log('   COMPOSIO_API_KEY encontrada');
  } else {
    console.log('   AVISO: COMPOSIO_API_KEY nao definida');
    console.log('   Configure em: ~/.bashrc ou ambiente');
    console.log('   Obtem em: https://app.composio.dev\n');
  }
  
  // 3. Criar arquivo de exemplo de uso
  console.log('3. Criando exemplo de uso...');
  const exampleCode = `/**
 * Exemplo de Uso Composio com Rayxpx
 * Baseado em: scripts/composio-example.js
 */

const { anthropic } = require("@ai-sdk/anthropic");
const { Composio } = require("@composio/core");
const { VercelProvider } = require("@composio/vercel");
const { streamText, stepCountIs } = require("ai");

const composio = new Composio({ 
  provider: new VercelProvider() 
});

const userId = "rayxpx-agent";

async function executarTarefa(tarefa) {
  console.log("Iniciando tarefa:", tarefa);
  
  const session = await composio.create(userId);
  const tools = await session.tools();
  
  const stream = await streamText({
    model: anthropic("claude-sonnet-4-6"),
    prompt: tarefa,
    stopWhen: stepCountIs(10),
    tools,
  });
  
  for await (const textPart of stream.textStream) {
    process.stdout.write(textPart);
  }
  
  return stream;
}

// Exemplos de tarefas:
// - "Star the composiohq/composio repo on GitHub"
// - "Create a new repository on GitHub called test-repo"
// - "Send a Slack message to #general channel"

module.exports = { executarTarefa, composio, session };
`;

  const examplePath = path.join(WORKSPACE_DIR, 'scripts', 'composio-example.js');
  fs.writeFileSync(examplePath, exampleCode);
  console.log('   Criado:', examplePath);
  
  // 4. Mostrar proximos passos
  console.log('\n=== Proximos Passos ===');
  console.log('1. Obtenha API key em: https://app.composio.dev');
  console.log('2. Configure: export COMPOSIO_API_KEY=sua_key');
  console.log('3. Use em scripts: require("./scripts/composio-example.js")');
  console.log('\nDocs: https://docs.composio.dev');
}

main().catch(console.error);
