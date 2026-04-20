# Deploy Render + Cloudflare

Guia direto para colocar o projeto no ar com:

- Render para hospedagem 24h
- Cloudflare para DNS e SSL

## 1. Preparação local

No terminal da pasta do projeto:

```bash
git init -b main
git add .
git commit -m "Preparar deploy no Render"
```

Depois crie um repositório no GitHub e conecte:

```bash
git remote add origin https://github.com/SEU-USUARIO/SEU-REPO.git
git push -u origin main
```

## 2. Subir no Render

1. Entre em `https://dashboard.render.com`
2. Clique em `New` > `Blueprint`
3. Conecte o repositório do GitHub
4. Confirme o arquivo `render.yaml` na raiz
5. Clique em `Deploy Blueprint`

## 3. Variáveis no Render

Preencha estas variáveis:

- `SITE_URL=https://SEU-DOMINIO`
- `ADMIN_TOKEN=um-token-forte`
- `SUPER_ADMIN_USER=admin`
- `SUPER_ADMIN_PASSWORD=uma-senha-forte`
- `NINJAS_PIX_KEY=<sua-chave-pix-somente-no-render>`
- `NINJAS_PIX_RECEIVER_NAME=<nome-do-recebedor>`
- `NINJAS_MERCHANT_NAME=<nome-comercial-do-recebedor>`
- `NINJAS_MERCHANT_CITY=CRUZEIRO DO SUL`

Observação:
o BR Code do Pix aceita nome técnico curto no payload, então o sistema normaliza esse campo automaticamente quando precisar.

As demais já estão definidas no `render.yaml`.

## 4. Conectar domínio no Render

No serviço `catalogo-cruzeiro-web`:

1. Abra `Settings`
2. Vá em `Custom Domains`
3. Adicione:
   - `seudominio.com.br`
   - `www.seudominio.com.br`

O Render vai mostrar os registros DNS necessários.

## 5. Configurar Cloudflare

No Cloudflare:

1. Adicione o domínio
2. Troque os nameservers no registrador
3. Crie os DNS pedidos pelo Render

Para este projeto, o hostname atual do serviço é:

- `catalogo-cruzeiro-web.onrender.com`

No Cloudflare, use primeiro em modo `DNS only`:

- `CNAME` `@` -> `catalogo-cruzeiro-web.onrender.com`
- `CNAME` `www` -> `catalogo-cruzeiro-web.onrender.com`

Remova qualquer registro `AAAA` antes de verificar no Render.

Depois que o certificado estiver emitido e válido, você pode trocar para `Proxied` se quiser.

## 6. Ajuste final obrigatório

Depois que o domínio responder:

1. volte ao Render
2. atualize `SITE_URL` com o domínio final real
3. faça um novo deploy

Isso garante canonical, sitemap, Open Graph e links absolutos corretos.

## 7. Checklist rápido

- Render em `starter`
- domínio conectado
- `SITE_URL` correto
- home abrindo
- `https://SEU-DOMINIO/sitemap.xml` abrindo
- `https://SEU-DOMINIO/robots.txt` abrindo

## 8. Custo estimado

- Cloudflare DNS Free: `US$ 0/mês`
- Render Starter: `US$ 7/mês`
- Disk 1 GB: `US$ 0,25/mês`

Total base: `US$ 7,25/mês`
