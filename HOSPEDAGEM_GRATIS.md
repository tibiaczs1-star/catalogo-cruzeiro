# Hospedagem + Banco (teste rápido)

## Melhor rota para subir rápido (quase sem custo)

1. **Frontend:** Vercel (Hobby)
2. **Backend Node (Express):** Railway
3. **Banco grátis:** Cloudflare D1 (na próxima etapa de migração) ou JSON local para teste inicial

### Observação importante

- Vercel Hobby é gratuito.
- Railway atualmente tem trial e depois custo mínimo baixo.
- Se você quiser **100% grátis contínuo**, o melhor é migrar backend para Cloudflare Workers + D1.

## Rota 100% grátis (com limites)

1. **Frontend:** Cloudflare Pages (grátis)
2. **Backend:** Cloudflare Workers (grátis com limites)
3. **Banco:** Cloudflare D1 (grátis com limites diários)

### Limites úteis do D1 Free (referência oficial)

- Rows read: 5 milhões/dia
- Rows written: 100 mil/dia
- Storage: 5 GB total

## Gestão por mim (no código)

Eu consigo te ajudar a gerir tudo por código e deploy:

- padronizar variáveis de ambiente
- preparar pipeline de deploy
- ajustar endpoints para produção
- migrar persistência para banco gerenciado
- configurar logs e relatório admin

## Próximo passo recomendado para você

Como você vai entrar em testes agora:

1. Subir frontend no Vercel (mais rápido)
2. Subir backend no Railway (sem bloquear lançamento)
3. Rodar assim por 1 semana
4. Migrar backend para Cloudflare Workers + D1 (100% grátis com limites)
