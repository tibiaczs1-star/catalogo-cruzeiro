# Prompt operacional seguro — Cheffe Call popup e pendências

Context Capsule:
- Identidade: Rayxpx/Hermes Matrix Core operando para Junior Play no Projeto Codex.
- Workspace: `C:/Users/junio/projeto codex`.
- Escopo: Cheffe Call, popup de acesso Full Admin, fila de prompt/ordem e validação local reversível.
- Arquivos principais: `cheffe-call.html`, `cheffe-call.js`, `cheffe-call.css`, `server.js`, `data/cheffe-call-state.json`, `docs/cheffe-call-181-prompts.json`.
- Proibido: expor senha/token, publicar/deployar/pushar sem aprovação, apagar dados, mexer em PubPaid/jogo/CZS fora do necessário.
- Gates: R0 observar, R1 organizar, R2 validar, R3 corrigir local reversível. R4/R5 parar antes de efeito externo.
- Validação esperada: sintaxe JS, servidor local, navegador real, console sem erro crítico e evidência visual/DOM do popup.

Missão:
1. Confirmar causa provável do popup não aparecer: senha Full Admin lembrada em `sessionStorage` fechava automaticamente o modal na inicialização, antes de validação humana, deixando o usuário sem o popup esperado.
2. Corrigir sem quebrar fluxo: o popup deve aparecer sempre ao abrir a Cheffe Call; se houver senha lembrada, ela pode ficar pré-preenchida, mas o usuário precisa clicar `Entrar` para validar e seguir.
3. Não salvar senha inválida nem fechar modal antes da API confirmar sucesso.
4. Manter `postCall` armazenando senha somente depois de resposta OK.
5. Se senha falhar, limpar senha lembrada, campo rápido e campo do formulário, e manter popup aberto com mensagem de erro.
6. Rodar verificação real:
   - `node --check cheffe-call.js && node --check server.js`
   - subir `node server.js` local
   - abrir `/cheffe-call.html`
   - testar estado sem senha em sessionStorage: modal visível, status pedindo senha
   - testar estado com senha fake em sessionStorage: modal continua visível, status pede clique para validar; ao clicar, erro limpa storage e mantém modal
7. Reportar só evidência real: comandos, status HTTP/DOM/console, arquivos alterados.

Pendências a fechar:
- Popup de acesso não aparecer quando senha estava lembrada.
- Senha ser salva/lembrada antes de validação bem-sucedida em `postCall`/submit.
- Falha de senha não limpar campo do popup.
- Prompt operacional documentado para repetir/continuar a correção sem segredos.

Resultado esperado:
- `cheffe-call.js` alterado localmente.
- Este arquivo de prompt criado em `docs/superpowers/plans/cheffe-call-popup-operational-prompt-2026-06-01.md`.
- Validação local concluída sem deploy/push.
