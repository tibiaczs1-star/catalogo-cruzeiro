# Hermes OpenDesign Desk

Atualizado: 2026-06-02

## Objetivo

Configurar o OpenDesign como uma mesa de pedidos de design operada pelo Hermes,
com Codex como diretor final e os modelos auxiliares como workers para pesquisa,
opcoes, copy, contraste, layout e revisao.

Essa frente nao substitui a home do CZS e nao instala ferramenta externa por
padrao. Ela organiza pedidos e referencias para que o Hermes saiba como agir
quando receber uma demanda visual.

## Comandos

```powershell
npm run hermes:opendesign:status
npm run hermes:opendesign:brief
npm run hermes:opendesign:resources
npm run hermes:opendesign:request -- --request "criar landing para servico local"
```

## Regra Operacional

- `openai-codex/gpt-5.5` e a autoridade quando estiver saudavel.
- Hermes recebe o pedido, consulta referencias e delega para workers.
- MiniMax, Gemma, Llama, Gemini/NVIDIA e MoA podem ajudar com pesquisa,
  variações e critica.
- Qwen fica restrito a codigo pequeno, explicito e revisado.
- Nenhum worker publica sozinho nem altera pagina publica sem revisao do Codex.
- Para artefatos visuais, preferir HTML navegavel quando fizer sentido.

## Fluxo De Pedido

1. O pedido entra por `hermes:opendesign:request`.
2. O bridge registra a ordem em `data/opendesign-orders.json`.
3. O bridge gera o prompt operacional em `.codex-temp/hermes-opendesign/latest-request.md`.
4. Hermes usa o catalogo GitHub curado como fonte de exemplos.
5. Codex define a direcao visual e os limites do projeto.
6. Workers geram alternativas e checklists.
7. Codex sintetiza, valida e entrega o artefato final.

## Catalogo GitHub Inicial

- [Open CoDesign](https://github.com/OpenCoworkAI/open-codesign): candidato local-first para prompt to prototype, `DESIGN.md`, sessoes e artefatos exportaveis.
- [OpenPencil](https://github.com/open-pencil/open-pencil): alternativa open-source ao Figma para canvas e design visual.
- [ZSeven-W OpenPencil](https://github.com/ZSeven-W/openpencil): design-as-code, agent teams, MCP, CLI `op` e exportacao multi-plataforma.
- [Open Design Framework](https://github.com/opendesigndev/open-design-framework): toolkit para trabalhar com dados de UI design por codigo.
- [OpenGenerativeUI](https://github.com/CopilotKit/OpenGenerativeUI): exemplos de generative UI em iframe seguro.
- [Shadcn Space](https://github.com/shadcnspace/shadcnspace): blocos, componentes, templates e dashboards editaveis.
- [Tailark Blocks](https://github.com/tailark/blocks): blocos comerciais/marketing com shadcn, Tailwind, Next e TypeScript.
- [Flowbite](https://github.com/themesberg/flowbite): biblioteca madura de componentes Tailwind, icones e design system.
- [TypeUI](https://github.com/bergside/typeui): pacotes `DESIGN.md` e `SKILL.md` para ferramentas agenticas.
- [Onlook](https://github.com/onlook-dev/onlook): editor visual AI-first para React.
- [LayoutPrompter](https://github.com/microsoft/LayoutGeneration/tree/main/LayoutPrompter): referencia de pesquisa para gerar e ranquear layouts.

## Saidas

- `.codex-temp/hermes-opendesign/latest-status.json`
- `.codex-temp/hermes-opendesign/latest-status.md`
- `.codex-temp/hermes-opendesign/latest-request.md`
- `data/opendesign-orders.json`

## Proximo Passo Opcional

Instalar ou conectar Open CoDesign/OpenPencil so deve acontecer depois de uma
ordem explicita, porque isso adiciona runtime externo. O modo atual ja deixa o
Hermes pronto para receber pedidos de design com pesquisa, referencias e
gerenciamento local.
