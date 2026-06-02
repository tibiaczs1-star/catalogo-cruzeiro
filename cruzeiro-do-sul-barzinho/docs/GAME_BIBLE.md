# PubPaid 3.0 — Cruzeiro do Sul Barzinho

Status: protótipo separado em `cruzeiro-do-sul-barzinho/`. Não substitui `/pubpaid.html`, `pubpaid-phaser/`, `pubpaid-phaser.css`, `pubpaid-runtime.js` nem `games/vale-pool/`.

## Promessa
Entrar num bar pixel-art premium de Cruzeiro do Sul, escolher uma persona local, sentar em uma instância com até 10 jogadores, conversar por chat/emotes e jogar Sinuca, Damas ou Xadrez com HUD cinematográfico.

## Fatia implementada agora
- Intro visual Matrix/Bar CZS.
- Seleção com 10 personagens/personas.
- Lobby com 10 slots.
- Chat local + 10 emotes.
- Sinuca base com canvas local e 3 modos: Livre, Brasileira, Par/Ímpar.
- Damas base com board e movimento diagonal simples.
- Xadrez base com peças legíveis e movimento livre para validação visual.
- `window.renderGameToText()` para smoke/QA.

## Regras duras
- Dinheiro real, prêmio, saque, taxa/rake e torneio pago ficam bloqueados até parecer jurídico/contábil/LGPD/pagamento e aprovação explícita do Junior Play.
- Publicação/deploy/push exige aprovação explícita.
- Todos os gráficos finais do PubPaid 3.0/Cruzeiro do Sul Barzinho devem ser criados no ChatGPT Imagem em Chrome/perfil controlável do usuário: intro, exterior, interior, HUDs, menus, personagens, sprites, mesas, props, FX e overlays. Não trocar por outro gerador como arte final.
- Se o Chrome/ChatGPT Imagem não estiver controlável, preparar prompts/arquivos e parar antes de substituir por outro gerador.
- PubPaid canônico continua protegido pelo guard: `npm run guard:pubpaid`.

## Próximo bloco recomendado
1. Separar assets finais via ChatGPT Imagem: intro, bar exterior, interior, HUD, personagens, mesas.
2. Substituir placeholders por imagens reais aprovadas.
3. Implementar regras completas de Damas/Xadrez ou integrar engine existente.
4. Evoluir lobby local para contrato online/PvP só depois de QA e segurança.
