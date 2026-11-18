const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ROOT_DIR = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');

if (!fs.existsSync(DOCS_DIR)) {
  fs.mkdirSync(DOCS_DIR, { recursive: true });
}

function convertHtmlToPdf(htmlPath, pdfPath) {
  const args = [
    '--headless',
    '--disable-gpu',
    '--no-pdf-header-footer',
    '--run-all-compositor-stages-before-draw',
    `--print-to-pdf=${pdfPath}`,
    htmlPath
  ];
  console.log(`[PDF] Renderizando: ${path.basename(pdfPath)}...`);
  const res = cp.spawnSync(CHROME_PATH, args, { stdio: 'inherit' });
  if (res.error) throw res.error;
  if (res.status !== 0) throw new Error(`Chrome saiu com código ${res.status}`);
  const stat = fs.statSync(pdfPath);
  console.log(`[PDF] OK: ${path.basename(pdfPath)} (${(stat.size / 1024).toFixed(1)} KB)`);
  return stat.size;
}

const COMMON_CSS = `
  @page {
    size: A4;
    margin: 18mm 16mm 18mm 16mm;
  }

  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0;
    font-family: 'Georgia', serif;
    color: #121923;
    background-color: #ffffff;
    font-size: 13.5px;
    line-height: 1.65;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  h1, h2, h3, h4 {
    font-family: 'Georgia', serif;
    color: #111827;
    margin-top: 1.4em;
    margin-bottom: 0.4em;
    font-weight: 700;
  }
  h1 { font-size: 25px; line-height: 1.25; letter-spacing: -0.5px; text-align: center; }
  h2 { font-size: 17.5px; border-bottom: 2px solid #121923; padding-bottom: 4px; margin-top: 1.8em; }
  h3 { font-size: 15px; color: #8b1e1e; margin-top: 1.3em; }

  p { margin: 0 0 11px 0; }
  strong { font-weight: 700; color: #000000; }

  .masthead {
    text-align: center;
    border-bottom: 3px double #121923;
    padding-bottom: 12px;
    margin-bottom: 18px;
  }
  .masthead-title {
    font-size: 30px;
    font-weight: 800;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin: 0;
    color: #121923;
  }
  .masthead-subtitle {
    font-style: italic;
    font-size: 13px;
    color: #4b5563;
    margin: 4px 0 8px 0;
  }
  .dateline-bar {
    display: flex;
    justify-content: space-between;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    border-top: 1px solid #121923;
    border-bottom: 1px solid #121923;
    padding: 4px 8px;
    color: #374151;
    background: #faf7f0;
  }

  .badge {
    display: inline-block;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 9.5px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 3px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .badge-nyt { background: #121923; color: #fff; }
  .badge-redacao { background: #8b1e1e; color: #fff; }
  .badge-check { background: #065f46; color: #fff; }
  .badge-gold { background: #b45309; color: #fff; }
  .badge-blue { background: #1e3a8a; color: #fff; }

  .box-destaque {
    background: #faf7f0;
    border-left: 4px solid #8b1e1e;
    padding: 12px 16px;
    margin: 14px 0;
    border-radius: 0 4px 4px 0;
    page-break-inside: avoid;
  }
  .box-destaque p:last-child { margin-bottom: 0; }

  .passo-card {
    border: 1px solid #dcd7cc;
    background: #fdfcf9;
    padding: 14px 16px;
    border-radius: 5px;
    margin: 14px 0;
    page-break-inside: avoid;
  }
  .passo-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  .passo-numero {
    background: #121923;
    color: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 3px;
    text-transform: uppercase;
  }
  .passo-titulo {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-weight: 700;
    font-size: 14px;
    color: #111827;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 12px;
    page-break-inside: avoid;
  }
  th, td {
    border: 1px solid #d1d5db;
    padding: 9px 12px;
    text-align: left;
    vertical-align: top;
  }
  th {
    background-color: #121923;
    color: #ffffff;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 10.5px;
    letter-spacing: 0.5px;
  }
  tr:nth-child(even) { background-color: #faf7f0; }

  .page-break {
    page-break-before: always;
  }

  .footer-brand {
    margin-top: 26px;
    padding-top: 8px;
    border-top: 1px solid #d1d5db;
    display: flex;
    justify-content: space-between;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 9.5px;
    color: #6b7280;
    text-transform: uppercase;
  }
`;

