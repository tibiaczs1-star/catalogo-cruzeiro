# Angel Mídia Play — Identidade, Biblioteca, Editor e Aplicativos

## Objetivo

Concluir a experiência administrativa do Angel Mídia Play com a identidade fornecida pelo proprietário, biblioteca de mídias detalhada, edição visual não destrutiva, controle claro de onde cada conteúdo roda e downloads reais dos dois APKs. Esta especificação complementa e, nos pontos visuais e de edição, substitui `2026-08-19-angel-midia-play-media-orchestration-design.md`.

## Direção visual aprovada

O logo enviado é a fonte visual oficial. O produto usa azul-marinho profundo como fundo, branco para conteúdo e vermelho como único acento de ação, alerta e estado ativo. O azul-ciano e o violeta genéricos da versão anterior deixam de ser cores principais.

Tese visual: uma central de operação audiovisual premium, sóbria e precisa, com a asa do logo sugerindo movimento sem competir com os dados.

- O logo aparece no login, topo do painel, menu lateral, tela neutra do Player e área de downloads.
- A asa pode aparecer como marca-d'água de baixa opacidade em áreas vazias e transições.
- A interface usa no máximo duas famílias tipográficas, hierarquia forte, áreas amplas e poucos contornos.
- O vermelho identifica gravação/reprodução ativa, urgência, erro e ação primária; não será usado como decoração em excesso.
- Desktop, tablet e celular não podem produzir rolagem horizontal nem cortar títulos, formulários, miniaturas ou botões.
- Animações serão curtas: entrada suave da navegação, troca de painel e resposta visual de seleção/enquadramento. `prefers-reduced-motion` será respeitado.

## Navegação

O menu lateral mantém as áreas operacionais existentes e adiciona acesso permanente aos aplicativos:

1. Visão geral
2. TVs e mapa
3. Biblioteca
4. Playlists
5. Programação
6. Ao vivo
7. Relatórios
8. Aplicativos

No rodapé do menu ficam dois atalhos sempre visíveis: **Baixar Admin** e **Baixar TV**. Em telas pequenas eles migram para o menu móvel sem ocupar a área de trabalho.

## Biblioteca detalhada

Cada mídia terá miniatura real e identificação imediata. Um operador deve entender o arquivo sem abri-lo.

Dados exibidos:

- tipo: imagem ou vídeo;
- formato: JPG, PNG, WebP ou MP4;
- nome amigável e nome original;
- resolução, orientação e proporção;
- tamanho do arquivo;
- duração real do vídeo ou duração padrão da imagem;
- data de envio, autor e estado de processamento;
- quantidade de playlists que usam a mídia;
- TVs, grupos e programações onde ela está atribuída;
- indicação **Rodando agora** com as TVs correspondentes;
- última reprodução e total de reproduções quando disponíveis.

A biblioteca oferece busca, filtros por tipo/status/uso, ordenação por nome/data/tamanho e visualização em grade ou lista. Estados de carregamento, vazio, erro e processamento têm mensagens próprias. Falha de upload mantém nome e duração preenchidos e informa o motivo exato.

## Editor de mídia

O editor é um inspetor lateral no desktop e uma folha/modal em tela cheia no celular. A prévia permanece dominante; as alterações são não destrutivas e ficam salvas como parâmetros de exibição, preservando o arquivo original.

### Controles comuns

- renomear;
- pré-visualizar em paisagem e retrato;
- modo de ajuste: **Conter**, **Preencher/Cortar** ou **Esticar**;
- centralização horizontal e vertical por grade 3x3;
- ponto focal fino com coordenadas de 0 a 100%;
- zoom e rotação em passos de 90 graus;
- cor de fundo para áreas vazias no modo Conter;
- restaurar enquadramento original;
- salvar como padrão da mídia ou aplicar somente ao item da playlist.

### Imagens

- duração padrão em segundos;
- duração específica por item da playlist;
- transição de entrada e saída entre opções curtas e seguras;
- prévia exata do recorte na proporção da TV selecionada.

### Vídeos

- duração detectada, resolução, proporção e presença de áudio;
- volume ou mudo por item;
- ponto inicial e ponto final para recorte lógico de reprodução, sem reprocessar o arquivo nesta entrega;
- reprodução em loop quando o item for usado isoladamente;
- captura automática de miniatura e escolha de quadro de capa.

