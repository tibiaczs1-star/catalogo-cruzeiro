(() => {
  'use strict';
  const DURATION_MS = 5000;
  const style = document.createElement('style');
  style.textContent = `
    #school-intro {
      position: fixed;
      inset: 0;
      z-index: 10000;
      overflow: auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: safe center;
      gap: 10px;
      padding: max(18px, env(safe-area-inset-top)) 16px max(18px, env(safe-area-inset-bottom));
      background: radial-gradient(circle at 50% 24%, #cc2233 0%, #991322 48%, #410913 100%);
      color: #ffffff;
      font: 15px/1.4 'Inter', system-ui, -apple-system, sans-serif;
      text-align: center;
      transition: opacity 0.35s ease;
    }
    #school-intro.leaving {
      opacity: 0;
      pointer-events: none;
    }
    #school-intro .intro-head {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    #school-intro .intro-crest {
      width: 62px;
      height: 62px;
      object-fit: contain;
      filter: drop-shadow(0 0 18px rgba(245, 196, 91, 0.55)) drop-shadow(0 6px 14px rgba(0, 0, 0, 0.45));
    }
    #school-intro .intro-kicker {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #f5c45b;
      margin: 0;
    }
    #school-intro h1 {
      margin: 0;
      font-size: clamp(1.75rem, 5vw, 2.5rem);
      font-weight: 850;
      letter-spacing: -0.04em;
      line-height: 1.05;
      color: #ffffff;
      text-shadow: 0 3px 12px rgba(28, 3, 8, 0.45);
    }
    #school-intro .scene {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: flex-end;
      gap: clamp(6px, 2vw, 18px);
      width: min(100%, 460px);
      padding: 12px 14px 10px;
      border-radius: 22px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(0, 0, 0, 0.18) 100%);
      border: 1px solid rgba(245, 196, 91, 0.32);
      box-shadow: 0 18px 40px rgba(25, 4, 8, 0.35);
    }
    #school-intro .cadet {
      display: block;
      width: clamp(82px, 26vw, 124px);
      aspect-ratio: 260 / 420;
      flex: 0 0 auto;
      background-image: url('assets/firehouse/tres-cadetes.png?v=36');
      background-size: 300% 300%;
      background-repeat: no-repeat;
      filter: drop-shadow(0 8px 10px rgba(22, 3, 6, 0.38));
      animation: cadet-poses 1.8s steps(1, end) infinite, cadet-bob 0.9s ease-in-out infinite;
    }
    #school-intro .cadet-one { background-position-x: 0%; animation-delay: 0s, 0s; }
    #school-intro .cadet-two { background-position-x: 50%; animation-delay: -0.35s, -0.3s; }
    #school-intro .cadet-three { background-position-x: 100%; animation-delay: -0.7s, -0.6s; }
    @keyframes cadet-poses {
      0%, 100% { background-position-y: 0%; }
      25%, 75% { background-position-y: 50%; }
      50% { background-position-y: 100%; }
    }
    @keyframes cadet-bob {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }
    #school-intro .progress-wrap {
      width: min(100%, 340px);
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 2px;
    }
    #school-intro .progress-track {
      width: 100%;
      height: 8px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.22);
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.16);
    }
    #school-intro .progress-fill {
      width: 100%;
      height: 100%;
      transform-origin: left center;
      transform: scaleX(0);
      background: linear-gradient(90deg, #f5c45b 0%, #ffe6a1 100%);
      animation: intro-load ${DURATION_MS}ms linear forwards;
    }
    @keyframes intro-load {
      from { transform: scaleX(0); }
      to { transform: scaleX(1); }
    }
    #school-intro [role="status"] {
      margin: 0;
      font-size: 13px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.92);
    }
    #school-intro .intro-sound-btn {
      position: fixed;
      top: max(16px, env(safe-area-inset-top));
      right: max(16px, env(safe-area-inset-right));
      z-index: 2;
      width: 44px;
      height: 44px;
      padding: 0;
      display: grid;
      place-items: center;
      border-radius: 999px;
      border: 1px solid rgba(245, 196, 91, 0.55);
      background: rgba(25, 4, 10, 0.42);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      color: #ffffff;
      cursor: pointer;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.28);
      transition: transform 0.16s ease, background 0.16s ease;
    }
    #school-intro .intro-sound-btn:hover {
      background: rgba(25, 4, 10, 0.65);
      transform: scale(1.04);
    }
    #school-intro .intro-sound-btn[aria-pressed="true"] {
      border-color: rgba(255, 255, 255, 0.35);
      color: rgba(255, 255, 255, 0.8);
    }
    @media (prefers-reduced-motion: reduce) {
      #school-intro .cadet {
        animation: none;
        background-position-y: 100%;
        transform: none;
      }
      #school-intro .progress-fill {
        animation: none;
        transform: scaleX(1);
      }
    }
  `;
  document.head.append(style);

  const ICON_SOUND_ON = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
  const ICON_SOUND_OFF = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';

  const overlay = document.createElement('section');
  overlay.id = 'school-intro';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Abertura do Dom Pedro II Voice');
  overlay.innerHTML = `
    <button type="button" class="intro-sound-btn" id="introSoundToggle" aria-label="Desligar som" title="Desligar som" aria-pressed="false">${ICON_SOUND_ON}</button>
    <div class="intro-head">
      <img class="intro-crest" src="assets/brand/crest-128.png" width="56" height="56" alt="Brasão do Colégio Militar Dom Pedro II">
      <p class="intro-kicker">Colégio Dom Pedro II · Campus CZS Sul</p>
      <h1>Dom Pedro II Voice</h1>
    </div>
    <div class="scene" role="img" aria-label="Três estudantes de boina vermelha em movimento enquanto o aplicativo carrega por 5 segundos.">
      <span class="cadet cadet-one"></span>
      <span class="cadet cadet-two"></span>
      <span class="cadet cadet-three"></span>
    </div>
    <div class="progress-wrap">
      <div class="progress-track" aria-hidden="true"><div class="progress-fill"></div></div>
      <p role="status">Carregando seu espaço de estudos…</p>
      <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:.08em;color:#f5c45b;">🎵 Hino Soldados do Fogo · Edição 16-bit</p>
    </div>
  `;
  document.body.prepend(overlay);

  const background = [...document.querySelectorAll('.app,.bottom,#openEmergency,.modal')].filter(element => !element.inert);
  background.forEach(element => { element.inert = true; });

  const status = overlay.querySelector('[role="status"]');
  const soundBtn = overlay.querySelector('#introSoundToggle');

  const music = new Audio('assets/abertura.wav');
  const effect = new Audio('assets/passo.wav');
  music.volume = 0.55;
  effect.volume = 0.33;
  let muted = false;
  let finished = false;
  const timers = [];

  function renderSoundState() {
    soundBtn.innerHTML = muted ? ICON_SOUND_OFF : ICON_SOUND_ON;
    soundBtn.setAttribute('aria-pressed', String(muted));
    soundBtn.setAttribute('aria-label', muted ? 'Ligar som' : 'Desligar som');
    soundBtn.setAttribute('title', muted ? 'Ligar som' : 'Desligar som');
  }

  function tryPlayMusic() {
    if (muted || finished) return;
    music.muted = false;
    music.play().catch(() => {});
  }
  tryPlayMusic();

  overlay.addEventListener('pointerdown', event => {
    if (!muted && music.paused && !event.target.closest('#introSoundToggle')) {
      tryPlayMusic();
    }
  }, { once: true });

  document.addEventListener('click', event => {
    if (!muted && !overlay.isConnected && event.target.closest('nav button,#tutorialNext,#tutorialPrevious')) {
      effect.currentTime = 0;
      effect.play().catch(() => {});
    }
  });

  function finish() {
    if (finished || !overlay.isConnected) return;
    finished = true;
    timers.forEach(clearTimeout);
    document.removeEventListener('keydown', onKeyDown);
    music.pause();
    overlay.classList.add('leaving');
    setTimeout(() => {
      background.forEach(element => { element.inert = false; });
      overlay.remove();
      style.remove();
      document.dispatchEvent(new Event('escola:intro-end'));
    }, 280);
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') finish();
  }

  timers.push(setTimeout(() => { if (status) status.textContent = 'Conectando caderno e vozes…'; }, 1650));
  timers.push(setTimeout(() => { if (status) status.textContent = 'Tudo pronto! Entrando…'; }, 3400));
  timers.push(setTimeout(finish, DURATION_MS));

  soundBtn.onclick = () => {
    muted = !muted;
    music.muted = muted;
    effect.muted = muted;
    if (muted) {
      music.pause();
    } else {
      tryPlayMusic();
    }
    renderSoundState();
  };
  document.addEventListener('keydown', onKeyDown);
})();
