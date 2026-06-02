# Sistema Visual Premium - Catálogo CZS

Data: 31/05/2026

## Diagnostico

O lote atual nao pode ser tratado como premium enquanto tiver:

- logo cortado, pequeno demais ou encostado na borda;
- card sem assinatura clara do Catálogo CZS;
- foto escura sem intencao editorial;
- texto parecendo colagem ou recorte de HTML;
- noticia sem foto real quando existe foto na fonte;
- arte de venda generica sem cara de loja confiavel.

## Referencias Estudadas

- BBC News social/Instagram: sistema com templates reconheciveis, adaptados por tipo de historia, com pesquisa de publico e visual nativo de Instagram.
- New York Times: hierarquia, grid, foto principal, tipografia e composicao como "capa" do pacote editorial.
- The Economist: design system consistente, identidade forte e uso disciplinado de componentes.
- Guias de safe zone para Stories/Reels: em 1080x1920, manter texto, logo, rosto, produto e CTA longe do topo, rodape e laterais.

## Regra Dura De Safe Area

Stories 1080x1920:

- nenhum logo, titulo, rosto, produto, preco ou CTA nos primeiros 250 px;
- nenhum logo, titulo, produto, preco ou CTA nos ultimos 310 px;
- margem lateral minima de 72 px;
- area segura editorial: x 72-1008, y 280-1540;
- link sticker fica no meio inferior, nunca colado no rodape;
- logo do Catálogo CZS fica sempre inteiro, com respiro, nunca grudado no canto.

Feed 1080x1350:

- margem minima de 64 px;
- logo dentro de uma faixa superior ou inferior com altura definida;
- titulo dentro de bloco com largura maxima de 860 px;
- nada importante a menos de 80 px das bordas.

Quadrado 1080x1080:

- margem minima de 72 px;
- logo inteiro em faixa propria;
- produto/foto no centro visual, sem cortar informacao comercial.

## Assinatura CZS

Todo asset precisa ter:

- marca inteira: `CATÁLOGO CZS` ou `CATÁLOGO CRUZEIRO`;
- sublinha editorial curta: `Jornal do Vale do Juruá` ou `Cruzeiro do Sul e Região`;
- uma linha de fonte quando for noticia;
- site publico apenas quando fizer sentido: `catalogo-cruzeiro-web.onrender.com`;
- assinatura pequena, clara e alinhada, sem ocupar o titulo.

## Padroes De Composicao

### Noticia Forte

1. Foto ou frame real em tela cheia.
2. Degrade escuro somente onde o texto precisa ler.
3. Logo em faixa segura superior.
4. Tarja de editoria curta.
5. Titulo grande, 2 a 4 linhas, sem esmagar a foto.
6. Fonte discreta no rodape seguro.
7. CTA: `Saiba mais no site`.

### Politica/Gestao

1. Foto real da agenda.
2. Fundo limpo, sem dramatizar.
3. Titulo direto e institucional.
4. Sem adjetivo sensacionalista.
5. Marca e fonte bem visiveis.

### Policia/Acidente

1. Foto real, sem explorar vitima.
2. Tarja `ALERTA` ou `POLICIA`.
3. Titulo factual.
4. Sem musica de terror.
5. Narracao calma ou sem musica.

### Servico/Venda

1. Parece loja confiavel, nao flyer amador.
2. Produto ou servico como heroi visual.
3. Preco em modulo proprio quando houver.
4. Beneficio em uma linha.
5. WhatsApp e CTA claros.
6. Catálogo CZS inteiro e visivel.

## Paleta

Base:

- preto editorial: `#071114`;
- branco texto: `#F7FAFC`;
- amarelo etiqueta: `#FFD84A`;
- verde Acre/CZS: `#00A36C`;
- azul informacao: `#1CA7EC`;
- cinza apoio: `#AAB6BE`.

Usar no maximo 2 cores de destaque por arte. O visual deve parecer jornal/local premium, nao carnaval de cores.

## Tipografia

- Titulo: sans bold, alto contraste, sem condensar demais.
- Subtitulo: sans medium.
- Fonte/rodape: sans regular, pequeno mas legivel.
- Nunca usar texto minúsculo em rodape se o print do celular nao permite ler.
- Nunca gerar letras por IA dentro da imagem quando o texto precisa estar correto. A imagem pode ser gerada por IA, mas texto final deve ser aplicado por template/editor.

## Regra Para GPT Image

GPT Image gera:

- foto premium, cena, fundo, produto, atmosfera;
- sem texto importante dentro da imagem;
- sem logo falso;
- sem mockup com letras inventadas.

Depois o template CZS aplica:

- logo real;
- titulo real;
- preco;
- CTA;
- fonte;
- site.

## Prompt Base Em Ingles

```text
Create a premium editorial social media background for a local news and commerce brand in the Brazilian Amazon. 
Do not include any readable text, logos, labels, watermarks, UI, fake letters, or signage. 
Use a realistic, high-end journalistic/commercial photography style, strong natural light, clean composition, clear subject, premium contrast, and enough empty space for a headline overlay. 
Composition must be mobile-first: safe margins, uncluttered top and bottom, strong central subject, professional news-magazine look, no horror mood, no cheap flyer style.
```

## Prompt De Regeneracao Por Arte

```text
You are the senior art director for Catálogo CZS, a local newspaper and commerce channel for Cruzeiro do Sul and Vale do Juruá.

Regenerate this asset as a premium social media post/story.

Hard rules:
- Brand must read exactly: CATÁLOGO CZS.
- Never crop the logo.
- Keep all critical content inside safe margins.
- Use real editorial hierarchy: brand, section tag, main image, headline, source/CTA.
- If using AI image generation, generate only the background/photo/product image with no text; apply all text later with the template.
- No fake letters, no mojibake, no broken accents, no HTML screenshot look.
- No terror soundtrack or horror visual mood.
- For stories, use 1080x1920. For feed, use 1080x1350. For WhatsApp sales, use 1080x1080 or 1080x1350.

Output:
1. One clean premium image/video asset.
2. One caption in Portuguese.
3. One link/CTA line.
4. One quality checklist result.
```

## Reprovacao Automatica

Reprovar e refazer antes de postar se:

- `CATÁLOGO CZS` nao aparece inteiro;
- qualquer letra sai estranha;
- o logo encosta na borda;
- o titulo passa de 4 linhas em story;
- story sai sem imagem/video real;
- arte sai verde, vazia ou generica;
- fonte/link aparece antes da midia;
- imagem parece print de site quebrado;
- venda nao parece confiavel.

