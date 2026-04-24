@echo off
title PubPaid 2.0 - servidor local
cd /d "C:\Users\junio\projeto codex"
set REAL_AGENTS_AUTO_RUN_DISABLED=true
set NODE_EXE=C:\Program Files\nodejs\node.exe
echo.
echo PubPaid 2.0 - JOGO LOCAL
echo.
echo Pasta: %CD%
echo Node: %NODE_EXE%
echo.
echo Servidor: http://127.0.0.1:3000/pubpaid-v2.html
echo.
echo Deixe esta janela aberta enquanto joga.
echo Se aparecer "online", volte ao navegador e atualize com Ctrl+F5.
echo.
if not exist "%NODE_EXE%" (
  echo ERRO: Node nao encontrado em "%NODE_EXE%".
  echo Instale Node.js ou ajuste o caminho no arquivo ABRIR_PUBPAID_2_LOCAL.cmd.
  pause
  exit /b 1
)
"%NODE_EXE%" server.js
echo.
echo O servidor parou. Pressione qualquer tecla para fechar.
pause