O recorte físico, filtros de cor, textos sobrepostos e renderização de um novo arquivo ficam fora desta entrega para não transformar o servidor em editor de vídeo. O recorte lógico informa claramente que o arquivo original permanece intacto.

## Uso, prioridade e localização

Ao abrir uma mídia, a aba **Onde está rodando** mostra playlists, campanhas, TVs e grupos vinculados, programação ativa, prioridade e próximo horário. O operador pode navegar diretamente para a TV ou programação correspondente.

Prioridades continuam determinísticas: urgente vence alta, que vence normal. A tela informa conflitos antes de salvar e mostra qual programação será efetiva. Alterações de enquadramento ou playlist geram nova versão de manifesto; cada Player ativa a versão somente depois de baixar e validar os arquivos necessários.

## Aplicativos e APKs

A área **Aplicativos** apresenta dois produtos separados:

- **Angel Mídia Admin**: celular do administrador, com acesso autenticado ao painel;
- **Angel Mídia TV**: sticks e TVs, somente ativação, sincronização e reprodução.

Cada download mostra ícone, finalidade, versão, tamanho, data de publicação, compatibilidade Android, hash de integridade e instruções curtas de instalação. Os botões apontam para os APKs reais já mantidos no projeto. A página nunca anuncia uma versão mais nova do que o binário servido.

Uma release deve atualizar, de forma coordenada, a versão visível do painel, os nomes/links dos APKs, o manifesto PWA e o cache. O painel detecta nova publicação, informa **Nova versão disponível** e oferece recarga imediata.

## Recomendações operacionais incluídas

Além do pedido direto, esta entrega inclui recursos que reduzem atendimento e telas paradas:

- saúde das TVs: online, offline, último contato, armazenamento e versão instalada;
- progresso de download por TV e mídia;
- modo offline com última playlist íntegra;
- alerta de mídia ausente, corrompida ou sem espaço local;
- histórico de alterações e reproduções, sem registrar segredos;
- confirmação antes de excluir, despublicar ou substituir conteúdo ativo;
- indicador de armazenamento usado no servidor;
- diagnóstico copiável da TV para suporte;
- prévia da programação efetiva antes de publicar.

## Dados e API

Os metadados técnicos detectados pertencem ao ativo de mídia. Parâmetros de enquadramento padrão pertencem à mídia; substituições específicas pertencem ao item da playlist. A API deve persistir, validar e devolver pelo menos `width`, `height`, `duration`, `has_audio`, `fit_mode`, `focal_x`, `focal_y`, `zoom`, `rotation`, `background_color`, `trim_start`, `trim_end`, `volume` e `thumbnail` conforme o tipo.

Uploads continuam restritos a JPG, PNG, WebP e MP4, com validação de MIME, extensão e tamanho. Valores de corte, zoom, duração e volume recebem limites no servidor. Exclusão de mídia em uso permanece bloqueada até a remoção das associações ou uma substituição explícita.

## Segurança

O APK TV nunca recebe funções administrativas. O APK Admin não contém senha fixa. Login, token, hash e configuração secreta permanecem fora do repositório e dos APKs. Alterações de mídia, programação e dispositivos exigem autenticação; ações críticas entram no histórico de auditoria.

## Testes e aceite

A implementação seguirá TDD e deverá comprovar:

- upload real de imagem e MP4, com mensagem útil em falha;
- extração e exibição dos detalhes técnicos;
- edição e persistência de enquadramento, duração, volume e recorte lógico;
- prévia responsiva sem corte ou rolagem horizontal;
- indicação correta de onde a mídia está programada e rodando;
- links dos dois APKs com versão, tamanho e download HTTP válido;
- atualização de release e remoção do cache anterior;
- operação offline do Player com a última playlist íntegra;
- testes de API, controlador, manifesto e builds Android;
- inspeção visual em desktop e celular;
- verificação pública de login, upload, edição, programação e downloads após autorização de push/deploy.

## Fora de escopo

- renderização física de vídeos no servidor;
- filtros avançados, legendas ou textos sobrepostos;
- múltiplas zonas simultâneas dentro da mesma TV;
- cobrança, planos e múltiplas organizações;
- publicação automática sem confirmação do administrador.
