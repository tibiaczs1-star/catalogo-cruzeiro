export const HUD_WIDGET_IDS = ['summary', 'map', 'inventory', 'companies', 'sync'];

export const DEFAULT_HUD_PREFERENCES = Object.freeze({
  theme: 'light',
  density: 'comfortable',
  motion: 'full',
  widgetOrder: HUD_WIDGET_IDS,
  hiddenWidgets: [],
});

const STORAGE_KEY = 'angel-hud-preferences';
const choice = (value, allowed, fallback) => allowed.includes(value) ? value : fallback;

export function normalizeWidgetOrder(order = []) {
  const known = [...new Set(Array.isArray(order) ? order.filter((id) => HUD_WIDGET_IDS.includes(id)) : [])];
  return [...known, ...HUD_WIDGET_IDS.filter((id) => !known.includes(id))];
}

export function normalizeHudPreferences(value = {}) {
  const hiddenWidgets = [...new Set(Array.isArray(value.hiddenWidgets)
    ? value.hiddenWidgets.filter((id) => HUD_WIDGET_IDS.includes(id))
    : [])];
  return {
    theme: choice(value.theme, ['light', 'dark'], DEFAULT_HUD_PREFERENCES.theme),
    density: choice(value.density, ['comfortable', 'compact'], DEFAULT_HUD_PREFERENCES.density),
    motion: choice(value.motion, ['full', 'reduced'], DEFAULT_HUD_PREFERENCES.motion),
    widgetOrder: normalizeWidgetOrder(value.widgetOrder),
    hiddenWidgets,
  };
}

export function getHudPreferences(storage = globalThis.localStorage) {
  try {
    return normalizeHudPreferences(JSON.parse(storage?.getItem(STORAGE_KEY) || '{}'));
  } catch {
    return normalizeHudPreferences();
  }
}

export function saveHudPreferences(value, storage = globalThis.localStorage) {
  const preferences = normalizeHudPreferences(value);
  try { storage?.setItem(STORAGE_KEY, JSON.stringify(preferences)); } catch {}
  return preferences;
}

export function applyHudPreferences(value, documentObject = globalThis.document) {
  const preferences = normalizeHudPreferences(value);
  const html = documentObject?.documentElement;
  if (!html) return preferences;
  html.dataset.theme = preferences.theme;
  html.dataset.density = preferences.density;
  html.dataset.motion = preferences.motion;
  const themeMeta = documentObject.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.content = preferences.theme === 'dark' ? '#0b1220' : '#f5f8ff';
  return preferences;
}

export function moveHudWidget(order, draggedId, targetId) {
  const normalized = normalizeWidgetOrder(order);
  if (draggedId === targetId || !normalized.includes(draggedId) || !normalized.includes(targetId)) return normalized;
  const next = normalized.filter((id) => id !== draggedId);
  next.splice(next.indexOf(targetId), 0, draggedId);
  return next;
}

