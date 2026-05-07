# PubPaid 2 - Direcao Visual Obrigatoria

Atualizado: 2026-05-06

Este arquivo e a lei visual da PubPaid 2. Antes de criar, trocar ou aprovar qualquer tela, sprite, HUD, fundo, NPC, veiculo ou interface, a resposta precisa passar por este contrato.

## Norte Visual

PubPaid 2 deve parecer um jogo 2D pixel art profissional, ate 32 bits, com personagens e cenario pertencendo ao mesmo universo. A cena precisa parecer desenhada manualmente para o proprio jogo, nao montada com assets soltos.

O objetivo nao e "colocar personagens em pixel art". O objetivo e uma linguagem visual unica: escala, perspectiva, paleta, contraste, sombra, densidade de pixels, contorno e iluminacao coerentes.

## Leitura Das Referencias Enviadas

### Referencia principal

Imagens 1 e 2 sao o norte de cena: personagens lado a lado em ambiente interno, leitura de RPG/beat'em up/adventure retro, silhuetas claras, personagens proporcionais, luz de ambiente em blocos e cenario com profundidade 2D.

O que aproveitar:
- personagens humanos proporcionais, nao chibi/mobile;
- poses legiveis com personalidade;
- escala comum entre elenco;
- sombras simples no chao;
- fundo detalhado, mas sem roubar o foco;
- paleta noturna/controlada;
- contorno e contraste fortes o suficiente para leitura em baixa resolucao.

### Referencias de construcao

Imagens 3 a 8 ajudam no processo de corpo, roupa e turnaround. Elas servem para estudar silhueta, proporcao, vista frontal/lateral e separacao de tons. Elas nao definem a paleta final azul nem autorizam personagem chapado.

Imagens 11 a 16 ajudam em pose, roupa e construcao de sprite. Usar como estudo de logica: base corporal, roupa em poucos blocos, cabelo/rosto simples, variacao de corpo e acessorio integrado.

### Referencias de ambiente

Imagens 19, 20, 23 e 24 ajudam a entender bar/salao em pixel art: madeira, balcao, garrafas, luz quente, neon, profundidade 2D e objetos desenhados em blocos. A imagem 24 tem marca d'agua e nao pode ser usada como asset, trace ou copia; serve apenas como direcao geral de iluminacao e atmosfera.

### Referencias rejeitadas ou de alerta

Imagens 9 e 10 mostram o que evitar: pessoas muito geometricas, flat, stock, sem densidade suficiente para o jogo.

Imagens 17 e 18 tem marca d'agua e visual de stock/template; nao podem entrar como base de asset.

Imagens 21 e 22 sao icones/objetos isolados. Nao definem personagem, escala de mundo ou interface principal.

## Regras Nao Negociaveis

- Pixel art 2D real, ate 32 bits.
- Pixels visiveis, sem suavizacao visual.
- Sem gradiente moderno, blur, glow liso ou pintura digital suave.
- Sem vetor, Canva, clipart, stock, emoji, avatar generico ou UI de dashboard.
- Sem personagem fabricado por canvas, `graphics()`, formas basicas ou runtime procedural.
- Sem asset colocado no runtime antes de preview externo e aprovacao visual.
- Sem semi-alpha em sprite final de personagem/veiculo/objeto de mundo: alpha deve ser 0 ou 255.
- Render sempre com `image-rendering: pixelated` e filtros nearest.

## Contrato Dos Personagens

Cada personagem precisa ser desenhado primeiro pela silhueta, depois paleta, depois iluminacao e por ultimo detalhes.

Checklist obrigatorio:
- cabeca, tronco, bracos e pernas definidos em pixel art;
- roupa legivel em poucos tons;
- variacao real de corpo, altura e roupa;
- contorno controlado, sem linha vetorial lisa;
- sombra em blocos no chao;
- expressao simples, mas clara;
- acessorios integrados ao sprite, nunca prop solto por cima;
- mesma escala e baseline do elenco aprovado;
- mesma direcao de luz do cenario;
- densidade de detalhe parecida com o fundo.

Contrato atual de escala:
- adulto primeiro plano: 105 a 130 px renderizados;
- adulto meio plano: 75 a 100 px renderizados;
- fundo: 50 a 75 px renderizados;
- sprites jogaveis/protagonistas continuam em grade propria, mas qualquer NPC novo precisa ser comparado contra o protagonista e contra o cenario antes de entrar no runtime.

