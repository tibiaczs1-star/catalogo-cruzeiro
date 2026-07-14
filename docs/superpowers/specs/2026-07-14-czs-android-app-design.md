# CZS Android App — Design

## Objetivo

Entregar um aplicativo Android leve que reproduz exclusivamente a experiência editorial pública do Catálogo CZS — notícias, vídeos, editorias e busca — com APK assinado para download direto no site.

## Escopo da primeira versão

- Android apenas.
- Conteúdo sincronizado com o jornal online por API.
- Sem Cheffe Call, escritórios, agentes ou rotas administrativas.
- Sem notificações push do Android.
- Aviso interno “Novas notícias chegaram” enquanto o aplicativo estiver aberto.
- Instalação por APK hospedado no próprio site, com versão, tamanho, checksum e instruções curtas.
- PWA instalável como base e pacote Android gerado por Trusted Web Activity.

## Arquitetura

1. A rota mobile pública fornece o shell editorial leve.
2. O app consome lotes pequenos da API de notícias e vídeos.
3. Uma verificação periódica consulta apenas o identificador/data da notícia mais recente.
4. Quando houver mudança, o app exibe um botão interno para atualizar o feed.
5. O APK abre apenas origens e rotas públicas autorizadas do CZS.
6. `assetlinks.json` associa domínio, pacote Android e certificado de assinatura.

## Distribuição

- Pacote: `com.catalogoczs.app`.
- APK armazenado em `downloads/catalogo-czs-android.apk`.
- Manifesto público de versão em `downloads/catalogo-czs-android.json`.
- Página/bloco de download no website com link direto, checksum SHA-256 e data da versão.
- APK assinado por chave de produção mantida fora do Git.

## Desempenho e UX

- Nada de intro cinematográfica bloqueando conteúdo.
- Primeira carga limitada a 20–40 notícias.
- Arquivo histórico carregado sob demanda.
- Navegação inferior simples: Agora, Vídeos, Editorias e Busca.
- Alvos de toque com pelo menos 44 px.
- Assistente flutuante e módulos internos não carregam no app.

## Segurança e atualização

- Somente HTTPS.
- Chave de assinatura, senhas e tokens nunca entram no repositório.
- APK publicado somente após testes, checksum e aprovação R5 para deploy.
- Conteúdo editorial atualiza sem nova versão do APK; mudanças no shell exigem novo APK.

## Validação

- Testes do manifest, service worker, API e detecção de notícias novas.
- Auditoria mobile em 360, 390 e 412 px.
- Instalação real do APK em Android/BlueStacks via ADB.
- Smoke de abertura, notícias, vídeos, busca e atualização do feed.
- Verificação do link de download e checksum local antes do deploy.

## Fora do escopo desta etapa

- Google Play Store.
- iPhone/iOS.
- Push notifications.
- Cheffe Call, escritórios e agentes no aplicativo.
- Publicação no Render sem aprovação explícita.
