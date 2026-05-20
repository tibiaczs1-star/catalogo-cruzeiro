# Vale Pool - Conhecimento Atual

## Fluxo De Entrada

- Demo/IA e PvP começam com moeda.
- Quem ganha a moeda escolhe somente uma categoria:
  - ser primeiro na mesa;
  - escolher a modalidade.
- Quem perde a moeda escolhe a categoria que sobrou.
- Depois das duas escolhas, abre tutorial da modalidade antes da mesa.
- A partida só libera tacada depois do botão `Começar`.
- No PvP, os dois jogadores precisam confirmar o tutorial.

## Modalidades Atuais

- `Livre`: branca + bolas 1 a 9 em diamante, bola 1 na frente e bola 9 no centro; vence quem derruba mais bolas.
- `Brasileira`: branca + bolas 1 a 7 oficiais; bola da vez é a menor em mesa; pontuação pelo valor da bola.
- `Par/Impar`: branca + bolas 2 a 15; primeiro encaçape válido define PAR/IMPAR; bola 15 fecha/castiga.

## Direção De Arte E UX

- Não redesenhar a arte aprovada do protótipo Vale Pool sem ordem explícita.
- HUD e objetos dinâmicos devem permanecer funcionais: bolas, taco, mira, força, efeito, caçapas, bolas fora, turno, modalidade e tutorial.
- Tutorial deve ser curto e jogável, sem bloquear a leitura visual da mesa depois de começar.
- Caçapa boa precisa parecer aberta para o lado do pano e ser generosa na física: detectar a bola pelo trajeto entre frames antes do repique no trilho, não só pela posição final.
- Cada modalidade precisa de regra viva durante a partida, nao só tutorial antes da mesa: informar alvo permitido, formula de pontuação, falta/vitória e grupo do jogador quando existir.
- Em Par/Impar, o cartao do jogador deve dizer PAR ou IMPAR assim que a primeira bola valida cair; antes disso, a leitura correta é `1a bola define PAR/IMPAR`.
- Em Par/Impar, a UI deve nomear os donos dos grupos (`VOCE`, `RIVAL` ou `IA`) e nao apenas mostrar PAR/IMPAR solto.
- Falta de bola branca precisa trocar a vez para o rival/IA explicitamente; nunca pode ficar presa no jogador 1.
- Depois das escolhas da moeda, mostrar uma animacao curta de `MODO ESCOLHIDO` antes do tutorial, mantendo a mesa travada ate o tutorial começar.