export function bindHudPersonalization(root, options = {}) {
  const storage = options.storage ?? globalThis.localStorage;
  const documentObject = options.documentObject ?? globalThis.document;
  const dashboard = root.querySelector('.operations-dashboard');
  if (!dashboard) return null;
  let preferences = getHudPreferences(storage);
  let draggedId = '';

  const widgets = () => [...dashboard.querySelectorAll('[data-hud-widget]')];
  const setPressed = (selector, current) => dashboard.querySelectorAll(selector).forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.hudTheme === current || button.dataset.hudDensity === current || button.dataset.hudMotion === current));
  });
  const arrange = () => {
    const grid = dashboard.querySelector('[data-hud-grid]');
    if (!grid) return;
    preferences.widgetOrder.forEach((id) => {
      const widget = grid.querySelector(`[data-hud-widget="${id}"]`);
      if (widget) grid.append(widget);
    });
  };
  const reflect = () => {
    applyHudPreferences(preferences, documentObject);
    setPressed('[data-hud-theme]', preferences.theme);
    setPressed('[data-hud-density]', preferences.density);
    setPressed('[data-hud-motion]', preferences.motion);
    dashboard.querySelectorAll('[data-hud-visibility]').forEach((button) => {
      button.setAttribute('aria-pressed', String(!preferences.hiddenWidgets.includes(button.dataset.hudVisibility)));
    });
    widgets().forEach((widget) => {
      widget.hidden = preferences.hiddenWidgets.includes(widget.dataset.hudWidget);
    });
    arrange();
  };
  const update = (partial) => {
    preferences = saveHudPreferences({ ...preferences, ...partial }, storage);
    reflect();
  };
  const setCustomizing = (active) => {
    dashboard.classList.toggle('is-customizing', active);
    const trigger = dashboard.querySelector('[data-hud-personalize]');
    const panel = dashboard.querySelector('[data-hud-customizer]');
    if (trigger) trigger.setAttribute('aria-pressed', String(active));
    if (panel) panel.hidden = !active;
    widgets().forEach((widget) => { widget.draggable = active; });
  };

  dashboard.querySelector('[data-hud-personalize]')?.addEventListener('click', () => setCustomizing(!dashboard.classList.contains('is-customizing')));
  dashboard.querySelectorAll('[data-hud-theme]').forEach((button) => button.addEventListener('click', () => update({ theme: button.dataset.hudTheme })));
  dashboard.querySelectorAll('[data-hud-density]').forEach((button) => button.addEventListener('click', () => update({ density: button.dataset.hudDensity })));
  dashboard.querySelectorAll('[data-hud-motion]').forEach((button) => button.addEventListener('click', () => update({ motion: button.dataset.hudMotion })));
  dashboard.querySelectorAll('[data-hud-visibility]').forEach((button) => button.addEventListener('click', () => {
    const id = button.dataset.hudVisibility;
    const hiddenWidgets = preferences.hiddenWidgets.includes(id)
      ? preferences.hiddenWidgets.filter((widgetId) => widgetId !== id)
      : [...preferences.hiddenWidgets, id];
    update({ hiddenWidgets });
  }));
  dashboard.querySelector('[data-hud-reset]')?.addEventListener('click', () => {
    update({ ...DEFAULT_HUD_PREFERENCES, widgetOrder: [...HUD_WIDGET_IDS] });
  });
  dashboard.querySelectorAll('[data-hud-move]').forEach((button) => button.addEventListener('click', () => {
    const widget = button.closest('[data-hud-widget]');
    const current = preferences.widgetOrder.indexOf(widget?.dataset.hudWidget);
    const offset = button.dataset.hudMove === 'previous' ? -1 : 1;
    const target = Math.max(0, Math.min(preferences.widgetOrder.length - 1, current + offset));
    if (current < 0 || current === target) return;
    const next = [...preferences.widgetOrder];
    [next[current], next[target]] = [next[target], next[current]];
    update({ widgetOrder: next });
  }));
  widgets().forEach((widget) => {
    widget.addEventListener('dragstart', (event) => {
      if (!dashboard.classList.contains('is-customizing')) { event.preventDefault(); return; }
      draggedId = widget.dataset.hudWidget;
      widget.classList.add('is-dragging');
      event.dataTransfer?.setData('text/plain', draggedId);
      if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
    });
    widget.addEventListener('dragover', (event) => {
      if (!draggedId) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    });
    widget.addEventListener('drop', (event) => {
      event.preventDefault();
      if (draggedId) update({ widgetOrder: moveHudWidget(preferences.widgetOrder, draggedId, widget.dataset.hudWidget) });
    });
    widget.addEventListener('dragend', () => {
      widgets().forEach((item) => item.classList.remove('is-dragging'));
      draggedId = '';
    });
  });

  reflect();
  setCustomizing(false);
  return { get preferences() { return preferences; }, update, setCustomizing };
}
