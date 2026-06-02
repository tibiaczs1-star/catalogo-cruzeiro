# PubPaid — 2 opções novas de protagonista hiper-realista v1

Status: conceitos gerados e testados; nada foi aplicado no runtime do jogo.

## Referências estudadas

Arquivos atuais do PubPaid:

- `assets/pubpaid/sprites/protagonist/protagonist-male-generated-idle-breathe-8dir-4f.png`
- `assets/pubpaid/sprites/protagonist/protagonist-female-generated-idle-breathe-8dir-4f.png`

Padrão encontrado:

- frame alvo: `96x144` px;
- sheet: `384x1152` px, 4 frames x 8 direções;
- adultos altos, semi-realistas, não chibi;
- roupa urbana/barzinho: jaqueta, camisa, saia/calça, tênis;
- rosto/hair visíveis mesmo pequeno;
- pés ancorados embaixo, hitbox menor no corpo/pés.

## Opção 1 — Caio Pix

Função: protagonista masculino moderno, jogador/estrategista de bar, cara de carteira digital/Pix e apostas de habilidade sem parecer criminoso.

Visual:

- boné escuro;
- jaqueta bomber preta com brilho;
- camisa clara;
- calça escura;
- tênis claro;
- pochete/bolsa de celular;
- corrente com token dourado.

Ponto forte:

- combina com PubPaid, é diferente do homem atual e tem silhueta boa.

Risco:

- em 96x144 perde textura hiper-realista; precisa pixel pass manual para virar sheet final 8 direções.

Arquivos:

- master limpo: `caio_pix_master_alpha_clean.png`
- frame 96x144: `caio_pix_master_front_96x144_alpha.png`
- sheet placeholder: `caio_pix_master_concept_idle_placeholder_8dir_4f_alpha.png`

## Opção 2 — Rafa Dealer

Função: protagonista feminina premium, dealer/estrategista do PubPaid, mais cassino/bar elegante.

Visual:

- blazer vinho;
- roupa preta;
- cabelo escuro com mecha verde;
- brincos dourados;
- cartas na mão;
- postura confiante.

Ponto forte:

- é a opção mais forte visualmente: tem cor própria, objeto de gameplay e identidade imediata.

Risco:

- salto/calçado e pose com cartas precisam simplificação para animação; precisa versão de costas/lados desenhada manualmente.

Arquivos:

- master limpo: `rafa_dealer_master_alpha_clean.png`
- frame 96x144: `rafa_dealer_master_front_96x144_alpha.png`
- sheet placeholder: `rafa_dealer_master_concept_idle_placeholder_8dir_4f_alpha.png`

## Board de comparação

`pubpaid_hyperreal_main_options_v1_board_alpha_clean.png`

Mostra:

1. protagonista masculino atual;
2. protagonista feminina atual;
3. Caio Pix;
4. Rafa Dealer.

## Verificação feita

- Alpha real: sim, arquivos limpos em RGBA.
- Frame 96x144: sim.
- Sheet 384x1152: sim, mas é placeholder repetido para testar escala/layout, não animação final.
- Compatibilidade visual: sim como conceito; ainda precisa pixel pass/manual art para produção.

## Próximo passo recomendado

Escolher uma direção:

1. Rafa Dealer como protagonista principal premium; ou
2. Caio Pix como protagonista masculino alternativo; ou
3. manter os dois como novas opções de seleção.

Depois gerar/refinar:

- frente limpa;
- costas;
- lado;
- diagonais;
- idle 4 frames;
- walk 4 frames;
- manifest final com anchor/hitbox/hurtbox.
