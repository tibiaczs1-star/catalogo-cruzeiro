# Correcoes Sociais Obrigatorias - Catálogo CZS

Data: 01/06/2026

## Falhas Reconhecidas

1. Noticias foram tratadas como divulgacao geral e acabaram indo para grupos de venda.
2. O Instagram nao recebeu a evolucao prometida: video/captura primeiro, musica jornalistica, maquetes de stories e retirada de erros.
3. O sistema ficou com documentos certos em partes, mas sem trava operacional forte o bastante.

## Nova Regra De Canal

| Tipo de destino | Pode receber | Nao pode receber |
| --- | --- | --- |
| Grupo de venda/classificados | produto, servico, classificado, pedido de links | noticia, politica, enquete, editorial |
| Grupo/canal de noticia | noticia, alerta, enquete editorial, chamada do jornal | anuncio de produto sem contexto |
| Catálogo CZS | noticia, enquete, aviso editorial, chamada do jornal | spam de classificados |
| Status proprio | noticia, venda, bastidor, chamada | conteudo sem revisao |
| Grupo desconhecido | nada ate classificar | qualquer postagem automatica |

## Instagram A Partir De Agora

- Story de noticia comeca por video real/captura da fonte quando existir.
- Imagem premium entra como apoio, capa ou fechamento, nao como substituta do video.
- Musica deve soar como jornal local moderno: baixa, limpa e sem suspense barato.
- Acidente, morte e policia usam silencio ou base neutra muito baixa.
- Propaganda entra intercalada depois de 3 a 5 stories editoriais, nunca no meio de urgencia.
- Feed e carrossel ficam para noticia consolidada; story cobre o agora.

## Arte E Video

- Usar safe area 1080x1920.
- Logo inteiro.
- Texto curto.
- Fonte clara.
- Link publico.
- Nada de URL pequena dentro de imagem IA.
- Nada de letra gerada por IA quando precisa ser legivel.

## Proxima Execucao Permitida

Antes de publicar qualquer coisa:

1. Separar fila em `venda`, `noticia`, `pedido_de_links`, `status`.
2. Conferir destino.
3. Conferir se a mensagem combina com o destino.
4. Registrar print/log.
5. Se o grupo for de venda, bloquear noticia automaticamente.

