# Agentes ao Vivo — plugin global do Catálogo CZS

O portal se monta na presença do leitor. Este plugin desenha um painel
lateral que mostra as verificações que o site faz de verdade: quantas
seções existem, quais imagens resolvem, quais links internos têm destino,
quais subsistemas estão publicados e se a página de reservas existe.

## Fluxo na tela

1. Ao entrar no portal, o painel abre e as linhas montam uma a uma.
2. Terminada a montagem, ele recolhe para a borda direita e vira uma aba
   discreta, para não cobrir as notícias.
3. Rolar para cima solta o painel de novo; rolar para baixo recolhe.
4. No celular ele nasce recolhido e abre apenas no toque.
5. Com `prefers-reduced-motion` a animação para, mas recolher e soltar
   continuam funcionando — é estado da interface, não enfeite.

## De onde vem o texto

Nada é inventado. O painel lê `agente-vivo/registro.json`, gerado por
`scripts/agente-vivo-supervisor.js`, que abre as páginas publicadas e conta:

| Verificação | O que mede |
| --- | --- |
| Leitor de estrutura | seções `<section>` nas páginas públicas |
| Verificador de imagem | imagens locais que existem no disco |
| Guardião de rotas | links internos com destino real |
| Indexador de subsistemas | subpastas publicadas com `index.html` |
| Inspetor de reservas | existência da página de reserva |

`npm start` roda o supervisor antes de subir o servidor, então o registro
é atualizado em cada deploy. Para regenerar na mão:
`npm run agentes:registro`.

Se o registro faltar ou estiver velho, o plugin não finge atividade
remota: mostra a leitura real da página aberta (seções, imagens, links) e
o rodapé diz "leitura local".

## Injeção no servidor

O arquivo não é copiado em 30 HTMLs. Em `server.js`, `sendFile()` chama
`injectAgenteVivo()` para todo `text/html` que passe em
`shouldInjectAgenteVivo()` — uma tag `<script defer>` antes de `</body>`.

Ficam de fora: `maintenance.html`, `pubpaid.html`, `pubpaid-admin.html`,
`game-director-demo.html`, `pesquisa-acre-2026-admin.html`,
`real-agents.html`, `app.html`, tudo em `backend/` e `assets/`.

## Arquivos

- `agente-vivo/agentes.js` — comportamento e montagem das linhas.
- `agente-vivo/agentes.css` — painel, trilho e aba lateral.
- `agente-vivo/registro.json` — dado real lido pelo painel.
- `scripts/agente-vivo-supervisor.js` — gera o registro.
- `scripts/__tests__/czs-agente-vivo.test.js` — contrato do plugin.

## Versionamento de cache

Os assets são servidos com `Cache-Control: immutable` por um ano. Ao
mudar o JS ou o CSS, suba a versão em dois lugares:

- a tag em `server.js` (`AGENTE_VIVO_SCRIPT`, `agentes.js?v=...`);
- o caminho do CSS dentro de `agentes.js` (`agentes.css?v=...`).

Sem isso o navegador continua com a versão antiga.