# Angel Mídia Play — Orquestração de Mídias e Monitoramento

## Objetivo

Evoluir o Angel Mídia Play para uma plataforma de sinalização digital composta por dois aplicativos separados: um Admin para celular/web e um Player para sticks/TVs. O administrador envia imagens e vídeos, monta playlists ordenadas, programa onde e quando cada conteúdo roda e acompanha em tempo quase real o estado de cada TV.

## Abordagem escolhida

Manter a arquitetura atual e ampliá-la incrementalmente. O backend Node/PostgreSQL continua como fonte de verdade, o Admin continua na subpágina `/angel-midia/` do Catálogo CZS e o APK TV mantém cache local para reprodução offline. Essa opção preserva o deploy já validado e evita reescrever os aplicativos.

Alternativas descartadas:

- Um APK único com escolha entre Admin e TV: aumenta tamanho, confunde instalação e amplia a superfície administrativa nos sticks.
- Streaming contínuo: depende de conexão permanente e não atende a reprodução offline.

## Identidade e experiência visual

O produto será apresentado como **Angel Mídia Play**. O painel terá aparência premium, limpa e responsiva, com fundo escuro em azul-marinho, superfícies translúcidas, acentos em azul-celeste e violeta, tipografia de alta legibilidade, ícones consistentes e estados coloridos sem excesso visual.

A navegação principal terá sete áreas:

1. Visão geral: totais, TVs online/offline, campanhas ativas e alertas.
2. Mapa das TVs: marcadores por endereço/posição, status e mídia atual.
3. Biblioteca: upload, prévia e metadados de imagens e vídeos.
4. Playlists: ordem explícita dos itens, duração de imagens e prioridade.
5. Programação: período e destino por TV, grupo ou todas.
6. Ao vivo: mídia atual, próxima mídia, sincronização e downloads.
7. Relatórios: reproduções, falhas e histórico por TV.

## Modelo de domínio

### Mídia

Cada arquivo terá nome, tipo, URL, tamanho, estado de processamento e duração. Imagens exigem duração configurável em segundos. Vídeos usam a duração real detectada pelo player; uma duração informada pelo Admin serve apenas como metadado de contingência quando a detecção não estiver disponível.

### Playlist e itens

Uma playlist contém vários itens. Cada item referencia uma mídia e possui posição inteira. A ordem de reprodução é definida pelo administrador e persistida no servidor. A duração efetiva de uma imagem pertence ao item, permitindo usar a mesma imagem com tempos diferentes em playlists diferentes.

### Programação

Uma programação associa uma playlist a uma TV, grupo ou todas as TVs, com data/hora inicial, data/hora final e prioridade `normal`, `alta` ou `urgente`.

Regras determinísticas:

- `urgente` vence `alta`, que vence `normal`;
- na mesma prioridade, vence a programação mais recente que estiver ativa;
- dentro da playlist, os itens rodam na posição definida;
- ao terminar o último item, a playlist reinicia enquanto a programação estiver ativa;
- uma programação urgente assume no próximo ponto seguro de troca de mídia e a programação anterior é retomada quando a urgência termina.

### TV e telemetria

Cada TV mantém nome, estabelecimento, endereço, latitude, longitude, grupo, autorização e último contato. O player reporta mídia atual, próximo item calculado, posição da playlist, início da reprodução, estado do download, mensagem de erro e espaço local disponível.

Uma TV é considerada online quando o último contato ocorreu nos últimos 90 segundos; depois disso aparece offline. O painel indica dados atrasados para não apresentar telemetria antiga como atual.

## Fluxo operacional

1. O APK TV solicita ativação e recebe um identificador seguro.
2. O administrador aprova, nomeia, agrupa e posiciona a TV no mapa.
3. O administrador envia imagens e vídeos para a biblioteca.
4. Ele cria uma playlist, ordena os itens e define a duração das imagens.
5. Ele programa a playlist para uma TV, grupo ou todas, escolhendo período e prioridade.
6. O servidor entrega um manifesto versionado ao player.
7. O player baixa arquivos ausentes, valida o cache e só ativa a nova versão quando os itens necessários estiverem disponíveis.
8. O player reproduz localmente e envia telemetria; falhas de rede não interrompem a playlist já armazenada.
9. O Admin mostra estado ao vivo, downloads e histórico.

## API e persistência

O banco receberá estruturas separadas para `media_assets`, `playlists`, `playlist_items`, `playback_status` e `download_status`, preservando as tabelas existentes e migrando campanhas atuais sem perda. Endpoints administrativos serão autenticados; endpoints do player exigirão token individual da TV.

Uploads aceitarão inicialmente JPG, PNG, WebP e MP4. O servidor validará MIME, extensão e tamanho. Nomes físicos serão gerados pelo servidor, sem confiar no nome enviado. Exclusão de mídia usada por playlist será bloqueada; o Admin deverá removê-la da playlist antes.

O manifesto entregue à TV terá versão, playlist ativa, itens ordenados, hashes/URLs, duração de imagens e validade. Isso permite sincronização idempotente e cache offline seguro.

## Erros e estados vazios

- Upload inválido: rejeitar com mensagem direta e manter o formulário preenchido.
- Download incompleto: continuar usando a última programação íntegra e tentar novamente com espera progressiva.
- Arquivo corrompido: descartar o arquivo local, registrar falha e baixar novamente.
- Nenhuma programação: mostrar tela neutra da marca, sem expor controles administrativos.
- TV offline: manter última telemetria com horário e etiqueta de dado atrasado.
- Falha parcial de playlist: não ativar uma versão que ainda não tenha os arquivos obrigatórios.

## Segurança e limites iniciais

O Admin exige login. Tokens das TVs são revogáveis e não dão acesso administrativo. Uploads usam lista explícita de tipos permitidos e limite configurável. Senhas e tokens nunca entram no APK, no repositório ou nos logs. O escopo inicial não inclui edição de vídeo, múltiplas zonas na mesma tela, cobrança ou usuários com permissões diferentes.

## Testes e aceite

A implementação seguirá TDD para regras de prioridade, ordem, duração, seleção de destino, manifesto, telemetria e validação de upload. Também haverá testes de API, testes do painel em desktop/mobile e build dos dois APKs.

Critérios de aceite:

- enviar imagem e MP4 pela Biblioteca;
- montar playlist com vários itens e alterar sua ordem;
- definir duração por imagem e usar duração real do vídeo;
- programar para TV, grupo e todas as TVs;
- prioridade urgente substituir e depois devolver a programação normal;
- player baixar, armazenar e tocar a playlist sem internet;
- painel mostrar TV, mapa, mídia atual, próxima mídia, sincronização e erro de download;
- painel responsivo e visualmente consistente com a identidade Angel Mídia Play;
- APK Admin e APK TV instaláveis e disponíveis na subpágina;
- deploy público validado por health check, login, operações principais e downloads dos APKs.
