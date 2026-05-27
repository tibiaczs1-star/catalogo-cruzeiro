# PubPaid - Questões Legais, Riscos e Go/No-Go

Versão: 1.0
Data de referência: 26 de maio de 2026
Produto: PubPaid (`/pubpaid.html`)

## Aviso essencial

Este documento é uma matriz de risco e uma minuta de decisão. Ele não é parecer jurídico. A assinatura deste go/no-go não autoriza, sozinha, operação com dinheiro real. Para liberar saldo, entrada paga, prêmio, taxa, comissão, torneio pago, saque ou publicidade de ganho, é obrigatório obter revisão de advogado, contador e responsáveis de pagamento.

## Bases oficiais consultadas

- Lei nº 14.790/2023, marco de apostas de quota fixa: `https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/l14790.htm`
- Página da Secretaria de Prêmios e Apostas do Ministério da Fazenda sobre apostas de quota fixa: `https://www.gov.br/fazenda/pt-br/composicao/orgaos/secretaria-de-premios-e-apostas/apostas-de-quota-fixa/apostas-de-quota-fixa`
- FAQ da Secretaria de Prêmios e Apostas sobre jogos online, menores e publicidade: `https://www.gov.br/fazenda/pt-br/composicao/orgaos/secretaria-de-premios-e-apostas/apostas-de-quota-fixa/tire-suas-duvidas`
- Lei Geral de Proteção de Dados, Lei nº 13.709/2018: `https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm`
- Decreto-Lei nº 3.688/1941, Lei das Contravenções Penais: `https://www.planalto.gov.br/ccivil_03/decreto-lei/del3688.htm`
- Marco Civil da Internet, Lei nº 12.965/2014: `https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm`
- Código de Defesa do Consumidor, Lei nº 8.078/1990: `https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm`
- Decreto nº 7.962/2013, comércio eletrônico: `https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/decreto/d7962.htm`
- Lei nº 5.768/1971, distribuição gratuita de prêmios, sorteios e concursos: `https://www.planalto.gov.br/ccivil_03/leis/l5768.htm`
- Normas Pix do Banco Central do Brasil: `https://www.bcb.gov.br/estabilidadefinanceira/pix-normas`

## Leitura regulatória resumida

A Lei nº 14.790/2023 define aposta como colocar valor em risco na expectativa de prêmio e trata a exploração de apostas de quota fixa como atividade dependente de autorização do Ministério da Fazenda. A página oficial da Secretaria de Prêmios e Apostas informa que, desde 1º de janeiro de 2025, apenas empresas autorizadas pela SPA podem operar apostas de quota fixa nacionalmente.

A FAQ da SPA distingue certos jogos de habilidade, jogos multiapostador e P2P do conceito de evento virtual de aposta de quota fixa, mas isso não significa autorização automática para operar competição com dinheiro, prêmio, taxa ou saque. O PubPaid deve tratar essa zona como risco jurídico alto até parecer formal.

## Matriz de riscos

| Tema | Risco | Motivo | Ação obrigatória |
| --- | --- | --- | --- |
| Apostas de quota fixa | Alto | Se houver valor em risco com expectativa de prêmio, pode haver enquadramento regulatório. | Parecer jurídico antes de qualquer dinheiro real. |
| Jogo de azar/álea | Alto | Qualquer prêmio decidido por sorte, moeda, chance dominante ou mecânica aleatória aumenta risco. | Garantir que moeda só define início; prêmio nunca depende de sorte. |
| P2P, taxa ou comissão | Alto | Mesmo P2P/habilidade pode gerar discussão regulatória, consumerista, fiscal e de pagamento. | Não cobrar taxa/rake sem parecer específico. |
| Torneio pago | Alto | Entrada, prêmio, ranking e eliminação podem atrair regras de promoção, competição e tributação. | Regulamento completo e aprovação jurídica/contábil. |
| Prêmios e promoções | Alto | Sorteio, vale-brinde, concurso ou operação semelhante pode exigir autorização própria. | Não prometer prêmio promocional sem análise da Lei 5.768/1971. |
| Menores de 18 anos | Alto | Apostas e jogos com risco financeiro devem bloquear menores. | Age gate, termos e moderação; não anunciar para menores. |
| Publicidade | Alto | Não pode sugerir enriquecimento, renda fácil ou recuperação de perdas. | Revisão de toda copy pública antes de publicar. |
| Pix e custódia | Alto | Depósitos/saques exigem conciliação, titularidade, antifraude e registros. | Manual financeiro, comprovantes, logs e validação de titularidade. |
| Tributação | Alto | Prêmios, taxas, receitas e pagamentos podem ter obrigações fiscais. | Parecer contábil/fiscal antes da operação. |
| LGPD | Alto | Login, WhatsApp, Pix, logs e histórico de jogo são dados pessoais. | Aviso de privacidade, canal de direitos, retenção e segurança. |
| Consumidor/e-commerce | Médio/alto | Usuário precisa de informação clara, suporte, preço, restrições e reembolso. | Termos públicos, suporte e política de reembolso. |
| Propriedade intelectual | Médio | Assets, áudio, vídeo, fontes e bibliotecas precisam de licença. | Arquivar origem/licença de todos os assets. |
| Segurança técnica | Médio/alto | Bugs podem afetar saldo, resultado e confiança. | Logs, teste PvP com duas sessões, rollback e revisão de disputas. |

