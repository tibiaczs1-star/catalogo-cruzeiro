@echo off
title PubPaid 2.0 - servidor estatico
cd /d "C:\Users\junio\projeto codex"
echo.
echo PubPaid 2.0 - SERVIDOR ESTATICO
echo.
echo URL: http://127.0.0.1:4188/pubpaid-v2.html
echo.
echo Deixe esta janela aberta enquanto joga.
echo.
python -m http.server 4188 --bind 127.0.0.1
echo.
echo O servidor parou. Pressione qualquer tecla para fechar.
pause >nul
