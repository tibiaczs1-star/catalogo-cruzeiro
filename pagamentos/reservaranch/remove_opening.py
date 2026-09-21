with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Remove opening screen section + iframe
old = '''    <section class="opening-screen" id="opening-screen" aria-label="Abertura Arizona Ranch">
      <div class="opening-image" aria-hidden="true"></div>
      <div class="opening-vignette" aria-hidden="true"></div>
      <div class="opening-content">
        <p class="eyebrow">Inauguração oficial · 05 de setembro</p>
        <h1>Reserve sua mesa.</h1>
        <p>Escolha a mesa e finalize sua reserva.</p>
        <div class="opening-progress" aria-label="Carregando experiência"><span id="opening-progress"></span></div>
        <button class="button button-gold" id="start-experience" type="button" disabled>Preparando a experiência…</button>
        <p class="copyright-notice sr-only">Trilha incorporada do YouTube: "Marília Mendonça Ao Vivo" — Marília Mendonça. Todos os direitos reservados aos titulares.</p>
      </div>
    </section>
    <iframe id="opening-player" class="opening-player" title="Trilha oficial incorporada do YouTube" allow="autoplay; encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin"></iframe>

'''

html = html.replace(old, '')

# Remove is-opening class from body
html = html.replace('class="is-opening"', '')

# Remove opening-related element refs from JS elements object
js = js.replace('    opening: document.querySelector("#opening-screen"), openingButton: document.querySelector("#start-experience"), openingPlayer: document.querySelector("#opening-player"), openingProgress: document.querySelector("#opening-progress"),\n', '')

# Remove YouTube constant
js = js.replace('  const YOUTUBE_VIDEO_ID = "CxKRaR6kFYs";\n', '')

# Remove startExperience function
start = js.find('  function startExperience() {\n')
end = js.find('  function setupOpening() {\n')
if start >= 0 and end >= 0:
    js = js[:start] + js[end:]
    print('OK: startExperience removed')

# Remove setupOpening function
start = js.find('  function setupOpening() {\n')
end = js.find('\n  function togglePixInfo()')
if start >= 0 and end >= 0:
    js = js[:start] + js[end:]
    print('OK: setupOpening removed')

# Remove opening button event listener
js = js.replace('elements.openingButton.addEventListener("click", startExperience);\n', '')

# Remove sendPlayerCommand function
start = js.find('  function sendPlayerCommand(')
end = js.find('\n  function startExperience()')
if start >= 0 and end >= 0:
    js = js[:start] + js[end:]
    print('OK: sendPlayerCommand removed')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)

print('=== VERIFICATION ===')
print('HTML has opening-screen:', 'opening-screen' in html)
print('HTML has is-opening:', 'is-opening' in html)
print('JS has setupOpening:', 'setupOpening' in js)
print('JS has startExperience:', 'startExperience' in js)
print('JS has openingProgress:', 'openingProgress' in js)
print('JS has YOUTUBE_VIDEO_ID:', 'YOUTUBE_VIDEO_ID' in js)