## Go/No-Go operacional

### Pode seguir agora

- Damas e Xadrez em demonstração.
- Teste técnico interno.
- Validação mobile, HUD, regra, lances e IA.
- Partidas sem saldo real.
- Cadastro limitado para homologação.
- Sinuca offline até correção e nova validação.

### Não pode seguir sem parecer assinado

- Publicar promessa de ganho.
- Receber entrada paga.
- Distribuir prêmio em dinheiro ou equivalente.
- Cobrar taxa, comissão, rake ou porcentagem.
- Liberar saque automatizado.
- Fazer torneio pago.
- Usar moeda, sorteio ou aleatoriedade como fator de prêmio.
- Operar com menores de 18 anos.
- Rodar campanha promocional com prêmio sem autorização aplicável.

## Checklist obrigatório antes de dinheiro real

- `[  ]` Parecer jurídico sobre enquadramento do PubPaid.
- `[  ]` Parecer contábil/fiscal sobre entrada, prêmio, taxa, receita e saque.
- `[  ]` Termos de Uso públicos revisados.
- `[  ]` Política de Privacidade/LGPD revisada.
- `[  ]` Regulamento específico de torneio, se houver.
- `[  ]` Política de reembolso e disputa.
- `[  ]` Política de prevenção a fraude e múltiplas contas.
- `[  ]` Bloqueio de menores de 18 anos.
- `[  ]` Conciliação Pix e registros financeiros.
- `[  ]` Conferência de titularidade para saque.
- `[  ]` Teste PvP real em duas sessões autenticadas.
- `[  ]` Auditoria de logs de lances, resultado e saldo.
- `[  ]` Revisão de publicidade sem promessa de renda.
- `[  ]` Arquivo de licenças dos assets.
- `[  ]` Plano de suporte e prazo de resposta.

## Decisão

Marcar apenas uma opção:

- `[  ]` GO técnico limitado: autorizado somente teste, demonstração e homologação sem dinheiro real.
- `[  ]` GO financeiro condicionado: autorizado operar dinheiro real somente após anexar parecer jurídico, contábil, fiscal, LGPD e pagamento.
- `[  ]` NO-GO financeiro: manter dinheiro real bloqueado até correção das pendências.

## Pendências anexas

1. `[PREENCHER]`
2. `[PREENCHER]`
3. `[PREENCHER]`
4. `[PREENCHER]`
5. `[PREENCHER]`

## Declaração de ciência

Declaro que li esta matriz de riscos e aceito que o PubPaid não deve operar dinheiro real, entrada paga, prêmio, taxa, comissão, torneio pago, saque automatizado ou publicidade de ganho enquanto as pendências obrigatórias não estiverem resolvidas e assinadas pelos responsáveis.

## Assinaturas

Responsável legal: ______________________________________________

CPF/CNPJ: _______________________________________________________

Cargo/função: ___________________________________________________

Local e data: ___________________________________________________

Assinatura: _____________________________________________________

Advogado revisor: _______________________________________________

OAB/UF: _________________________________________________________

Assinatura: _____________________________________________________

Contador/revisor fiscal: ________________________________________

CRC/UF: _________________________________________________________

Assinatura: _____________________________________________________

Responsável técnico: ____________________________________________

CPF: ____________________________________________________________

Assinatura: _____________________________________________________
