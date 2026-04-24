# PubPaid 2.0 - 20 Personagens Modelo RPG 32-bit

Objetivo:

- treinar a equipe em pixel art
- criar uma folha de modelo visual
- definir linguagem de personagem antes de integrar no jogo
- estilo: RPG 32-bit / PS1 tardio reinterpretado em pixel art indie atual

Regra:

- estes personagens sao estudo/modelo visual
- nao entram no runtime ate passarem no protocolo anti-procedural
- cada personagem deve funcionar primeiro em silhueta
- escala-base: 32x48
- variacao detalhada permitida: 48x64
- grid: 8x8
- export final: PNG

## Estilo visual

- semi-realista estilizado
- adulto urbano
- proporcoes mais proximas de RPG narrativo do que chibi
- roupa integrada ao corpo
- paleta noturna PubPaid
- sombras frias
- highlights pequenos de neon
- clusters limpos
- nada de corpo-retangulo
- nada de perna-poste

## Lista dos 20 personagens

1. Protagonista base
   - adulto jovem
   - jaqueta escura
   - postura confiante
   - silhueta media

2. Protagonista variante urbana
   - casaco aberto
   - camiseta clara contaminada por neon
   - mesma familia visual do base

3. Seguranca do pub
   - corpo largo
   - roupa escura
   - postura parada firme

4. Garcom do bar
   - roupa de atendimento
   - postura elegante
   - silhueta interna, nao rua

5. Cantora do palco
   - vestido/roupa marcante
   - postura de performance
   - acento quente de luz

6. Cliente apostador
   - camisa social casual
   - postura inclinada
   - vibe bar/jogo

7. Mulher no ponto com guarda-chuva
   - guarda-chuva como silhueta dominante
   - fone de ouvido
   - postura dancando sutil

8. Nerd sentado no chao com celular
   - sentado
   - tela pequena iluminando rosto
   - mochila ou moletom

9. Dupla nerd conversando A
   - corpo magro
   - capuz ou jaqueta
   - gesto de fala

10. Dupla nerd conversando B
   - corpo diferente do A
   - postura ouvindo
   - celular ou mochila

11. Morador de rua dormindo sentado
   - silhueta baixa
   - cobertor/casaco
   - nao caricatural

12. Bebado encostado
   - postura pesada
   - corpo desequilibrado
   - deve parecer humano, nao bloco

13. Senhora esperando onibus
   - casaco longo
   - bolsa
   - postura paciente

14. Homem velho de bengala
   - bengala legivel
   - coluna levemente curvada
   - escala humana real

15. Garoto de capuz
   - vibe suspeita/discreta
   - rosto parcialmente sombreado
   - silhueta pequena e fechada

16. Motoboy parado
   - capacete na mao ou mochila
   - roupa urbana
   - pronto para moto futura

17. Taxista urbano
   - jaqueta simples
   - postura de espera
   - detalhe amarelo/ambar discreto

18. Mulher social do bar
   - roupa elegante
   - silhueta diferente dos NPCs de rua
   - luz quente

19. Jogador veterano
   - idade media/alta
   - postura de mesa/jogo
   - roupa mais classica

20. Figura misteriosa do beco
   - silhueta escura
   - pouca informacao facial
   - nao pode roubar foco da porta

## Entrega esperada

Para cada personagem:

- silhueta monocromatica
- sprite base colorido
- nota de leitura no fundo real
- classificacao: aprovado, retrabalho ou rejeitado

## Prompt-base para geracao visual

```text
Create a single 2D pixel art RPG character sprite concept for a modern indie game, inspired by late 32-bit era RPG character art and PS1-era urban game atmosphere, but rendered as crisp hand-made pixel art.

Character: [NOME DO PERSONAGEM]
Canvas feel: 32x48 RPG sprite proportions, adult semi-realistic stylization, not chibi.
World: rainy neon urban night outside and inside the PubPaid bar.
Palette: cold blue/violet shadows, controlled amber highlights, subtle cyan/magenta neon influence.
Requirements: strong readable silhouette, clean pixel clusters, integrated clothing, no rectangular body, no stick legs, no fake procedural look, no vector look, no text, no UI, no background scene.
Pose: [POSTURA]
Output style: sprite model sheet preview, isolated character on flat neutral background for review, crisp pixel art.
```

## Criterios de rejeicao

- parece procedural
- parece bloco
- parece personagem de outro jogo
- escala nao combina com porta/calcada
- roupa parece colada
- silhueta nao le
- cor compete com letreiro
- detalhe vira ruido

## Proxima etapa

Gerar uma folha visual com 20 modelos para avaliacao. Apenas os aprovados viram sprites finais ou spritesheets.
