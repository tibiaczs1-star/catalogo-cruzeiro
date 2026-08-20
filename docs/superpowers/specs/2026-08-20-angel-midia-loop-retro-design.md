# Angel Mídia Play — loop contínuo e interface Retro Pro

**Data:** 2026-08-20
**Status:** aprovado para planejamento

## Objetivo

Permitir que playlists e campanhas sejam publicadas em loop contínuo, sem exigir início ou fim, e tornar a janela de programação mais clara, bonita e responsiva. O painel adotará uma identidade própria chamada **Angel Mídia Retro Pro**, inspirada na organização e nos controles do Windows clássico, sem copiar seus recursos gráficos.

## Decisões de produto

- `Loop contínuo` será o modo padrão.
- Nesse modo, datas não serão exigidas nem exibidas no formulário.
- `Período definido` continuará disponível e exigirá início e fim válidos.
- O comportamento valerá para playlists e campanhas individuais.
- Uma programação contínua permanece ativa até ser substituída, desativada ou superada por outra de maior prioridade.
- Na TV, após o último item, a reprodução volta ao primeiro sem tela intermediária.
- Uma playlist com um item repete esse mesmo item.
- Uma mídia inválida ou indisponível será registrada e pulada; a TV tentará o próximo item sem encerrar o loop.

## Modelo e resolução da programação

As programações terão um modo explícito: `continuous` ou `scheduled`. Programações contínuas armazenam início e fim nulos; programações agendadas armazenam os dois valores. O servidor considerará ativa uma programação quando:

- for contínua; ou
- tiver início menor ou igual ao horário atual e fim posterior ao horário atual.

A escolha da programação vencedora continuará respeitando destino e prioridade. Em empate, a publicação mais recente vence. O manifesto enviado à TV indicará explicitamente que a sequência é repetível e não produzirá datas artificiais para programações contínuas.

## Reprodução no APK TV

O player tratará a playlist como uma sequência circular. Ao concluir ou atingir o tempo configurado de um item, avançará pelo índice usando retorno circular. Antes da troca, o próximo arquivo já baixado será preparado para reduzir tela preta. Se a playlist for atualizada, a TV concluirá de forma segura o item atual e adotará a nova versão, exceto em emergência.

Falhas de arquivo, decodificação ou download gerarão evento de erro com TV, mídia e motivo. O player tentará os demais itens uma vez por ciclo; se nenhum puder ser reproduzido, mostrará uma tela Angel Mídia de recuperação e repetirá a tentativa com espera controlada, sem travamento acelerado.

## Janela de programação

A janela será reorganizada em quatro grupos, na ordem operacional:

1. **Conteúdo:** playlist ou campanha escolhida.
2. **Destino:** todas as TVs, conjunto ou TV individual.
3. **Modo de reprodução:** cartões selecionáveis `Loop contínuo` e `Período definido`.
4. **Prioridade:** normal, alta ou urgente.

No modo contínuo, os campos de data ficam ocultos, sem atributo `required` e sem valores enviados. No modo por período, os campos surgem lado a lado em telas largas e empilhados em telas pequenas. Uma faixa de resumo mostrará, em linguagem natural, o conteúdo, destino, modo e prioridade antes da confirmação.

Programações existentes serão exibidas com o selo `Loop contínuo` ou com o intervalo formatado. A janela deve preservar foco visível, navegação por teclado, rótulos associados aos controles e áreas de toque adequadas.

## Identidade Angel Mídia Retro Pro

- Barra de título azul-marinho com nome da janela e estado.
- Painéis claros em relevo, bordas precisas e botões táteis inspirados em caixas de diálogo clássicas.
- Vermelho da Angel Mídia reservado para seleção, urgência e ação principal.
- Tipografia legível e atual; o retrô virá da composição, das bordas e dos ícones, não de texto serrilhado.
- Densidade controlada, alinhamento consistente e espaço suficiente para leitura.
- Adaptação completa para desktop e celular, sem campos cortados ou rolagem horizontal.
- Sons discretos de seleção, sucesso e erro, respeitando a preferência global de efeitos sonoros.

## Ícones originais

Será criado um conjunto exclusivo de ícones Angel Mídia em estilo pixel art nítido, sem reutilizar ícones proprietários do Windows. O conjunto cobrirá navegação, TVs, mapa, localização, imagem, vídeo, biblioteca, playlists, programação, relatórios, empresas, usuários, emergência, configurações, downloads e APKs.

Cada ícone terá estados normal, selecionado, desativado e alerta quando aplicável. Os arquivos serão vetoriais ou desenhados em grade escalável para permanecerem nítidos em diferentes densidades. Texto e `aria-label` continuarão disponíveis; nenhum comando dependerá apenas do desenho.

## Biblioteca e visualização de mídia

A biblioteca deixará de apresentar apenas miniaturas genéricas. Cada cartão mostrará a mídia completa dentro de uma moldura de monitor, usando `contain` por padrão para não cortar rostos, textos, logotipos ou bordas. O cartão identificará claramente o tipo com ícone e selo `Imagem` ou `Vídeo` e exibirá, quando disponível:

