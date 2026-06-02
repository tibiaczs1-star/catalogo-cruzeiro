from pathlib import Path
import json, re, time
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright

BASE = 'https://catalogo-cruzeiro-web.onrender.com/'
OUT = Path('C:/Users/junio/projeto codex/reports/czs-render-diagnostic')
(OUT / 'screenshots').mkdir(parents=True, exist_ok=True)
CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
PAGES = [
    ('home', BASE),
    ('catalogo-servicos', urljoin(BASE, 'catalogo-servicos.html')),
    ('arquivo', urljoin(BASE, 'arquivo.html')),
    ('divulgue', urljoin(BASE, 'divulgue.html')),
    ('noticia-rio-jurua', urljoin(BASE, 'noticia.html?slug=rio-jurua-esta-proximo-de-sair-da-cota-de-transbordamento-em-cruzeiro-do-sul')),
    ('cheffe-call', urljoin(BASE, 'cheffe-call.html')),
    ('galeria', urljoin(BASE, 'galeria.html')),
    ('fontes-monitoradas', urljoin(BASE, 'fontes-monitoradas.html')),
    ('legal', urljoin(BASE, 'legal.html')),
]
results = []
interactions = []


def summarize_page(page, name, url, viewport):
    logs = []
    failures = []
    bad_responses = []
    page.on('console', lambda msg: logs.append({'type': msg.type, 'text': msg.text[:500]}))
    def _request_failed(req):
        failure = req.failure
        if isinstance(failure, str):
            reason = failure
        elif failure:
            reason = getattr(failure, 'error_text', str(failure))
        else:
            reason = 'failed'
        failures.append({'url': req.url, 'failure': reason})
    page.on('requestfailed', _request_failed)
    page.on('response', lambda resp: bad_responses.append({'url': resp.url, 'status': resp.status}) if resp.status >= 400 else None)
    t0 = time.time()
    err = None
    status = None
    try:
        resp = page.goto(url, wait_until='domcontentloaded', timeout=45000)
        status = resp.status if resp else None
        try:
            page.wait_for_load_state('networkidle', timeout=10000)
        except Exception:
            pass
    except Exception as e:
        err = repr(e)
    elapsed = round((time.time() - t0) * 1000)
    page.wait_for_timeout(800)
    title = page.title()
    text = page.locator('body').inner_text(timeout=8000)[:8000] if page.locator('body').count() else ''
    h1 = [x.strip() for x in page.locator('h1').all_inner_texts()]
    links = page.locator('a').count()
    buttons = page.locator('button').count()
    inputs = page.locator('input, textarea, select').count()
    imgs = page.locator('img').count()
    img_missing_alt = page.locator('img:not([alt])').count()
    headings = []
    for sel in ['h1', 'h2', 'h3']:
        try:
            headings += [x.strip() for x in page.locator(sel).all_inner_texts() if x.strip()][:12]
        except Exception:
            pass
    selector_counts = {}
    for sel in ['article', '.card', '.news-card', '.service-card', '.story-card', '.archive-card', '.catalog-card', '[data-category]', 'form', 'video', 'iframe']:
        try:
            selector_counts[sel] = page.locator(sel).count()
        except Exception:
            pass
    screenshot = str((OUT / 'screenshots' / f'{name}-{viewport}.png').resolve())
    try:
        page.screenshot(path=screenshot, full_page=True, timeout=30000)
    except Exception as e:
        screenshot = 'SCREENSHOT_ERR ' + repr(e)
    return {
        'name': name,
        'url': url,
        'viewport': viewport,
        'status': status,
        'error': err,
        'elapsed_ms': elapsed,
        'title': title,
        'h1': h1,
        'links': links,
        'buttons': buttons,
        'inputs': inputs,
        'imgs': imgs,
        'img_missing_alt': img_missing_alt,
        'headings': headings[:20],
        'selector_counts': selector_counts,
        'bad_responses': bad_responses[:30],
        'request_failures': failures[:20],
        'console': logs[:50],
        'text_sample': text[:1800],
        'screenshot': screenshot,
    }


