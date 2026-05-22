# Final Sweep 2026-05-22

## Shared Rule

- Treat CZS/Projeto Codex and PubPaid as separate products that share a repository and public address.
- Do not import CZS homepage/editorial/card rules into PubPaid unless the user explicitly asks.
- Do not import PubPaid game/HUD/PvP/wallet rules into CZS public pages unless the user explicitly asks.

## Projeto Codex / CZS

- Current public-site baseline: `20260522-homegate3`.
- Home validation target: content renders, hero has a real story/CTA, carousel controls remain usable, review team reports `totalIssues: 0`.
- Editorial cleanup lesson: public text must be Portuguese; source links stay visible; avoid generic translated filler.

## PubPaid

- Current PubPaid baseline: `20260522-boardfit1`.
- Hard gate: run `npm run guard:pubpaid` before claiming PubPaid validation.
- Xadrez and Damas camera lesson: board center is for playing; camera uses edges, middle mouse and pinch; only `Mesa fixa/Girar rival` should be visible as a compact control.
- Xadrez intro lesson: keep `video -> creditos -> moeda -> tabuleiro`. Never fire the coin before the intro phase finishes.
- Sinuca lesson: mobile drag adjusts aim only; short tap advances to power/shot.

## Cleanup Boundary

- Preserve rollback backups, approved evidence, `games/vale-pool/`, `pubpaid-phaser/`, `assets/pubpaid/`, wallet/PvP data and approved art anchors.
- Safe disposable targets from this sweep: `output/`, `debug.log`, Python `__pycache__`, runtime-only `data/pubpaid-tournaments.json`, and generated dependency coverage.
- Do not delete installed dependency `dist` folders as cleanup.

## Verification Baseline

- `node --check` on touched JS files.
- `git diff --check`.
- `npm run cleanup:audit`.
- `npm run review:team`.
- HTTP `/api/pubpaid/build` should return `20260522-boardfit1` locally.
- Browser smoke should confirm home and PubPaid without console errors.
