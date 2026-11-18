# GUIA E FAQ COMPLETO DO EDITOR — REDAÇÃO CATÁLOGO CZS (`/editores`)

Este manual reúne **todas as ferramentas da Redação Catálogo CZS**, onde acessar cada função e o passo a passo para publicar reportagens originais no padrão *The New York Times + Semafor*, checar fatos, apontar incoerências entre jornais e moderar comentários dos cidadãos.

---

## 1. Onde Acessar (Links Oficiais)

- **Painel Privado da Redação (Login de Editores):**  
  👉 **`https://catalogo-cruzeiro-web.onrender.com/editores`**
- **Capa do Jornal (Público):**  
  👉 **`https://catalogo-cruzeiro-web.onrender.com/`**
- **Lista Pública de Matérias da Redação:**  
  👉 **`https://catalogo-cruzeiro-web.onrender.com/editores?publicadas`**
- **Feed RSS Oficial & Sitemap SEO:**  
  👉 **`https://catalogo-cruzeiro-web.onrender.com/rss.xml`** | **`https://catalogo-cruzeiro-web.onrender.com/sitemap.xml`**

---

## 2. Como Funciona a Hierarquia e a Exclusão Automática de Réplicas

### P: O que acontece quando eu publico uma matéria no `/editores`?
**R:** Toda matéria publicada pela Redação CZS recebe o selo **`Original • Redação CZS`** e tem **soberania absoluta** sobre as notícias automáticas de outros sites:
1. **Manchete principal (`Nível 2`):** Vai imediatamente para o **#1 da Hero (`#leadStory`)** no topo da capa, com foto grande em cima e título/resumo completos embaixo.
2. **Destaque na capa (`Nível 1`):** Assume o topo da coluna direita (`#heroSide`) e aparece na vitrine especial **"Destaques Originais & Fatos Checados da Redação"** (`#redacao-destaques`).
3. **Feed de notícias (`Nível 0`):** Entra no topo do feed principal antes das notícias externas.