def try_interactions(ctx, viewport_name):
    # Home interactions
    page = ctx.new_page()
    logs = []
    page.on('console', lambda msg: logs.append({'type': msg.type, 'text': msg.text[:300]}))
    page.goto(BASE, wait_until='domcontentloaded', timeout=45000)
    page.wait_for_timeout(1000)
    inter = {'viewport': viewport_name, 'page': 'home', 'actions': []}
    for placeholder in ['Buscar', 'busca', 'Pesquisar', 'O que você procura']:
        try:
            loc = page.locator(f'input[placeholder*="{placeholder}" i]').first
            if loc.count():
                loc.fill('saúde')
                page.keyboard.press('Enter')
                page.wait_for_timeout(1000)
                inter['actions'].append({'action': 'home search enter saúde', 'url_after': page.url, 'visible_text': page.locator('body').inner_text(timeout=5000)[:500]})
                break
        except Exception as e:
            inter['actions'].append({'action': 'home search', 'error': repr(e)})
    for label in ['Menu', 'Abrir menu', '☰']:
        try:
            b = page.get_by_role('button', name=re.compile(label, re.I)).first
            if b.count() and b.is_visible():
                b.click(timeout=5000)
                page.wait_for_timeout(500)
                inter['actions'].append({'action': 'click menu', 'success': True, 'body_sample': page.locator('body').inner_text(timeout=5000)[:600]})
                break
        except Exception:
            pass
    inter['console'] = logs
    interactions.append(inter)
    page.close()

    # Services catalog search
    page = ctx.new_page()
    logs = []
    page.on('console', lambda msg: logs.append({'type': msg.type, 'text': msg.text[:300]}))
    page.goto(urljoin(BASE, 'catalogo-servicos.html'), wait_until='domcontentloaded', timeout=45000)
    page.wait_for_timeout(1000)
    inter = {'viewport': viewport_name, 'page': 'catalogo-servicos', 'actions': []}
    try:
        inputs = page.locator('input[type="search"], input[placeholder*="buscar" i], input[placeholder*="serv" i], input')
        if inputs.count():
            inputs.first.fill('farmacia')
            page.wait_for_timeout(800)
            inter['actions'].append({'action': 'fill search farmacia', 'url_after': page.url, 'text_sample': page.locator('body').inner_text(timeout=5000)[:800]})
        else:
            inter['actions'].append({'action': 'fill search farmacia', 'result': 'no input found'})
    except Exception as e:
        inter['actions'].append({'action': 'catalog search', 'error': repr(e)})
    interactions.append({**inter, 'console': logs})
    page.close()

    # Archive search
    page = ctx.new_page()
    logs = []
    page.on('console', lambda msg: logs.append({'type': msg.type, 'text': msg.text[:300]}))
    page.goto(urljoin(BASE, 'arquivo.html'), wait_until='domcontentloaded', timeout=45000)
    page.wait_for_timeout(1000)
    inter = {'viewport': viewport_name, 'page': 'arquivo', 'actions': []}
    try:
        inputs = page.locator('input[type="search"], input[placeholder*="buscar" i], input')
        if inputs.count():
            inputs.first.fill('rio')
            page.wait_for_timeout(800)
            inter['actions'].append({'action': 'fill archive search rio', 'url_after': page.url, 'text_sample': page.locator('body').inner_text(timeout=5000)[:800]})
        else:
            inter['actions'].append({'action': 'fill archive search rio', 'result': 'no input found'})
    except Exception as e:
        inter['actions'].append({'action': 'archive search', 'error': repr(e)})
    interactions.append({**inter, 'console': logs})
    page.close()


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=CHROME, args=['--no-sandbox', '--disable-dev-shm-usage'])
    for viewport_name, viewport in [('desktop', {'width': 1366, 'height': 900}), ('mobile', {'width': 390, 'height': 844})]:
        ctx = browser.new_context(viewport=viewport, device_scale_factor=1, is_mobile=(viewport_name == 'mobile'), has_touch=(viewport_name == 'mobile'), locale='pt-BR', user_agent='Mozilla/5.0 Hermes QA')
        for name, url in PAGES:
            page = ctx.new_page()
            results.append(summarize_page(page, name, url, viewport_name))
            page.close()
        try_interactions(ctx, viewport_name)
        ctx.close()
    browser.close()

summary = {'generated_at': time.strftime('%Y-%m-%d %H:%M:%S'), 'base': BASE, 'results': results, 'interactions': interactions}
(OUT / 'raw-playwright-results.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8')
compact = []
for r in results:
    compact.append({k: r[k] for k in ['name', 'viewport', 'status', 'elapsed_ms', 'title', 'h1', 'links', 'buttons', 'inputs', 'imgs', 'img_missing_alt', 'selector_counts', 'bad_responses', 'request_failures', 'console', 'screenshot']})
print(json.dumps({'out': str(OUT.resolve()), 'pages_tested': len(results), 'compact': compact, 'interactions': interactions}, ensure_ascii=False, indent=2)[:50000])
