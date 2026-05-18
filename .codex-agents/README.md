# Real Agents Runtime

Sistema local que transforma os agentes dos escritorios em agentes reais do projeto.

## O que existe aqui

- `registry.json`: cadastro consolidado de todos os agentes reais.
- `agents/`: manifesto individual de cada agente, com papel, capacidades e prompt de trabalho.
- `game-director-system/`: hierarquia separada para jogos, com Diretor do Jogo,
  subagentes, prompt mestre, fluxo e estudo inicial.
- `.codex-temp/real-agents/latest-run.json`: fila operacional mais recente.
- `.codex-temp/real-agents/latest-run.md`: leitura humana da rodada mais recente.

## Regra de separacao

Jogo e jogo, jornal e jornal. A equipe de jogos pode usar conhecimento tecnico do
Escritorio Nerd, mas nao deve puxar regras editoriais, homepage, cards, CZS ou
agentes de noticia sem pedido explicito.

## Como rodar

```bash
npm run agents:run
```

## O que a rodada faz

1. carrega os agentes dos escritorios;
2. materializa cada um em manifesto proprio;
3. le as noticias e os relatórios locais do jornal;
4. distribui uma tarefa real de monitoramento/ideia por agente;
5. gera uma fila operacional auditavel.
