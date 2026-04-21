# Current State

Updated: 2026-04-21T15:25:07.653Z

## Active Goal

- Persistencia da SPO blindada

## Summary

A gravação da Pesquisa Acre 2026 foi reforçada com escrita atômica e fila de mutação por arquivo para evitar sobrescrita concorrente. O deploy também foi preparado para usar DATA_DIR persistente em disco no Render. Teste local real: 2 votos gravados, servidor reiniciado e a contagem permaneceu em 2.

## Next

- Publicar a blindagem da persistência da SPO e
- se preciso
- confirmar no Render se o serviço está sincronizando o disk do render.yaml.
