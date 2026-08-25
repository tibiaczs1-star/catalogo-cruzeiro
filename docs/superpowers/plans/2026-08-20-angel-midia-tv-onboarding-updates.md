# Angel Midia Play - cadastro inicial e atualizacoes da TV

**Objetivo:** fazer cada APK TV pedir nome do aparelho e local somente na primeira abertura, registrar a TV no servidor e definir a politica de atualizacao durante essa instalacao.

## Entrega imediata

- Tela nativa, legivel a distancia, com nome da TV, local/endereco e opcao de atualizacao automatica.
- Identificador de instalacao persistente; reabrir o aplicativo nao repete o cadastro.
- Ativacao na API e exibicao do codigo `AMP-XXXXXX` para vinculo no painel.
- Coordenadas opcionais no cadastro inicial, pois sticks/TVs normalmente nao possuem GPS; o marcador pode ser ajustado depois no painel.
- Politica explicita: silenciosa apenas em aparelho gerenciado (Device Owner); em Android comum o download pode ser automatico, mas a confirmacao final pertence ao sistema operacional.

## Verificacao

- Testes unitarios da validacao do cadastro e da politica de atualizacao.
- Testes da API aceitando local sem coordenadas e rejeitando coordenadas incompletas.
- Build e inspecao dos APKs antes de substituir os downloads publicos.

