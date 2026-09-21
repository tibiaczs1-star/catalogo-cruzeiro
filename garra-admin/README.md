# Garra dos Sonhos — console administrativo

Área protegida em `/garra-admin/`, integrada ao login administrativo já existente no Catálogo CZS.

## Estado atual

- Somente homologação: cobrança, saque, resgate e entrega estão desativados.
- Estoque por lotes com valores inteiros em centavos.
- Razão append-only e trilha de auditoria para toda entrada.
- Requisições de escrita exigem `Idempotency-Key`.
- Dados persistidos em `DATA_DIR/garra-admin/state.json`.

Faça backup do diretório configurado em `DATA_DIR`. Para dinheiro e prêmios reais ainda serão necessários provedor de pagamentos, webhooks assinados e idempotentes, antifraude, privacidade, regras jurídicas, logística de resgate/entrega e revisão de segurança. Nenhuma dessas operações é simulada como real nesta versão.