### Protocolo de personagens/pedestres

O prompt operacional vivo esta em `PUBPAID_2_CHARACTER_ART_PROMPT.md`.

Regras adicionais obrigatorias:
- pedestre de rua andando precisa ter spritesheet lateral com 5 frames reais;
- nada de caminhada procedural, interpolada ou automatica;
- pernas e bracos precisam alternar com peso humano;
- personagem deve ter fundo transparente real, sem halo, mancha branca, mancha verde ou pixel solto;
- props e acessorios precisam fazer parte da silhueta, nao parecer retangulo colado por cima;
- entregar sempre em HTML simples de aprovacao antes de qualquer runtime;
- se a aprovacao falhar em escala, paleta, recorte, contorno, caminhada ou pertencimento ao cenario, refazer antes de integrar.

## Contrato Do Cenario

O cenario deve ser pixel art 2D real, com objetos desenhados manualmente e profundidade sem parecer 3D moderno.

Obrigatorio:
- blocos/tiles com leitura pixelada;
- sombras em massas de pixel;
- luz quente/fria coerente;
- objetos com detalhe suficiente para ambientacao;
- nenhum fundo stock ou pintura digital suave;
- nenhuma camada que pareca colada por cima da cena.

## Contrato Da Interface

Se houver UI, ela deve parecer parte de um jogo pixel art:
- caixas de dialogo pixeladas;
- bordas retas ou serrilhadas em pixels;
- menus retro;
- tipografia pixelada ou monospace coerente;
- botoes sem aparencia web moderna;
- sem cards arredondados genericos;
- sem icones lisos;
- sem dashboard/Canva.

DOM pode existir para acessibilidade e operacao, mas a aparencia visual precisa obedecer ao jogo. Qualquer moldura visual complexa deve virar asset bitmap/pixel art aprovado, nao ser desenhada por formas soltas no runtime.

## Pipeline Obrigatorio

1. Estudo de referencia: escolher qual grupo de imagens guia a decisao.
2. Silhueta: desenhar a massa do personagem/objeto em baixa resolucao.
3. Paleta: limitar tons por material e casar com o cenario.
4. Iluminacao: aplicar luz e sombra em blocos coerentes.
5. Detalhes: inserir rosto, roupa e acessorios sem polir demais.
6. Preview externo: montar HTML/sheet de comparacao fora do jogo.
7. Gate visual: comparar baseline, escala, paleta, contraste e sombra contra screenshot real da cena.
8. Aprovacao humana: so depois de aprovado entra em `BootScene`/runtime.
9. Integracao minima: runtime apenas carrega PNG/spritesheet e posiciona/anima; nao desenha arte final.
10. Auditoria: rodar `npm run pubpaid:visual-audit` antes de dizer que esta pronto.

## Perguntas De Aprovacao

Antes de finalizar, responder sim para todas:
- Parece pixel art 2D real?
- Parece ate 32 bits?
- Casa com o cenario?
- A escala esta correta?
- A iluminacao esta coerente?
- A sombra pertence ao chao?
- Parece desenhado manualmente para este jogo?
- Evita Canva, vetor, procedural, cartoon moderno e template?
- O personagem nao parece colado?
- A UI, se existir, parece jogo e nao site?

Se uma resposta for nao, refazer.

## Proibicoes Tecnicas

No runtime visual da PubPaid 2, nao criar arte final com:
- `document.createElement("canvas")`;
- `createCanvas`;
- `OffscreenCanvas`;
- `generateTexture`;
- `textures.createCanvas`;
- `graphics()` para personagem, NPC, veiculo, objeto de mundo, fundo ou UI final;
- SVG/HTML/CSS como substituto de sprite de personagem;
- assets stock/watermarked como fonte direta;
- formas geometricas basicas como personagem.

Phaser pode continuar sendo o motor tecnico. O canvas tecnico do motor nao e permissao para desenhar sprite final por canvas/runtime.

## Como Comparar Sem Quebrar O Jogo

Qualquer arte nova deve ir primeiro para pagina/preview separado, por exemplo `pubpaid-npc-approval.html` ou outro HTML de aprovacao. O runtime vivo da rua nao deve ser alterado para "testar rapidinho" carros, motos, NPCs ou fundo.

So integrar depois que o usuario aprovar explicitamente.
