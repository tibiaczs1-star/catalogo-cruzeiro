#!/usr/bin/env node
/**
 * Nango SDK Setup para Rayxpx Matrix Swarm Core
 * 
 * Uso:
 *   node scripts/install-nango.js
 * 
 * O que faz:
 *   - Verifica se @nangohq/node esta instalado
 *   - Cria estrutura de integracao OAuth
 *   - Mostra como usar no Hermes/Rayxpx
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const WORKSPACE_DIR = path.join(__dirname, '..');

async function main() {
  console.log('=== Nango SDK Setup para Rayxpx ===\n');
  
  // 1. Verificar se esta instalado
  console.log('1. Verificando installacao atual...');
  try {
    require.resolve('@nangohq/node');
    console.log('   @nangohq/node ja instalado\n');
  } catch (e) {
    console.log('   @nangohq/node nao encontrado. Instalando...\n');
    try {
      execSync(`cd "${WORKSPACE_DIR}" && npm install @nangohq/node --save`, {
        stdio: 'inherit'
      });
      console.log('   Nango SDK instalado com sucesso\n');
    } catch (err) {
      console.error('   ERRO ao instalar:', err.message);
      console.log('   Tente manualmente: npm install @nangohq/node\n');
    }
  }
  
  // 2. Verificar NANGO_SECRET_KEY
  console.log('2. Verificando NANGO_SECRET_KEY...');
  const secretKey = process.env.NANGO_SECRET_KEY;
  if (secretKey) {
    console.log('   NANGO_SECRET_KEY encontrada');
  } else {
    console.log('   AVISO: NANGO_SECRET_KEY nao definida');
    console.log('   Configure em: ~/.bashrc ou ambiente');
    console.log('   Obtem em: https://app.nango.dev\n');
  }
  
  // 3. Criar arquivo de exemplo de uso
  console.log('3. Criando exemplo de uso...');
  const exampleCode = `/**
 * Exemplo de Uso Nango com Rayxpx
 * Baseado em: scripts/nango-example.js
 * 
 * Nango gerencia conexoes OAuth para integrais com servicios externos.
 * Use para conectar GitHub, Slack, Google Workspace, etc.
 */

const { Nango } = require("@nangohq/node");

// Inicializar com sua secret key
const nango = new Nango({ 
  secretKey: process.env.NANGO_SECRET_KEY || "<YOUR-NANGO-SECRET-KEY>" 
});

// Exemplo 1: Dar star em um repo GitHub
async function starRepository() {
  await nango.put({
    endpoint: "/user/starred/nangohq/nango",
    connectionId: "05c44207-1fbf-4e0d-83eb-5d9f68148db2",
    providerConfigKey: "github-getting-started"
  });
  console.log("Starred Nango's Github repository!");
}

// Exemplo 2: Listar repositorios GitHub
async function listRepositories(connectionId) {
  const result = await nango.get({
    endpoint: "/user/repos",
    connectionId: connectionId,
    providerConfigKey: "github-getting-started"
  });
  return result.data;
}

// Exemplo 3: Enviar mensagem Slack
async function sendSlackMessage(connectionId, channel, message) {
  await nango.post({
    endpoint: "/chat.postMessage",
    data: {
      channel: channel,
      text: message
    },
    connectionId: connectionId,
    providerConfigKey: "slack"
  });
  console.log("Mensagem enviada para Slack!");
}

// Setup de conexao OAuth
async function createConnection(providerConfigKey, userId) {
  const connectionConfig = await nango.createConnection({
    providerConfigKey: providerConfigKey,
    connectionId: userId,
    forceNewDeployment: true
  });
  return connectionConfig;
}

module.exports = { nango, starRepository, listRepositories, sendSlackMessage, createConnection };
`;

  const examplePath = path.join(WORKSPACE_DIR, 'scripts', 'nango-example.js');
  fs.writeFileSync(examplePath, exampleCode);
  console.log('   Criado:', examplePath);
  
  // 4. Mostrar integracoes disponiveis
  console.log('\n=== Integracoes Nango Disponiveis ===');
  const integrations = [
    { name: 'GitHub', key: 'github', desc: 'Repos, stars, issues, PRs' },
    { name: 'Slack', key: 'slack', desc: 'Canais, mensagens, arquivos' },
    { name: 'Google Workspace', key: 'google-workspace', desc: 'Gmail, Drive, Calendar' },
    { name: 'Notion', key: 'notion', desc: 'Pages, databases' },
    { name: 'Linear', key: 'linear', desc: 'Issues, projects' },
    { name: 'Jira', key: 'jira', desc: 'Tickets, projetos' },
    { name: 'Salesforce', key: 'salesforce', desc: 'CRM, oportunidades' },
  ];
  
  console.log('\n Provider Config Key     | Nome                | Capacidades');
  console.log('-------------------------|---------------------|-----------------------------');
  integrations.forEach(i => {
    console.log(` ${i.key.padEnd(22)} | ${i.name.padEnd(18)} | ${i.desc}`);
  });
  
  // 5. Mostrar proximos passos
  console.log('\n=== Proximos Passos ===');
  console.log('1. Obtenha API key em: https://app.nango.dev');
  console.log('2. Configure: export NANGO_SECRET_KEY=***');
  console.log('3. Use em scripts: require("./scripts/nango-example.js")');
  console.log('\nDocs: https://docs.nango.dev');
}

main().catch(console.error);
