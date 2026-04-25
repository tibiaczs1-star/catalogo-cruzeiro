# Reuniao Real - Design Agents MD

Data: 2026-04-25
Status: sala online em Markdown, pronta para agentes reais lerem e responderem.

## Objetivo

Criar uma reuniao assincrona real entre agentes de design para estudar DESIGN.md, melhorar prompts de aprendizado e devolver instrucoes praticas de design para Codex aplicar em projetos.

Este arquivo deve ser enviado, colado ou referenciado para agentes online de design. Eles nao precisam executar codigo. Eles precisam ler os materiais, responder em Markdown e devolver instrucoes acionaveis.

## Fontes que os agentes devem estudar

- Repositorio base: https://github.com/VoltAgent/awesome-design-md
- Colecao design-md: https://github.com/VoltAgent/awesome-design-md/tree/main/design-md
- Catalogo publico: https://getdesign.md
- Exemplo completo: https://getdesign.md/design-md/figma/DESIGN.md
- Prompt consolidado deste projeto: docs/prompt-aprendizado-design-agents-online.md

## Como cada agente deve responder

Cada agente deve responder exatamente neste formato:

```md
# Parecer do Agente: <nome do agente>

## 1. O que aprendi com os DESIGN.md
- <principio visual>
- <principio de componentes>
- <principio de responsividade>

## 2. Instrucoes para melhorar arquivos MD
- <como estruturar DESIGN.md>
- <quais secoes nao podem faltar>
- <como escrever anti-padroes>
- <como escrever prompts de exemplo>

## 3. Instrucoes de design para Codex
- <layout>
- <cores/tokens>
- <tipografia>
- <componentes>
- <responsividade>
- <acessibilidade>

## 4. Regras negativas
- Nao fazer: <erro comum>
- Nao fazer: <erro comum>
- Nao fazer: <erro comum>

## 5. Patch sugerido para o prompt mestre
```text
<trecho pronto para ser incorporado ao prompt mestre>
```

## 6. Checklist de avaliacao
- [ ] Hierarquia clara
- [ ] Tokens semanticos
- [ ] Componentes com estados
- [ ] Mobile/desktop verificados
- [ ] Acessibilidade considerada
- [ ] Anti-padroes bloqueados
```

## Agentes convidados

- Figma Agent: componentes, colaboracao, multi-cor, design systems.
- Framer Agent: movimento, ritmo visual, landing/product pages.
- Webflow Agent: responsividade, marketing pages, estrutura visual publicavel.
- Linear Agent: minimalismo operacional, densidade, foco e precisao.
- Vercel Agent: developer-first, tipografia, contraste, documentacao e deploy mental.
- Stripe Agent: narrativa premium, fintech, gradientes funcionais.
- Apple Agent: espaco, produto, imagem, reducao e hierarquia cinematica.
- IBM Carbon Agent: acessibilidade, enterprise, grid, consistencia.
- Airbnb Agent: fotografia, descoberta, calor humano e conversao.
- Miro Agent: canvas, colaboracao visual, energia e mapas mentais.

## Instrucao central para os agentes

Leiam os DESIGN.md como contratos de comportamento visual, nao como inspiracao vaga. Devolvam regras que um agente de codigo consiga aplicar, testar e repetir.

## Instrucao de aprendizado para Codex

Quando receber respostas desses agentes, Codex deve:

1. Extrair novas regras reutilizaveis.
2. Separar opiniao estetica de regra operacional.
3. Incorporar somente instrucoes que melhorem clareza, acessibilidade, consistencia ou velocidade de producao.
4. Atualizar o prompt mestre com patches pequenos, rastreaveis e citados.
5. Manter uma secao de decisoes aprendidas com data e origem.

## Prompt para disparar a reuniao

```text
Voce e um agente especialista em design de interfaces. Leia o material abaixo como uma reuniao assincrona real sobre DESIGN.md e devolva um parecer em Markdown no formato solicitado. Seu foco e ensinar Codex a criar arquivos MD melhores e interfaces visualmente mais consistentes.

Materiais:
- https://github.com/VoltAgent/awesome-design-md
- https://github.com/VoltAgent/awesome-design-md/tree/main/design-md
- https://getdesign.md
- https://getdesign.md/design-md/figma/DESIGN.md

Tarefa:
1. Estude a estrutura DESIGN.md.
2. Compare pelo menos 5 estilos de design diferentes.
3. Escreva instrucoes de MD e design para Codex aprender.
4. Entregue um patch textual para melhorar o prompt mestre.
5. Nao invente resultados; cite suposicoes quando houver.
```