// -------------------------------------------------------------
// 1. GUIA PRÁTICO DO EDITOR (LIMPO, DIRETO, ZERO CÓDIGO)
// -------------------------------------------------------------
function buildCleanEditorGuideHtml() {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Guia Prático do Editor — Redação Catálogo CZS</title>
  <style>${COMMON_CSS}</style>
</head>
<body>
  <div class="masthead">
    <div class="masthead-title">Catálogo CZS</div>
    <div class="masthead-subtitle">Redação Oficial de Jornalismo • Vale do Juruá, Acre</div>
    <div class="dateline-bar">
      <span>Painel da Redação (/editores)</span>
      <span>Manual Prático do Editor</span>
      <span>Edição Atualizada 2026</span>
    </div>
  </div>

  <h1>MANUAL PRÁTICO DO EDITOR</h1>
  <p style="text-align:center; font-style:italic; color:#4b5563; font-size:14px; margin-bottom:16px;">
    Tudo o que você precisa saber para redigir matérias originais, checar fatos, apagar cópias de outros sites e moderar comentários
  </p>

  <div class="box-destaque">
    <p><strong>Bem-vindo à Redação do Catálogo CZS!</strong> Este jornal foi criado para fazer jornalismo sério, direto e sem poluição. Aqui não copiamos releases prontos nem enchemos a capa com banners irritantes. Como editor, você tem total poder para criar matérias autorais, usar inteligência artificial para pesquisar e checar dados, e dar voz aos moradores dos bairros de Cruzeiro do Sul e região.</p>
  </div>

  <h2>1. Como Acessar a Redação</h2>
  <p>Abra o navegador no computador ou no celular e acesse o endereço:</p>
  <div class="box-destaque" style="background:#eef2f6; border-left-color:#1e3a8a;">
    <strong style="font-size:15px; color:#1e3a8a;">👉 https://catalogo-cruzeiro-web.onrender.com/editores</strong><br>
    <span style="font-size:12px; color:#4b5563;">Digite seu usuário e senha de editor para liberar o painel completo de redação.</span>
  </div>

  <h2>2. Onde Sua Matéria vai Aparecer (Níveis de Destaque)</h2>
  <p>Quando você for publicar ou editar uma reportagem, você escolhe onde ela vai entrar:</p>

  <div class="passo-card">
    <div class="passo-header">
      <span class="passo-numero" style="background:#8b1e1e;">Nível 2</span>
      <span class="passo-titulo">Manchete Principal (#1 da Capa)</span>
    </div>
    <p>É a notícia mais importante do dia. Fica grandona no topo do site, com a foto principal em destaque, o resumo de impacto e o botão de áudio para quem quiser ouvir a matéria.</p>
  </div>

  <div class="passo-card">
    <div class="passo-header">
      <span class="passo-numero" style="background:#1e3a8a;">Nível 1</span>
      <span class="passo-titulo">Destaque de Capa (Coluna Lateral & Faixa Nobre)</span>
    </div>
    <p>Assume o topo da coluna direita da capa e entra na faixa nobre <em>"Destaques da Redação"</em>. Perfeito para reportagens especiais de saúde, polícia ou economia local.</p>
  </div>

  <div class="passo-card">
    <div class="passo-header">
      <span class="passo-numero" style="background:#374151;">Nível 0</span>
      <span class="passo-titulo">Feed da Redação</span>
    </div>
    <p>Entra no fluxo de notícias com o selo dourado <strong>Redação CZS</strong>. Toda matéria da nossa redação entra sempre antes de qualquer notícia automática externa.</p>
  </div>

  <div class="page-break"></div>

  <h2>3. Passo a Passo: Escrevendo uma Nova Matéria</h2>
  <p>Na aba <strong>Nova matéria</strong> do seu painel, você preenche os campos básicos:</p>
  <ul>
    <li><strong>Título:</strong> Escreva um título claro, informativo e direto, sem sensacionalismo.</li>
    <li><strong>Editoria:</strong> Escolha a categoria (Cruzeiro do Sul, Polícia, Saúde, Rio Juruá, Agro, Economia ou Educação).</li>
    <li><strong>"Por que importa":</strong> Escreva 1 frase resumindo o impacto da notícia. Exemplo: <em>"A interdição da ponte altera os horários de ônibus e o transporte de pacientes entre Cruzeiro do Sul e Mâncio Lima."</em> Esse bloco aparece em destaque logo abaixo do título no jornal.</li>
    <li><strong>Foto da Matéria:</strong> Se você tiver a foto tirada no local, anexe o link ou arquivo. <em>Não tem foto? Sem problema:</em> o jornal cria automaticamente uma ilustração artística exclusiva e nunca repete fotos velhas de arquivo.</li>
    <li><strong>Texto da Matéria:</strong> Digite ou cole o texto. À direita da sua tela, você vê em tempo real exatamente como o leitor vai enxergar a página pronta.</li>
    <li><strong>Salvamento Automático:</strong> O sistema salva seu texto no navegador enquanto você digita. Se a energia cair ou você fechar a aba sem querer, basta clicar em <strong>"Restaurar rascunho"</strong> para recuperar tudo.</li>
  </ul>

  <h2>4. Seus 7 Assistentes de Inteligência Artificial (IA)</h2>
  <p>Abaixo do campo de texto, você tem botões inteligentes que poupam horas de trabalho:</p>

  <table>
    <thead>
      <tr>
        <th style="width:32%;">Botão</th>
        <th style="width:68%;">Como Usar e O que Ele Faz</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>🔗 Importar Fatos da URL</strong></td>
        <td>Cole o link de outro portal (ou do Diário Oficial) na barra superior e clique neste botão. O sistema lê as informações e datas essenciais sem copiar o texto alheio.</td>
      </tr>
      <tr>
        <td><strong>🔎 Estudar Fontes &amp; Incoerências</strong></td>
        <td>Lê as informações coladas e redige uma reportagem original completa. Se houver divergências de números ou valores entre outros jornais, ele aponta tudo no quadro de checagem.</td>
      </tr>
      <tr>
        <td><strong>🧹 Secar Release</strong></td>
        <td>Recebeu uma nota de assessoria cheia de elogios e propaganda de prefeitura ou governo? Este botão limpa a bajulação e deixa só os fatos reais.</td>
      </tr>
      <tr>
        <td><strong>🕵️ Perguntas Investigativas</strong></td>
        <td>Sugere 4 perguntas inteligentes e não respondidas sobre a matéria, indicando quais documentos ou autoridades você deve cobrar.</td>
      </tr>
      <tr>
        <td><strong>✨ Revisar Português</strong></td>
        <td>Corrige erros de digitação, concordância e pontuação sem mexer nos nomes de pessoas, locais do Acre ou dados da notícia.</td>
      </tr>
      <tr>
        <td><strong>📰 3 Manchetes</strong></td>
        <td>Cria 3 opções de títulos fortes e sérios para você escolher o melhor para a capa.</td>
      </tr>
      <tr>
        <td><strong>📌 Resumo 3 Pontos</strong></td>
        <td>Gera rapidamente os 3 blocos de leitura rápida: <em>O essencial</em>, <em>O que muda hoje</em> e <em>Quem acompanha o caso</em>.</td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <h2>5. O "Radar do Dia": Pegando Pautas e Apagando Cópias</h2>
  <p>Quer cobrir algo que acabou de acontecer e garantir exclusividade?</p>
  <ol>
    <li>Clique na aba <strong>Radar do Dia</strong> no topo do painel.</li>
    <li>O sistema varre notícias de 77 fontes externas e mostra as principais novidades em tempo real.</li>
    <li>Ao achar uma pauta importante, clique no botão: <strong>"⚡ Assumir Pauta como Original (Apagar Réplica)"</strong>.</li>
    <li>O rascunho abre pronto no seu editor. Clique em <strong>"🔎 Estudar Fontes &amp; Incoerências"</strong>, ajuste com sua apuração própria, coloque foto e clique em <strong>"Publicar agora"</strong>.</li>
    <li><strong>Acontece a mágica:</strong> A sua matéria autoral assume a capa do jornal e a matéria repetida do outro portal é automaticamente apagada do feed público.</li>
  </ol>

  <h2>6. Moderando a "Voz do Cidadão" (Comentários dos Moradores)</h2>
  <p>Ao final de cada reportagem, moradores de Cruzeiro do Sul podem enviar relatos do bairro deles:</p>
  <ul>
    <li>No painel, clique na aba <strong>Comentários Cidadãos</strong>.</li>
    <li>Você verá os relatos divididos por bairro (ex.: Telégrafo, Cohab, Centro, Remanso, Mâncio Lima).</li>
    <li><strong>Confirmou o fato?</strong> Clique em <strong>"✓ Destacar como Relato Verificado"</strong>. O morador ganha um selo dourado de confiança na matéria.</li>
    <li><strong>É ofensa ou propaganda?</strong> Clique em <strong>"🗑️ Excluir comentário"</strong> para remover imediatamente.</li>
  </ul>

  <h2>7. Gerenciando Matérias Já Publicadas e Backup</h2>
  <ul>
    <li>Na aba <strong>Matérias</strong>, você encontra tudo o que já foi publicado. Pode corrigir títulos, alterar textos, trocar fotos ou mudar a posição editorial.</li>
    <li>Quer tirar uma notícia antiga do ar sem apagar o histórico? Mude o status para <strong>Arquivada</strong>.</li>
    <li>No topo da página, clique em <strong>"💾 Baixar Backup JSON da Redação"</strong> para salvar uma cópia completa de segurança de todas as matérias no seu computador.</li>
  </ul>

  <div class="footer-brand">
    <span>Catálogo CZS — Redação &amp; Jornalismo</span>
    <span>Cruzeiro do Sul • Acre</span>
    <span>Manual do Editor • Versão Prática</span>
  </div>
</body>
</html>`;
}

// -------------------------------------------------------------
// 2. PLANO DE NEGÓCIOS & PARCERIAS COMERCIAIS (PARA APRESENTAR)
// -------------------------------------------------------------
function buildCleanBusinessPlanHtml() {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Plano de Negócios &amp; Parcerias Comerciais — Catálogo CZS</title>
  <style>${COMMON_CSS}</style>
</head>
<body>
  <div class="masthead">
    <div class="masthead-title">Catálogo CZS</div>
    <div class="masthead-subtitle">A Gazeta Digital do Vale do Juruá • Padrão Editorial The New York Times</div>
    <div class="dateline-bar">
      <span>Cruzeiro do Sul • Vale do Juruá • Acre</span>
      <span>Apresentação Comercial &amp; Oportunidades de Parceria</span>
      <span>Circulação Diária</span>
    </div>
  </div>

  <h1>PLANO DE NEGÓCIOS &amp; PARCERIAS</h1>
  <p style="text-align:center; font-style:italic; color:#4b5563; font-size:14px; margin-bottom:16px;">
    Associe sua marca à maior autoridade em credibilidade, checagem de fatos e utilidade pública do interior do Acre
  </p>

  <div class="box-destaque">
    <p><strong>A Nova Referência em Notícias no Juruá:</strong> O <strong>Catálogo CZS</strong> nasceu para romper com o modelo falido de portais poluídos por anúncios invasivos e notícias copiadas. Oferecemos ao morador de Cruzeiro do Sul e região um jornalismo autoral sóbrio, com leitura agradável em papel creme e tipografia nobre, checagem rigorosa de fatos e serviços diários essenciais.</p>
  </div>

  <h2>1. Por Que Anunciar no Catálogo CZS?</h2>
  <div class="passo-card">
    <div class="passo-titulo" style="font-size:15px; color:#121923; margin-bottom:6px;">🌟 1. Atenção Qualificada (Sem Anúncios Invasivos)</div>
    <p>Em portais comuns, os anúncios piscam e bloqueiam a tela, fazendo o leitor fechar a página irritado. No Catálogo CZS, a sua marca é integrada ao design do jornal com respeito à atenção do leitor, gerando reconhecimento positivo e alta taxa de cliques voluntários.</p>
  </div>

  <div class="passo-card">
    <div class="passo-titulo" style="font-size:15px; color:#121923; margin-bottom:6px;">🛡️ 2. Máxima Segurança de Marca (Brand Safety)</div>
    <p>O anunciante tem a certeza de que sua empresa jamais aparecerá vinculada a fake news, sensacionalismo barato ou notícias falsas. Todo o conteúdo é verificado e auditado por jornalistas locais.</p>
  </div>

  <div class="passo-card">
    <div class="passo-titulo" style="font-size:15px; color:#121923; margin-bottom:6px;">📲 3. Força Viral no WhatsApp e Redes Sociais</div>
    <p>Cruzeiro do Sul se informa pelo WhatsApp. Nossas reportagens contam com botão de compartilhamento rápido com resumo pronto em áudio e texto, permitindo que as campanhas dos parceiros circulem organicamente nos principais grupos da cidade.</p>
  </div>

  <div class="page-break"></div>

  <h2>2. Formatos Comerciais &amp; Cotas de Parceria</h2>
  <p>Criamos produtos de mídia pensados para diferentes perfis de empresas e orçamentos:</p>

  <table>
    <thead>
      <tr>
        <th style="width:28%;">Cota / Produto</th>
        <th style="width:30%;">Onde Sua Marca Aparece</th>
        <th style="width:42%;">Benefício &amp; Retorno para o Parceiro</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>1. Patrocinador Master de Capa</strong><br><span style="font-size:11px; color:#6b7280;">Bancos, Lojas, Telecom, Cooperativas</span></td>
        <td>Card nobre na capa do portal, logo após a manchete principal, com chamada e botão direto para o WhatsApp comercial.</td>
        <td>Associação de liderança e prestígio; presença visual dominante vista por 100% dos leitores que acessam o portal.</td>
      </tr>
      <tr>
        <td><strong>2. Patrocínio de Serviços Diários</strong><br><span style="font-size:11px; color:#6b7280;">Saúde, Agro, Comércio, Clínicas</span></td>
        <td>Assinatura <em>"Oferecimento [Sua Marca]"</em> nos módulos mais consultados: Cotação do Rio Juruá, Previsão do Tempo e Empregos.</td>
        <td>Exposição diária e recorrente junto a utilidades públicas essenciais consultadas todas as manhãs pelos moradores.</td>
      </tr>
      <tr>
        <td><strong>3. Publieditorial &amp; Guia Local</strong><br><span style="font-size:11px; color:#6b7280;">Restaurantes, Serviços, Profissionais</span></td>
        <td>Reportagem especial produzida pela redação contando a história, produtos e diferenciais da empresa com fotos e links.</td>
        <td>Fica gravada permanentemente no Google (SEO), servindo como cartão de visita de alta credibilidade para a empresa.</td>
      </tr>
      <tr>
        <td><strong>4. Boletim de Áudio &amp; WhatsApp</strong><br><span style="font-size:11px; color:#6b7280;">Lançamentos, Eventos e Promoções</span></td>
        <td>Assinatura de voz antes da narração em áudio das matérias e menção da marca nos resumos enviados no WhatsApp.</td>
        <td>Alcance direto no ouvido e no bolso do consumidor, atingindo quem prefere ouvir as notícias no trajeto ou trabalho.</td>
      </tr>
    </tbody>
  </table>

  <h2>3. Métricas Transparentes e Sem Robôs</h2>
  <p>No Catálogo CZS, você não recebe números inflados. Nosso painel disponibiliza relatórios com dados reais:</p>
  <ul>
    <li><strong>Leituras Efetivas (Views):</strong> Quantas pessoas realmente abriram e leram a matéria.</li>
    <li><strong>Cliques Diretos (Clicks):</strong> Quantas pessoas clicaram no link ou no botão do WhatsApp da sua empresa.</li>
    <li><strong>Retenção de Leitura:</strong> Leitores qualificados que passam tempo no jornal lendo as checagens e ouvindo os áudios.</li>
  </ul>

  <h2>4. Como Iniciar Sua Parceria</h2>
  <div class="box-destaque">
    <p><strong>Ativação Rápida em Menos de 24 Horas:</strong> Nossa equipe de redação e arte prepara o card editorial, os textos e os links comerciais da sua empresa com padrão visual impecável.</p>
    <p style="margin-bottom:0;">
      <strong>Portal no ar:</strong> <code>https://catalogo-cruzeiro-web.onrender.com/</code><br>
      <strong>Contato Comercial:</strong> Redação Catálogo CZS • Cruzeiro do Sul, Acre
    </p>
  </div>

  <div class="footer-brand">
    <span>Catálogo CZS — Departamento Comercial</span>
    <span>Cruzeiro do Sul • Vale do Juruá • Acre</span>
    <span>Proposta de Parceria &amp; Negócios 2026</span>
  </div>
</body>
</html>`;
}

// =============================================================
// COMPILADOR DOS ARQUIVOS E CRIAÇÃO DO PACOTE ZIP
// =============================================================
async function main() {
  console.log('=== GERANDO PACOTE OFICIAL FOCADO: GUIA DO EDITOR + PLANO DE NEGÓCIOS ===');

  const editorHtmlPath = path.join(DOCS_DIR, '01_GUIA_PRATICO_DO_EDITOR.html');
  const editorPdfPath = path.join(DOCS_DIR, '01_GUIA_PRATICO_DO_EDITOR.pdf');
  const planHtmlPath = path.join(DOCS_DIR, '02_PLANO_DE_NEGOCIOS_E_PARCERIAS.html');
  const planPdfPath = path.join(DOCS_DIR, '02_PLANO_DE_NEGOCIOS_E_PARCERIAS.pdf');

  // 1. Escrever HTMLs
  fs.writeFileSync(editorHtmlPath, buildCleanEditorGuideHtml(), 'utf8');
  fs.writeFileSync(planHtmlPath, buildCleanBusinessPlanHtml(), 'utf8');

  // 2. Renderizar PDFs via Chrome Headless
  convertHtmlToPdf(editorHtmlPath, editorPdfPath);
  convertHtmlToPdf(planHtmlPath, planPdfPath);

  // Também manter cópia amigável na raiz do projeto
  fs.copyFileSync(editorPdfPath, path.join(ROOT_DIR, 'GUIA_DO_EDITOR.pdf'));
  fs.copyFileSync(planPdfPath, path.join(ROOT_DIR, 'PLANO_DE_NEGOCIOS.pdf'));

  // 3. Criar arquivo ZIP
  const zipName = 'CATALOGO_CZS_ENTREGA_EDITORES_E_PARCEIROS.zip';
  const zipPathInProject = path.join(ROOT_DIR, zipName);
  const zipPathInDownloads = path.join('C:\\Users\\junio\\Downloads', zipName);

  if (fs.existsSync(zipPathInProject)) fs.unlinkSync(zipPathInProject);
  if (fs.existsSync(zipPathInDownloads)) fs.unlinkSync(zipPathInDownloads);

  console.log(`[ZIP] Compactando arquivos em: ${zipName}...`);
  const psCmd = `Compress-Archive -Path '${editorPdfPath}', '${planPdfPath}' -DestinationPath '${zipPathInProject}' -Force`;
  cp.execSync(`pwsh -NoProfile -Command "${psCmd}"`, { stdio: 'inherit' });

  // Copiar também para a pasta Downloads
  fs.copyFileSync(zipPathInProject, zipPathInDownloads);

  const zipStat = fs.statSync(zipPathInProject);
  console.log(`\n=== SUCESSO TOTAL! ===`);
  console.log(`✔ PDF 1: 01_GUIA_PRATICO_DO_EDITOR.pdf (${(fs.statSync(editorPdfPath).size / 1024).toFixed(1)} KB)`);
  console.log(`✔ PDF 2: 02_PLANO_DE_NEGOCIOS_E_PARCERIAS.pdf (${(fs.statSync(planPdfPath).size / 1024).toFixed(1)} KB)`);
  console.log(`✔ ZIP 1 (Projeto): ${zipPathInProject} (${(zipStat.size / 1024).toFixed(1)} KB)`);
  console.log(`✔ ZIP 2 (Downloads): ${zipPathInDownloads} (${(zipStat.size / 1024).toFixed(1)} KB)`);
}

main().catch(err => {
  console.error('ERRO FATAL:', err);
  process.exit(1);
});
