# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

O usuário principal é o administrador da Angel Mídia, que precisa operar uma rede de TVs a partir do computador ou do aplicativo Android administrador. Ele acompanha o estado e a localização dos aparelhos, organiza mídias e playlists, publica programações, administra empresas anunciantes e consulta a comprovação de exibições.

## Product Purpose

O Angel Mídia Play centraliza a operação de digital signage: cadastrar e localizar TVs, enviar e enquadrar mídias, montar playlists, definir destinos e horários, acompanhar reprodução e falhas e relacionar anunciantes ao conteúdo veiculado. O produto tem sucesso quando o administrador entende rapidamente o estado da rede e consegue colocar o conteúdo certo nas telas certas com segurança.

## Positioning

Uma central operacional simples para a rede local da Angel Mídia que combina mapa de TVs, controle de exibição e gestão visual das empresas anunciantes no mesmo fluxo.

## Operating Context

- O painel web também é exibido dentro do APK Android administrador.
- Um APK Android separado transforma o aparelho conectado à TV em player da rede.
- A operação inclui visão geral, TVs, biblioteca, playlists, programação, acompanhamento ao vivo, relatórios, empresas, emergência, aplicativos e ajuda.
- TVs podem informar endereço, latitude, longitude, estado de conexão, reprodução e armazenamento.

## Capabilities and Constraints

- O painel existente é HTML, CSS e JavaScript modular sem framework visual.
- A API e o banco existentes suportam dispositivos, locais, grupos, campanhas, mídias, playlists, agendas, telemetria, relatórios e anunciantes.
- O mapa atual não usa um mapa-base: apenas projeta marcadores em um painel vazio. Não há chave configurada do Google Maps JavaScript.
- Cada TV com coordenadas pode abrir sua posição exata no site do Google Maps.
- O cadastro atual de anunciantes não possui coluna de foto ou logotipo; essa capacidade precisa ser adicionada de ponta a ponta.
- Dados de demonstração podem ser usados localmente. Criar dados em produção exige autorização explícita.
- Provedor definitivo do mapa-base: decisão em aberto. A alternativa imediata sem chave é OpenStreetMap; Google Maps exige chave, faturamento e restrições de domínio.

## Brand Commitments

- Nome do produto: Angel Mídia Play.
- A interface administrativa deve usar azul e branco como identidade predominante.
- O layout deve ser claro, bem alinhado, profissional e visualmente muito superior ao painel escuro atual.
- Empresas cadastradas precisam ter espaço visível para foto ou logotipo.
- O mapa com a localização das TVs é parte central da experiência, não um painel decorativo.

## Evidence on Hand

- Implementação atual em `controller/src/` e contratos exercitados em `controller/tests/`.
- API e esquema do banco em `api/src/` e `api/migrations/`.
- Identidade existente em `controller/assets/angel-midia-logo.png`.
- Não existem fotos reais das empresas no repositório; mockups não devem apresentá-las como clientes reais.

## Product Principles

- O estado da rede e as exceções devem ser compreendidos em poucos segundos.
- Mapa, lista e detalhes de TV devem permanecer sincronizados.
- Publicar conteúdo deve ter um fluxo curto, previsível e reversível.
- Identidade visual não pode encobrir tarefa, estado ou ação.
- Fotos e logotipos de empresas devem reforçar reconhecimento sem substituir dados operacionais.

## Accessibility & Inclusion

- Contraste legível, foco de teclado visível, controles com rótulos e estados que não dependem apenas de cor.
- O layout deve funcionar no desktop e no WebView Android do aplicativo administrador sem desalinhamento ou rolagem horizontal acidental.
