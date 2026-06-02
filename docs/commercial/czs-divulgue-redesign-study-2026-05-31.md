# Estudo de Redesign - Landing Divulgue no Catalogo CZS

Data: 2026-05-31

## Diagnostico direto

A versao publicada de `divulgue.html` cumpre parte tecnica de SEO, mas falha como peca visual e comercial.

Problemas principais:

- Parece uma tela generica de SaaS/portfolio, nao uma proposta regional do Catalogo CZS.
- O hero usa `cheffe-call-office-bg.jpg`, que comunica bastidor/operacao interna, nao Cruzeiro do Sul, Vale do Jurua, comercio local, jornalismo ou oportunidade comercial.
- O titulo esta grande demais e ocupa a tela como poster, mas nao diz rapidamente o beneficio concreto para o anunciante.
- O card lateral com `og-cover.svg` parece mockup de apresentacao, nao prova real do produto.
- A pagina fala de muitos canais ao mesmo tempo, mas nao organiza uma oferta clara por prioridade.
- Falta prova visual real: print do jornal, print do Instagram, numeros do pitch comercial, miniatura do catalogo, exemplos de anuncio ou contexto de negocios locais.
- O tom visual e bege/azul pesado, com pouca energia de cidade, comercio, rio, feira, rua, servico e noticia.

Conclusao: a pagina esta tecnicamente indexavel, mas comercialmente fraca. Ela precisa ser redesenhada como proposta local, nao como landing decorativa.

## Objetivo correto da pagina

A pagina nao deve substituir a home jornalistica. Ela deve ser uma pagina comercial de conversao para:

1. explicar o que o Catalogo CZS vende;
2. mostrar por que o jornal/catalogo ajuda empresas locais;
3. levar o interessado para WhatsApp;
4. reforcar SEO local para termos de divulgacao, anuncio, catalogo, servicos e Cruzeiro do Sul.

Frase de norte:

> O Catalogo CZS e uma vitrine local ligada ao jornal: noticia gera atencao, catalogo gera busca, WhatsApp gera contato.

## Publico

Primario:

- donos de pequenos negocios em Cruzeiro do Sul;
- prestadores de servico;
- vendedores de produtos em grupos/Marketplace;
- restaurantes, farmacias, clinicas, oficinas, lojas, hospedagem, transporte, beleza, eventos e servicos digitais.

Secundario:

- patrocinadores do jornal;
- parceiros comerciais;
- compradores de cotas;
- pessoas que querem aparecer no Google local.

## Promessa comercial

Promessa ruim:

- "Divulgue no Catalogo CZS" sozinho.

Promessa melhor:

- "Sua empresa aparecendo onde Cruzeiro do Sul procura noticia, telefone e servico."

Alternativas de H1:

1. `Anuncie para Cruzeiro do Sul`
2. `Apareca no Catalogo CZS`
3. `Sua empresa no jornal e no guia local`

Recomendacao:

> `Apareca no Catalogo CZS`

Subtitulo:

> Noticia chama atencao. Catalogo vira busca. WhatsApp vira contato. O CZS coloca sua empresa dentro da rotina digital de Cruzeiro do Sul e do Vale do Jurua.

## Direcao visual recomendada

Visual thesis:

> Uma pagina comercial regional, clara e confiavel, com cara de jornal local moderno: fundo claro, azul editorial, acentos amarelo/rio, fotos reais ou prints reais, layout de proposta e prova.

Evitar:

- imagem de escritorio pixel art no hero;
- mockup generico;
- hero tipografico gigante;
- excesso de cards iguais;
- estetica de startup distante da cidade;
- fundo escuro pesado;
- decoracao que nao prova nada.

Usar:

- print real da home do CZS;
- print do catalogo de servicos;
- print/arte do Instagram `@catalogo_czs_`;
- faixa com numeros do pitch comercial, quando houver fonte/print: 9.000 views informadas em cerca de 3 dias, 552 seguidores, 181 posts;
- modulos reais do catalogo;
- CTA de WhatsApp sempre visivel, mas sem poluir.

## Estrutura proposta

### 1. Hero

Funcao: explicar em 5 segundos.

Layout:

- esquerda: H1, subtitulo, CTA WhatsApp, link para catalogo;
- direita: composicao com 3 provas reais empilhadas:
  - mini print da home do jornal;
  - mini print do catalogo de servicos;
  - mini print do Instagram ou story de servicos.

Texto:

- H1: `Apareca no Catalogo CZS`
- Sub: `Noticia chama atencao. Catalogo vira busca. WhatsApp vira contato.`
- CTA primario: `Quero aparecer`
- CTA secundario: `Ver catalogo`

### 2. Faixa de prova

Funcao: mostrar que ha movimento.

Conteudo:

