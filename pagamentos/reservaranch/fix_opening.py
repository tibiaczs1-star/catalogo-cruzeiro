with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

old = '''function setupOpening() { let progress = 0; const timer = window.setInterval(() => { progress = Math.min(100, progress + (progress < 72 ? 8 : 2)); elements.openingProgress.style.width = `${progress}%`; if (progress === 100) { window.clearInterval(timer); elements.openingButton.disabled = false; elements.openingButton.textContent = "Reservar mesa"; } }, 85); }'''

new = '''function setupOpening() {
    let progress = 0;
    const timer = window.setInterval(() => {
      progress = Math.min(100, progress + (progress < 72 ? 8 : 2));
      elements.openingProgress.style.width = `${progress}%`;
      if (progress === 100) {
        window.clearInterval(timer);
        elements.openingButton.disabled = false;
        elements.openingButton.textContent = "Reservar mesa";
      }
    }, 85);
    setTimeout(() => {
      if (elements.openingButton.disabled) {
        elements.openingButton.disabled = false;
        elements.openingButton.textContent = "Reservar mesa";
        elements.openingProgress.style.width = "100%";
      }
    }, 4000);
  }'''

if old in js:
    js = js.replace(old, new)
    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(js)
    print('OK: failsafe added')
else:
    print('ERROR: old string not found')
    # Try to find it
    idx = js.find('function setupOpening')
    print(repr(js[idx:idx+300]))
