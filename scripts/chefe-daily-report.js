#!/usr/bin/env node
/**
 * CHEFE CALL — Relatório Diário
 * Envia resumo de métricas para o Telegram
 * Roda todo dia às 9h via cron
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const SITE_URL = 'https://catalogo-cruzeiro.github.io/catalogo-cruzeiro/';
const GITHUB_REPO = 'tibiaczs1-star/catalogo-cruzeiro';

async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function checkUptime() {
  try {
    const res = await fetchWithTimeout(SITE_URL, {}, 8000);
    return res.ok ? '🟢 Online' : '🔴 Erro HTTP ' + res.status;
  } catch (e) {
    return '🔴 Fora do ar';
  }
}

async function getLighthouseScore() {
  // Usa API pública do PageSpeed (sem API key — limitado)
  try {
    const url = encodeURIComponent(SITE_URL);
    const res = await fetchWithTimeout(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&strategy=mobile&category=performance`,
      {},
      15000
    );
    if (!res.ok) return null;
    const data = await res.json();
    const score = data?.lighthouseResult?.categories?.performance?.score;
    return score ? Math.round(score * 100) : null;
  } catch (e) {
    return null;
  }
}

async function getGitHubLastCommit() {
  try {
    const res = await fetchWithTimeout(
      `https://api.github.com/repos/${GITHUB_REPO}/commits?per_page=1`,
      { headers: { 'User-Agent': 'ChefeCall/1.0' } },
      8000
    );
    if (!res.ok) return null;
    const commits = await res.json();
    if (!commits || !commits[0]) return null;
    const c = commits[0];
    const date = new Date(c.commit.author.date);
    const diff = Date.now() - date.getTime();
    const hours = Math.round(diff / 3600000);
    return { message: c.commit.message.split('\n')[0].substring(0, 60), hours, url: c.html_url };
  } catch (e) {
    return null;
  }
}

function formatDate() {
  return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

async function sendTelegram(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('[Chefe Call] Telegram não configurado. Mensagem:', message);
    return;
  }
  try {
    const res = await fetchWithTimeout(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: 'Markdown' })
      },
      10000
    );
    const data = await res.json();
    if (!data.ok) console.error('[Chefe Call] Erro Telegram:', data.description);
  } catch (e) {
    console.error('[Chefe Call] Falha ao enviar Telegram:', e.message);
  }
}

async function main() {
  console.log('[Chefe Call] Gerando relatório diário...');

  const [uptime, lighthouse, commit] = await Promise.all([
    checkUptime(),
    getLighthouseScore(),
    getGitHubLastCommit()
  ]);

  let perfEmoji = '⚡';
  let perfText = 'N/A';
  if (lighthouse !== null) {
    if (lighthouse >= 90) { perfEmoji = '✅'; }
    else if (lighthouse >= 70) { perfEmoji = '🟡'; }
    else { perfEmoji = '🔴'; }
    perfText = `${lighthouse}/100`;
  }

  let commitText = 'N/A';
  if (commit) {
    const timeAgo = commit.hours < 1 ? '< 1h' : `${commit.hours}h`;
    commitText = `[${timeAgo} atrás](${commit.url}) — ${commit.message}`;
  }

  const message = [
    `*📊 Chefe Call — Relatório Diário*`,
    `*${formatDate()}*`,
    ``,
    `*🌐 Site:* ${uptime}`,
    `*${perfEmoji} Performance:* ${perfText}`,
    ``,
    `*📦 Último deploy:*`,
    commitText ? commitText : 'N/A',
    ``,
    `*🎯 Prioridades de hoje:*`,
    `• Verificar feeds de notícias`,
    `• Checar fontes ativas`,
    `• Acompanhar cobertura regional`,
    ``,
    `_Enviado automaticamente pelo Chefe Call_`
  ].join('\n');

  console.log(message);
  await sendTelegram(message);
}

main().catch(console.error);
