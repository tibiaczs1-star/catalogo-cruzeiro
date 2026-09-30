# Workflow operacional CZS Video Newsroom 2026

Status: implementação inicial; publicação bloqueada sem aprovação humana explícita.

## Resultado observável

Toda pauta audiovisual passa por um gate determinístico antes da edição. O gate aceita somente conteúdo com local, fonte pública, estado de confirmação, mídia real da fonte e direitos liberados. A saída decide formato, safe area, música, renderização e mantém a publicação bloqueada.

## Fluxo

1. Captação: vídeo real primeiro; foto ou captura real apenas quando não houver vídeo.
2. Proveniência: registrar fonte, URL pública, data, local e direitos de uso.
3. Checagem: marcar `confirmed` ou `developing`; em atualização, declarar o que falta confirmar.
4. Gate: executar `scripts/czs-video-newsroom-gate.js`.
5. Roteiro: fato, fonte, impacto no Vale do Juruá e o que acompanhar.
6. Composição: template determinístico 1080x1920; texto e logo nunca gerados por IA.
7. Renderização: FFmpeg; NVENC preferencial para vídeo real.
8. QA: revisar frame, áudio, ortografia, fonte, safe area e direitos.
9. Aprovação humana: necessária antes de qualquer publicação.
10. Distribuição: gerar versões somente após o master vertical ser aprovado.

## Contrato mínimo de entrada

```json
{
  "items": [{
    "id": "czs-001",
    "title": "Manchete factual",
    "location": "Cruzeiro do Sul",
    "sourceName": "Fonte identificada",
    "sourceUrl": "https://fonte.example/noticia",
    "mediaType": "source-video",
    "mediaUrl": "https://fonte.example/video.mp4",
    "rights": "cleared",
    "status": "confirmed",
    "category": "public-service",
    "publishedAt": "2026-09-14T15:00:00-05:00"
  }]
}
```

Valores de `mediaType`: `source-video`, `source-photo`, `source-screenshot`.

Para `status: developing`, incluir `unconfirmed` com o que ainda não foi confirmado.

## Execução

```text
node scripts/czs-video-newsroom-gate.js intake.json plan.json
```

Códigos de saída:

- 0: todas as pautas aceitas pelo gate;
- 2: uma ou mais pautas bloqueadas;
- 1: entrada ou execução inválida.

## Regras canônicas aplicadas

- Stories/Reels: 1080x1920.
- Área segura editorial: x 72–1008 e y 280–1540.
- Vídeo real da fonte precede card ou imagem de apoio.
- Polícia, morte ou acidente com vítima: sem música ou base neutra muito baixa.
- IA generativa: somente fundo ou ilustração identificável; nunca evidência documental.
- Marca, títulos, fontes, legendas e CTA são aplicados por template determinístico.
- Nenhum item sai do estado `awaiting-explicit-human-approval` automaticamente.

## Fontes internas

- `docs/social/czs-instagram-news-standard-2026-05-31.md`
- `docs/social/czs-instagram-video-first-playbook-2026-06-01.md`
- `docs/social/czs-premium-visual-system-2026-05-31.md`
- `docs/CATALOGO_CZS_AI_SAFETY.md`
- `docs/CZS_PRODUCT_MASTER_RULES.md`
- `docs/CZS_REAL_VIDEO_REELS_AGENT_PROMPT.md`

## Pesquisa externa incorporada

- Reuters Journalistic Standards: precisão, independência, ausência de fabricação e edição visual não enganosa.
- Verification Handbook: checar proveniência, fonte, data e localização de conteúdo gerado pelo usuário.
- Documentação oficial ComfyUI/Wan: workflows são adequados a material gerado ou ilustrativo, não à fabricação de registro jornalístico.
- NVIDIA Video Codec SDK: NVENC/NVDEC via FFmpeg para aceleração de codificação e decodificação.

A pesquisa externa complementa, mas não substitui as regras canônicas CZS.