- `Jornal local`
- `Catalogo de servicos`
- `Instagram e stories`
- `Grupos e Marketplace`
- `SEO local`
- `PubPaid e campanhas`

Se usar numeros, deixar claro quando forem "informados" ou "apurados".

### 3. Como o cliente aparece

Funcao: tornar a oferta concreta.

Tres etapas:

1. `Cadastro`: nome, categoria, telefone, WhatsApp, bairro, fotos e fonte.
2. `Pagina e chamada`: texto local, imagem, botao e link interno.
3. `Propagacao`: jornal, catalogo, Instagram, stories, grupos validados e sitemap.

### 4. Planos/formatos sem preco fixo

Funcao: vender sem travar em tabela.

Formatos:

- `Entrada rapida`: cadastro + chamada + WhatsApp.
- `Divulgacao local`: pagina + arte + story + link no catalogo.
- `Campanha`: landing + pacote de posts + SEO + acompanhamento.
- `PubPaid promocional`: jogo/desafio/campanha interativa.

### 5. SEO local explicado para leigo

Funcao: responder ao pedido de aparecer no Google.

Texto simples:

> Para aparecer melhor em buscas, cada negocio precisa de nome claro, categoria, cidade, contato, descricao util, links internos, pagina indexavel e consistencia com Google/Instagram/WhatsApp.

Checklist:

- titulo com categoria + cidade;
- descricao unica;
- telefone/WhatsApp;
- bairro/area atendida;
- imagem real;
- link interno;
- schema quando houver dados suficientes;
- sitemap e Search Console.

### 6. CTA final

Funcao: conversao.

Texto:

> Me mande o nome da empresa, categoria, WhatsApp e 3 fotos. Eu preparo a primeira vitrine.

CTA:

- `Enviar dados no WhatsApp`

## SEO tecnico recomendado

O que manter da versao atual:

- pagina propria `divulgue.html`;
- canonical para `https://catalogo-cruzeiro-web.onrender.com/divulgue.html`;
- entrada no sitemap;
- links internos vindos da home e do catalogo;
- JSON-LD basico.

O que melhorar:

- trocar o `schemaType` generico de `Service` por uma composicao mais clara:
  - `WebPage` para a pagina;
  - `Organization`/`NewsMediaOrganization` para o CZS;
  - `Service` como `mainEntity`;
  - `OfferCatalog` com os formatos comerciais;
- criar breadcrumbs;
- adicionar `FAQPage` somente se houver perguntas reais e uteis, sem forcar rich result;
- melhorar alt texts com descricao real;
- nao usar keyword stuffing;
- criar paginas futuras por intencao:
  - `/anunciar-em-cruzeiro-do-sul.html`;
  - `/catalogo-empresas-cruzeiro-do-sul.html`;
  - ou rotas dinamicas por modulo quando o servidor suportar slug limpo.

## SEO do catalogo para aparecer no Google

O catalogo precisa deixar de ser so uma pagina com tabs e virar um conjunto de entidades locais.

Prioridade:

1. Criar uma pagina/URL indexavel por modulo com texto proprio:
   - `Farmacias em Cruzeiro do Sul`
   - `Restaurantes em Cruzeiro do Sul`
   - `Telefones uteis em Cruzeiro do Sul`
   - `Hospedagem em Cruzeiro do Sul`
   - `Servicos digitais em Cruzeiro do Sul`
2. Para cada empresa/servico confirmado, guardar:
   - nome;
   - categoria;
   - telefone;
   - WhatsApp;
   - endereco ou bairro se confirmado;
   - site/rede social;
   - fonte;
   - data de revisao;
   - status de confirmacao.
3. Gerar pagina individual para anunciantes pagos, quando possivel.
4. Usar `LocalBusiness` somente quando houver dados suficientes e verdadeiros.
5. Enviar sitemap no Search Console e inspecionar manualmente:
   - `/`;
   - `/divulgue.html`;
   - `/catalogo-servicos.html`;
   - principais URLs de modulo.

## Referencias tecnicas usadas

- Google Search Central - SEO Starter Guide: titulos, descricoes e estrutura util importam mais que meta keywords.
- Google Search Central - LocalBusiness structured data: dados locais precisam ser consistentes e verdadeiros.
- Google Search Central - Sitemaps: sitemap ajuda descoberta, mas nao substitui conteudo util e indexavel.

## Recomendacao final antes de redesenhar

Refazer a landing com uma abordagem mais simples e mais verdadeira:

- menos "efeito";
- mais prova real;
- mais cidade;
- mais oferta concreta;
- mais caminho para WhatsApp;
- mais SEO sem parecer texto escrito para robo.

O proximo redesenho deve trocar a pagina atual por uma estrutura comercial clara, usando prints reais como prova e mantendo o SEO tecnico ja publicado.
