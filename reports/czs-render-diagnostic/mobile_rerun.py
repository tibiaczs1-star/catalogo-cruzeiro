from pathlib import Path
import json, time
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright
BASE='https://catalogo-cruzeiro-web.onrender.com/'
OUT=Path('C:/Users/junio/projeto codex/reports/czs-render-diagnostic')
(OUT/'screenshots').mkdir(parents=True, exist_ok=True)
PAGES=[('home',BASE),('catalogo-servicos',urljoin(BASE,'catalogo-servicos.html')),('arquivo',urljoin(BASE,'arquivo.html')),('divulgue',urljoin(BASE,'divulgue.html'))]
rows=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path='C:/Program Files/Google/Chrome/Application/chrome.exe')
    ctx=browser.new_context(viewport={'width':390,'height':844}, is_mobile=True, has_touch=True, locale='pt-BR', user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1')
    for name,url in PAGES:
        page=ctx.new_page(); logs=[]; bad=[]
        page.on('console', lambda m: logs.append({'type':m.type,'text':m.text[:200]}))
        page.on('response', lambda r: bad.append({'url':r.url,'status':r.status}) if r.status>=400 else None)
        t=time.time(); err=None; status=None
        try:
            resp=page.goto(url, wait_until='domcontentloaded', timeout=45000); status=resp.status if resp else None
            page.wait_for_timeout(1800)
        except Exception as e: err=repr(e)
        body=page.locator('body').inner_text(timeout=5000)[:800] if page.locator('body').count() else ''
        shot=str((OUT/'screenshots'/f'{name}-mobile-rerun.png').resolve())
        try: page.screenshot(path=shot, full_page=True, timeout=30000)
        except Exception as e: shot='ERR '+repr(e)
        rows.append({'name':name,'status':status,'ms':round((time.time()-t)*1000),'title':page.title(),'h1':page.locator('h1').all_inner_texts()[:3],'inputs':page.locator('input').count(),'buttons':page.locator('button').count(),'bad':bad[:10],'console':logs[:10],'body':body,'screenshot':shot,'error':err})
        page.close(); time.sleep(0.7)
    ctx.close(); browser.close()
(OUT/'mobile-rerun.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(rows,ensure_ascii=False,indent=2))
