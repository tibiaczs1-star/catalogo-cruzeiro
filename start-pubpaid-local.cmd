@echo off
cd /d "C:\Users\junio\projeto codex"
echo PubPaid 2.0 local server
echo URL: http://127.0.0.1:4188/pubpaid-v2.html
python -m http.server 4188 --bind 127.0.0.1
