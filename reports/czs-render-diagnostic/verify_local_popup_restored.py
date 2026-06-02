from pathlib import Path
import json
import time
from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:3198/'
OUT = Path('C:/Users/junio/projeto codex/reports/czs-render-diagnostic/popup-restored-verification')
OUT.mkdir(parents=True, exist_ok=True)
CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'

def inspect_page(page, name, url, popup_selector, wait_ms):
    logs = []
    errors = []
    bad = []
    page.on('console', lambda msg: logs.append({'type': msg.type, 'text': msg.text[:500]}))
    page.on('pageerror', lambda err: errors.append(str(err)[:800]))
    page.on('response', lambda resp: bad.append({'url': resp.url, 'status': resp.status}) if resp.status >= 400 else None)
    response = page.goto(url, wait_until='domcontentloaded', timeout=30000)
    try:
        page.wait_for_selector(f'{popup_selector}.is-visible, {popup_selector}', state='attached', timeout=wait_ms)
    except Exception:
        pass
    try:
        page.wait_for_selector(f'{popup_selector}.is-visible', state='visible', timeout=wait_ms)
    except Exception:
        pass
    popup = page.locator(popup_selector)
    visible_count = False
    popup_state = {}
    try:
        visible_count = bool(popup.count() and popup.first.is_visible())
        popup_state = page.evaluate("""(selector) => {
          const el = document.querySelector(selector);
          if (!el) return { exists: false };
          const cs = getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return {
            exists: true,
            hidden: el.hidden,
            className: el.className,
            display: cs.display,
            opacity: cs.opacity,
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          };
        }""", popup_selector)
    except Exception as error:
        popup_state = {'error': repr(error)}
    screenshot = OUT / f'{name}.png'
    page.screenshot(path=str(screenshot), full_page=False, timeout=20000)
    return {
        'name': name,
        'url': url,
        'status': response.status if response else None,
        'title': page.title(),
        'popup_selector': popup_selector,
        'popup_count': popup.count(),
        'popup_visible': bool(visible_count),
        'popup_state': popup_state,
        'body_class': page.locator('body').get_attribute('class') or '',
        'console': logs[:20],
        'page_errors': errors,
        'bad_responses': bad[:20],
        'screenshot': str(screenshot)
    }

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=CHROME, args=['--no-sandbox', '--disable-dev-shm-usage'])
    ctx = browser.new_context(viewport={'width': 1366, 'height': 900}, locale='pt-BR')
    ctx.add_init_script("""
      try { localStorage.clear(); sessionStorage.clear(); } catch (e) {}
    """)
    home = ctx.new_page()
    home_result = inspect_page(home, 'home-popup-restored', BASE + '?popup-check=' + str(int(time.time())), '[data-home-activation-popup]', 10500)
    catalog = ctx.new_page()
    catalog_result = inspect_page(catalog, 'catalogo-servicos-popup-restored', BASE + 'catalogo-servicos.html?popup-check=' + str(int(time.time())), '[data-svc-activation-popup]', 1800)
    ctx.close()
    browser.close()

summary = {
    'generated_at': time.strftime('%Y-%m-%d %H:%M:%S'),
    'base': BASE,
    'results': [home_result, catalog_result],
    'ok': all(r['status'] == 200 and r['popup_visible'] for r in [home_result, catalog_result])
}
(OUT / 'summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(summary, ensure_ascii=False, indent=2))
raise SystemExit(0 if summary['ok'] else 1)
