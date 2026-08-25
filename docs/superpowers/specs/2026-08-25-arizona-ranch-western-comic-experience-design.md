# Arizona Ranch — experiência cinematográfica de reserva

## Objetivo

Transformar a landing de reserva do Arizona Ranch em uma narrativa interativa de velho oeste que conduz o visitante, sem desvio, da entrada do rancho até a escolha e o pagamento da mesa. A experiência deve parecer uma sequência cinematográfica ou uma história em quadrinhos western em movimento, não uma galeria e não um conjunto de cartões decorativos.

## Direção aprovada

- Usar somente cenas novas e únicas produzidas com GPT Imagem para a narrativa principal.
- Não repetir fotografias, fundos, enquadramentos ou acessórios entre cenas.
- Não usar canvas como elemento visual principal nem como substituto para as imagens finais.
- Criar ilusão de vídeo com sequências curtas de frames consecutivos, animação de câmera e camadas de profundidade.
- Preservar a chamada de voz já funcional apenas na abertura.
- Depois da abertura, usar somente efeitos sonoros ambientais e pontuais, sem nova locução.
- Manter o fluxo comercial completo: apresentação do show, escolha visual da mesa, identificação pelo Google e pagamento.

## Jornada narrativa

### 1. Chamado de entrada

A experiência abre com a chamada existente e uma imagem de impacto do portão do Arizona Ranch. O primeiro gesto do visitante inicia simultaneamente a jornada visual e o áudio permitido pelo navegador, sem exibir pedido próprio de permissão, termos sobre som ou escolha “com/sem som”.

### 2. Porteira e chegada

Uma sequência exclusiva de frames mostra a porteira abrindo, poeira levantando e o visitante avançando para dentro do rancho. A câmera usa aproximação, parallax em planos e leve deslocamento lateral. Ferradura, madeira, cerca, capim e iluminação existem dentro da cena; não aparecem como coleção de objetos soltos.

### 3. Estrada do rancho

Nova sequência mostra a estrada, cavalos e a silhueta do saloon ao fundo. A câmera alterna travelling e zoom progressivo. Poeira, partículas e vegetação em primeiro plano reforçam profundidade sem esconder o conteúdo.

### 4. Fachada do saloon

Cena totalmente nova da fachada do Arizona Ranch, com letreiro próprio, portas de madeira e luz quente. A transição simula página de quadrinho virando, tinta se espalhando ou papel queimado de forma rápida e elegante.

### 5. Entrada no salão

As portas do saloon se abrem em frames consecutivos. O visitante atravessa o bar, balcão e pista até enxergar palco e mesas. Cada camada se move em velocidade diferente para criar profundidade 3D e sensação de caminhada.

### 6. Apresentação do show

O show aparece como parte da cena do palco, com nome, data, horário, couvert e chamada “Garanta sua mesa”. O texto comercial fica em HTML, legível e responsivo, sobre área de respiro prevista na composição da imagem. Nenhum texto essencial será rasterizado dentro da arte.

### 7. Mapa de mesas integrado

O salão cinematográfico transiciona naturalmente para a visão superior da planta. O mapa real de mesas continua interativo e informa disponibilidade, capacidade e valor. O usuário escolhe a mesa aqui — não em uma etapa escondida no fim da página.

### 8. Identificação e pagamento

Depois da escolha, um resumo fixo mostra mesa, lugares e total. O login Google serve apenas para identificar o comprador. Em seguida, o fluxo atual de pagamento é aberto com os dados da mesa preservados. Estados de carregamento, mesa indisponível e erro de pagamento devem oferecer retorno claro sem reiniciar toda a experiência.

## Sistema de imagem e movimento

Cada momento narrativo terá uma arte-mestra exclusiva e, quando o movimento exigir, de três a cinco frames consecutivos coerentes. As sequências prioritárias são: porteira abrindo, avanço pela estrada, portas do saloon abrindo e aproximação da mesa escolhida.

Os efeitos combinados serão:

