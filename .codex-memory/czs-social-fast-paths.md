# CZS Social Fast Paths

Use this first for CZS social/posting work.

## Channel Rules

- WhatsApp `Catálogo CZS`: news cards/images only, with destination header validated.
- Instagram `@catalogo_czs_`: news and services only.
- Instagram must not receive object-sale stories such as phones, TVs, Meta Quest or single-item classifieds.
- Object sales go to WhatsApp sales groups and Facebook/Marketplace only, never Instagram stories.
- Facebook/Marketplace is separate from WhatsApp and must not be forced through a distorted category/composer.

## Fast Order

1. Read `.codex-memory/propaganda-automation-protocol.md`.
2. Check latest logs/assets in `.codex-temp/zap-round-*` before generating anything new.
3. For news, use `scripts/capture-latest-news.js` and `data/runtime-news.json`.
4. For Instagram, inspect existing story/feed evidence before posting.
5. Validate visually before publish; if visual is ugly or channel is wrong, stop.

## Known Good Evidence Paths

- WhatsApp news correction: `.codex-temp/zap-round-20260602/news-catalogo-czs-cards-posted.png`
- WhatsApp news correction log: `.codex-temp/zap-round-20260602/news-catalogo-czs-cards-post-log.json`
- Meta/Instagram feed capture: `.codex-temp/zap-round-20260602/meta-instagram-feed-capture.png`
- Wide capture report: `.codex-temp/zap-round-20260602/captacao-ampla-20260602.md`

## Recovery Rule

If a wrong item was posted to Instagram, do not click blindly through stories. First capture the current screen, identify the exact story, then remove only if the delete menu clearly belongs to that item.
