# Current State

Updated: 2026-04-30T23:39:13.225Z

## Active Goal

- Home mais rapida, hero diversificado e Tendencias abastecido

## Summary

Rodada aplicou preload de /api/news antes dos scripts pesados, invalidou cache diario do hero quando NEWS_DATA muda, religou rotacao do destaque principal mesmo com cards de topicos e adicionou fallback de Tendencias baseado em sinais sociais reais de Instagram/X/Facebook quando nao ha materia perfeitamente ligada.

## Next

- Commitar/deployar se aprovado; em producao conferir cache-bust script.js?v=20260430-hero-trends-speed1 e reiniciar Render para carregar server atual se necessario.
