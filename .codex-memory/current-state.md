# Current State

Updated: 2026-05-13T01:22:16.933Z

## Active Goal

- Corrigir home mobile/desktop: sem area Rede Social indevida, abertura cinematografica no primeiro acesso e carregamento real curto entre paginas.

## Summary

Mudancas locais validadas: home nao contem mais #rede-social nem texto Rede Social nos arquivos publicos, abertura saiu do modelo app para Abertura cinematografica por sessao do navegador, e navegacao home/materia/recursos usa barra superior curta em vez de full-screen cinematico. Checks: node --check script/startup/noticia/early-home-surfaces, review:team totalIssues=0, perf:budget ok=true. Smoke mobile local em 127.0.0.1:3219 confirmou primeira abertura e segunda visita sem intro.

## Next

- Commitar, enviar para origin/main e validar online no Render com viewport mobile.
