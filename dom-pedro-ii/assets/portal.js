/* Dom Pedro II Voice — camada de movimento premium
   Parallax no hero, scroll-reveal e tilt 3D nos cards.
   Respeita prefers-reduced-motion e desliga em telas sensíveis ao toque. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* 1. Parallax do hero — camada da imagem se move com o scroll */
  function initParallax() {
    if (reduce) return;
    var hero = document.querySelector('.welcome');
    var img = document.querySelector('.welcome figure img');
    var copy = document.querySelector('.welcome-copy');
    if (!hero || !img) return;

    var ticking = false;
    function update() {
      var y = window.scrollY || window.pageYOffset;
      if (y < window.innerHeight * 1.2) {
        img.style.transform = 'translate3d(0,' + (y * 0.18).toFixed(1) + 'px,0) scale(1.08)';
        if (copy) copy.style.transform = 'translate3d(0,' + (y * 0.06).toFixed(1) + 'px,0)';
      }
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* 2. Scroll-reveal — revela seções ao entrar na viewport */
  function initReveal() {
    var items = document.querySelectorAll(
      '.section-head, .steps article, .reel-card, ' +
      '.feature-grid article, .gallery figure, .devices article, .test-note'
    );
    if (!items.length) return;

    if (reduce || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    items.forEach(function (el) { el.classList.add('reveal'); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    items.forEach(function (el) { io.observe(el); });
  }

  /* 3. Tilt 3D nos cards — segue o cursor suavemente */
  function initTilt() {
    if (reduce || !fine) return;
    var cards = document.querySelectorAll('.steps article, .feature-grid article, .gallery figure');
    cards.forEach(function (card) {
      card.classList.add('tilt');
      var raf;
      card.addEventListener('mousemove', function (e) {
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          var r = card.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - 0.5;
          var py = (e.clientY - r.top) / r.height - 0.5;
          card.style.setProperty('--rx', (-py * 7).toFixed(2) + 'deg');
          card.style.setProperty('--ry', (px * 7).toFixed(2) + 'deg');
        });
      });
      card.addEventListener('mouseleave', function () {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* 4. Barra de progresso de leitura */
  function initProgress() {
    if (reduce) return;
    var bar = document.createElement('div');
    bar.className = 'read-progress';
    document.body.appendChild(bar);
    var ticking = false;
    function update() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? (window.scrollY / h) * 100 : 0;
      bar.style.width = p.toFixed(2) + '%';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* 5. Modo Cinema (ativo por padrão) / Claro */
  function initCinemaMode() {
    var btn = document.getElementById('cinemaToggle');
    var saved = localStorage.getItem('portalTheme');
    var isDark = saved !== 'light';
    document.body.classList.toggle('cinema-mode', isDark);
    if (btn) btn.textContent = isDark ? '☀️ Modo Claro' : '🎬 Modo Cinema';
    if (!btn) return;
    btn.addEventListener('click', function () {
      var active = document.body.classList.toggle('cinema-mode');
      btn.textContent = active ? '☀️ Modo Claro' : '🎬 Modo Cinema';
      localStorage.setItem('portalTheme', active ? 'cinema' : 'light');
    });
  }

  /* 5B. Hino dos Bombeiros 16-bit (Trilha opcional com pausa automática ao assistir Reels) */
  var portalBgm = null;
  function pausePortalBgm() {
    var btn = document.getElementById('portalBgmBtn');
    if (portalBgm && !portalBgm.paused) {
      portalBgm.pause();
      if (btn) {
        btn.setAttribute('aria-pressed', 'false');
        btn.textContent = '🎵 Hino 16-bit';
      }
    }
  }
  function initBgm() {
    var btn = document.getElementById('portalBgmBtn');
    if (!btn) return;
    portalBgm = new Audio('assets/audio/hino-bombeiros-16bit.mp3');
    portalBgm.loop = true;
    portalBgm.volume = 0.28;
    btn.addEventListener('click', function () {
      if (!portalBgm.paused) {
        pausePortalBgm();
      } else {
        portalBgm.play().then(function () {
          btn.setAttribute('aria-pressed', 'true');
          btn.textContent = '⏸️ Hino 16-bit';
        }).catch(function () {});
      }
    });
    document.querySelectorAll('.reels-showcase video').forEach(function (v) {
      v.addEventListener('play', pausePortalBgm);
    });
  }

  /* 6. Contador animado das estatísticas */
  function initStatsCounter() {
    var nums = document.querySelectorAll('.stat-number');
    if (!nums.length) return;
    var started = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !started) {
          started = true;
          nums.forEach(function (el) {
            var target = parseInt(el.getAttribute('data-target') || '0', 10);
            var suffix = el.getAttribute('data-suffix') || '';
            var duration = 1400;
            var start = performance.now();
            function step(now) {
              var progress = Math.min((now - start) / duration, 1);
              var ease = 1 - Math.pow(1 - progress, 3);
              var cur = Math.round(target * ease);
              el.textContent = cur + suffix;
              if (progress < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
          });
          io.disconnect();
        }
      });
    }, { threshold: 0.3 });
    var bar = document.querySelector('.cinema-stats');
    if (bar) io.observe(bar);
  }

  /* 7. Sala de Cinema / Lightbox de Vídeos & Galeria */
  function initTheater() {
    var modal = document.getElementById('videoTheaterModal');
    var video = document.getElementById('theaterVideo');
    var image = document.getElementById('theaterImage');
    var titleEl = document.getElementById('theaterTitle');
    var descEl = document.getElementById('theaterDesc');
    var closeBtn = document.getElementById('theaterClose');
    var backdrop = document.getElementById('theaterBackdrop');
    if (!modal || !video) return;

    var dialog = modal.querySelector('.theater-dialog');

    function openVideo(src, title, desc, isReel) {
      pausePortalBgm();
      if (dialog) dialog.classList.toggle('is-reel', Boolean(isReel));
      if (image) { image.hidden = true; image.removeAttribute('src'); }
      video.hidden = false;
      video.src = src;
      if (titleEl) titleEl.textContent = title || 'Vídeo';
      if (descEl) descEl.textContent = desc || '';
      modal.hidden = false;
      modal.setAttribute('aria-hidden', 'false');
      video.play().catch(function () {});
    }

    function openImage(src, alt, caption) {
      if (dialog) dialog.classList.remove('is-reel');
      video.pause();
      video.removeAttribute('src');
      video.hidden = true;
      if (image) {
        image.src = src;
        image.alt = alt || caption || 'Campus CZS Sul';
        image.hidden = false;
      }
      if (titleEl) titleEl.textContent = caption || 'Colégio Militar Dom Pedro II — CZS Sul';
      if (descEl) descEl.textContent = alt || 'Acervo fotográfico do campus.';
      modal.hidden = false;
      modal.setAttribute('aria-hidden', 'false');
    }

    function close() {
      video.pause();
      video.removeAttribute('src');
      video.hidden = false;
      if (image) { image.hidden = true; image.removeAttribute('src'); }
      if (dialog) dialog.classList.remove('is-reel');
      modal.hidden = true;
      modal.setAttribute('aria-hidden', 'true');
    }

    document.querySelectorAll('[data-src]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        openVideo(
          btn.getAttribute('data-src'),
          btn.getAttribute('data-title'),
          btn.getAttribute('data-desc'),
          btn.getAttribute('data-reel') === '1'
        );
      });
    });

    document.querySelectorAll('.gallery figure').forEach(function (fig) {
      fig.style.cursor = 'zoom-in';
      fig.addEventListener('click', function () {
        var img = fig.querySelector('img');
        var cap = fig.querySelector('figcaption');
        if (!img) return;
        openImage(img.getAttribute('src'), img.getAttribute('alt'), cap ? cap.textContent : '');
      });
    });

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (backdrop) backdrop.addEventListener('click', close);
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) close();
    });
  }

  function init() {
    initParallax();
    initReveal();
    initTilt();
    initProgress();
    initCinemaMode();
    initBgm();
    initStatsCounter();
    initTheater();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
