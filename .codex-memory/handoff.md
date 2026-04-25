# Handoff

Updated: 2026-04-25T12:25:00.000Z

Card de captacao social aprovado na home. Ele fica dentro do espaco abaixo do texto de Participacao Comunitaria, sem abrir coluna/div nova, com visual 3D. O front chama `/api/social-trends` e mistura trending topics/hashtags externos de listas publicas de X/Twitter e Instagram antes de qualquer fallback local.

## Next

- Publicar pacote aprovado.
- Depois do deploy, validar `/api/social-trends?limit=8` no ambiente final e conferir o card em `/#participacao-comunitaria`.

## Files In Focus

- index.html
- styles.css
- script.js
- server.js
