/* ============================================================
   BADCLAUDE — formulário de contato → backend
   Qualquer <form data-lead> vira um POST para /api/leads.
   Se o servidor não estiver rodando (site aberto via file://),
   cai automaticamente para o WhatsApp com a mensagem preenchida.
   ============================================================ */

(function () {
  const API = (window.BADCLAUDE_API || '/badclaude') + '/api/leads';
  const WA = (window.SITE_CONFIG && window.SITE_CONFIG.whatsapp) || '5568999999999';

  function say(form, text, kind) {
    let box = form.querySelector('.lead-msg');
    if (!box) {
      box = document.createElement('p');
      box.className = 'lead-msg';
      box.setAttribute('role', 'status');
      box.style.cssText = 'margin:12px 0 0;font-size:13px;line-height:1.5';
      form.appendChild(box);
    }
    box.style.color = kind === 'ok' ? '#10b981' : kind === 'err' ? '#ef4444' : 'inherit';
    box.textContent = text;
  }

  async function submit(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    const payload = {
      name: data.name || data.nome || '',
      contact: data.contact || data.email || data.telefone || data.whatsapp || '',
      message: data.message || data.mensagem || '',
      plan: data.plan || data.plano || '',
      direction: form.dataset.direction || document.documentElement.dataset.direction || '',
      lang: (window.BadLang && window.BadLang.get()) || 'pt',
      page: location.pathname,
    };
    if (!payload.name || !payload.contact) {
      say(form, 'Preencha nome e contato.', 'err');
      return;
    }
    const btn = form.querySelector('button[type=submit], button');
    if (btn) { btn.dataset.label = btn.textContent; btn.disabled = true; btn.textContent = 'Enviando…'; }
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || 'falha no envio');
      say(form, 'Recebido! Respondemos em até 1 dia útil.', 'ok');
      form.reset();
    } catch (err) {
      // fallback: WhatsApp com mensagem pronta (também cobre file://)
      var offline = location.protocol === 'file:' || !navigator.onLine;
      const text = `Olá! Sou ${payload.name} (${payload.contact}). ${payload.message}`;
      const url = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text);
      say(form, 'Servidor offline — abrindo o WhatsApp como alternativa.', 'err');
      window.open(url, '_blank', 'noopener');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || 'Enviar'; }
    }
  }

  function boot() {
    document.querySelectorAll('form[data-lead]').forEach((form) => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        submit(form);
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();