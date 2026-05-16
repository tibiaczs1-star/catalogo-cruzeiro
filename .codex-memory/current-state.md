# Current State

Updated: 2026-05-16T23:35:19.315Z

## Active Goal

- PubPaid 2.0 Google wallet real flow with receipt-name check

## Summary

Local build now requires the Pix receipt name before Avisar admin, sends it with Google-bound deposit data, shows it in admin review, keeps Damas blocked without approved real balance, and uses inviting entry copy instead of Google primeiro/computer-language labels. Cache version: 20260516-google-wallet-invitecopy2.

## Next

- Commit and push from clean deploy worktree
- wait for Render
- verify online cache-busted URL

## Files In Focus

- pubpaid-v2.html
- site-google-auth.js
- pubpaid-admin.html
- pubpaid-runtime.js
- server.js
- pubpaid-phaser/app.js
- pubpaid-phaser/scenes/BootScene.js
- pubpaid-phaser/services/accountService.js
- pubpaid-phaser/ui/walletInterface.js
- pubpaid-phaser/ui/domGameInterface.js

## Assets In Focus

- local-google-gate
- local-auth-wallet
- local-deposit-pending
- local-lobby-blocked
- local-admin-review
- local-restored-intro
- local-restored-street
- local-mobile-google-gate
