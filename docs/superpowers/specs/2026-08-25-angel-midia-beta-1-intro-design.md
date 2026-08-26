# Angel Mídia Play Beta 1.0 — Intro e acesso

## Objetivo

Transformar a entrada do painel em uma abertura curta de aplicativo, mantendo o acesso rápido e a identidade sólida azul e branca da Angel Mídia.

## Direção aprovada

- Intro própria da Angel Mídia, sem referências a porteira, rancho ou outro site.
- Tela cheia por cerca de 2 segundos, com logomarca real, selo `BETA 1.0` e a mensagem `Sua rede vai entrar no ar`.
- Três sinais operacionais em sequência: Mídias, Playlists e TVs.
- Botão `Entrar agora` para pular imediatamente.
- A intro aparece uma vez por sessão; o login fica disponível em seguida.
- Pessoas com movimento reduzido não recebem a animação.
- No formulário, a marca real substitui o bloco estático `AM` e recebe movimento discreto de sinal e transmissão.
- Cores sólidas, sem gradientes; azul Angel, branco e azul-marinho.

## Acessibilidade e desempenho

- A intro é decorativa para a autenticação e nunca bloqueia permanentemente o formulário.
- O botão de pular é operável por teclado.
- O foco vai para o campo de usuário após a saída.
- A marca usa o PNG já existente e efeitos CSS leves, sem vídeo ou download adicional.
- `prefers-reduced-motion: reduce` remove a abertura automaticamente.

## Critérios de aceite

1. A primeira abertura da sessão mostra a intro e os três estágios.
2. Pular ou concluir registra a sessão e remove a camada.
3. Reabrir o login na mesma sessão não repete a intro.
4. O formulário exibe a logomarca Angel Mídia animada e mantém o olho de senha funcional.
5. A versão visível e os arquivos públicos identificam `Beta 1.0`.