### P: Se outro jornal já tiver dado a notícia e eu publicar a nossa matéria original, vão ficar duas notícias repetidas?
**R: Não.** O motor [backend/nyt-editorial-engine.js](file:///C:/Users/junio/catalogo-cruzeiro/backend/nyt-editorial-engine.js) detecta automaticamente que a sua matéria trata do mesmo fato, **apaga a réplica externa do feed público** e absorve o link do outro jornal apenas como fonte comparada dentro do quadro de **Checagem de Fatos & Incoerências** da sua matéria.

### P: E se eu publicar uma matéria sem foto (ou se a foto de uma notícia falhar)?
**R:** O sistema **nunca** usa aquela foto repetida da ponte/rio e nunca deixa espaço quebrado. Ele gera automaticamente uma **Ilustração Editorial Vetorial Padrão NYT** exclusiva para a matéria (`/api/articles/:slug/illustration.svg`), com gravura temática da editoria (Justiça, Rio/Clima, Saúde, Educação, Economia ou Cidade) e o título tipografado.

---

## 3. Como Usar as Ferramentas da Aba "Nova Matéria"

Dentro de `/editores`, na aba **Nova matéria**, você dispõe de:

1. **Título, Editoria e "Por que importa (Nut Graph)":**
   - Preencha o **Título** (até 160 caracteres).
   - Escolha a **Editoria / Categoria** (*Cruzeiro do Sul, Polícia, Saúde, Educação, Economia, Rio Juruá*, etc.).
   - Preencha o campo **"Por que importa (Nut Graph)"**: 1 frase direta explicando o impacto da notícia para o morador de Cruzeiro do Sul. Esse bloco aparece em destaque logo abaixo do título no leitor NYT.

2. **🔗 Importar Fatos de uma URL Externa:**
   - Quer estudar uma notícia que saiu em outro portal (ou no Diário Oficial) sem copiar?
   - Cole o endereço `https://...` na barra **"Cole o link de outro jornal para importar e checar fatos"** e clique em **`🔗 Importar Fatos da URL`**.
   - Você pode importar 1, 2 ou 3 links diferentes para o mesmo rascunho e, em seguida, clicar no botão **`🔎 Estudar Fontes & Incoerências (NYT)`**.

3. **Assistente IA da Redação (7 Botões Gratuitos 24/7):**
   - **`🔎 Estudar Fontes & Incoerências (NYT)`:** Lê os relatos colados no editor, **não copia frases**, redige uma reportagem 100% original no estilo *The New York Times*, cria a seção `## Checagem de Fatos` e lista `## Incoerências e Divergências entre Jornais` (mostrando onde os outros sites divergiram em valores, números ou datas).
   - **`🧹 Secar Release (Anti-Assessoria)`:** Remove adjetivos elogiosos e propaganda política de textos de prefeitura/governo, deixando só o fato jornalístico seco.
   - **`🕵️ Perguntas Investigativas`:** Sugere 4 perguntas não respondidas e quais documentos oficiais cobrar.
   - **`✨ Revisar Português`:** Corrige gramática e fluidez mantendo todos os dados originais.
   - **`📰 3 Manchetes`:** Sugere 3 títulos fortes e diretos sem sensacionalismo.
   - **`📌 Resumo 3 Pontos`:** Cria o bloco *O essencial / O que muda hoje / Quem acompanha*.
   - **`⚖️ Contraponto Semafor`:** Estrutura *O que os fatos mostram* vs. *Contraponto / O que falta confirmar*.

4. **Editor Lado a Lado (Split Preview) + Autosave Local (`Ctrl + S`):**
   - Enquanto você digita à esquerda, a **Prévia da matéria** à direita mostra exatamente como o texto formatado aparecerá no jornal, com contagem de palavras, tempo de leitura e salvamento automático no navegador (botão **`Restaurar rascunho`** na barra superior).

---

## 4. Como Usar o "Radar do Dia" para Assumir Pautas e Apagar Réplicas

1. No menu superior do `/editores`, clique na aba **`Radar do Dia`**.
2. O sistema lista as principais notícias captadas das 77 fontes externas no dia.
3. Ao encontrar um fato importante, clique em **`⚡ Assumir Pauta como Original (Apagar Réplica)`**.
4. O sistema abre a aba **Nova matéria** com os insumos carregados. Clique em **`🔎 Estudar Fontes & Incoerências (NYT)`**, revise o texto autoral, adicione foto (se tiver) e clique em **`Publicar agora`**.
5. Pronto: sua matéria original assume o destaque na capa e a réplica externa some do feed.

---

## 5. Como Editar uma Matéria Já Publicada ou Fazer Backup

1. Acesse a aba **`Matérias`** no `/editores`.
2. Em cada matéria publicada, você verá o painel **`Gerenciar ou Editar Publicação`**:
   - Você pode corrigir o **Título**, a **Editoria**, o **Texto completo da matéria**, mudar a **Posição editorial** (*Feed*, *Destaque na capa* ou *Manchete principal*) ou mudar a visibilidade para *Arquivada*, clicando em **`Salvar alterações`**.
3. No topo da aba **`Matérias`**, clique em **`💾 Baixar Backup JSON da Redação`** para salvar no seu computador uma cópia completa de todas as matérias originais e comentários cidadãos.

---

## 6. Como Moderar Comentários dos Cidadãos

1. Quando o leitor clica em **"Leia matéria completa"** na capa, abre o Leitor Editorial NYT com a seção **"Comentários e Relatos dos Cidadãos"** ao final da matéria.
2. Qualquer morador pode enviar um *Relato do bairro*, uma *Correção/Checagem* ou uma *Opinião* informando nome e bairro/município.
3. No `/editores`, clique na aba **`Comentários Cidadãos`**:
   - Clique em **`✓ Destacar como Relato Verificado`** quando o relato do morador for confirmado pela redação (ele passa a exibir o selo **`✓ Relato Verificado pela Redação`** na matéria).
   - Clique em **`🗑️ Excluir comentário`** para remover spam ou mensagens inadequadas.

---

## 7. Ferramentas do Leitor Público (O que o Leitor Vê ao Abrir a Matéria)

Ao clicar em **"Leia matéria completa"** ou em qualquer notícia da capa:
- **Leitor Instantâneo NYT (`#czsDossierModal`):** Abre sem recarregar a página e gera um link direto compartilhável (`https://catalogo-cruzeiro-web.onrender.com/?materia=<slug>`).
- **🔊 Ouvir reportagem:** Narração em voz em português do Brasil lendo a manchete, o bloco *Por que importa* e o texto autoral.
- **`A-` / `A+`:** Ajuste imediato do tamanho da letra para leitura confortável.
- **📲 Copiar resumo p/ WhatsApp:** Copia a manchete formatada em negrito, o selo de checagem, o resumo de impacto e o link direto para colar nos grupos de WhatsApp.
- **🔎 Aprofundar checagem com IA:** Botão dentro do quadro de auditoria que reexecuta a análise comparativa de fontes em tempo real.
