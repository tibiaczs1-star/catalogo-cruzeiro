# Handoff

Updated: 2026-04-21T15:25:07.665Z

A SPO agora grava votos com escrita atômica e fila serializada para não perder registros em gravações próximas. O render.yaml foi preparado com disk e DATA_DIR persistente para o serviço web. Teste local real confirmou persistência após restart.

## Next

- Subir essa correção e depois conferir no deploy se o serviço Render aplicou o disk persistente ou se precisa ajuste manual no dashboard.