- parallax multicamada controlado por rolagem e, discretamente, pelo ponteiro;
- perspectiva 3D e diferenças de escala entre primeiro plano, cenário e fundo;
- zoom in, zoom out, travelling horizontal e avanço de câmera;
- virada de página, máscara de tinta, papel queimado e flash de luz como transições;
- poeira, grãos, luz de lampião, fumaça e sombras móveis;
- microanimações nas chamadas e no estado das mesas;
- redução automática de intensidade para aparelhos lentos e para `prefers-reduced-motion`.

Animações não podem atrasar nem bloquear a compra. A rolagem permite avançar e voltar entre cenas, e um botão persistente “Escolher minha mesa” leva diretamente ao mapa.

## Paisagem sonora

O clique inicial desbloqueia o áudio do navegador e toca a chamada de voz uma única vez. Depois dela, um controlador agenda efeitos curtos em intervalos aleatórios, evitando repetição imediata e sobreposição excessiva.

Biblioteca prevista: vento, madeira rangendo, porteira, passos, cascos, relincho, gado, esporas, portas de saloon, ambiente distante de bar, grilos, coruja e tiros cinematográficos distantes. Os efeitos acompanham as cenas quando possível. Não haverá nova voz, música automática contínua, botão de “entrar com som” nem modal de permissão.

O áudio terá limites de volume e espaçamento; tiros nunca serão usados em sequência agressiva. O visitante poderá silenciar por um ícone discreto, mas não será obrigado a decidir antes de entrar.

## Conteúdo visual e galerias

As imagens geradas para a narrativa são layout e cenário, não galeria. As fotos originais não entram nessas cenas e não serão repetidas. Uma galeria documental futura poderá receber fotos reais em seção separada, depois do fluxo comercial, quando houver material aprovado; ela não faz parte desta implementação.

## Arquitetura de implementação

- HTML semântico mantém conteúdo, CTAs, mapa e formulário acessíveis.
- CSS organiza cenas em camadas 3D, transições, versões responsivas e modos de desempenho.
- JavaScript separa quatro responsabilidades: progressão narrativa, motor de movimento, paisagem sonora e fluxo de reserva.
- Imagens finais ficam em `pagamentos/reservaranch/assets/cinematic/` com nomes por cena e frame.
- Efeitos sonoros ficam em `pagamentos/reservaranch/assets/sfx/` e são carregados sob demanda.
- O sistema existente de disponibilidade, seleção, Google e pagamento permanece como fonte de verdade.

## Desempenho e acessibilidade

- Entregar formatos WebP/AVIF quando compatíveis e pôster estático para cada sequência.
- Pré-carregar somente abertura e próxima cena; carregar o restante progressivamente.
- Usar imagens responsivas e limitar efeitos simultâneos em telas menores.
- Manter contraste, foco por teclado, rótulos de mesa e alternativa textual para toda informação comercial.
- Se áudio ou animação falhar, o visitante ainda consegue conhecer o show, selecionar mesa e pagar.

## Validação

- Testes automatizados preservam disponibilidade, seleção, identificação e início do pagamento.
- Testes estruturais garantem voz única, ausência de galeria narrativa e ausência de imagens repetidas.
- Teste visual real em desktop e celular verifica cortes, legibilidade, parallax, transições e desempenho.
- Teste auditivo verifica variedade, espaçamento, volume, sincronização e inexistência de locução após a abertura.
- A versão só será declarada online depois de autorização explícita de deploy e verificação HTTP/visual da URL pública.

## Critérios de aceite

1. A abertura conduz diretamente à narrativa sem pedido visual de permissão de som.
2. Cada cena usa imagem exclusiva produzida para seu papel narrativo.
3. Pelo menos quatro momentos usam frames consecutivos para criar ilusão de vídeo.
4. Parallax, zoom e transições criam profundidade sem prejudicar navegação ou desempenho.
5. A voz toca no máximo uma vez; depois existem somente sons ambientais variados.
6. O mapa de mesas aparece como conclusão natural da história e continua totalmente operável.
7. A escolha da mesa segue para Google e pagamento sem perda de dados.
8. Nenhuma foto original é reutilizada na narrativa principal.
