# Sistema Diretor de Jogos

Este pacote separa a frente de jogos da frente de jornal dentro do mesmo projeto.

Skill global relacionada: `game-director-general`
(`C:\Users\junio\.codex\skills\game-director-general\SKILL.md`).

Regra central: jogo e jogo, jornal e jornal. Eles podem compartilhar workspace,
ferramentas e conhecimento tecnico, mas nao compartilham direcao editorial,
criterios de aprovacao, memoria de produto nem fila de decisao.

## Hierarquia

1. Usuario
2. Codex e Hermes como ferramentas finais de tomada de decisao operacional
3. Diretor Geral
4. Conselho Tecnico Nerd
5. Diretor do Jogo
6. Subagentes principais
7. Sub-subagentes tecnicos quando uma frente precisar quebrar trabalho

O Codex retem decisoes primarias do workflow quando elas forem claras, tecnicas,
reversiveis e alinhadas ao pedido. O que ficar ambiguo, estetico demais,
financeiro, juridico, de risco alto ou dependente de preferencia do usuario sobe
para o usuario com resumo curto.

O Diretor Geral nao substitui o Diretor do Jogo; ele coordena a cadeia inteira.
O Conselho Tecnico Nerd nao substitui o Diretor; ele alimenta a equipe com
conhecimento tecnico acumulado antes da execucao operacional.

## Subagentes principais

- `game-director-master.md`: diretor do jogo e dono do sistema.
- `game-art-design-lead.md`: arte, pixel art, concept art e design de game.
- `game-ui-hud-interface-lead.md`: interfaces, programacao de UI e HUD.
- `game-test-security-lead.md`: testes, QA, seguranca gamer e anti-cheat.
- `game-final-line-reviewer.md`: linha final de verificacao da arte, jogo e interface.

## Papel do Escritorio Nerd

O Escritorio Nerd atua como biblioteca viva e apoio tecnico. Ele pode mandar
informacoes adquiridas anteriormente para a equipe de jogos, especialmente sobre
engine, fisica, audio, economia, render, QA e HUD.

Ele nao substitui o Diretor do Jogo e nao mistura prioridades de jornal/CZS com
PubPaid ou outras frentes de jogo.

## Loop de aprendizado

Erros e acertos viram regra:

1. prever o que deveria acontecer;
2. produzir ou planejar uma fatia pequena;
3. testar/criticar contra criterio;
4. registrar erro ou acerto;
5. atualizar criterio/checklist;
6. retomar do ultimo ramo aprovado.

Se o usuario rejeitar algo como generico, cubico, fake pixel art, UI de template
ou sem cara de jogo, pare a expansao, identifique a camada que falhou e reaprenda
antes de continuar.

## Fontes de estudo inicial

- Derek Yu Pixel Art Tutorial: https://derekyu.com/makegames/pixelart.html
- Lospec Pixel Art Tutorials: https://lospec.com/pixel-art-tutorials/
- Aseprite Sprite Sheets: https://www.aseprite.org/docs/sprite-sheet/
- Aseprite CLI export: https://www.aseprite.org/docs/cli/
- Phaser Animations: https://docs.phaser.io/phaser/concepts/animations
- Riot Clarity in League: https://www.leagueoflegends.com/en-us/news/dev/clarity-in-league/
- Riot Valorant Gameplay Clarity: https://www.riotgames.com/en/news/valorant-shaders-and-gameplay-clarity
- OWASP Game Security Framework: https://owasp.org/www-project-gamesec-framework/
- Microsoft Xbox Accessibility Guidelines: https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/
- Game Accessibility Guidelines: https://gameaccessibilityguidelines.com/basic/
