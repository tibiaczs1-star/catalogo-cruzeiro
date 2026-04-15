# Integração rápida • Catálogo Cruzeiro do Sul

## 1) Subir o backend

```bash
cd backend
npm install
npm run dev
```

Backend local padrão: `http://localhost:8787`

## 2) Dashboard admin

Abrir:

`http://localhost:8787/admin/admin-dashboard.html`

Painel mostra:

- acessos totais
- visitantes únicos
- sessões
- dispositivos e navegadores
- cidades (quando provedor envia geodados)
- tempo médio de sessão
- votos/simulações e ranking
- exportação CSV de acessos e votos

## 3) Frontend apontando para API

Se o site estiver em outro domínio/porta, defina no HTML antes dos scripts:

```html
<script>
  window.CATALOGO_API_BASE = "https://seu-backend.com";
</script>
```

Sem isso:

- em `file://` usa `http://localhost:8787`
- em hospedagem usa o mesmo domínio (`location.origin`)

## 4) Agregador automático (30 min)

O backend atualiza feeds RSS ao iniciar e repete a cada 30 minutos.

Endpoint para leitura:

`GET /api/news/aggregator?limit=50`

## 5) Eleições

Endpoint:

`GET /api/elections/acre?scope=federal|estadual|municipal`

Regras já aplicadas:

- se for ciclo geral (ex: 2026), não exibe eleição para prefeito
- destaca governo e senado quando aplicável
- inclui link nacional de ranking político