- nome, formato, dimensões, proporção e tamanho do arquivo;
- duração real do vídeo ou tempo configurado da imagem;
- presença de áudio e estado de processamento;
- playlists e conjuntos de TVs vinculados;
- TVs que estão exibindo a mídia no momento.

Ao selecionar a miniatura, uma visualização ampliada permitirá ajustar à janela, ver em tamanho real e simular tela cheia. Vídeos terão reprodução, pausa, barra de tempo, volume e duração visível. Estados de carregamento, arquivo indisponível e erro de decodificação terão mensagens e ações próprias, sem deixar uma área vazia ou deformar o layout.

## Editor de imagem e vídeo

O editor será uma janela Retro Pro organizada em duas áreas: uma prévia grande da tela à esquerda e um inspetor por grupos à direita. Em celular, a prévia ficará acima e os grupos serão recolhíveis. A barra de título mostrará nome, tipo e estado da mídia; salvar e cancelar permanecerão sempre visíveis.

A prévia terá molduras selecionáveis para `TV horizontal 16:9`, `TV vertical 9:16`, `Tela 4:3` e `Quadrado 1:1`, além de linhas de área segura. O modo inicial será `Mostrar inteira`. Também existirão `Preencher tela` e `Esticar`; opções que possam cortar ou deformar a mídia exibirão um aviso visual. A biblioteca sempre continuará mostrando o arquivo inteiro, enquanto a simulação do editor reproduzirá fielmente o enquadramento salvo para a TV.

Os controles de enquadramento incluirão:

- nove atalhos de alinhamento em grade, incluindo centralização exata;
- posição horizontal e vertical com controle deslizante e valor numérico em porcentagem;
- zoom com controle deslizante, valor numérico e limites seguros;
- rotação, cor de fundo, restaurar padrão e desfazer alterações da sessão;
- botão `Simular na TV` para abrir a composição em tela cheia.

Para imagens, o editor permitirá definir o tempo de exibição em segundos. Para vídeos, mostrará reprodução, pausa, avanço pela linha do tempo, duração, volume/silêncio e pontos opcionais de início e fim. O corte será não destrutivo: o arquivo original será preservado e somente os metadados de apresentação serão alterados.

Alterações terão resposta imediata na prévia. Antes de salvar, um resumo informará enquadramento, duração ou recorte, rotação, playlists e destinos afetados. O editor não fará transcodificação nem alteração permanente de pixels neste incremento.

## Compatibilidade e migração

A migração de banco adicionará o modo de reprodução e permitirá datas nulas sem modificar o significado das programações atuais. Registros existentes serão classificados como `scheduled`. Clientes antigos continuarão recebendo manifestos válidos para programações datadas; a atualização do APK TV acrescentará o contrato de loop explícito.

## Erros e validações

- `Período definido` sem as duas datas: bloquear e indicar os campos.
- Fim igual ou anterior ao início: bloquear com mensagem específica.
- `Loop contínuo` com datas residuais no navegador: ignorar e não enviar as datas.
- Playlist vazia: impedir a publicação.
- Destino sem TVs ativas: alertar antes da confirmação.
- Falha de rede ao publicar: manter os valores do formulário para nova tentativa.

## Testes e critérios de aceite

- API aceita `continuous` sem datas e rejeita combinações inválidas.
- API continua aceitando `scheduled` com período válido.
- Resolução escolhe programações contínuas, agendadas e prioridades corretamente.
- Interface começa em loop contínuo, oculta datas e produz o corpo correto.
- Alternar para período definido revela datas, aplica validações e atualiza o resumo.
- Layout não corta campos em larguras de celular e desktop.
- APK reproduz `1 → 2 → 3 → 1` e `1 → 1`.
- APK pula mídia com erro, registra o evento e mantém a sequência.
- Atualização de playlist é aplicada sem interromper indevidamente o item corrente.
- Ícones têm rótulos acessíveis e estados visuais consistentes.
- Cartões distinguem imagem e vídeo e apresentam os metadados disponíveis sem cortar a mídia.
- Visualização ampliada exibe imagem completa e controles funcionais de vídeo.
- Editor centraliza por grade ou porcentagem e reproduz fielmente `Mostrar inteira`, `Preencher tela` e `Esticar`.
- Modos que cortam ou deformam mostram aviso, enquanto a mídia original permanece preservada.
- Prévia 16:9, 9:16, 4:3 e 1:1 funciona sem estouro no desktop e no celular.
- Duração de imagem e recorte não destrutivo de vídeo são persistidos e respeitados pelo APK TV.

## Fora deste incremento

O mapa geográfico detalhado e os relatórios de segundos por TV continuarão em uma especificação própria, pois exigem telemetria e modelo de dados independentes. Esta entrega não alterará cobrança, usuários ou o mecanismo de emergência.
