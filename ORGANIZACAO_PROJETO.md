# Organização aplicada na pasta

## Limpeza feita agora

- Removidos da raiz arquivos locais que não fazem parte do site:
  - `openclaude-ollama.ps1`
  - `organizar_e_limpar_pc.ps1`
  - `organizar_para_hd.ps1`
  - `desativar_inicializacao_opcional.ps1`

## Proteção para não sujar de novo

- Criado `.gitignore` para bloquear arquivos locais de manutenção e diagnóstico:
  - `dxdiag_gpu.txt`
  - scripts locais `.ps1` acima

## Estrutura de deploy (Render)

- Site/API principal:
  - `server.js` (raiz) **ou** `backend/server.js` (quando backend estiver 100% no repositório)
- Configuração Render:
  - preferencialmente usar comandos simples do root enquanto finalizamos a publicação:
    - Build: `npm install`
    - Start: `node server.js`

