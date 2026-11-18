(() => {
  const root = document.documentElement;
  const options = {largeText:'data-large-text', highContrast:'data-high-contrast'};
  const toggles = [...document.querySelectorAll('[data-accessibility]')];
  for (const [id, attribute] of Object.entries(options)) {
    const controls = toggles.filter(toggle => toggle.dataset.accessibility === id);
    const apply = checked => {
      root.toggleAttribute(attribute, checked);
      controls.forEach(toggle => { toggle.checked = checked; });
    };
    const key = 'escolaVivaA11y.' + id;
    try { apply(localStorage.getItem(key) === '1'); } catch { apply(false); }
    controls.forEach(toggle => toggle.addEventListener('change', () => {
      apply(toggle.checked);
      try { localStorage.setItem(key, toggle.checked ? '1' : '0'); } catch {}
    }));
  }
})();

