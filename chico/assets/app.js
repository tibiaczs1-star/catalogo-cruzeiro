(() => {
  "use strict";

  // 0. Motor de Efeitos Sonoros Reais do Jogo + Web Audio Micro-SFX
  const SfxEngine = (() => {
    let enabled = true;
    let audioCtx = null;
    const pool = {};
    const SFX_FILES = {
      click1: "./assets/audio/sfx/click_0001.ogg",
      click2: "./assets/audio/sfx/click_0002.ogg",
      click3: "./assets/audio/sfx/click_0003.ogg",
      brush: "./assets/audio/sfx/brush_00.ogg",
      chop: "./assets/audio/sfx/chop_00.ogg",
      grass: "./assets/audio/sfx/grass_0000.ogg"
    };

    function play(key = "click1", volume = 0.34) {
      if (!enabled) return;
      const src = SFX_FILES[key];
      if (!src) return;
      try {
        const audio = pool[key] ? pool[key].cloneNode() : new Audio(src);
        if (!pool[key]) pool[key] = audio;
        audio.volume = volume;
        audio.play().catch(() => {});
      } catch (_) {}
    }

    function playHover() {
      if (!enabled) return;
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        if (!audioCtx) audioCtx = new Ctx();
        if (audioCtx.state === "suspended") return;
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(760, now + 0.045);
        gain.gain.setValueAtTime(0.025, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
      } catch (_) {}
    }

    function unlock() {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (Ctx && !audioCtx) audioCtx = new Ctx();
        if (audioCtx && audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
      } catch (_) {}
    }

    return {
      play,
      playHover,
      unlock,
      toggle() {
        enabled = !enabled;
        if (enabled) {
          unlock();
          play("click2", 0.38);
        }
        return enabled;
      },
      isEnabled: () => enabled
    };
  })();

  window.addEventListener("pointerdown", () => SfxEngine.unlock(), { once: true, passive: true });

  // 1. Alternador de Tema (Noite do Juruá <-> Amanhecer Caboclo), Modo Natal & Som
  const root = document.documentElement;
  const btnTheme = document.getElementById("btn-theme");
  const btnNatal = document.getElementById("btn-natal");
  const btnSfx = document.getElementById("btn-sfx");

  if (btnSfx) {
    btnSfx.addEventListener("click", () => {
      const on = SfxEngine.toggle();
      btnSfx.textContent = on ? "🔊" : "🔇";
      btnSfx.classList.toggle("is-sfx-on", on);
      btnSfx.setAttribute("aria-pressed", String(on));
    });
  }

  btnTheme.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "night" ? "dawn" : "night";
    root.setAttribute("data-theme", next);
    btnTheme.textContent = next === "night" ? "☀" : "🌙";
    SfxEngine.play("click2", 0.35);
  });

  if (btnNatal) {
    btnNatal.addEventListener("click", () => {
      const nextNatal = root.getAttribute("data-festive") !== "natal";
      root.setAttribute("data-festive", nextNatal ? "natal" : "off");
      btnNatal.classList.toggle("is-active", nextNatal);
      btnNatal.setAttribute("aria-pressed", String(nextNatal));
      window.JuruStage3D?.setFestive(nextNatal);
      SfxEngine.play("click3", 0.36);
    });
  }

  // 2. Parallax 3D Motion Fluido (Scroll + Ponteiro + Fundo Real da Cidade + Tilt 3D)
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let targetPx = 0;
  let targetPy = 0;
  let curPx = 0;
  let curPy = 0;
  let bgTargetX = 0;
  let bgTargetY = 0;
  let bgCurX = 0;
  let bgCurY = 0;

  if (!prefersReducedMotion) {
    window.addEventListener("pointermove", e => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      targetPx = -nx * 20;
      targetPy = -ny * 14;
      bgTargetX = -nx * 14;
      bgTargetY = -ny * 9;

      const diorama = document.getElementById("hero-diorama");
      if (diorama) {
        diorama.style.setProperty("--rx", `${(-ny * 5).toFixed(2)}deg`);
        diorama.style.setProperty("--ry", `${(nx * 6).toFixed(2)}deg`);
      }
    }, { passive: true });

    const stageBackdrop = document.getElementById("stage-city-backdrop");
    function tickParallax() {
      const scrollDrift = Math.max(-42, -window.scrollY * 0.038);
      curPx += (targetPx - curPx) * 0.09;
      curPy += ((targetPy + scrollDrift) - curPy) * 0.09;
      bgCurX += (bgTargetX - bgCurX) * 0.09;
      bgCurY += (bgTargetY - bgCurY) * 0.09;

      root.style.setProperty("--px", `${curPx.toFixed(2)}px`);
      root.style.setProperty("--py", `${curPy.toFixed(2)}px`);
      if (stageBackdrop) {
        stageBackdrop.style.setProperty("--bgx", `${bgCurX.toFixed(2)}px`);
        stageBackdrop.style.setProperty("--bgy", `${bgCurY.toFixed(2)}px`);
      }
      requestAnimationFrame(tickParallax);
    }
    requestAnimationFrame(tickParallax);

    document.querySelectorAll("[data-tilt-3d]").forEach(card => {
      card.addEventListener("pointermove", e => {
        if (card.querySelector('.prop-viewport[data-dragging="1"]')) return;
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        const rx = (0.5 - y) * 8;
        const ry = (x - 0.5) * 10;
        card.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-6px)`;
        card.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
        card.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  }

  // 3. Scroll Reveal Suave
  const reveals = document.querySelectorAll(".reveal");
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  reveals.forEach(el => revealObserver.observe(el));

  // 4. Diorama Hero (Features Principais do Jogo) + Partículas Natalinas & Vaga-lumes
  const STAGES = {
    fazenda: {
      src: "./assets/images/demo_fazenda.jpg",
      icon: "./assets/icons/ico_enxada.png",
      badge: "Plantio & 60 Canteiros",
      desc: "Prepare a terra, plante 8 culturas amazônicas e colha direto na roça em 3D.",
      sfx: "grass",
      night: false
    },
    farinha: {
      src: "./assets/images/cartoon_farinha_roca.jpg",
      icon: "./assets/icons/ico_madeira.png",
      badge: "Casa de Farinha Artesanal",
      desc: "Cevador, tipiti e forno de barro para transformar mandioca em Farinha Ouro.",
      sfx: "chop",
      night: false
    },
    pesca: {
      src: "./assets/images/cartoon_pesca_boto.jpg",
      icon: "./assets/icons/ico_balde.png",
      badge: "Pesca & Rio Juruá",
      desc: "Fisgue 7 espécies regionais de canoa ao lado do Boto-cor-de-rosa.",
      sfx: "brush",
      night: false
    },
    cidade: {
      src: "./assets/images/demo_zap.jpg",
      icon: "./assets/icons/ico_celular.png",
      badge: "Celular Juruá Zap [N]",
      desc: "Receba encomendas dos moradores, acompanhe o mapa e cumpra missões na cidade.",
      sfx: "click2",
      night: true
    }
  };
  const stageImg = document.getElementById("hero-stage-img");
  const stageIcon = document.getElementById("hero-stage-icon");
  const stageBadge = document.getElementById("hero-stage-badge");
  const stageDesc = document.getElementById("hero-stage-desc");
  const stagePills = Array.from(document.querySelectorAll(".stage-pill[data-stage]"));
  const heroProgressFill = document.getElementById("hero-progress-fill");
  const heroDioramaWrap = document.querySelector(".hero-diorama-wrap");
  let isNightStage = false;
  let stageAutoIdx = 0;
  let stageAutoPaused = false;
  let stageAutoTimer = null;

  function applyHeroStage(key, withSfx = false) {
    const st = STAGES[key];
    if (!st) return;
    if (stageImg) {
      stageImg.style.opacity = "0.5";
      stageImg.src = st.src;
      requestAnimationFrame(() => {
        stageImg.style.opacity = "1";
      });
    }
    if (stageIcon) stageIcon.src = st.icon;
    if (stageBadge) stageBadge.textContent = st.badge;
    if (stageDesc) stageDesc.textContent = st.desc;
    isNightStage = st.night;
    stagePills.forEach((p, idx) => {
      const active = p.dataset.stage === key;
      p.classList.toggle("is-active", active);
      if (active) stageAutoIdx = idx;
    });
    if (heroProgressFill) {
      heroProgressFill.style.transition = "none";
      heroProgressFill.style.width = "0%";
      void heroProgressFill.offsetWidth;
      heroProgressFill.style.transition = "width 5.4s linear";
      heroProgressFill.style.width = stageAutoPaused ? "0%" : "100%";
    }
    if (withSfx) SfxEngine.play(st.sfx || "click1", 0.34);
  }

  function scheduleHeroTour() {
    clearInterval(stageAutoTimer);
    if (prefersReducedMotion || stagePills.length < 2) return;
    stageAutoTimer = setInterval(() => {
      if (stageAutoPaused || document.hidden) return;
      stageAutoIdx = (stageAutoIdx + 1) % stagePills.length;
      applyHeroStage(stagePills[stageAutoIdx].dataset.stage, false);
    }, 5500);
  }

  stagePills.forEach(pill => {
    pill.addEventListener("click", () => {
      stageAutoPaused = false;
      applyHeroStage(pill.dataset.stage, true);
      scheduleHeroTour();
    });
  });

  if (heroDioramaWrap) {
    heroDioramaWrap.addEventListener("pointerenter", () => { stageAutoPaused = true; });
    heroDioramaWrap.addEventListener("pointerleave", () => {
      stageAutoPaused = false;
      if (heroProgressFill) {
        heroProgressFill.style.transition = "width 5.4s linear";
        heroProgressFill.style.width = "100%";
      }
    });
  }
  applyHeroStage("fazenda", false);
  scheduleHeroTour();

  const fxCanvas = document.getElementById("heroFxCanvas");
  const fxCtx = fxCanvas.getContext("2d");
  const fireflies = Array.from({ length: 24 }, (_, i) => ({
    x: (i * 39) % 100,
    y: (i * 29) % 100,
    speed: 0.28 + (i % 4) * 0.14,
    phase: i * 0.85,
    hue: i % 4
  }));

  const natalCanvas = document.getElementById("natalAmbientCanvas");
  const natalCtx = natalCanvas ? natalCanvas.getContext("2d") : null;
  const natalParticles = Array.from({ length: 30 }, (_, i) => ({
    x: ((i * 37) % 100) / 100,
    y: ((i * 53) % 100) / 100,
    vy: 0.00055 + (i % 5) * 0.00018,
    radius: 1.5 + (i % 3) * 0.9,
    phase: i * 0.7,
    paletteIdx: i % 4
  }));
  const NATAL_COLORS = [
    "255, 208, 123",
    "255, 248, 224",
    "94, 224, 128",
    "255, 110, 140"
  ];
  let fxTick = 0;

  function renderAmbientFx() {
    fxTick += 0.025;
    const isNatal = root.getAttribute("data-festive") === "natal";

    const w = fxCanvas.width = fxCanvas.offsetWidth || 640;
    const h = fxCanvas.height = fxCanvas.offsetHeight || 360;
    fxCtx.clearRect(0, 0, w, h);

    for (const p of fireflies) {
      const px = ((p.x / 100) * w + Math.sin(fxTick * p.speed + p.phase) * 26 + w) % w;
      const py = ((p.y / 100) * h + Math.cos(fxTick * p.speed + p.phase) * 18 + h) % h;
      const alpha = 0.35 + 0.45 * Math.sin(fxTick * 2 + p.phase);
      fxCtx.beginPath();
      fxCtx.arc(px, py, isNightStage || isNatal ? 2.6 : 2.1, 0, Math.PI * 2);
      const rgb = isNatal ? NATAL_COLORS[p.hue] : (isNightStage ? "255, 208, 123" : "255, 248, 220");
      fxCtx.fillStyle = `rgba(${rgb}, ${Math.max(0.22, alpha)})`;
      fxCtx.fill();
    }

    if (natalCtx && isNatal) {
      const nw = natalCanvas.width = window.innerWidth || 1280;
      const nh = natalCanvas.height = window.innerHeight || 720;
      natalCtx.clearRect(0, 0, nw, nh);
      for (const s of natalParticles) {
        s.y = (s.y + s.vy) % 1;
        const sx = (s.x * nw + Math.sin(fxTick * 0.7 + s.phase) * 28 + curPx * 0.55 + nw) % nw;
        const sy = (s.y * nh + curPy * 0.4 + nh) % nh;
        const alpha = 0.25 + 0.35 * Math.sin(fxTick * 1.8 + s.phase);
        natalCtx.beginPath();
        natalCtx.arc(sx, sy, s.radius, 0, Math.PI * 2);
        natalCtx.fillStyle = `rgba(${NATAL_COLORS[s.paletteIdx]}, ${Math.max(0.14, alpha)})`;
        natalCtx.fill();
      }
    }

    requestAnimationFrame(renderAmbientFx);
  }
  if (!prefersReducedMotion) renderAmbientFx();

  // 5. Introdução Oficial do Jogo (Voz Real do Chico Gatão)
  const voiceCapsule = document.getElementById("voice-capsule");
  const btnVoiceToggle = document.getElementById("btn-voice-toggle");
  const chicoAudio = document.getElementById("chico-real-audio");
  const btnCharSpeak = document.getElementById("btn-char-speak");

  function syncAudioUI(playing) {
    voiceCapsule?.classList.toggle("is-playing", playing);
    btnVoiceToggle?.classList.toggle("is-playing", playing);
    if (btnVoiceToggle) btnVoiceToggle.textContent = playing ? "❚❚" : "♫";
    if (btnCharSpeak) btnCharSpeak.textContent = playing ? "❚❚ Pausar Chico Gatão" : "♫ Ouvir Chico Gatão";
    window.JuruStage3D?.setSpeaking(playing);
  }

  async function toggleChicoVoice(forcePlay = false) {
    if (!chicoAudio) return;
    try {
      if (forcePlay || chicoAudio.paused) {
        await chicoAudio.play();
        syncAudioUI(true);
      } else {
        chicoAudio.pause();
        syncAudioUI(false);
      }
    } catch (err) {
      console.warn("Reprodução de áudio aguardando gesto:", err);
      syncAudioUI(false);
    }
  }

  btnVoiceToggle?.addEventListener("click", () => {
    SfxEngine.play("click1", 0.3);
    toggleChicoVoice(false);
  });
  chicoAudio?.addEventListener("ended", () => syncAudioUI(false));
  chicoAudio?.addEventListener("pause", () => syncAudioUI(false));

  // 5B. Painel Interativo Ilustrado das 6 Principais Funções do Jogo
  const MECHANICS_DATA = {
    plantio: {
      kicker: "Ciclo Agrícola Completo",
      title: "Plantio Vivo nos 60 Canteiros do Sítio",
      desc: "Prepare a terra roxa com a enxada, semeie mandioca brava, macaxeira e milho crioulo e acompanhe os 4 estágios reais de crescimento até a colheita.",
      img: "./assets/images/demo_fazenda.jpg",
      sfx: "grass",
      hotkey: "Teclas [1] Enxada · [2] Regador · [E] Plantar & Colher",
      steps: [
        ["Capinar & Adubar", "Use a Enxada [1] e a Pá para limpar e abrir os 60 canteiros."],
        ["Semear & Regar", "Plante sementes do Sr. Celso [E] e mantenha a umidade com o Regador [2]."],
        ["Colher Safra Cheia", "Recolha raízes maduras para a Casa de Farinha ou venda direta."]
      ]
    },
    farinha: {
      kicker: "Ofício Tradicional do Juruá",
      title: "Casa de Farinha Artesanal & Qualidade Ouro",
      desc: "Transforme a mandioca recém-colhida na legítima Farinha de Cruzeiro do Sul: raspe, prense a massa no tipiti de fibra e torre no tacho sobre o forno de barro.",
      img: "./assets/images/cartoon_farinha_roca.jpg",
      sfx: "chop",
      hotkey: "Tecla [3] Machado de Lenha · [E] Operar Tipiti & Forno",
      steps: [
        ["Cavar & Raspar", "Colha a mandioca brava nos canteiros e leve para o cocho da Casa de Farinha."],
        ["Prensar no Tipiti", "Extraia a manipueira na prensa trançada até a massa ficar enxuta."],
        ["Torrar no Forno", "Mexa com o rodo de madeira no fogo à lenha até dourar a Farinha Ouro."]
      ]
    },
    pesca: {
      kicker: "Vida Ribeirinha & Fauna 3D",
      title: "Pesca no Trapiche, Canoa & Boto do Rio Juruá",
      desc: "Desça o barranco até o trapiche ou suba na canoa para pescar 7 espécies amazônicas enquanto o boto-cor-de-rosa salta diante da Ponte da União.",
      img: "./assets/images/cartoon_pesca_boto.jpg",
      sfx: "brush",
      hotkey: "Tecla [4] Vara de Pesca · [E] Lançar Linha & Embarcar",
      steps: [
        ["Equipar Vara [4]", "Caminhe até o trapiche de madeira ou embarque na canoa ribeirinha."],
        ["Observação do Rio", "Escolha o horário: na neblina da manhã e ao pôr do sol os peixes puxam firme."],
        ["Fisgar 7 Espécies", "Capture do Lambari ao Tambaqui e Pirarucu ao lado do boto do Juruá."]
      ]
    },
    zap: {
      kicker: "Encomendas & Vida Social",
      title: "Celular Juruá Zap [N] & Missões da Vizinhança",
      desc: "Abra o celular do Chico a qualquer momento para responder mensagens de Dona Rosa, Raiane, Vovô Sebastião e Sr. Celso com pedidos urgentes da cidade.",
      img: "./assets/images/demo_zap.jpg",
      sfx: "click2",
      hotkey: "Tecla [N] Abrir / Fechar Celular Juruá Zap · [J] Diário",
      steps: [
        ["Notificação no Bolso", "Escute o toque do Juruá Zap e pressione [N] para abrir as conversas."],
        ["Aceitar Encomenda", "Veja quantas sacas de farinha, espigas de milho ou peixes cada vizinho pediu."],
        ["Entregar & Subir Nível", "Leve os produtos até a Praça ou Mercado e receba pagamento + reputação."]
      ]
    },
    cidade: {
      kicker: "Mundo Aberto Regional",
      title: "Cruzeiro do Sul em 3D, Catedral & Feira",
      desc: "Atravesse a Ponte da União rumo ao centro histórico: visite a Catedral Nossa Senhora da Glória, o Coreto da Praça Orleir Cameli, a Casa das Sementes e o Mercado.",
      img: "./assets/images/mirante_catedral.jpg",
      sfx: "click1",
      hotkey: "Teclas [WASD] Mover · [Shift] Correr · [M] Mapa Regional",
      steps: [
        ["Cruzar a Ponte", "Saia do Sítio do Chico pela estrada ou pelo rio rumo ao centro urbano 3D."],
        ["Comércio na Praça", "Compre sementes com Sr. Celso, tome café com D. Rosa e converse no Coreto."],
        ["Vender Produção", "Deposite no Caixote de Entrega ou negocie direto na feira da cidade."]
      ]
    },
    natal: {
      kicker: "Atmosfera Dinâmica UTC-5",
      title: "Ciclo Dia/Noite Sincronizado & Natal Iluminado",
      desc: "O céu do jogo acompanha o fuso real do Acre (UTC-5) — da cerração da alvorada às noites estreladas de Natal com pisca-piscas e árvore gigante na praça.",
      img: "./assets/images/bg_praca_noite_natal.jpg",
      sfx: "click3",
      hotkey: "Tecla [F] Lanterna Noturna · [K] Rádio Juruá · [P] Foto",
      steps: [
        ["Sol & Neblina Real", "Amanheça com neblina no varadouro e sol dourado aquecendo a floresta."],
        ["Noite com Lanterna [F]", "Acenda sua lanterna para caminhar pela roça e pescar sob as estrelas."],
        ["Luzes de Natal", "Explore a Praça Orleir Cameli e o Sítio decorados com luzes festivas."]
      ]
    }
  };

  const mechTabs = document.querySelectorAll(".mechanic-tab[data-mech]");
  const mechImg = document.getElementById("mech-preview-img");
  const mechHotkey = document.getElementById("mech-hotkey-badge");
  const mechKicker = document.getElementById("mech-kicker");
  const mechTitle = document.getElementById("mech-title");
  const mechDesc = document.getElementById("mech-desc");
  const mechStep1Title = document.getElementById("mech-step1-title");
  const mechStep1Desc = document.getElementById("mech-step1-desc");
  const mechStep2Title = document.getElementById("mech-step2-title");
  const mechStep2Desc = document.getElementById("mech-step2-desc");
  const mechStep3Title = document.getElementById("mech-step3-title");
  const mechStep3Desc = document.getElementById("mech-step3-desc");

  mechTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const key = tab.dataset.mech;
      const d = MECHANICS_DATA[key];
      if (!d) return;
      SfxEngine.play(d.sfx || "click1", 0.34);
      mechTabs.forEach(t => t.classList.toggle("is-active", t === tab));
      if (mechImg) {
        mechImg.style.opacity = "0.35";
        mechImg.src = d.img;
        requestAnimationFrame(() => {
          mechImg.style.opacity = "1";
        });
      }
      if (mechHotkey) mechHotkey.textContent = d.hotkey;
      if (mechKicker) mechKicker.textContent = d.kicker;
      if (mechTitle) mechTitle.textContent = d.title;
      if (mechDesc) mechDesc.textContent = d.desc;
      if (mechStep1Title) mechStep1Title.textContent = d.steps[0][0];
      if (mechStep1Desc) mechStep1Desc.textContent = d.steps[0][1];
      if (mechStep2Title) mechStep2Title.textContent = d.steps[1][0];
      if (mechStep2Desc) mechStep2Desc.textContent = d.steps[1][1];
      if (mechStep3Title) mechStep3Title.textContent = d.steps[2][0];
      if (mechStep3Desc) mechStep3Desc.textContent = d.steps[2][1];
      document.querySelectorAll(".mech-step-card").forEach(card => {
        card.classList.remove("is-popped");
        void card.offsetWidth;
        card.classList.add("is-popped");
      });
    });
  });

  // 6. Palco 3D Interativo da Turma + Fundo Real da Cidade
  const CREW_DATA = {
    chico: {
      name: "Chico Gatão",
      role: "Protagonista · Agricultor Caboclo",
      cityBg: "./assets/images/bg_praca_noite_natal.jpg",
      cityLabel: "Praça Orleir Cameli (Natal)",
      defaultAnim: "Idle_A",
      quotes: [
        "\"Eu sou Chico Gatão, filho desse rincão. Pegue sua coragem, segure o timão. Bem-vindo ao Juruá!\"",
        "\"Quem semeia na terra cuidado, vê a farinha dourar no forno de barro antes do cair da tarde.\"",
        "\"Atravesse a Ponte da União e veja Cruzeiro do Sul iluminada para o Natal entre o coreto e a catedral.\""
      ]
    },
    raiane: {
      name: "Raiane",
      role: "Parceira na Praça & Coreto",
      cityBg: "./assets/images/mirante_catedral.jpg",
      cityLabel: "Catedral & Centro 3D",
      defaultAnim: "Interact",
      quotes: [
        "\"Bom dia, Chico! O orvalho ainda tá no coreto — senta um pouquinho comigo antes do sol rachar.\"",
        "\"Essa hora a luz bate no Rio Juruá e ele fica dourado, viu? Dá vontade de nem ir embora.\"",
        "\"Depois que acendem os pisca-piscas, a Praça Orleir Cameli vira outra cidade. Todo mundo sai pra conversar.\""
      ]
    },
    rosa: {
      name: "Dona Rosa",
      role: "Padaria & Café Central",
      cityBg: "./assets/images/bg_praca_dia_natal.jpg",
      cityLabel: "Coreto & Feira de Natal",
      defaultAnim: "Working_A",
      quotes: [
        "\"O cuscuz tá na chapa agora, Chico! Cheiro de manteiga de garrafa acordando a rua inteira.\"",
        "\"Mandioca da tua roça? Deixa comigo que eu raspo, preparo e ainda te dou o beiju de graça.\"",
        "\"Meu painho dizia: noite de Natal em Cruzeiro sem café é noite sem estrela. Senta que eu coo o último.\""
      ]
    },
    sebastiao: {
      name: "Vovô Sebastião",
      role: "Guardião do Rio & Varadouro",
      cityBg: "./assets/images/mirante_ponte.jpg",
      cityLabel: "Mirante do Rio Juruá",
      defaultAnim: "Fishing_Idle",
      quotes: [
        "\"A neblina ainda tá no varadouro. Nessa hora o boto pesca junto com a gente, só que ele não divide.\"",
        "\"Ô neto, cedo assim? O rio tá manso, boia de lambari agora é o que puxa firme na linha.\"",
        "\"Quando eu era menino a água chegava naquela pedra branca. Respeita o rio que ele te dá o sustento.\""
      ]
    },
    celso: {
      name: "Sr. Celso",
      role: "Casa das Sementes",
      cityBg: "./assets/images/bg_sitio_noite_natal.jpg",
      cityLabel: "Sítio do Chico (Natal)",
      defaultAnim: "Walking_A",
      quotes: [
        "\"Separei umas sementes de milho crioulo mais bonitas hoje. Voz de quem entende: essa safra promete!\"",
        "\"Essa colheita tua vai dar farinha Qualidade Ouro, aposto meu bornal. Guarda umas sacas pra feira!\"",
        "\"Leva essa dica de velho: quem planta antes da chuva colhe antes do santo. É a regra daqui.\""
      ]
    }
  };

  let activeChar = "chico";
  let quoteIndex = 0;

  const charPill = document.getElementById("char-stage-pill");
  const charName = document.getElementById("char-info-name");
  const charRole = document.getElementById("char-info-role");
  const charDialogue = document.getElementById("char-dialogue-text");
  const stageCityImg = document.getElementById("stage-city-img");
  const crewTabs = document.querySelectorAll(".crew-tab");
  const animChips = document.querySelectorAll(".action-chip[data-anim]");
  const scenePills = document.querySelectorAll(".stage-scene-pill[data-city-bg]");

  function setStageCityBackdrop(src, label, charDisplayName) {
    if (stageCityImg && src) {
      stageCityImg.style.opacity = "0.35";
      stageCityImg.src = src;
      requestAnimationFrame(() => {
        stageCityImg.style.opacity = "1";
      });
    }
    scenePills.forEach(p => p.classList.toggle("is-active", p.dataset.cityBg === src));
    if (charPill) {
      charPill.textContent = `${charDisplayName || CREW_DATA[activeChar].name} · ${label}`;
    }
  }

  function setActiveAnimChip(animName) {
    animChips.forEach(c => c.classList.toggle("is-active", c.dataset.anim === animName));
  }

  function pulseDialogueBubble() {
    const bubble = document.querySelector(".dialogue-bubble");
    if (!bubble) return;
    bubble.classList.remove("is-updated");
    void bubble.offsetWidth;
    bubble.classList.add("is-updated");
  }

  scenePills.forEach(pill => {
    pill.addEventListener("click", () => {
      SfxEngine.play("click3", 0.3);
      setStageCityBackdrop(pill.dataset.cityBg, pill.dataset.cityLabel, CREW_DATA[activeChar]?.name);
    });
  });

  crewTabs.forEach(tab => {
    tab.addEventListener("click", async () => {
      const id = tab.dataset.char;
      const info = CREW_DATA[id];
      if (!info) return;
      SfxEngine.play("click2", 0.34);
      activeChar = id;
      quoteIndex = 0;
      crewTabs.forEach(t => t.classList.toggle("is-active", t === tab));
      charName.textContent = info.name;
      charRole.textContent = info.role;
      charDialogue.textContent = info.quotes[0];
      pulseDialogueBubble();
      setStageCityBackdrop(info.cityBg, info.cityLabel, info.name);
      setActiveAnimChip(info.defaultAnim);
      await window.JuruStage3D?.selectCharacter(id, info.defaultAnim);
    });
  });

  const ANIM_SFX = {
    Idle_A: "click1",
    Interact: "click2",
    Walking_A: "grass",
    Digging: "chop",
    Fishing_Idle: "brush"
  };

  animChips.forEach(chip => {
    chip.addEventListener("click", () => {
      const anim = chip.dataset.anim;
      SfxEngine.play(ANIM_SFX[anim] || "click1", 0.34);
      setActiveAnimChip(anim);
      window.JuruStage3D?.playAnimation(anim);
    });
  });

  document.getElementById("btn-next-dialogue").addEventListener("click", () => {
    const info = CREW_DATA[activeChar];
    if (!info) return;
    SfxEngine.play("click2", 0.32);
    quoteIndex = (quoteIndex + 1) % info.quotes.length;
    charDialogue.textContent = info.quotes[quoteIndex];
    pulseDialogueBubble();
    window.JuruStage3D?.playAnimation("Interact");
    setActiveAnimChip("Interact");
  });

  btnCharSpeak.addEventListener("click", async () => {
    if (activeChar !== "chico") {
      const chicoTab = document.querySelector('.crew-tab[data-char="chico"]');
      if (chicoTab) await chicoTab.click();
    }
    toggleChicoVoice(false);
  });

  // 7. Filtro de Raridade & Controle Direto da Intensidade de Luz 3D
  const rarityPills = document.querySelectorAll(".rarity-pill[data-filter-rarity]");
  const propCards = document.querySelectorAll(".prop-card[data-rarity]");
  const lightSlider = document.getElementById("rarity-light-slider");
  const lightReadout = document.getElementById("rarity-light-readout");

  rarityPills.forEach(pill => {
    pill.addEventListener("click", () => {
      const filter = pill.dataset.filterRarity;
      rarityPills.forEach(p => p.classList.toggle("is-active", p === pill));
      propCards.forEach(card => {
        const show = filter === "todos" || card.dataset.rarity === filter;
        if (show) card.removeAttribute("hidden");
        else card.setAttribute("hidden", "");
      });
    });
  });

  if (lightSlider && lightReadout) {
    lightSlider.addEventListener("input", () => {
      const pct = Number(lightSlider.value) || 100;
      const mult = pct / 100;
      lightReadout.textContent = `${pct}%`;
      window.JuruStage3D?.setRarityIntensity(mult);

      propCards.forEach(card => {
        const base = Number(card.dataset.intensity || "50");
        const scaled = Math.min(100, Math.round(base * mult));
        const luxEl = card.querySelector(".prop-lux-val");
        const meterEl = card.querySelector(".rarity-meter > span");
        if (luxEl) luxEl.textContent = `Luz ${scaled}%`;
        if (meterEl) meterEl.style.width = `${scaled}%`;
      });
    });
  }

  // 8. Lightbox Navegável + Relógio ao Vivo + Checklist Interativo + Modais
  const mediaModal = document.getElementById("media-modal");
  const mediaImg = document.getElementById("media-modal-img");
  const mediaTitle = document.getElementById("media-modal-title");
  const mediaDesc = document.getElementById("media-modal-desc");

  const searchModal = document.getElementById("search-modal");
  const downloadModal = document.getElementById("download-modal");

  const modalTriggers = Array.from(document.querySelectorAll("[data-modal-img]"));
  let currentModalIdx = -1;

  function closeAllModals() {
    [mediaModal, searchModal, downloadModal].forEach(m => m.classList.remove("is-open"));
  }

  function openImageModal({ img, title, desc }, idx = -1) {
    closeAllModals();
    currentModalIdx = idx;
    mediaImg.src = img;
    mediaImg.alt = title;
    mediaTitle.textContent = title;
    mediaDesc.textContent = desc;
    mediaModal.classList.add("is-open");
  }

  function stepImageModal(delta) {
    if (!modalTriggers.length) return;
    const nextIdx = ((currentModalIdx < 0 ? 0 : currentModalIdx) + delta + modalTriggers.length) % modalTriggers.length;
    const el = modalTriggers[nextIdx];
    SfxEngine.play("click2", 0.34);
    openImageModal({
      img: el.dataset.modalImg,
      title: el.dataset.modalTitle || "CHICO • Caminhos do Juruá",
      desc: el.dataset.modalDesc || ""
    }, nextIdx);
  }

  modalTriggers.forEach((el, idx) => {
    el.addEventListener("click", () => {
      SfxEngine.play("click1", 0.34);
      openImageModal({
        img: el.dataset.modalImg,
        title: el.dataset.modalTitle || "CHICO • Caminhos do Juruá",
        desc: el.dataset.modalDesc || ""
      }, idx);
    });
  });
  document.getElementById("media-modal-close")?.addEventListener("click", () => {
    SfxEngine.play("click3", 0.25);
    closeAllModals();
  });
  document.getElementById("media-modal-prev")?.addEventListener("click", () => stepImageModal(-1));
  document.getElementById("media-modal-next")?.addEventListener("click", () => stepImageModal(1));

  // Relógio ao vivo de Cruzeiro do Sul (UTC-5)
  const clockText = document.getElementById("jurua-clock-text");
  function updateJuruaClock() {
    if (!clockText) return;
    try {
      const now = new Date();
      const parts = new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Rio_Branco",
        hour: "2-digit",
        minute: "2-digit"
      }).format(now);
      const hourNum = Number(parts.split(":")[0]);
      const icon = (hourNum >= 6 && hourNum < 18) ? "☀ Dia" : "🌙 Noite";
      clockText.textContent = `Cruzeiro do Sul · ${parts} (${icon})`;
    } catch (_) {
      clockText.textContent = "Cruzeiro do Sul · Ao vivo";
    }
  }
  updateJuruaClock();
  setInterval(updateJuruaClock, 30000);

  // Checklist vivo "Feito no Acre, Vivo no Juruá"
  document.querySelectorAll(".live-check-item[data-live-action]").forEach(item => {
    item.addEventListener("click", () => {
      document.querySelectorAll(".live-check-item").forEach(b => b.classList.remove("is-checked"));
      item.classList.add("is-checked");
      const act = item.dataset.liveAction;
      SfxEngine.play("click2", 0.36);
      if (act === "natal") {
        btnNatal?.click();
      } else if (act === "dia") {
        btnTheme?.click();
      } else if (act === "voz") {
        toggleChicoVoice(true);
      } else if (act === "catedral") {
        openImageModal({
          img: "./assets/images/mirante_catedral.jpg",
          title: "Catedral da Glória & Praça Orleir Cameli",
          desc: "Centro histórico de Cruzeiro do Sul recriado em escala 3D no jogo."
        });
      }
    });
  });

  // Micro-SFX de hover + clique em todos os botões, mecânicas, turma, ferramentas e cards
  document.querySelectorAll(".mechanic-tab, .crew-tab, .action-chip, .stage-scene-pill, .stage-pill, .rarity-pill, .pillar-chip, .gallery-card, .tilt-card, .prop-card, .demo-preview-card, .nav-pill").forEach(el => {
    el.addEventListener("pointerenter", () => SfxEngine.playHover(), { passive: true });
    el.addEventListener("click", () => SfxEngine.play("click1", 0.3));
  });
  document.querySelectorAll(".prop-viewport").forEach(vp => {
    vp.addEventListener("pointerdown", () => SfxEngine.play("chop", 0.24));
  });
  document.querySelectorAll(".btn-gold, .btn-glass").forEach(el => {
    el.addEventListener("click", () => SfxEngine.play("brush", 0.32));
  });

  // Scroll-Spy vivo para destacar a seção atual na barra de navegação
  const navPills = Array.from(document.querySelectorAll(".nav-pill[href^='#']"));
  const spySections = navPills
    .map(pill => document.querySelector(pill.getAttribute("href")))
    .filter(Boolean);
  if (spySections.length && "IntersectionObserver" in window) {
    const spyObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const id = `#${entry.target.id}`;
        navPills.forEach(p => p.classList.toggle("is-active", p.getAttribute("href") === id));
      }
    }, { rootMargin: "-30% 0px -55% 0px", threshold: 0.01 });
    spySections.forEach(sec => spyObserver.observe(sec));
  }

  const SEARCH_ITEMS = [
    {
      title: "Roça & Casa de Farinha (Cartoon 3D)",
      desc: "60 canteiros vivos, tipiti e forno de barro para torrar Farinha Ouro.",
      action: () => openImageModal({ img: "./assets/images/cartoon_farinha_roca.jpg", title: "Roça & Casa de Farinha", desc: "Cultive mandioca brava, macaxeira e milho crioulo e processe até a Farinha Ouro." })
    },
    {
      title: "Pesca & Boto no Rio Juruá (Cartoon 3D)",
      desc: "Canoa no pôr do sol, 7 espécies nativas e Boto-cor-de-rosa.",
      action: () => openImageModal({ img: "./assets/images/cartoon_pesca_boto.jpg", title: "Pesca & Lendas do Rio", desc: "Pesque no Rio Juruá sob a Ponte da União com o boto-cor-de-rosa." })
    },
    {
      title: "Cidade Viva & Juruá Zap (Cartoon 3D)",
      desc: "Praça Orleir Cameli, Catedral e encomendas no celular ao pôr do sol.",
      action: () => openImageModal({ img: "./assets/images/cartoon_cidade_zap.jpg", title: "Cidade Viva & Juruá Zap", desc: "Atravesse a ponte até a Praça Orleir Cameli e receba encomendas no Juruá Zap [N]." })
    },
    {
      title: "Turma 3D com Fundo Real da Cidade & Natal",
      desc: "Chico, Raiane, Dona Rosa, Vovô e Celso diante dos cenários reais e Árvore de Natal 3D.",
      action: () => { closeAllModals(); document.getElementById("turma-3d").scrollIntoView({ behavior: "smooth" }); }
    },
    {
      title: "Objetos 3D com Luz e Raridade",
      desc: "Comum, Incomum, Raro, Épico e Lendário com luzes e anéis em Three.js.",
      action: () => { closeAllModals(); document.getElementById("objetos-3d").scrollIntoView({ behavior: "smooth" }); }
    },
    {
      title: "Noite de Natal na Praça Orleir Cameli",
      desc: "Demo atual com árvore iluminada, pisca-pisca, chafariz e trânsito 3D.",
      action: () => openImageModal({ img: "./assets/images/demo_noite_centro.jpg", title: "Noite de Natal na Praça Orleir Cameli", desc: "Demo atual com iluminação noturna, enfeites de Natal e trânsito vivo." })
    }
  ];

  const searchInput = document.getElementById("search-input");
  const searchResults = document.getElementById("search-results");

  function renderSearch(q) {
    const term = q.trim().toLowerCase();
    const list = SEARCH_ITEMS.filter(it =>
      !term || it.title.toLowerCase().includes(term) || it.desc.toLowerCase().includes(term)
    );
    searchResults.innerHTML = "";
    list.forEach(it => {
      const btn = document.createElement("button");
      btn.style.cssText = "text-align:left; padding:12px 16px; border-radius:20px; border:1px solid var(--border-soft); background:var(--bg-base); color:var(--text-main); cursor:pointer;";
      btn.innerHTML = `<div style="font-size:14px; font-weight:800;">${it.title}</div><div style="font-size:12px; color:var(--text-muted); margin-top:3px;">${it.desc}</div>`;
      btn.addEventListener("click", it.action);
      searchResults.appendChild(btn);
    });
  }

  document.getElementById("btn-search").addEventListener("click", () => {
    closeAllModals();
    searchModal.classList.add("is-open");
    renderSearch("");
    setTimeout(() => searchInput.focus(), 60);
  });
  searchInput.addEventListener("input", () => renderSearch(searchInput.value));
  document.getElementById("search-close").addEventListener("click", closeAllModals);

  function openDownloadModal() {
    closeAllModals();
    downloadModal.classList.add("is-open");
  }
  ["btn-nav-demo", "btn-hero-download", "btn-download-trust"].forEach(id => {
    document.getElementById(id)?.addEventListener("click", openDownloadModal);
  });
  ["download-close", "download-ok"].forEach(id => {
    document.getElementById(id)?.addEventListener("click", closeAllModals);
  });
  [mediaModal, searchModal, downloadModal].forEach(modal => {
    modal.addEventListener("click", e => {
      if (e.target === modal) closeAllModals();
    });
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeAllModals();
    if (mediaModal.classList.contains("is-open")) {
      if (e.key === "ArrowLeft") stepImageModal(-1);
      if (e.key === "ArrowRight") stepImageModal(1);
    }
  });
})();
