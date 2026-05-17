# Handoff

Updated: 2026-05-17T03:10:00.000Z

PubPaid 2.0 recebeu correcao do gate mobile, carteira e NPCs do salao. O fluxo normal apos Google/termos chama a intro direto, sem painel extra de "som/tela cheia"; o som fica opcional. Carteira mostra "Ja fiz o pagamento" e "Atualizar saldo". `pubpaid-runtime.js` preserva `manualApprovedBalanceCoins` para saldo aprovado/manualizado e ganhos, evitando zerar carteira ao fechar/voltar. No salao, garcom esta maior e dancarina esta como NPC no palco, com texto PALCO oculto.

## Next

- Deploy em origin/main
- aguardar Render e verificar online /pubpaid-v2.html?v=20260517-mobile-fix-stage-wallet1.
