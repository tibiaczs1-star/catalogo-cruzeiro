(function () {
  "use strict";

  const LIVE = "https://catalogo-cruzeiro-web.onrender.com";
  const BRAND_INTRO = "assets/brand/catalogo-czs-logo-offline-horizontal-crop-20260603.png";
  const BRAND_MAIN = "assets/brand/catalogo-czs-logo-offline-horizontal-crop-20260603.png";
  const BRAND_HORIZONTAL = "assets/brand/catalogo-czs-logo-offline-horizontal-crop-20260603.png";
  const BRAND_ICON = "assets/brand/catalogo-czs-logo-transparent-png-20260603/06-icone-czs-estrelas-sem-fundo.png";
  const INTRO_VIDEO = "assets/intro/czs-loader-video-20260603.mp4";
  const V8_BOOT_VERSION = "20260604-rayl-crop-perfect-v2";
  const ENTRY_POPUP_LAST_SEEN_KEY = "czs-v8-entry-popup-last-seen-at";
  const ENTRY_POPUP_VERSION_KEY = "czs-v8-entry-popup-version";
  const INTRO_SESSION_KEY = "czs-v8-intro-seen-session";
  const ENTRY_POPUP_SESSION_KEY = "czs-v8-entry-popup-seen-session";
  const ENTRY_POPUP_INTERVAL_MS = 24 * 60 * 60 * 1000;
  const SOCIAL_EMAIL = "juniorclovissampaio@gmail.com";
  const SOCIAL_INSTAGRAM = "https://www.instagram.com/catalogo_czs_/";
  const SOCIAL_WHATSAPP_NUMBER = "556896026649";
  const SOCIAL_WHATSAPP = `https://wa.me/${SOCIAL_WHATSAPP_NUMBER}?text=${encodeURIComponent("Oi, CZS. Vim pelo V8 e quero atendimento.")}`;
  const CHEFFE_ACTIONS_KEY = "czs-v8-cheffe-actions";
  const COMMUNITY_REPORTS_KEY = "czs-v8-community-reports";
  const NEWSLETTER_LEADS_KEY = "czs-v8-newsletter-leads";
  const SAVED_STORIES_KEY = "czs-v8-saved-stories";
  const AD_EVENT_CACHE_KEY = "czs-v8-ad-events";
  const DENSITY_MODE_KEY = "czs-v8-density-mode";
  const VIDEO_FRAME_CACHE_KEY = "czs-v8-video-frame-cache";
  const REVIEWED_STORIES_KEY = "czs-v8-reviewed-stories";
  const ARCHIVE_PAGE_STEP = 24;

  function releaseIntroLock() {
    if (typeof window.__czsReleaseIntroLock === "function") {
      window.__czsReleaseIntroLock();
      return;
    }
    document.documentElement.classList.remove("czs-intro-lock");
    document.documentElement.classList.add("czs-intro-release");
  }

  const API = {
    archive: "/api/news/archive?limit=1000",
    authSession: "/api/auth/session",
    cheffe: "/api/cheffe-call",
    communityReports: "/api/community/reports",
    editorialCorrections: "/api/editorial-corrections",
    adsCampaigns: "/api/ads/campaigns",
    adsEvents: "/api/ads/events",
    commercialLeads: "/api/commercial/leads",
    raylChat: "/api/rayl/chat",
    officeAI: "/api/office-ai/chat",
    cheffeAI: "/api/cheffe-call/ai",
  };
  const V8_VIDEO_PLAYLIST = [
    {
      id: "czs-apresentacao",
      title: "Plantão CZS em vídeo",
      label: "TV CZS",
      src: "assets/founders-cafe-pack-anim.mp4",
      poster: "assets/home-cache/footer-cruzeiro-bg.jpg",
      text: "Arquivo local usado quando a captura de notícia ainda não trouxe vídeo real.",
    },
    {
      id: "jurua-cultura",
      title: "Cultura e cidade",
      label: "Acervo",
      src: "assets/pubpaid/chess/chess-intro-premium-v1.mp4",
      poster: "assets/home-cache/buzz-via-cruzeiro.jpg",
      text: "Vídeo de apoio para manter a TV ativa até chegar novo corte jornalístico.",
    },
    {
      id: "jurua-servico",
      title: "Serviço em vídeo",
      label: "Acervo",
      src: "assets/pubpaid/checkers/checkers-intro-premium-v1.mp4",
      poster: "assets/home-cache/buzz-cruzeiro-03.jpg",
      text: "Fallback de mídia local enquanto a TV busca vídeos de notícias no arquivo.",
    },
  ];
  const archiveState = {
    query: "",
    period: "all",
    category: "all",
    source: "all",
    folder: "all",
    limit: ARCHIVE_PAGE_STEP,
  };
  const storyViewerState = {
    playlist: [],
    index: 0,
  };
  const RAYL_POSES = {
    loaderWave: "assets/aylla/rayl-v2-clean/rayl-v2-wave-full.png",
    loaderThink: "assets/aylla/rayl-v2-clean/rayl-v2-confident-full.png",
    loaderPoint: "assets/aylla/rayl-v2-clean/rayl-v2-point-full.png",
    loaderPresent: "assets/aylla/rayl-v2-clean/rayl-v2-present-alt-full.png",
    loaderJoy: "assets/aylla/rayl-v2-clean/rayl-v2-laugh-full.png",
    seatedFeature: "assets/aylla/rayl-v2-clean/rayl-v2-seated-feature.png",
    fullWave: "assets/aylla/rayl-v2-clean/rayl-v2-wave-full.png",
    fullThink: "assets/aylla/rayl-v2-clean/rayl-v2-confident-full.png",
    fullPoint: "assets/aylla/rayl-v2-clean/rayl-v2-point-full.png",
    fullPresent: "assets/aylla/rayl-v2-clean/rayl-v2-present-alt-full.png",
    fullCelebrate: "assets/aylla/rayl-v2-clean/rayl-v2-heart-full.png",
    fullPonder: "assets/aylla/rayl-v2-clean/rayl-v2-kiss-full.png",
    propsSeated: "assets/aylla/rayl-v2-clean/rayl-v2-seated-feature.png",
    propsStool: "assets/aylla/rayl-v2-clean/rayl-v2-seated-feature.png",
    propsPeek: "assets/aylla/rayl-v2-clean/rayl-v2-point-full.png",
    propsPhone: "assets/aylla/rayl-v2-clean/rayl-v2-present-full.png",
    chatNeutral: "assets/aylla/rayl-v2-clean/rayl-v2-neutral-full.png",
    chatWave: "assets/aylla/rayl-v2-clean/rayl-v2-wave-full.png",
    chatThink: "assets/aylla/rayl-v2-clean/rayl-v2-confident-full.png",
    chatPoint: "assets/aylla/rayl-v2-clean/rayl-v2-point-full.png",
    chatPresent: "assets/aylla/rayl-v2-clean/rayl-v2-present-full.png",
    chatPointUp: "assets/aylla/rayl-v2-clean/rayl-v2-present-alt-full.png",
    chatCelebrate: "assets/aylla/rayl-v2-clean/rayl-v2-heart-full.png",
    chatHoldCard: "assets/aylla/rayl-v2-clean/rayl-v2-present-alt-full.png",
    chatPhone: "assets/aylla/rayl-v2-clean/rayl-v2-phone-like.png",
  };
  const AYLLA_LOADER_POSES = [
    [RAYL_POSES.loaderWave, "Preparando a primeira dobra.", "wave"],
    [RAYL_POSES.loaderThink, "Conferindo fontes e imagens.", "thinking"],
    [RAYL_POSES.loaderPoint, "Apontando os atalhos úteis.", "point"],
    [RAYL_POSES.loaderPresent, "Organizando serviços e anúncios.", "present"],
    [RAYL_POSES.loaderJoy, "Quase pronto para abrir.", "joy"],
    [RAYL_POSES.seatedFeature, "RAyL entra com o portal.", "seated"],
  ];
  const dataNode = document.getElementById("newsData");
  const DATA = dataNode ? JSON.parse(dataNode.textContent || "{}") : { items: [] };
  const allStories = (DATA.items || [])
    .filter((item) => !/^(lei organica|lei orgânica)$/i.test(String(item.title || "").trim()));
  let archiveSourceStories = allStories.slice();
  let archiveSourceMeta = {
    status: "snapshot",
    label: "Snapshot local",
    total: DATA.archiveTotal || allStories.length,
  };
  let cheffeBackendState = {
    status: "local",
    label: "Fila local",
    detail: "sem sincronização confirmada",
  };
  let commercialCampaigns = [];
  const bySlug = new Map(allStories.map((item) => [String(item.slug || ""), item]));
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const REAL_PHOTO_POOL = [
    "assets/home-cache/rio-jurua-panorama.jpg",
    "assets/home-cache/footer-cruzeiro-bg.jpg",
    "assets/home-cache/buzz-cruzeiro-01.jpg",
    "assets/home-cache/buzz-cruzeiro-02.jpg",
    "assets/home-cache/buzz-cruzeiro-03.jpg",
    "assets/home-cache/buzz-cruzeiro-04.jpg",
    "assets/home-cache/news-batelao-local.jpg",
    "assets/home-cache/fallback-cheia.jpg",
    "assets/home-cache/fallback-cotidiano.jpg",
    "assets/home-cache/buzz-via-cruzeiro.jpg",
    "assets/home-cache/buzz-cultura-show.jpg",
  ];
  const esc = (value) =>
    String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[char]);
  const cssEscape = (value) =>
    window.CSS?.escape ? CSS.escape(String(value || "")) : String(value || "").replace(/["\\]/g, "\\$&");
  const cleanPublicAiText = (value, fallback = "Resposta local indisponível. Use um atalho seguro do CZS.") => {
    const text = String(value || "")
      .replace(/<think>[\s\S]*?<\/think>/gi, " ")
      .replace(/<think>[\s\S]*/gi, " ")
      .replace(/<\/think>/gi, " ")
      .replace(/^\s*(assistant|model|ollama|ai|answer|resposta)\s*:\s*/i, "")
      .replace(/\s+/g, " ")
      .trim();
    const normalized = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const englishHits = (normalized.match(/\b(the|and|you|your|please|click|open|answer|question|should|would|could|here|there|safe|sources|website|assistant|local news|next step)\b/g) || []).length;
    const portugueseHits = (normalized.match(/\b(que|para|como|uma|um|com|noticia|noticias|servico|servicos|abrir|clique|fonte|vale|jurua|cruzeiro|atendimento|humano|pode|deve|cheffe|redacao|resposta|seguro|proximo|passo|aqui|estou)\b/g) || []).length;
    const unsafe = !text || text.length < 18 || /[\u3040-\u30ff\u3400-\u9fff]/.test(text) || /\b(as an ai|i am|i'm|i cannot|i can|i don't|i do not|sure,|certainly,|hello,|hi,|please|click here|open the|let me|you can|your question|the answer)\b/i.test(text) || (englishHits >= 4 && englishHits > portugueseHits + 1);
    return unsafe ? String(fallback || "Resposta local indisponível. Use um atalho seguro do CZS.") : text.slice(0, 900);
  };

  function safeRead(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function safeWrite(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_) {
      return false;
    }
  }

  function safeSetItem(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (_) {
      return false;
    }
  }

  function safeGetItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (_) {
      return null;
    }
  }

  function compactDateTime(value = new Date()) {
    try {
      return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value));
    } catch (_) {
      return "agora";
    }
  }

  function whatsappHref(message) {
    return `https://wa.me/${SOCIAL_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }

  const slugFromHref = (href) => {
    try {
      const url = new URL(href, location.href);
      const hashMatch = url.hash.match(/noticia=([^&]+)/);
      if (hashMatch) return decodeURIComponent(hashMatch[1]);
      if (/noticia\.html$/i.test(url.pathname)) return url.searchParams.get("slug") || "";
    } catch (_) {
      const match = String(href || "").match(/slug=([^&#]+)/);
      if (match) return decodeURIComponent(match[1]);
    }
    return "";
  };

  const hashText = (value = "") => {
    let hash = 0;
    String(value || "").split("").forEach((char) => {
      hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
    });
    return Math.abs(hash);
  };

  const realPhotoFor = (story = {}) =>
    REAL_PHOTO_POOL[hashText(story.slug || story.title || story.category || "czs") % REAL_PHOTO_POOL.length];

  const isVideoUrl = (value = "") =>
    /\.(?:mp4|webm|ogg)(?:[?#].*)?$/i.test(String(value || "").trim());

  const normalizeAssetUrl = (value = "") =>
    String(value || "").replace(/^\/assets\//, "assets/");

  const weakImage = (value = "") =>
    !value ||
    isVideoUrl(value) ||
    /(?:^|\/)assets\/news-fallbacks\/|\/news-fallbacks\/|loading_v2\.gif|pixel-art-editorial\.svg|placeholder|spacer|blank|favicon|logo|avatar|gravatar|default|sem-imagem|generica|gen[eé]rica/i.test(String(value));

  const imgFor = (story) => {
    const raw = normalizeAssetUrl(story?.imageUrl || story?.feedImageUrl || story?.sourceImageUrl || "");
    if (weakImage(raw)) return realPhotoFor(story);
    return raw;
  };

  function firstVideoUrlFrom(value) {
    if (!value) return "";
    if (typeof value === "string") return isVideoUrl(value) ? normalizeAssetUrl(value) : "";
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = firstVideoUrlFrom(item);
        if (found) return found;
      }
      return "";
    }
    if (typeof value === "object") {
      const candidates = [
        value.url,
        value.src,
        value.mp4,
        value.videoUrl,
        value.contentUrl,
        value.file,
      ];
      for (const candidate of candidates) {
        const found = firstVideoUrlFrom(candidate);
        if (found) return found;
      }
    }
    return "";
  }

  function storyVideoUrl(story = {}) {
    return firstVideoUrlFrom([
      story.videoUrl,
      story.video,
      story.media,
      story.mediaUrl,
      story.imageUrl,
      story.feedImageUrl,
      story.sourceImageUrl,
    ]);
  }

  function videoTypeFor(src = "") {
    if (/\.webm(?:[?#].*)?$/i.test(src)) return "video/webm";
    if (/\.ogg(?:[?#].*)?$/i.test(src)) return "video/ogg";
    return "video/mp4";
  }

  function readVideoFrameCache() {
    const cache = safeRead(VIDEO_FRAME_CACHE_KEY, {});
    return cache && typeof cache === "object" && !Array.isArray(cache) ? cache : {};
  }

  function videoPosterFor(story = {}, videoSrc = storyVideoUrl(story)) {
    const cache = readVideoFrameCache();
    return cache[videoSrc] || imgFor(story);
  }

  function storeVideoFrame(videoSrc, dataUrl) {
    if (!videoSrc || !dataUrl) return;
    const cache = readVideoFrameCache();
    const entries = Object.entries({ [videoSrc]: dataUrl, ...cache }).slice(0, 80);
    safeWrite(VIDEO_FRAME_CACHE_KEY, Object.fromEntries(entries));
  }

  function updateVideoPosterTargets(videoSrc, dataUrl) {
    if (!videoSrc || !dataUrl) return;
    $$(`[data-v8-video-poster-src="${cssEscape(videoSrc)}"]`).forEach((node) => {
      if (node.tagName === "VIDEO") node.poster = dataUrl;
      else if (node.tagName === "IMG") node.src = dataUrl;
      else node.style.backgroundImage = `url("${dataUrl}")`;
      node.dataset.v8PosterReady = "1";
    });
  }

  function canCaptureVideoFrame(videoSrc = "") {
    try {
      const url = new URL(videoSrc, location.href);
      return url.origin === location.origin;
    } catch (_) {
      return false;
    }
  }

  function captureVideoFrame(videoSrc, fallback = "") {
    if (!videoSrc || window.__v8VideoFrameJobs?.has(videoSrc)) return;
    if (!canCaptureVideoFrame(videoSrc)) {
      if (fallback) updateVideoPosterTargets(videoSrc, fallback);
      return;
    }
    window.__v8VideoFrameJobs = window.__v8VideoFrameJobs || new Set();
    window.__v8VideoFrameJobs.add(videoSrc);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.crossOrigin = "anonymous";
    video.src = videoSrc;
    const cleanup = () => {
      video.removeAttribute("src");
      video.load();
      window.__v8VideoFrameJobs.delete(videoSrc);
    };
    const fail = () => {
      if (fallback) updateVideoPosterTargets(videoSrc, fallback);
      cleanup();
    };
    video.addEventListener("loadedmetadata", () => {
      const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 4;
      video.currentTime = Math.min(Math.max(duration * 0.22, 0.55), Math.max(duration - 0.2, 0.55), 2.8);
    }, { once: true });
    video.addEventListener("seeked", () => {
      try {
        const width = Math.min(720, video.videoWidth || 720);
        const height = Math.max(1, Math.round(width * ((video.videoHeight || 405) / (video.videoWidth || 720))));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, width, height);
        const frame = canvas.toDataURL("image/jpeg", .72);
        storeVideoFrame(videoSrc, frame);
        updateVideoPosterTargets(videoSrc, frame);
      } catch (_) {
        if (fallback) updateVideoPosterTargets(videoSrc, fallback);
      } finally {
        cleanup();
      }
    }, { once: true });
    video.addEventListener("error", fail, { once: true });
    setTimeout(() => {
      if (window.__v8VideoFrameJobs?.has(videoSrc)) fail();
    }, 4200);
  }

  function refreshVideoFrames(root = document) {
    const cache = readVideoFrameCache();
    $$("[data-v8-video-poster-src]", root).forEach((node) => {
      const videoSrc = node.dataset.v8VideoPosterSrc || "";
      const fallback = node.dataset.v8VideoFallback || "";
      if (!videoSrc) return;
      if (cache[videoSrc]) {
        updateVideoPosterTargets(videoSrc, cache[videoSrc]);
        return;
      }
      if (node.dataset.v8PosterRequested === "1") return;
      node.dataset.v8PosterRequested = "1";
      captureVideoFrame(videoSrc, fallback);
    });
  }

  function storyVisualMarkup(story, loading = "lazy") {
    const videoSrc = storyVideoUrl(story);
    if (videoSrc) {
      const fallback = imgFor(story);
      return `<video controls playsinline preload="metadata" poster="${esc(videoPosterFor(story, videoSrc))}" data-v8-story-video="${esc(story?.slug || "")}" data-v8-video-poster-src="${esc(videoSrc)}" data-v8-video-fallback="${esc(fallback)}">
        <source src="${esc(videoSrc)}" type="${esc(videoTypeFor(videoSrc))}">
        Vídeo indisponível neste navegador.
      </video>`;
    }
    return `<img src="${esc(imgFor(story))}" alt="${esc(story?.title || "Notícia CZS")}" loading="${esc(loading)}" onerror="this.onerror=null;this.src='${esc(realPhotoFor(story))}'">`;
  }

  function ensureStoryViewerOverlay() {
    let overlay = $("#v8StoryViewer");
    if (overlay) return overlay;

    overlay = document.createElement("section");
    overlay.id = "v8StoryViewer";
    overlay.className = "v8-story-viewer";
    overlay.setAttribute("aria-label", "Visualizador de stories CZS");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("role", "dialog");
    overlay.innerHTML = `
      <div class="v8-story-viewer-stage">
        <button class="v8-story-viewer-close" type="button" data-v8-story-close aria-label="Fechar story">x</button>
        <button class="v8-story-viewer-nav prev" type="button" data-v8-story-prev aria-label="Story anterior">&lsaquo;</button>
        <div class="v8-story-viewer-phone">
          <div class="v8-story-progress" aria-hidden="true"><i></i><i></i><i></i></div>
          <video id="v8StoryViewerVideo" controls playsinline preload="metadata">
            <source src="" type="video/mp4">
            Seu navegador não conseguiu carregar este vídeo.
          </video>
          <div class="v8-story-viewer-copy">
            <span id="v8StoryViewerLabel"></span>
            <strong id="v8StoryViewerTitle"></strong>
            <p id="v8StoryViewerText"></p>
            <a id="v8StoryViewerRead" class="small-btn" href="#videos" hidden>Ler matéria</a>
          </div>
        </div>
        <button class="v8-story-viewer-nav next" type="button" data-v8-story-next aria-label="Próximo story">&rsaquo;</button>
      </div>`;
    document.body.appendChild(overlay);

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay || event.target.closest("[data-v8-story-close]")) {
        closeStoryViewer();
        return;
      }
      if (event.target.closest("[data-v8-story-prev]")) {
        updateStoryViewer(storyViewerState.index - 1);
        return;
      }
      if (event.target.closest("[data-v8-story-next]")) {
        updateStoryViewer(storyViewerState.index + 1);
      }
    });
    document.addEventListener("keydown", (event) => {
      if (!overlay.classList.contains("is-open")) return;
      if (event.key === "Escape") closeStoryViewer();
      if (event.key === "ArrowLeft") updateStoryViewer(storyViewerState.index - 1);
      if (event.key === "ArrowRight") updateStoryViewer(storyViewerState.index + 1);
    });

    return overlay;
  }

  function updateStoryViewer(nextIndex = 0) {
    const playlist = storyViewerState.playlist;
    if (!playlist.length) return;
    const index = (nextIndex + playlist.length) % playlist.length;
    const item = playlist[index];
    storyViewerState.index = index;

    const overlay = ensureStoryViewerOverlay();
    const video = $("#v8StoryViewerVideo", overlay);
    const source = video?.querySelector("source");
    const read = $("#v8StoryViewerRead", overlay);
    if (!item || !video || !source) return;

    source.src = item.src;
    source.type = videoTypeFor(item.src);
    video.poster = item.poster || item.fallbackPoster || "";
    video.dataset.v8VideoPosterSrc = item.src;
    video.dataset.v8VideoFallback = item.fallbackPoster || item.poster || "";
    $("#v8StoryViewerLabel", overlay).textContent = item.label || "TV CZS";
    $("#v8StoryViewerTitle", overlay).textContent = item.title || "Story CZS";
    $("#v8StoryViewerText", overlay).textContent = item.text || "";

    if (read) {
      if (item.storySlug) {
        read.hidden = false;
        read.href = v8Url({ slug: item.storySlug });
        read.dataset.v8Slug = item.storySlug;
      } else {
        read.hidden = true;
        read.removeAttribute("data-v8-slug");
      }
    }

    video.load();
    refreshVideoFrames(overlay);
    video.play().catch(() => {});
  }

  function openStoryViewer(item, playlist = []) {
    const list = playlist.length ? playlist : storyViewerState.playlist;
    const index = typeof item === "number" ? item : list.findIndex((entry) => entry.id === item?.id);
    storyViewerState.playlist = list;
    ensureStoryViewerOverlay().classList.add("is-open");
    document.body.classList.add("v8-story-viewer-open");
    updateStoryViewer(index >= 0 ? index : 0);
  }

  function closeStoryViewer() {
    const overlay = $("#v8StoryViewer");
    const video = $("#v8StoryViewerVideo", overlay || document);
    if (video) video.pause();
    overlay?.classList.remove("is-open");
    document.body.classList.remove("v8-story-viewer-open");
  }

  function apiFetchJson(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeout || 6500);
    return fetch(url, {
      cache: options.cache || "no-store",
      credentials: "same-origin",
      signal: controller.signal,
      ...options.fetch,
    })
      .then((response) => response.json().then((payload) => ({ ok: response.ok, status: response.status, payload })))
      .finally(() => clearTimeout(timer));
  }

  function apiPostJson(url, body, options = {}) {
    return apiFetchJson(url, {
      ...options,
      fetch: {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
        body: JSON.stringify(body || {}),
        ...(options.fetch || {}),
      },
    });
  }

  const isUrgent = (story) =>
    /urgente|alerta|cheia|temporal|policia|polícia|acidente|desaparece|pris/i.test(
      [story?.category, story?.title, story?.summary].join(" ")
    );

  const localScore = (story) => {
    const text = [story?.title, story?.subtitle, story?.summary, story?.category, story?.sourceName]
      .join(" ")
      .toLowerCase();
    let score = Number(story?.priority || 0);
    if (/cruzeiro do sul|vale do jurua|juruá|mancio lima|mâncio lima|rodrigues alves|marechal thaumaturgo|porto walter/.test(text)) score += 900;
    if (/acre|rio branco|tarauaca|tarauacá|feijo|feijó/.test(text)) score += 360;
    if (/prefeitura|saude|saúde|educacao|educação|seguranca|segurança|tempo|rio|servico|serviço|vaga|emprego|concurso/.test(text)) score += 220;
    if (isUrgent(story)) score += 500;
    return score;
  };

  const heroStories = allStories
    .slice()
    .sort((a, b) => localScore(b) - localScore(a))
    .slice(0, 8);

  const opportunityStories = allStories
    .filter((story) => isOpportunityStory(story))
    .sort((a, b) => localScore(b) - localScore(a))
    .slice(0, 9);

  const v8Url = (story) => {
    const url = new URL(location.href);
    url.hash = `noticia=${encodeURIComponent(story?.slug || "")}`;
    return url.toString();
  };

  const toast = (message) => {
    const node = $("#toast");
    if (!node) return;
    node.textContent = message;
    node.classList.add("on");
    clearTimeout(window.__v8ToastTimer);
    window.__v8ToastTimer = setTimeout(() => node.classList.remove("on"), 2400);
  };

  const sourceName = (story) => story?.sourceName || "Fonte informada";
  const storyDate = (story) => story?.date || "Atualizado agora";
  const readMin = (story) => story?.readMin || 2;
  const archiveDateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  const archiveMonthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

  const normalizeText = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  function storyTimestamp(story) {
    const raw = story?.publishedAt || story?.date || story?.capturedAt || "";
    const parsed = Date.parse(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function storyDateObject(story) {
    const stamp = storyTimestamp(story);
    return stamp ? new Date(stamp) : null;
  }

  function archiveDateLabel(story) {
    const date = storyDateObject(story);
    return date ? archiveDateFormatter.format(date).replace(".", "") : storyDate(story);
  }

  function archiveMonthKey(story) {
    const date = storyDateObject(story);
    if (!date) return "sem-data";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  function archiveMonthLabel(key) {
    if (key === "sem-data") return "Sem data";
    const [year, month] = key.split("-").map(Number);
    return archiveMonthFormatter.format(new Date(year, month - 1, 1));
  }

  function isOpportunityStory(story) {
    const text = [story?.title, story?.subtitle, story?.summary, story?.category, story?.sourceName]
      .join(" ")
      .toLowerCase();
    return /\b(sine|emprego|trabalho|mercado de trabalho|est[aá]gio|estagi[aá]rio|jovem aprendiz|aprendiz|concurso|processo seletivo|seletivo|edital|convoca[cç][aã]o|convoca|contrata[cç][aã]o|contratar|qualifica[cç][aã]o profissional|oportunidade profissional|vagas? de emprego)\b/i.test(text);
  }

  function opportunityLabel(story) {
    const text = [story?.title, story?.subtitle, story?.summary].join(" ").toLowerCase();
    if (/concurso|edital|processo seletivo|seletivo|convoca/i.test(text)) return "Concurso";
    if (/est[aá]gio|estagi[aá]rio|aprendiz/i.test(text)) return "Estágio";
    if (/curso|qualifica[cç][aã]o/i.test(text)) return "Curso";
    return "Vaga";
  }

  const iconSvg = (name) => {
    const icons = {
      home: "<path d=\"M4 11.5 12 5l8 6.5V20h-5v-5H9v5H4z\"/>",
      news: "<path d=\"M5 5h11l3 3v11H5z\"/><path d=\"M8 9h7M8 13h8M8 16h5\"/>",
      pulse: "<path d=\"M4 12h4l2-5 4 10 2-5h4\"/>",
      grid: "<path d=\"M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5zM13 13h6v6h-6z\"/>",
      megaphone: "<path d=\"M5 14h3l9 4V6L8 10H5z\"/><path d=\"M8 14v4\"/>",
      star: "<path d=\"m12 4 2.2 4.7 5.1.7-3.7 3.6.9 5.1-4.5-2.5-4.5 2.5.9-5.1-3.7-3.6 5.1-.7z\"/>",
      archive: "<path d=\"M5 7h14v13H5z\"/><path d=\"M4 4h16v3H4zM9 11h6\"/>",
      chat: "<path d=\"M5 6h14v10H9l-4 4z\"/>",
      play: "<path d=\"M8 5v14l11-7z\"/>",
      bag: "<path d=\"M6 8h12l-1 12H7z\"/><path d=\"M9 8a3 3 0 0 1 6 0\"/>",
      read: "<path d=\"M5 5h6a4 4 0 0 1 4 4v10H9a4 4 0 0 0-4-4z\"/><path d=\"M19 5h-4a4 4 0 0 0-4 4\"/>",
      cheffe: "<path d=\"M12 4v16M4 12h16\"/><path d=\"M7 7h10v10H7z\"/>",
      pool: "<circle cx=\"7.2\" cy=\"16.8\" r=\"2.2\"/><circle cx=\"12\" cy=\"12\" r=\"2.2\"/><circle cx=\"16.8\" cy=\"16.8\" r=\"2.2\"/><path d=\"M5 5l14 14\"/><path d=\"M18 4l-4.2 4.2\"/>",
      trend: "<path d=\"M4 17h16\"/><path d=\"M6 15l4-4 3 3 5-7\"/><path d=\"M15 7h3v3\"/>",
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.news}</svg>`;
  };

  function installBrandIdentity() {
    const brand = $(".brand");
    if (brand && !brand.dataset.v8Brand) {
      brand.dataset.v8Brand = "tabloid";
      brand.setAttribute("aria-label", "Catálogo CZS, jornal do Vale do Juruá");
    }
    const brandImg = brand?.querySelector("img");
    if (brandImg) {
      brandImg.src = BRAND_HORIZONTAL;
      brandImg.alt = "Catálogo CZS - informação que conecta";
    }
    brand?.querySelector(".v8-play-cta")?.remove();

    const topLabel = $(".top-strip div");
    if (topLabel) topLabel.innerHTML = "<b>Vale do Juruá em movimento</b>";

    const topNav = $(".top-strip nav");
    if (topNav && !topNav.dataset.v8QuickLinks) {
      topNav.dataset.v8QuickLinks = "1";
      $$("a", topNav).forEach((link) => {
        if (/chefe|cheffe/i.test(link.textContent || link.href)) {
          link.textContent = "Sistema admin";
          link.href = "#cheffeCallEditor";
          link.classList.add("v8-admin-link");
        }
      });
      [
        ["Galeria", "#galeriaFotos"],
        ["TV CZS", "#videos"],
        ["Área jovem", "#areaJovem"],
      ].forEach(([label, href]) => {
        if (topNav.querySelector(`a[href="${href}"]`)) return;
        const link = document.createElement("a");
        link.href = href;
        link.textContent = label;
        topNav.appendChild(link);
      });
    }

    const mainNav = $(".nav");
    if (mainNav && !mainNav.dataset.v8ExtraLinks) {
      mainNav.dataset.v8ExtraLinks = "1";
      [
        ["Galeria", "#galeriaFotos"],
        ["TV CZS", "#videos"],
        ["Jovem", "#areaJovem"],
      ].forEach(([label, href]) => {
        if (mainNav.querySelector(`a[href="${href}"]`)) return;
        const link = document.createElement("a");
        link.href = href;
        link.textContent = label;
        mainNav.appendChild(link);
      });
    }

    const loaderTitle = $(".loader-core h2");
    const loaderText = $(".loader-core p");
    const loaderLogo = $(".loader-logo");
    if (loaderLogo) {
      loaderLogo.classList.add("v8-loader-source-logo");
      loaderLogo.src = BRAND_INTRO;
      loaderLogo.alt = "Catálogo CZS";
      loaderLogo.hidden = false;
      loaderLogo.removeAttribute("aria-hidden");
    }
    const loaderCore = $(".loader-core");
    if (loaderCore && !$(".v8-loader-brand-logo", loaderCore)) {
      const introBrand = document.createElement("img");
      introBrand.className = "v8-loader-brand-logo";
      introBrand.src = BRAND_INTRO;
      introBrand.alt = "Catálogo CZS";
      loaderCore.insertBefore(introBrand, loaderCore.querySelector(".southern-cross") || loaderCore.querySelector("h2") || loaderCore.firstChild);
    }
    if (loaderCore && !$(".v8-loader-video-scene", loaderCore)) {
      const videoScene = document.createElement("div");
      videoScene.className = "v8-loader-video-scene";
      videoScene.setAttribute("aria-label", "Vídeo de abertura do Catálogo CZS");
      videoScene.innerHTML = `
        <video class="v8-loader-video" src="${INTRO_VIDEO}" muted playsinline autoplay loop preload="auto"></video>
        <span class="v8-loader-video-label">carregando o jornal do vale</span>`;
      const progressTrack = loaderCore.querySelector(".loader-track");
      loaderCore.insertBefore(videoScene, progressTrack || loaderCore.querySelector("h2") || null);
    }
    if (loaderTitle) loaderTitle.textContent = "VALE DO JURUÁ ACORDA";
    if (loaderText) loaderText.textContent = "NOTÍCIAS, SERVIÇOS E ALERTAS ENTRAM EM ÓRBITA.";

    const loader = $("#cinematicLoader");
    if (loader && !$(".v8-star-rush", loader)) {
      const rush = document.createElement("div");
      rush.className = "v8-star-rush";
      rush.setAttribute("aria-hidden", "true");
      rush.innerHTML = Array.from({ length: 42 }, (_, index) => {
        const x = (index * 37) % 101;
        const y = (index * 19) % 101;
        const delay = ((index % 11) * -0.32).toFixed(2);
        const scale = (0.55 + (index % 7) * 0.12).toFixed(2);
        return `<i style="--x:${x}%;--y:${y}%;--d:${delay}s;--s:${scale}"></i>`;
      }).join("");
      loader.appendChild(rush);
    }
    if (loader && !$(".v8-star-swarm", loader)) {
      const swarm = document.createElement("div");
      swarm.className = "v8-star-swarm";
      swarm.setAttribute("aria-hidden", "true");
      swarm.innerHTML = Array.from({ length: 220 }, (_, index) => {
        const angle = (index * 137.508) % 360;
        const radius = 32 + ((index * 29) % 68);
        const x = 50 + Math.cos(angle * Math.PI / 180) * radius;
        const y = 50 + Math.sin(angle * Math.PI / 180) * radius;
        const depth = 0.35 + (index % 9) * 0.11;
        const tz = Math.round(depth * 92);
        const tzFar = Math.round(depth * 220);
        const tzBlast = Math.round(depth * 330);
        const delay = ((index % 37) * -0.055).toFixed(3);
        const hue = index % 17 === 0 ? "gold" : index % 7 === 0 ? "blue" : "white";
        return `<i data-hue="${hue}" style="--x:${x.toFixed(2)}%;--y:${y.toFixed(2)}%;--dx:${(50 - x).toFixed(2)}vw;--dy:${(50 - y).toFixed(2)}vh;--tz:${tz}px;--tz-far:${tzFar}px;--tz-blast:${tzBlast}px;--z:${depth.toFixed(2)};--d:${delay}s"></i>`;
      }).join("");
      loader.prepend(swarm);
    }
    if (loader && !$(".v8-intro-flash", loader)) {
      const flash = document.createElement("div");
      flash.className = "v8-intro-flash";
      flash.setAttribute("aria-hidden", "true");
      loader.appendChild(flash);
    }
    if (loader && !$(".v8-intro-core", loader)) {
      const core = document.createElement("div");
      core.className = "v8-intro-core";
      core.setAttribute("aria-hidden", "true");
      loader.appendChild(core);
    }
    if (loader && !$(".v8-intro-streaks", loader)) {
      const streaks = document.createElement("div");
      streaks.className = "v8-intro-streaks";
      streaks.setAttribute("aria-hidden", "true");
      streaks.innerHTML = Array.from({ length: 28 }, (_, index) => {
        const angle = (index * 29) % 360;
        const dist = 90 + ((index * 17) % 210);
        const delay = ((index % 16) * -.05).toFixed(2);
        const tone = index % 3 === 0 ? "gold" : "blue";
        return `<i data-tone="${tone}" style="--angle:${angle}deg;--dist:${dist}px;--delay:${delay}s"></i>`;
      }).join("");
      loader.appendChild(streaks);
    }
    if (loader && !$(".v8-intro-orbits", loader)) {
      const orbits = document.createElement("div");
      orbits.className = "v8-intro-orbits";
      orbits.setAttribute("aria-hidden", "true");
      orbits.innerHTML = Array.from({ length: 5 }, (_, index) => `<i style="--i:${index};--d:${(index * -.42).toFixed(2)}s"></i>`).join("");
      loader.appendChild(orbits);
    }
    if (loader && !$(".v8-intro-chips", loader)) {
      const chips = document.createElement("div");
      chips.className = "v8-intro-chips";
      chips.setAttribute("aria-hidden", "true");
      [
        ["Notícias", "news"],
        ["Serviços", "grid"],
        ["Galeria", "star"],
        ["TV", "play"],
        ["Jovem", "pulse"],
        ["Pesquisa", "trend"],
      ].forEach(([label, icon], index) => {
        const chip = document.createElement("span");
        chip.style.setProperty("--i", index);
        chip.innerHTML = `${iconSvg(icon)}<b>${esc(label)}</b>`;
        chips.appendChild(chip);
      });
      loader.appendChild(chips);
    }
    if (loader && !$(".v8-loader-welcome", loader)) {
      const welcome = document.createElement("aside");
      welcome.className = "v8-loader-welcome";
      welcome.setAttribute("aria-label", "Boas-vindas da RAyL");
      welcome.innerHTML = `
        <span class="v8-loader-avatar-crop"><img src="${AYLLA_LOADER_POSES[0][0]}" alt="RAyL CZS" data-loader-aylla></span>
        <span class="v8-loader-copy"><b>RAyL CZS</b><span>${esc(AYLLA_LOADER_POSES[0][1])}</span></span>`;
      loader.appendChild(welcome);
    }
    if (loader && !$(".v8-loader-status", loader)) {
      const status = document.createElement("div");
      status.className = "v8-loader-status";
      status.setAttribute("aria-live", "polite");
      status.textContent = "Iniciando órbita editorial.";
      loader.appendChild(status);
    }

    const navMap = [
      ["Início", "home"],
      ["Notícias", "news"],
      ["Últimas", "pulse"],
      ["Serviços", "grid"],
      ["Anuncie", "megaphone"],
      ["Divulgue", "megaphone"],
      ["Cultura & Social", "star"],
      ["Festas & Social", "star"],
      ["Arquivo", "archive"],
      ["Comunidade", "chat"],
      ["Entretenimento", "play"],
      ["Galeria", "star"],
      ["TV CZS", "play"],
      ["Jovem", "pulse"],
      ["Comercial", "bag"],
    ];
    $$(".nav a").forEach((link) => {
      if (link.dataset.v8Iconified) return;
      const text = link.textContent.trim();
      const icon = navMap.find(([label]) => label === text)?.[1];
      if (!icon) return;
      link.dataset.v8Iconified = "1";
      link.innerHTML = `<span class="v8-nav-glyph">${iconSvg(icon)}</span><span>${esc(text)}</span>`;
    });

    const chipIcons = ["pulse", "grid", "read", "star", "archive", "bag", "pulse", "home"];
    $$(".utility-row .chip").forEach((chip, index) => {
      if (chip.dataset.v8Iconified) return;
      chip.dataset.v8Iconified = "1";
      chip.innerHTML = `<span class="v8-chip-glyph">${iconSvg(chipIcons[index] || "news")}</span><span>${esc(chip.textContent.trim())}</span>`;
    });
  }

  function installHeaderNewsCrawl() {
    const row = $(".brandrow");
    if (!row || $(".v8-header-crawl", row)) return;
    const source = (allStories.length ? allStories : heroStories).filter(Boolean).slice(0, 12);
    if (!source.length) return;
    const items = source.map((story) => `
      <a href="${esc(v8Url(story))}" data-v8-slug="${esc(story.slug || "")}">
        <b>${esc(story.category || "Plantão")}</b>
        <span>${esc(story.title || "Notícia do Vale do Juruá")}</span>
      </a>`).join("");
    const crawl = document.createElement("div");
    crawl.className = "v8-header-crawl";
    crawl.setAttribute("aria-label", "Manchetes em movimento");
    crawl.innerHTML = `
      <span class="v8-header-crawl-label">Plantão</span>
      <div class="v8-header-crawl-viewport">
        <div class="v8-header-crawl-track">${items}${items}</div>
      </div>`;
    const search = $(".search", row);
    if (search) {
      row.insertBefore(crawl, search);
    } else {
      row.appendChild(crawl);
    }
    const legacyTrack = $("#tickerTrack");
    if (legacyTrack && legacyTrack.dataset.v8TickerFilled !== "1") {
      legacyTrack.dataset.v8TickerFilled = "1";
      const legacyItems = source.map((story) => `
        <a class="ticker-item" href="${esc(v8Url(story))}" data-v8-slug="${esc(story.slug || "")}">
          <b>${esc(story.category || "Plantão")}</b>
          <span>${esc(story.title || "Notícia do Vale do Juruá")}</span>
        </a>`).join("");
      legacyTrack.innerHTML = legacyItems + legacyItems;
    }
  }

  function decorateBrandMarks() {
    [
      ".brand",
      ".loader-core.cosmic-core",
      ".v8-footer-logo",
    ].forEach((selector) => {
      const mark = $(selector);
      if (!mark || mark.dataset.v8BrandFx) return;
      mark.dataset.v8BrandFx = "1";
      const sparks = document.createElement("span");
      sparks.className = "v8-brand-sparks";
      sparks.setAttribute("aria-hidden", "true");
      sparks.innerHTML = "<i></i><i></i><i></i><i></i>";
      mark.appendChild(sparks);
    });
  }

  function installSideParticles() {
    const sky = $(".tech-sky");
    if (!sky || sky.dataset.v8SideParticles) return;
    sky.dataset.v8SideParticles = "1";
    const river = document.createElement("div");
    river.className = "v8-editorial-riverline";
    river.setAttribute("aria-hidden", "true");
    river.innerHTML = "<i></i><i></i><i></i>";
    sky.appendChild(river);

    const signal = document.createElement("div");
    signal.className = "v8-editorial-signal";
    signal.setAttribute("aria-hidden", "true");
    signal.innerHTML = Array.from({ length: 18 }, (_, index) => {
      const x = 4 + ((index * 23) % 92);
      const y = 10 + ((index * 31) % 78);
      const delay = ((index % 9) * -.42).toFixed(2);
      return `<i style="--x:${x}%;--y:${y}%;--d:${delay}s"></i>`;
    }).join("");
    sky.appendChild(signal);

    const notes = document.createElement("div");
    notes.className = "v8-editorial-ghost-notes";
    notes.setAttribute("aria-hidden", "true");
    ["Plantão local", "Serviços", "Galeria", "TV CZS"].forEach((label, index) => {
      const note = document.createElement("span");
      note.style.setProperty("--i", index);
      note.textContent = label;
      notes.appendChild(note);
    });
    sky.appendChild(notes);
  }

  function installCopyPolish() {
    const copy = [
      ["#searchInput", "placeholder", "Buscar notícia, bairro ou serviço"],
      ["#latestThreeColumns .section-kicker", "text", "Últimas notícias"],
      ["#latestThreeColumns .section-head h2", "text", "O que muda o dia no Vale do Juruá"],
      ["#latestThreeColumns .section-head .btn", "text", "Ver arquivo"],
      ["#wireList", "prevHeading", "Plantão em ordem"],
      ["#feed .section-kicker", "text", "Todas as notícias"],
      ["#feed .section-head h2", "text", "Últimas atualizações"],
      ["#feed .section-head p", "text", ""],
      ["#footerJumpInline", "text", "Mapa do site"],
      ["#arquivoArtigoSystem .section-kicker", "text", "Arquivo CZS"],
      ["#arquivoArtigoSystem .panel:first-child h2", "text", "Matérias antigas"],
      ["#arquivoArtigoSystem .panel:first-child p", "text", ""],
      ["#articlePreviewTitle", "text", "Escolha uma notícia"],
      ["#articlePreviewText", "text", ""],
      ["#articlePreviewLink", "text", "Ler"],
      ["#markBadImageBtn", "text", "Enviar para revisão"],
      ['#pubpaidAtalhos .shortcut-card.game b', "text", "Pesquisa eleitoral"],
      ['#pubpaidAtalhos .shortcut-card.game p', "text", "Acesse a pesquisa pronta, acompanhe dados e veja resultados."],
      ['#pubpaidAtalhos .section-kicker', "text", "Pesquisas políticas e dados"],
      ["#servicos .section-kicker", "text", "Serviços para o leitor"],
      ["#servicos .section-head h2", "text", "Serviços úteis"],
      ["#infosGerais .section-kicker", "text", "Mapa do jornal"],
      ["#infosGerais .section-head h2", "text", "Mapa do CZS"],
      ["#videos .section-kicker", "text", "Vídeos e bastidores"],
      ["#videos .section-head h2", "text", "Veja antes de compartilhar"],
      ["#galeriaFotos .section-kicker", "text", "Galeria do Vale"],
      ["#galeriaFotos .section-head h2", "text", "Fotos do Vale"],
      ["#galeriaFotos .section-head p", "text", ""],
      ["#galeriaFotos .btn", "text", "Ver galeria"],
      ["#comunidade .section-kicker", "text", "Pauta do bairro"],
      ["#comunidade h2", "text", "Sua pauta"],
      ["#comunidade p", "text", ""],
      ["#communityText", "placeholder", "Ex.: rua sem iluminação, atendimento de saúde, escola, evento, risco no bairro..."],
      ["#communityBtn", "text", "Enviar pauta"],
      ["#assistantInline .section-kicker", "text", "Atendimento ao leitor"],
      ["#assistantInline h2", "text", "Pergunte ao CZS"],
      ["#assistantInline p", "text", ""],
      ["#newsletter .section-kicker", "text", "Resumo do dia"],
      ["#newsletter h2", "text", "Resumo grátis"],
      ["#newsletter p", "text", ""],
      ["#fundadores .section-kicker", "text", "Apoio local"],
      ["#fundadores h2", "text", "Apoiadores"],
      ["#fundadores p", "text", ""],
      ["#fundadores .btn", "text", "Ver apoiadores"],
      ["#footerMiniStatus", "text", "Mapa, notícias e serviços."],
      ["#fullSiteFooter .section-kicker", "text", "Mapa completo"],
      ["#fullSiteFooter h2", "text", "Tudo do Catálogo CZS"],
      ["#fullSiteFooter .footer-full-head p", "text", ""],
      ["#syncBtn", "text", "Atualizar notícias"],
      ["#footerJumpTop", "text", "Mapa do site"],
      ["#footerJumpBtn", "text", "Mapa do site"],
      ["#footerJumpFeed", "text", "Mapa do site"],
      ["#syncStatus", "text", "Arquivo CZS: 1610 notícias • amostra local: 1000"],
    ];

    copy.forEach(([selector, mode, value]) => {
      const node = $(selector);
      if (!node) return;
      if (mode === "placeholder") node.setAttribute("placeholder", value);
      if (mode === "text") node.textContent = value;
      if (mode === "prevHeading") {
        const heading = node.closest(".panel")?.querySelector("h3");
        if (heading) heading.textContent = value;
      }
    });
    trimRedundantCopy();

    const serviceCopy = [
      ["Serviços públicos", "Telefones, saúde, atendimento, prazos e orientação para resolver a vida na cidade."],
      ["Vagas publicadas", "Matérias com Sine, seletivos, concursos, estágios e cursos quando houver fonte publicada."],
      ["Concursos", "Editais, inscrições e prazos que o leitor precisa acompanhar."],
      ["Agenda cultural", "Eventos, feiras, esporte e programação regional sem caça ao link."],
      ["Galeria visual", "Fotos do cotidiano, da comunidade e das matérias do dia."],
      ["Catálogo telefônico", "Contatos úteis reunidos para consulta rápida."],
      ["Participação da comunidade", "Bairros, relatos e sugestões de pauta com caminho claro para a redação."],
      ["Escritórios de agentes", "Entrada visual para os agentes autônomos e personagens do projeto."],
    ];
    $$("#servicos .service-card").forEach((card, index) => {
      const item = serviceCopy[index];
      if (!item) return;
      const title = card.querySelector("b");
      const text = card.querySelector("p");
      if (title) title.textContent = item[0];
      if (text) text.textContent = item[1];
    });
  }

  function trimRedundantCopy(root = document) {
    $$(".section-head", root).forEach((head) => {
      if (!head.querySelector(".section-kicker")) return;
      head.querySelectorAll("h2, p").forEach((node) => {
        node.hidden = true;
        node.setAttribute("aria-hidden", "true");
      });
    });
    const selectors = [
      ".section-head p",
      ".footer-full-head p",
      "#articlePreviewText",
      "#assistantInline p",
      "#newsletter p",
      "#fundadores p",
      "#comunidade p",
      "#arquivoArtigoSystem .panel:first-child p",
    ];
    selectors.forEach((selector) => {
      $$(selector, root).forEach((node) => {
        if (!node.textContent.trim()) {
          node.hidden = true;
          node.setAttribute("aria-hidden", "true");
          return;
        }
        const text = node.textContent.trim();
        if (/^(role para|as imagens entram|use para|not[ií]cias, servi[cç]os|no fim da leitura|acompanhe hist[oó]rico|clique em uma mat[eé]ria|envie um problema)/i.test(text)) {
          node.hidden = true;
          node.setAttribute("aria-hidden", "true");
        }
      });
    });
  }

  function installReader() {
    if ($("#v8Reader")) return;
    const reader = document.createElement("section");
    reader.id = "v8Reader";
    reader.className = "v8-reader";
    reader.setAttribute("aria-label", "Leitor V8 de matéria");
    reader.innerHTML = `
      <article class="v8-reader-shell" role="dialog" aria-modal="true">
        <div class="v8-reader-top">
          <button type="button" id="v8ReaderClose">Voltar ao jornal</button>
          <div class="v8-reader-actions">
            <button type="button" id="v8ReaderShare">Compartilhar</button>
            <button type="button" id="v8ReaderReport">Enviar para revisão</button>
            <a id="v8ReaderSource" href="#feed" target="_blank" rel="noopener">Fonte original</a>
          </div>
        </div>
        <section class="v8-reader-hero">
          <div class="v8-reader-copy">
            <span class="badge" id="v8ReaderCategory">Notícia</span>
            <h1 id="v8ReaderTitle"></h1>
            <p id="v8ReaderSubtitle"></p>
            <div class="meta" id="v8ReaderMeta"></div>
          </div>
        </section>
        <section class="v8-reader-context">
          <div class="v8-reader-media">
            <div class="v8-reader-media-frame" id="v8ReaderMedia"></div>
          </div>
          <aside class="v8-reader-info">
            <div class="v8-editorial-blocks" id="v8ReaderBlocks"></div>
          </aside>
        </section>
        <section class="v8-reader-body">
          <article class="v8-reader-article" id="v8ReaderArticle"></article>
          <aside class="v8-reader-related">
            <br>
            <h3>Continue no mesmo assunto</h3>
            <div class="v8-related-list" id="v8ReaderRelated"></div>
          </aside>
        </section>
        <section class="v8-reader-ad-grid" aria-label="Áreas de divulgação">
          <a class="v8-reader-ad v8-reader-ad-wide" href="#monetizacao">
            <span>Publicidade premium</span>
            <b>Topo, meio da leitura e cards nativos para marcas locais.</b>
          </a>
          <a class="v8-reader-ad" href="#monetizacao">
            <span>Comércio local</span>
            <b>Oferta do dia, serviço ou campanha com contexto editorial.</b>
          </a>
          <a class="v8-reader-ad" href="#newsletter">
            <span>Resumo grátis</span>
            <b>Leitor recebe notícias e oportunidades sem sair do CZS.</b>
          </a>
        </section>
      </article>`;
    document.body.appendChild(reader);

    $("#v8ReaderClose").addEventListener("click", closeReader);
    reader.addEventListener("click", (event) => {
      if (event.target === reader) closeReader();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && reader.classList.contains("is-open")) closeReader();
    });
  }

  function pageTurn(direction = "open", onMidpoint) {
    const old = $("#v8PageTurn");
    if (old) old.remove();
    const layer = document.createElement("div");
    layer.id = "v8PageTurn";
    layer.className = `v8-page-turn v8-page-turn--${direction}`;
    layer.setAttribute("aria-hidden", "true");
    layer.innerHTML = "<span></span><i></i><b></b>";
    document.body.appendChild(layer);
    document.body.classList.add("v8-page-is-turning");
    window.setTimeout(() => {
      layer.classList.add("is-midpoint");
      if (typeof onMidpoint === "function") onMidpoint();
    }, 520);
    window.setTimeout(() => {
      layer.classList.add("is-leaving");
      document.body.classList.remove("v8-page-is-turning");
    }, 1080);
    window.setTimeout(() => layer.remove(), 1320);
  }

  function articleParagraphs(story) {
    const body = Array.isArray(story?.body)
      ? story.body.filter(Boolean)
      : String(story?.fullText || story?.content || story?.articleBody || "")
        .split(/\n{2,}/)
        .filter(Boolean);
    if (body.length) {
      const cleaned = body
        .map((text, index) => cleanReaderParagraph(story, text, index))
        .filter((text) => text && !genericReaderParagraph(text));
      if (cleaned.length) return cleaned;
    }
    return [
      "Texto completo ainda não foi captado nesta amostra. Use a fonte original enquanto a captura integral é renovada.",
    ];
  }

  function renderReaderArticle(story) {
    const paragraphs = articleParagraphs(story);
    if (!paragraphs.length) return "";
    return paragraphs.map((p, index) => {
      const paragraph = `<p>${esc(p)}</p>`;
      const shouldInsertAd = paragraphs.length > 4 ? index === 2 : index === 0;
      if (shouldInsertAd) {
        return `${paragraph}<aside class="v8-in-article-ad"><span>Divulgação</span><b>Espaço nativo para comércio, serviço público ou campanha local.</b><a href="#monetizacao">Anunciar aqui</a></aside>`;
      }
      return paragraph;
    }).join("");
  }

  function genericReaderParagraph(text) {
    return /novas atualizações oficiais|cruzar com outras fontes regionais|redação automática|ampliar a chamada além|bloqueou o resumo importado/i.test(String(text || ""));
  }

  function cleanReaderParagraph(story, text, index) {
    let value = String(text || "").trim();
    if (index === 0) {
      value = value.replace(
        /^(.+?) registrou em (.+?): (.+?)\. A leitura do CZS parte desse fato confirmado e evita ampliar a chamada alem do que a fonte publicou\.$/i,
        "$3."
      );
    }
    return value
      .replace(/^Segundo\s+[^,]+,\s+em\s+[^:]+:\s*/i, "")
      .replace(/^Impacto pratico:/i, "Por que importa:")
      .replace(/^O que seguir:/i, "Acompanhe:")
      .replace(/Para quem acompanha a rotina local, a prioridade e saber se o assunto muda servico, deslocamento, seguranca, agenda ou decisao publica ainda hoje\.?/gi, "")
      .replace(/Para quem acompanha o Acre, a prioridade e saber se o assunto muda servico, deslocamento, seguranca, agenda ou decisao publica ainda hoje\.?/gi, "")
      .replace(/Para quem acompanha o Vale do Jurua, a prioridade e saber se o assunto muda servico, deslocamento, seguranca, agenda ou decisao publica ainda hoje\.?/gi, "")
      .replace(/A redação manteve o link da fonte original e bloqueou o resumo importado até que uma versão em português esteja pronta\.?/gi, "")
      .replace(/\balem\b/g, "além")
      .replace(/\bpratico\b/g, "prático")
      .replace(/\batualizacoes\b/g, "atualizações")
      .replace(/\bdisponiveis\b/g, "disponíveis")
      .replace(/\bservico\b/g, "serviço")
      .replace(/\bseguranca\b/g, "segurança")
      .replace(/\bdecisao publica\b/g, "decisão pública")
      .replace(/\bconfirmacao\b/g, "confirmação")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  function localImpact(story) {
    const text = [story?.title, story?.summary, story?.category].join(" ").toLowerCase();
    if (/prefeitura|servico|serviço|saude|saúde|educacao|educação|prazo|atendimento/.test(text)) {
      return "Pode afetar atendimento, calendário, serviço público ou decisão prática do morador.";
    }
    if (/tempo|chuva|rio|cheia|friagem|alerta/.test(text)) {
      return "Ajuda o leitor a planejar deslocamento, segurança, saúde e rotina da família.";
    }
    if (/emprego|vaga|concurso|inscri/.test(text)) {
      return "Pode abrir oportunidade ou prazo importante para trabalhadores e estudantes.";
    }
    if (/policia|polícia|acidente|pris|seguranca|segurança/.test(text)) {
      return "Ajuda a entender risco, circulação, segurança no bairro e próximos desdobramentos.";
    }
    return "Mostra o que muda para o leitor e o que acompanhar agora.";
  }

  function openReader(input, push = true) {
    const slug = typeof input === "string" ? input : input?.slug;
    const story = bySlug.get(String(slug || "")) || input || allStories[0];
    if (!story) return;
    installReader();
    const reader = $("#v8Reader");
    reader.dataset.slug = story.slug || "";
    $("#v8ReaderCategory").textContent = isUrgent(story) ? "Urgente" : story.category || "Notícia";
    $("#v8ReaderTitle").textContent = story.title || "Matéria do Catálogo CZS";
    $("#v8ReaderSubtitle").textContent = "";
    $("#v8ReaderSubtitle").hidden = true;
    $("#v8ReaderMeta").innerHTML = `
      <span>${esc(sourceName(story))}</span>
      <span>${esc(storyDate(story))}</span>
      <span>${readMin(story)} min de leitura</span>`;
    const reportButton = $("#v8ReaderReport");
    if (reportButton) {
      const sent = isReviewSent(story.slug || "");
      reportButton.textContent = sent ? "Enviado" : "Enviar para revisão";
      reportButton.classList.toggle("is-review-sent", sent);
      reportButton.setAttribute("aria-pressed", sent ? "true" : "false");
    }
    const media = $("#v8ReaderMedia");
    if (media) media.innerHTML = storyVisualMarkup(story, "eager");
    $("#v8ReaderSource").href = story.sourceUrl || LIVE;
    $("#v8ReaderArticle").innerHTML = renderReaderArticle(story);
    $("#v8ReaderBlocks").innerHTML = [
      ["O fato", story.title || "Matéria selecionada"],
      ["Impacto local", localImpact(story)],
      ["O que acompanhar", "Novas atualizações, confirmação de fonte, efeitos no bairro e próximos prazos."],
      ["Fonte", `${sourceName(story)}. Link original preservado.`],
    ].map(([title, text]) => `<div class="v8-editorial-card"><b>${esc(title)}</b><p>${esc(text)}</p></div>`).join("");
    const related = allStories
      .filter((item) => item.slug !== story.slug && (item.categoryKey === story.categoryKey || item.category === story.category))
      .slice(0, 2);
    $("#v8ReaderRelated").innerHTML = related.map((item) => `
      <a class="v8-related-card" href="${esc(v8Url(item))}" data-v8-slug="${esc(item.slug)}">
        <b>${esc(item.title)}</b>
        <p>${esc(item.category || "Notícia")} • ${esc(storyDate(item))}</p>
      </a>`).join("");
    $("#v8ReaderShare").onclick = () => shareStory(story);
    $("#v8ReaderReport").onclick = () => queueCheffeAction(story, "review");
    reader.classList.remove("is-closing");
    pageTurn("open", () => {
      document.body.classList.add("v8-reader-open");
      reader.classList.add("is-open");
      reader.scrollTop = 0;
    });
    if (push) history.pushState({ v8Reader: true, slug: story.slug }, "", v8Url(story));
  }

  function closeReader() {
    const reader = $("#v8Reader");
    if (reader?.classList.contains("is-open")) {
      reader.classList.add("is-closing");
      pageTurn("back", () => {
        reader.classList.remove("is-open", "is-closing");
        document.body.classList.remove("v8-reader-open");
      });
    } else {
      document.body.classList.remove("v8-reader-open");
    }
    if (location.hash.startsWith("#noticia=")) history.pushState({}, "", location.pathname + location.search);
  }

  function shareStory(story) {
    const url = v8Url(story);
    openSharePanel(story, url);
  }

  function openSharePanel(story, url = v8Url(story)) {
    const title = story?.title || "Notícia do Catálogo CZS";
    const text = `${title} - ${url}`;
    navigator.clipboard?.writeText(text);
    $("#v8SharePanel")?.remove();
    const panel = document.createElement("aside");
    panel.id = "v8SharePanel";
    panel.className = "v8-share-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Compartilhar notícia");
    panel.innerHTML = `
      <button class="v8-share-close" type="button" aria-label="Fechar compartilhamento">×</button>
      <b>Compartilhar notícia</b>
      <p>${esc(title)}</p>
      <div class="v8-share-actions">
        <a class="wa" href="https://wa.me/?text=${encodeURIComponent(text)}" target="_blank" rel="noopener">WhatsApp</a>
        <a class="ig" href="${SOCIAL_INSTAGRAM}" target="_blank" rel="noopener" data-v8-share-instagram>Instagram</a>
        <button type="button" data-v8-share-copy>Copiar link</button>
      </div>`;
    document.body.appendChild(panel);
    const close = () => panel.remove();
    panel.querySelector(".v8-share-close")?.addEventListener("click", close);
    panel.querySelector("[data-v8-share-copy]")?.addEventListener("click", () => {
      navigator.clipboard?.writeText(text);
      toast("Chamada copiada.");
    });
    panel.querySelector("[data-v8-share-instagram]")?.addEventListener("click", () => {
      navigator.clipboard?.writeText(text);
      toast("Chamada copiada para colar no Instagram.");
    });
    setTimeout(() => panel.classList.add("is-on"), 30);
    setTimeout(() => {
      if (document.body.contains(panel)) panel.remove();
    }, 16000);
  }

  function remapLegacyLinks(root = document) {
    const routes = [
      [/\/arquivo\.html/i, "#arquivoArtigoSystem"],
      [/\/catalogo-servicos\.html/i, "#servicos"],
      [/\/cheffe-call\.html/i, "#cheffeCallEditor"],
      [/\/galeria\.html/i, "#galeriaFotos"],
      [/\/divulgue\.html/i, "#monetizacao"],
      [/\/privacidade\.html/i, "#fullSiteFooter"],
      [/\/termos\.html/i, "#fullSiteFooter"],
    ];

    $$("a[href]", root).forEach((anchor) => {
      const href = anchor.getAttribute("href") || "";
      const slug = slugFromHref(href);
      if (slug) {
        anchor.dataset.v8Slug = slug;
        anchor.href = v8Url({ slug });
        return;
      }
      const routeTarget = href.includes(LIVE) ? href : new URL(href, location.href).pathname;
      const matched = routes.find(([pattern]) => pattern.test(routeTarget));
      if (matched) {
        anchor.dataset.v8Remapped = "true";
        anchor.href = matched[1];
      }
    });
  }

  function installClickRouter() {
    document.addEventListener("click", (event) => {
      const heroCheffe = event.target.closest("[data-v8-cheffe]");
      if (heroCheffe) {
        const story = bySlug.get(heroCheffe.dataset.v8Cheffe || "");
        if (story) {
          event.preventDefault();
          event.stopImmediatePropagation();
          queueCheffeAction(story, "review");
          return;
        }
      }

      if (event.target.closest("[data-v8-hero-next], [data-v8-hero-prev], [data-v8-dot], [data-v8-read]")) {
        return;
      }

      const review = event.target.closest("[data-v8-review]");
      if (review) {
        const story = bySlug.get(review.dataset.v8Review || "") || storyFromElement(review);
        if (story) {
          event.preventDefault();
          event.stopImmediatePropagation();
          queueCheffeAction(story, "review");
          return;
        }
      }

      const slugTarget = event.target.closest("[data-v8-slug]");
      if (slugTarget) {
        const story = bySlug.get(slugTarget.dataset.v8Slug);
        if (story) {
          event.preventDefault();
          openReader(story);
          return;
        }
      }

      const anchor = event.target.closest("a[href]");
      const slug = anchor ? slugFromHref(anchor.getAttribute("href") || anchor.href) : "";
      if (slug && bySlug.has(slug)) {
        event.preventDefault();
        openReader(slug);
        return;
      }

      const share = event.target.closest(".shareBtn");
      if (share) {
        const card = share.closest(".news-card");
        const cardSlug = card ? slugFromHref(card.querySelector("a[href]")?.href || "") : "";
        if (cardSlug && bySlug.has(cardSlug)) {
          event.preventDefault();
          event.stopImmediatePropagation();
          shareStory(bySlug.get(cardSlug));
        }
      }

      const report = event.target.closest(".reportBtn");
      if (report) {
        const card = report.closest(".news-card");
        const cardSlug = card ? slugFromHref(card.querySelector("a[href]")?.href || "") : "";
        if (cardSlug && bySlug.has(cardSlug)) {
          event.preventDefault();
          event.stopImmediatePropagation();
          queueCheffeAction(bySlug.get(cardSlug), "review");
        }
      }
    }, true);
  }

  function installGlobalReviewButtons(root = document) {
    const cardSelectors = [
      ".v8-archive-card",
      ".v8-opportunity-card",
      ".v8-related-card",
      ".article-modern-row",
      ".story-row",
      ".news-card",
    ];
    cardSelectors.forEach((selector) => {
      $$(selector, root).forEach((card) => {
        if (card.dataset.v8ReviewReady === "1") return;
        const story = storyFromElement(card);
        if (!story?.slug) return;
        card.dataset.v8ReviewReady = "1";
        const button = document.createElement("button");
        button.type = "button";
        button.className = `small-btn ghost v8-review-mini ${isReviewSent(story.slug) ? "is-review-sent" : ""}`;
        button.dataset.v8Review = story.slug;
        button.textContent = isReviewSent(story.slug) ? "Enviado" : "Revisão";
        button.setAttribute("aria-label", `Enviar ${story.title || "matéria"} para revisão`);
        const actions = card.querySelector(".actions");
        if (actions) actions.appendChild(button);
        else if (card.tagName === "A") card.insertAdjacentElement("afterend", button);
        else card.appendChild(button);
      });
    });
  }

  function renderHero() {
    const lead = $("#leadStory");
    const rail = $("#heroSide");
    if (!lead || !rail || !heroStories.length) return;
    let index = 0;
    let paused = false;
    let touchStart = 0;

    lead.classList.add("v8-live-hero");
    rail.classList.add("v8-hero-rail");
    rail.innerHTML = heroStories.slice(1, 6).map((story, i) => railCard(story, i + 1)).join("");

    const paint = (nextIndex) => {
      index = (nextIndex + heroStories.length) % heroStories.length;
      const story = heroStories[index];
      lead.dataset.v8Slug = story.slug || "";
      lead.innerHTML = `
        <div class="v8-hero-copy">
          <div class="v8-hero-edition"><span>Capa ao vivo</span><span>${index + 1}/${heroStories.length}</span></div>
          <span class="badge ${isUrgent(story) ? "urgent" : ""}">${esc(isUrgent(story) ? "Urgente" : story.category || "Notícia")}</span>
          <h1>${esc(story.title)}</h1>
          <p>${esc(story.subtitle || story.summary || "Acompanhe a atualização principal do CZS.")}</p>
          <div class="v8-impact-line"><b>Impacto para o leitor</b><p>${esc(localImpact(story))}</p></div>
          <div class="meta"><span>${esc(sourceName(story))}</span><span>${esc(storyDate(story))}</span><span>${readMin(story)} min</span></div>
          <div class="v8-hero-tools" aria-label="Ações rápidas da manchete">
            <span>${iconSvg("news")} manchete</span>
            <span>${iconSvg("pulse")} atualização</span>
            <span>${iconSvg("cheffe")} revisão</span>
          </div>
          <div class="v8-hero-controls">
            <button class="v8-icon-btn" type="button" data-v8-hero-prev aria-label="Notícia anterior">
              <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path d="M15 18 9 12l6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <button class="btn" type="button" data-v8-read="${esc(story.slug)}">Ler</button>
            <button class="btn ghost ${isReviewSent(story.slug) ? "is-review-sent" : ""}" type="button" data-v8-cheffe="${esc(story.slug)}">${isReviewSent(story.slug) ? "Enviado" : "Enviar para revisão"}</button>
            <button class="v8-icon-btn" type="button" data-v8-hero-next aria-label="Próxima notícia">
              <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path d="m9 18 6-6-6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <div class="v8-hero-dots">${heroStories.slice(0, 5).map((_, i) => `<button class="v8-hero-dot ${i === Math.min(index, 4) ? "is-active" : ""}" type="button" data-v8-dot="${i}" aria-label="Abrir destaque ${i + 1}"></button>`).join("")}</div>
          </div>
        </div>
        <div class="v8-hero-media">
          <div class="v8-hero-media-frame">${storyVisualMarkup(story, "eager")}</div>
        </div>`;
      $$(".v8-rail-story", rail).forEach((node) => node.classList.toggle("is-active", node.dataset.v8Slug === story.slug));
    };

    const next = () => paint(index + 1);
    const prev = () => paint(index - 1);
    paint(0);
    lead.addEventListener("click", (event) => {
      if (event.target.closest("[data-v8-hero-next]")) next();
      if (event.target.closest("[data-v8-hero-prev]")) prev();
      const dot = event.target.closest("[data-v8-dot]");
      if (dot) paint(Number(dot.dataset.v8Dot || 0));
      const read = event.target.closest("[data-v8-read]");
      if (read) {
        event.preventDefault();
        event.stopPropagation();
        openReader(read.dataset.v8Read);
        return;
      }
      const cheffe = event.target.closest("[data-v8-cheffe]");
      if (cheffe) {
        event.preventDefault();
        event.stopPropagation();
        queueCheffeAction(bySlug.get(cheffe.dataset.v8Cheffe), "review");
        return;
      }
    });
    rail.addEventListener("click", (event) => {
      const item = event.target.closest(".v8-rail-story");
      if (!item) return;
      event.preventDefault();
      const idx = heroStories.findIndex((story) => story.slug === item.dataset.v8Slug);
      if (idx >= 0) paint(idx);
    });
    lead.addEventListener("pointerenter", () => { paused = true; });
    lead.addEventListener("pointerleave", () => { paused = false; });
    lead.addEventListener("touchstart", (event) => { touchStart = event.touches[0].clientX; }, { passive: true });
    lead.addEventListener("touchend", (event) => {
      const delta = event.changedTouches[0].clientX - touchStart;
      if (Math.abs(delta) > 44) delta < 0 ? next() : prev();
    }, { passive: true });
    clearInterval(window.__v8HeroTimer);
    window.__v8HeroTimer = setInterval(() => {
      if (!paused) next();
    }, 6500);
  }

  function railCard(story) {
    return `
      <a class="v8-rail-story" href="${esc(v8Url(story))}" data-v8-slug="${esc(story.slug)}">
        <img src="${esc(storyVideoUrl(story) ? videoPosterFor(story, storyVideoUrl(story)) : imgFor(story))}" alt="${esc(story.title)}" loading="lazy" data-v8-video-poster-src="${esc(storyVideoUrl(story))}" data-v8-video-fallback="${esc(imgFor(story))}" onerror="this.onerror=null;this.src='${esc(realPhotoFor(story))}'">
        <span><b>${esc(story.title)}</b><small>${esc(story.category || "Notícia")} • ${esc(storyDate(story))}</small></span>
      </a>`;
  }

  function reviewedStories() {
    const value = safeRead(REVIEWED_STORIES_KEY, {});
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function isReviewSent(slug = "") {
    return Boolean(slug && reviewedStories()[slug]);
  }

  function markReviewSent(slug = "", action = {}) {
    if (!slug) return;
    const next = {
      ...reviewedStories(),
      [slug]: {
        at: new Date().toISOString(),
        actionId: action.id || "",
        title: action.title || "",
      },
    };
    safeWrite(REVIEWED_STORIES_KEY, next);
    $$(`[data-v8-cheffe="${cssEscape(slug)}"], [data-v8-review="${cssEscape(slug)}"]`).forEach((button) => {
      button.classList.add("is-review-sent");
      button.textContent = "Enviado";
      button.setAttribute("aria-pressed", "true");
    });
    const reader = $("#v8Reader");
    const readerButton = $("#v8ReaderReport");
    if (reader?.dataset.slug === slug && readerButton) {
      readerButton.classList.add("is-review-sent");
      readerButton.textContent = "Enviado";
      readerButton.setAttribute("aria-pressed", "true");
    }
  }

  function patchStoredCheffeAction(actionId, patch = {}) {
    const list = safeRead(CHEFFE_ACTIONS_KEY, []);
    const next = list.map((item) => item.id === actionId ? { ...item, ...patch } : item);
    safeWrite(CHEFFE_ACTIONS_KEY, next);
    renderCheffeCommand();
  }

  async function loadCheffeBackendState() {
    try {
      const result = await apiFetchJson(API.cheffe);
      const payload = result.payload || {};
      if (!result.ok) throw new Error(payload.error || `HTTP ${result.status}`);
      cheffeBackendState = {
        status: "online",
        label: payload.active ? "Backend Cheffe ativo" : "Backend Cheffe conectado",
        detail: payload.lastInstruction || `${payload.sessions || 0} sessões registradas`,
      };
    } catch (error) {
      cheffeBackendState = {
        status: "local",
        label: "Fila local",
        detail: error?.message || "sem resposta do servidor",
      };
    }
    renderCheffeCommand();
  }

  async function syncCheffeAction(action, story = {}) {
    const typeMap = {
      review: ["revisao", "Revisão editorial"],
      triage: ["triagem", "Triagem editorial"],
      correction: ["erro", "Correção"],
      photo: ["foto", "Foto"],
      source: ["fonte", "Fonte"],
    };
    const mapped = typeMap[action.type];
    if (!mapped) return;
    try {
      const result = await apiPostJson(API.editorialCorrections, {
        type: mapped[0],
        typeLabel: mapped[1],
        title: story?.title || action.title,
        slug: story?.slug || action.slug || "",
        sourceUrl: story?.sourceUrl || "",
        imageUrl: story?.imageUrl || story?.feedImageUrl || story?.sourceImageUrl || "",
        articleUrl: action.slug ? `noticia.html?slug=${action.slug}` : location.href,
        note: action.status,
        priority: action.type === "correction" ? "media" : "alta",
      });
      const payload = result.payload || {};
      if (!result.ok || !payload.ok) throw new Error(payload.error || `HTTP ${result.status}`);
      patchStoredCheffeAction(action.id, {
        remoteStatus: "synced",
        remoteLabel: "backend registrado",
        remoteId: payload.correction?.id || "",
      });
      toast("Cheffe registrada no backend");
    } catch (error) {
      patchStoredCheffeAction(action.id, {
        remoteStatus: "local",
        remoteLabel: "fila local",
        remoteError: error?.message || "",
      });
    }
  }

  function queueCheffeAction(story, type) {
    if (!story) story = heroStories[0] || allStories[0];
    const labels = {
      triage: "Triagem editorial aberta",
      review: "Enviado para revisão",
      photo: "Foto enviada para revisão",
      correction: "Correção registrada",
      social: "Captação social preparada",
      source: "Fonte marcada para checagem",
      service: "Serviço marcado para organização",
      commercial: "Comercial marcado para atendimento",
      community: "Pauta comunitária aberta",
      newsletter: "Lead do resumo registrado",
      pubpaid: "PubPaid conectado à fila",
      archive: "Arquivo marcado para filtragem",
    };
    const action = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      at: new Date().toISOString(),
      type,
      title: story?.title || "Matéria selecionada",
      source: sourceName(story),
      slug: story?.slug || "",
      office: type,
      status: labels[type] || "Ação registrada",
      remoteStatus: ["review", "triage", "correction", "photo", "source"].includes(type) ? "pending" : "local",
      remoteLabel: ["review", "triage", "correction", "photo", "source"].includes(type) ? "enviando ao backend" : "fila local",
    };
    const list = safeRead(CHEFFE_ACTIONS_KEY, []);
    list.unshift(action);
    safeWrite(CHEFFE_ACTIONS_KEY, list.slice(0, 48));
    renderCheffeCommand();
    const section = $("#cheffeCallEditor");
    section?.classList.add("v8-highlight-pulse");
    setTimeout(() => section?.classList.remove("v8-highlight-pulse"), 1200);
    const status = $("#cheffeStatus");
    if (status) status.textContent = `${action.status}: ${action.title}`;
    toast(action.status);
    if (story?.slug && (type === "review" || type === "triage" || type === "correction")) {
      markReviewSent(story.slug, action);
    }
    syncCheffeAction(action, story);
  }

  function renderCheffeCommand() {
    const section = $("#cheffeCallEditor");
    if (!section) return;
    section.classList.remove("v8-cheffe-command");
    section.classList.add("v8-reader-offices", "v8-autonomous-agents-gateway");
    const agents = getAutonomousAgentPreviews();
    section.innerHTML = `
      <div class="panel pad v8-offices-workspace v8-agent-gateway" id="agentesAutonomos">
        <div class="section-kicker">Agentes autônomos</div>
        <h2>Escritórios dos agentes</h2>
        <p class="v8-cheffe-lead">Uma porta visual para os agentes autônomos do projeto: personagens, tarefas públicas e rotas úteis, sem rotinas internas no front-end.</p>
        <div class="v8-agent-stage" aria-label="Personagens dos agentes autônomos">
          ${agents.map(agentGatewayCard).join("")}
        </div>
        <div class="v8-agent-public-actions">
          <a class="small-btn" href="#assistantInline">Falar com RAyL</a>
          <a class="small-btn ghost" href="#areaJovem">Ver área jovem</a>
          <a class="small-btn ghost" href="pubpaid.html">Abrir PubPaid</a>
        </div>
        <div class="chat" id="cheffeStatus">Entrada pública para conhecer os agentes e seguir para as áreas abertas do CZS.</div>
      </div>`;
    if (!section.dataset.v8CheffeBound) {
      section.addEventListener("click", onCheffeClick);
      section.addEventListener("submit", onCheffeSubmit);
      section.dataset.v8CheffeBound = "true";
    }
  }

  function getAutonomousAgentPreviews() {
    return [
      {
        title: "RAyL guia",
        text: "leva o leitor para notícias, serviços, mapa e atendimento.",
        img: "assets/aylla/rayl-v2-clean/rayl-v2-walk-full.png",
        href: "#assistantInline",
      },
      {
        title: "Agente do jogo",
        text: "aponta para PubPaid, sinuca, torneios e área jovem.",
        img: "assets/aylla/rayl-v2-clean/rayl-v2-present-full.png",
        href: "pubpaid.html",
      },
      {
        title: "Agente de comunidade",
        text: "encaminha pauta de bairro, fotos e relatos verificáveis.",
        img: "assets/aylla/rayl-v2-clean/rayl-v2-confident-full.png",
        href: "#comunidade",
      },
      {
        title: "Agente visual",
        text: "abre galeria, TV CZS e registros do Vale do Juruá.",
        img: "assets/aylla/rayl-v2-clean/rayl-v2-walk-full.png",
        href: "#galeriaFotos",
      },
    ];
  }

  function agentGatewayCard(agent) {
    return `
      <a class="v8-agent-public-card" href="${esc(agent.href)}">
        <span class="v8-agent-sprite"><img src="${esc(agent.img)}" alt="${esc(agent.title)}" loading="eager" decoding="async"></span>
        <b>${esc(agent.title)}</b>
        <p>${esc(agent.text)}</p>
      </a>`;
  }

  function commandCard(story) {
    return `
      <article class="v8-command-card" data-v8-command-card="${esc(story.slug)}">
        <img src="${esc(imgFor(story))}" alt="${esc(story.title)}" loading="lazy" onerror="this.onerror=null;this.src='${esc(realPhotoFor(story))}'">
        <div>
          <span class="v8-task-status">${esc(isUrgent(story) ? "alta prioridade" : story.category || "notícia")}</span>
          <h3>${esc(story.title)}</h3>
          <p>${esc(localImpact(story))}</p>
          <div class="actions">
            <button class="small-btn" data-v8-command="triage">Priorizar</button>
            <button class="small-btn" data-v8-command="photo">Revisar foto</button>
            <button class="small-btn" data-v8-command="source">Checar fonte</button>
            <button class="small-btn" data-v8-command="social">Gerar chamada</button>
            <button class="small-btn" data-v8-open="${esc(story.slug)}">Ler</button>
          </div>
        </div>
      </article>`;
  }

  function getOfficeDefinitions() {
    const weakPhotos = allStories.filter((story) => weakImage(story.imageUrl || story.feedImageUrl || story.sourceImageUrl)).length;
    const urgent = allStories.filter(isUrgent).length;
    const opportunities = opportunityStories.length;
    const sourceCount = new Set(allStories.map(sourceName)).size;
    return [
      { id: "redacao", title: "Redação", text: "prioridade, impacto local e manchete", metric: `${urgent} urgentes`, action: "Priorizar", href: "#feed", type: "triage", prompt: "Priorize a capa do CZS com foco no Vale do Juruá e diga o que deve subir primeiro." },
      { id: "checagem", title: "Checagem", text: "fonte, data, contexto e risco", metric: `${sourceCount} fontes`, action: "Checar", href: "#arquivoArtigoSystem", type: "source", prompt: "Revise riscos de fonte, data e contexto. Diga o que precisa de confirmação antes de publicar." },
      { id: "foto", title: "Imagens", text: "foto real, vídeo com frame e corte limpo", metric: `${weakPhotos} revisar`, action: "Revisar", href: "#galeriaFotos", type: "photo", prompt: "Analise a fila de imagens, vídeos e galeria. Sugira cortes seguros e quais fotos precisam trocar." },
      { id: "servico", title: "Serviços", text: "telefone, agenda, mapa e utilidade", metric: "guia local", action: "Organizar", href: "#servicos", type: "service", prompt: "Organize serviços úteis do dia para Cruzeiro do Sul: saúde, clima, energia, agenda e prazos." },
      { id: "comercial", title: "Comercial", text: "anúncio, formatos e atendimento", metric: "ads", action: "Abrir", href: "#monetizacao", type: "commercial", prompt: "Monte uma leitura comercial simples: formatos que vendem hoje e próximos contatos." },
      { id: "comunidade", title: "Comunidade", text: "pauta de bairro e colaboração", metric: "pautas", action: "Receber", href: "#comunidade", type: "community", prompt: "Transforme relatos de bairro em fila de pauta verificável, com cuidado para não publicar acusação sem checagem." },
      { id: "pesquisa", title: "Pesquisa e dados", text: "política, opinião e resultados", metric: "ativo", action: "Ver dados", href: "#pubpaidAtalhos", type: "archive", prompt: "Organize pesquisa eleitoral, resultados e dados de opinião sem misturar com entretenimento." },
      { id: "arquivo", title: "Arquivo", text: "mês, semana, dia, fonte e busca", metric: `${DATA.archiveTotal || allStories.length} notícias`, action: "Filtrar", href: "#arquivoArtigoSystem", type: "archive", prompt: "Diga como usar o arquivo para encontrar histórico por fonte, mês e assunto sem confundir o leitor." },
    ];
  }

  function officeCard(def) {
    let active = "";
    try {
      active = localStorage.getItem(`czs-v8-office-${def.id}`) ? " is-active" : "";
    } catch (_) {
      active = "";
    }
    return `
      <article class="v8-office-card${active}" data-office="${esc(def.id)}">
        <span class="v8-task-status">${esc(active ? "ativo" : def.metric)}</span>
        <h3>${esc(def.title)}</h3>
        <p>${esc(def.text)}</p>
        <small>${esc(def.prompt)}</small>
        <div class="actions">
          <button class="small-btn" data-v8-office-run="${esc(def.id)}">${esc(def.action)}</button>
          <button class="small-btn ghost" data-v8-office-ask="${esc(def.id)}">IA local</button>
          <a class="small-btn ghost" href="${esc(def.href)}">Abrir</a>
        </div>
      </article>`;
  }

  function setOfficeAiPrompt(def) {
    if (!def) return;
    const select = $("#v8OfficeSelect");
    const input = $("#v8OfficePrompt");
    if (select) select.value = def.id;
    if (input) input.value = def.prompt || "";
  }

  async function askOfficeAI(officeId, message) {
    const answer = $("#v8OfficeAiAnswer");
    const def = getOfficeDefinitions().find((item) => item.id === officeId) || getOfficeDefinitions()[0];
    if (!def || !message) return;
    if (answer) answer.textContent = `Consultando IA local para ${def.title}...`;
    try {
      const result = await apiPostJson(API.officeAI, {
        officeKey: def.id,
        officeLabel: def.title,
        message,
        context: {
          totalStories: allStories.length,
          archiveTotal: DATA.archiveTotal || allStories.length,
          urgentCount: allStories.filter(isUrgent).length,
          sourceCount: new Set(allStories.map(sourceName)).size,
        },
      }, { timeout: 28000 });
      const payload = result.payload || {};
      if (!result.ok || !payload.ok) throw new Error(payload.error || `HTTP ${result.status}`);
      if (answer) answer.innerHTML = `<b>${esc(payload.ai?.status === "online" ? "IA local respondeu em português" : "Fallback local")}</b><span>${esc(cleanPublicAiText(payload.answer, "Fluxo seguro: registre na Cheffe Call, confirme fonte e execute só depois da revisão."))}</span>`;
      return payload;
    } catch (error) {
      if (answer) answer.innerHTML = `<b>IA local offline</b><span>${esc(error?.message || "Resposta local indisponível.")}</span>`;
      return null;
    }
  }

  async function askCheffeAI(message) {
    const answer = $("#v8CheffeAiAnswer");
    if (!message) return;
    if (answer) answer.textContent = "Consultando IA local da Cheffe...";
    try {
      const result = await apiPostJson(API.cheffeAI, {
        message,
        queue: safeRead(CHEFFE_ACTIONS_KEY, []).slice(0, 10),
        sourcePage: location.pathname + location.search,
      }, { timeout: 28000 });
      const payload = result.payload || {};
      if (!result.ok || !payload.ok) throw new Error(payload.error || `HTTP ${result.status}`);
      if (answer) answer.innerHTML = `<b>${esc(payload.ai?.status === "online" ? "IA local respondeu em português" : "Fallback local")}</b><span>${esc(cleanPublicAiText(payload.answer, "Cheffe local: confirme fonte/data, revise imagem ou vídeo e mantenha a fila registrada antes de publicar."))}</span>`;
      return payload;
    } catch (error) {
      if (answer) answer.innerHTML = `<b>IA local offline</b><span>${esc(error?.message || "Resposta local indisponível.")}</span>`;
      return null;
    }
  }

  function onCheffeSubmit(event) {
    const officeForm = event.target.closest("[data-v8-office-ai-form]");
    if (officeForm) {
      event.preventDefault();
      const data = new FormData(officeForm);
      askOfficeAI(String(data.get("office") || "redacao"), String(data.get("message") || "").trim());
      return;
    }
    const cheffeForm = event.target.closest("[data-v8-cheffe-ai-form]");
    if (cheffeForm) {
      event.preventDefault();
      const data = new FormData(cheffeForm);
      askCheffeAI(String(data.get("message") || "").trim());
    }
  }

  function onCheffeClick(event) {
    const exportQueue = event.target.closest("[data-v8-cheffe-export]");
    if (exportQueue) {
      const stored = safeRead(CHEFFE_ACTIONS_KEY, []);
      const text = stored.length
        ? stored.map((item, index) => `${index + 1}. ${item.status} | ${item.title} | ${item.source || item.type || "CZS"} | ${compactDateTime(item.at)}`).join("\n")
        : "Registro público sem itens.";
      navigator.clipboard?.writeText(text);
      const status = $("#cheffeStatus");
      if (status) status.textContent = `${stored.length} item(ns) copiados para a área de transferência.`;
      toast("Fila copiada");
      return;
    }
    const clearQueue = event.target.closest("[data-v8-cheffe-clear]");
    if (clearQueue) {
      safeWrite(CHEFFE_ACTIONS_KEY, []);
      renderCheffeCommand();
      toast("Fila limpa");
      return;
    }
    const copyItem = event.target.closest("[data-v8-cheffe-copy]");
    if (copyItem) {
      const item = safeRead(CHEFFE_ACTIONS_KEY, []).find((entry) => entry.id === copyItem.dataset.v8CheffeCopy);
      if (item) {
        navigator.clipboard?.writeText(`${item.status}: ${item.title} (${item.source || item.type || "CZS"})`);
        toast("Item copiado");
      }
      return;
    }
    const doneItem = event.target.closest("[data-v8-cheffe-done]");
    if (doneItem) {
      const next = safeRead(CHEFFE_ACTIONS_KEY, []).filter((entry) => entry.id !== doneItem.dataset.v8CheffeDone);
      safeWrite(CHEFFE_ACTIONS_KEY, next);
      renderCheffeCommand();
      toast("Item concluído");
      return;
    }
    const command = event.target.closest("[data-v8-command]");
    if (command) {
      const card = command.closest("[data-v8-command-card]");
      queueCheffeAction(bySlug.get(card?.dataset.v8CommandCard || ""), command.dataset.v8Command);
      return;
    }
    const open = event.target.closest("[data-v8-open]");
    if (open) {
      openReader(open.dataset.v8Open);
      return;
    }
    const office = event.target.closest("[data-v8-office-run]");
    if (office) {
      const def = getOfficeDefinitions().find((item) => item.id === office.dataset.v8OfficeRun);
      safeSetItem(`czs-v8-office-${office.dataset.v8OfficeRun}`, new Date().toISOString());
      queueCheffeAction(heroStories[0] || allStories[0], def?.type || "triage");
      renderCheffeCommand();
      setOfficeAiPrompt(def);
      $("#cheffeStatus").textContent = `${def?.title || "Escritório"} acionado e marcado na fila local.`;
      toast(`${def?.title || "Escritório"} acionado`);
      askOfficeAI(def?.id || "redacao", def?.prompt || "Organize este escritório.");
      if (def?.href) $(def.href)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    const officeAsk = event.target.closest("[data-v8-office-ask]");
    if (officeAsk) {
      const def = getOfficeDefinitions().find((item) => item.id === officeAsk.dataset.v8OfficeAsk);
      setOfficeAiPrompt(def);
      askOfficeAI(def?.id || "redacao", def?.prompt || "Organize este escritório.");
    }
  }

  function renderSystemMap() {
    const target = $("#infosGerais");
    if (!target) return;
    target.classList.add("v8-system-map");
    target.innerHTML = `
      <div class="section-head">
        <div>
          <div class="section-kicker">Mapa do jornal</div>
          <h2>Tudo do jornal agora tem lugar</h2>
        </div>
      </div>
      <div class="v8-system-grid">
        ${systemCard("Notícias", "Feed vivo, hero interativo e leitor V8.", "#feed")}
        ${systemCard("Arquivo", "Histórico por assunto com leitura no mesmo padrão do V8.", "#arquivoArtigoSystem")}
        ${systemCard("Vagas", "Matérias de emprego, concurso e oportunidade com fonte publicada.", "#vagasCzs")}
        ${systemCard("Serviços para o leitor", "Telefones, prazos, agenda e orientação útil.", "#servicos")}
        ${systemCard("Comunidade", "Pauta de bairro e denúncia verificável.", "#comunidade")}
        ${systemCard("Fotos", "Galeria sem cortes agressivos.", "#galeriaFotos")}
        ${systemCard("Vídeos", "Notícias em vídeo, fonte e contexto visual.", "#videos")}
        ${systemCard("Cheffe Call", "Sistema admin restrito, sem painel aberto ao público.", "#agentesAutonomos", "is-admin")}
        ${systemCard("Escritórios de agentes", "Entrada visual para os agentes autônomos e personagens do projeto.", "#agentesAutonomos")}
        ${systemCard("Comercial", "Anúncio e apoio local dentro do mesmo desenho.", "#monetizacao")}
      </div>`;
  }

  function renderOpportunityCategory() {
    $$('a[href="#empregos"]').forEach((link) => link.setAttribute("href", "#vagasCzs"));

    const serviceCard = $("#empregos");
    if (serviceCard) {
      serviceCard.setAttribute("href", "#vagasCzs");
      const title = serviceCard.querySelector("b");
      const text = serviceCard.querySelector("p");
      if (title) title.textContent = "Vagas publicadas";
      if (text) text.textContent = "Emprego, concurso, estágio e curso quando a fonte publicar.";
    }

    if (!opportunityStories.length) {
      $$('a[href="#vagasCzs"]').forEach((link) => link.remove());
      $("#vagasCzs")?.remove();
      return;
    }

    let section = $("#vagasCzs");
    if (!section) {
      section = document.createElement("section");
      section.id = "vagasCzs";
      section.className = "section v8-opportunities";
      const anchor = $("#servicos") || $("#feed") || $("#infosGerais");
      anchor?.parentElement?.insertBefore(section, anchor);
    }
    section.innerHTML = `
      <div class="section-head">
        <div><div class="section-kicker">Vagas e oportunidades</div></div>
        <a class="small-btn" href="#feed">Ver todas</a>
      </div>
      <div class="v8-opportunity-grid">
        ${opportunityStories.map((story) => `
          <article class="v8-opportunity-card">
            <a href="${esc(v8Url(story))}" data-v8-slug="${esc(story.slug || "")}">
              <img src="${esc(imgFor(story))}" alt="${esc(story.title)}" loading="lazy" onerror="this.onerror=null;this.src='${esc(realPhotoFor(story))}'">
              <span class="badge">${esc(opportunityLabel(story))}</span>
              <b>${esc(story.title)}</b>
              <small>${esc(sourceName(story))} • ${esc(storyDate(story))}</small>
            </a>
          </article>`).join("")}
      </div>`;

    const utilityRow = $(".utility-row");
    if (utilityRow && !$('a[href="#vagasCzs"]', utilityRow)) {
      const chip = document.createElement("a");
      chip.className = "chip";
      chip.href = "#vagasCzs";
      chip.innerHTML = `<span class="v8-chip-glyph">${iconSvg("bag")}</span><span>Vagas</span>`;
      utilityRow.appendChild(chip);
    }
  }

  function systemCard(title, text, href, variant = "") {
    return `<a class="v8-system-card ${esc(variant)}" href="${href}"><b>${esc(title)}</b><p>${esc(text)}</p></a>`;
  }

  function videoContextStories() {
    const source = archiveSourceStories.length ? archiveSourceStories : allStories;
    return source
      .filter((story) => /v[ií]deo|youtube|tv|ao vivo|bastidor|futebol|show|cultura|esporte/i.test(
        [story?.title, story?.summary, story?.subtitle, story?.category, sourceName(story)].join(" ")
      ))
      .slice(0, 3);
  }

  function videoPlaylistItems() {
    const seen = new Set();
    const storyVideos = allStories
      .map((story) => {
        const src = storyVideoUrl(story);
        if (!src || seen.has(src)) return null;
        seen.add(src);
        return {
          id: `story-${story.slug || hashText(story.title || src)}`,
          title: story.title || "Vídeo do CZS",
          label: story.category || "Notícia",
          src,
          poster: videoPosterFor(story, src),
          fallbackPoster: imgFor(story),
          text: story.summary || story.subtitle || `Vídeo vinculado a ${sourceName(story)}.`,
          storySlug: story.slug || "",
        };
      })
      .filter(Boolean);
    V8_VIDEO_PLAYLIST.forEach((item) => seen.add(item.src));
    const localVideos = V8_VIDEO_PLAYLIST.map((item) => ({
      ...item,
      fallbackPoster: item.poster,
      poster: readVideoFrameCache()[item.src] || item.poster,
    }));
    return [...storyVideos, ...localVideos].slice(0, 8);
  }

  function renderRealVideoHub() {
    const section = $("#videos");
    if (!section) return;
    const playlist = videoPlaylistItems();
    const active = playlist[0];
    if (!active) return;
    storyViewerState.playlist = playlist;
    const context = videoContextStories();
    section.classList.add("v8-real-video-hub", "v8-story-video-hub");
    section.innerHTML = `
      <div class="section-head">
        <div>
          <div class="section-kicker">TV CZS Notícias</div>
          <h2>Vídeos de notícia em formato de story</h2>
          <p>A TV vertical captura vídeos publicados nas matérias e organiza cortes de notícia, cultura, eventos e serviço do Vale.</p>
        </div>
        <a class="btn ghost" href="#arquivoArtigoSystem">Buscar vídeos</a>
      </div>
      <div class="v8-story-bubbles" aria-label="Stories em vídeo do CZS">
        ${playlist.map((item, index) => `
          <button class="v8-story-bubble ${index === 0 ? "is-active" : ""}" type="button" data-v8-story-open="${esc(item.id)}">
            <span><img src="${esc(item.poster)}" alt="" data-v8-video-poster-src="${esc(item.src)}" data-v8-video-fallback="${esc(item.fallbackPoster || item.poster)}"></span>
            <b>${esc(item.label || "TV CZS")}</b>
          </button>`).join("")}
      </div>
      <div class="v8-video-shell v8-story-shell">
        <div class="v8-story-phone" aria-label="TV CZS em formato vertical">
          <div class="v8-story-progress" aria-hidden="true"><i></i><i></i><i></i></div>
          <video id="v8MainVideo" controls playsinline preload="metadata" poster="${esc(active.poster)}" data-v8-video-poster-src="${esc(active.src)}" data-v8-video-fallback="${esc(active.fallbackPoster || active.poster)}">
            <source src="${esc(active.src)}" type="${esc(videoTypeFor(active.src))}">
            Seu navegador não conseguiu carregar este vídeo.
          </video>
          <div class="v8-video-now">
            <span id="v8VideoLabel">${esc(active.label)}</span>
            <strong id="v8VideoTitle">${esc(active.title)}</strong>
            <p id="v8VideoText">${esc(active.text)}</p>
          </div>
        </div>
        <div class="v8-video-playlist v8-story-playlist" aria-label="Playlist de stories do CZS">
          <div class="v8-story-capture-note"><b>Captação</b><span>Prioriza vídeo real de notícia; usa acervo local só quando não houver vídeo no snapshot.</span></div>
          ${playlist.map((item, index) => `
            <button class="v8-video-item ${index === 0 ? "is-active" : ""}" type="button" data-v8-video="${esc(item.id)}">
              <img src="${esc(item.poster)}" alt="" data-v8-video-poster-src="${esc(item.src)}" data-v8-video-fallback="${esc(item.fallbackPoster || item.poster)}">
              <span><small>${esc(item.label)}</small><b>${esc(item.title)}</b></span>
            </button>`).join("")}
        </div>
      </div>
      <div class="v8-video-context">
        ${context.map((story) => `
          <article class="v8-editorial-card">
            <b>${esc(story.title)}</b>
            <p>${esc(story.summary || story.subtitle || "Matéria com contexto visual para conferência editorial.")}</p>
            <div class="actions">
              <a class="small-btn" href="${esc(v8Url(story))}" data-v8-slug="${esc(story.slug)}">Ler</a>
              <a class="small-btn ghost" href="${esc(story.sourceUrl || LIVE)}" target="_blank" rel="noopener">Abrir fonte</a>
            </div>
          </article>`).join("") || "<article class=\"v8-editorial-card\"><b>Sem matéria com vídeo no snapshot</b><p>O player acima continua disponível com os arquivos locais do projeto.</p></article>"}
      </div>`;
    section.addEventListener("click", (event) => {
      const storyButton = event.target.closest("[data-v8-story-open]");
      if (storyButton) {
        const item = playlist.find((entry) => entry.id === storyButton.dataset.v8StoryOpen);
        if (item) {
          $$(".v8-story-bubble", section).forEach((node) => node.classList.toggle("is-active", node === storyButton));
          openStoryViewer(item, playlist);
        }
        return;
      }
      const button = event.target.closest("[data-v8-video]");
      if (!button) return;
      const item = playlist.find((entry) => entry.id === button.dataset.v8Video);
      const video = $("#v8MainVideo");
      const source = video?.querySelector("source");
      if (!item || !video || !source) return;
      $$(".v8-video-item", section).forEach((node) => node.classList.toggle("is-active", node === button));
      source.src = item.src;
      source.type = videoTypeFor(item.src);
      video.poster = item.poster;
      video.dataset.v8VideoPosterSrc = item.src;
      video.dataset.v8VideoFallback = item.fallbackPoster || item.poster;
      $("#v8VideoLabel").textContent = item.label;
      $("#v8VideoTitle").textContent = item.title;
      $("#v8VideoText").textContent = item.text;
      video.load();
      refreshVideoFrames(section);
      video.play().catch(() => toast("Vídeo carregado. Aperte play para assistir."));
    }, { once: false });
    refreshVideoFrames(section);
  }

  function renderYoungArea() {
    let section = $("#areaJovem");
    if (section?.dataset.v8YoungReady === "1") return;
    const anchor = $("#videos") || $("#galeriaFotos") || $("#servicos");
    if (!section && !anchor?.parentElement) return;
    const source = archiveSourceStories.length ? archiveSourceStories : allStories;
    const pick = (regex, fallbackTitle, fallbackText, fallbackImage = "assets/home-cache/buzz-cultura-show.jpg") => {
      const story = source.find((item) => regex.test([item?.title, item?.summary, item?.subtitle, item?.category, sourceName(item)].join(" ")));
      if (story) {
        return {
          title: story.title,
          text: story.summary || story.subtitle || localImpact(story),
          image: imgFor(story),
          href: v8Url(story),
          label: story.category || sourceName(story),
        };
      }
      return {
        title: fallbackTitle,
        text: fallbackText,
        image: fallbackImage,
        href: "#areaJovem",
        label: "Curadoria CZS",
      };
    };
    const cards = [
      pick(/pubpaid|jogo|game|xadrez|damas|sinuca|torneio|ranking/i, "Sinuca e apostas", "Atalhos para experiências de jogo sem misturar com a home editorial.", "assets/home-cache/buzz-via-cruzeiro.jpg"),
      pick(/anime|animes|mang[aá]|geek|cosplay|games/i, "Animes e cultura geek", "Espaço jovem para animes, games, internet e cultura pop quando houver pauta segura.", "assets/home-cache/fallback-educacao.jpg"),
      pick(/novela|televis[aã]o|rede nacional|bbb|s[ée]rie|filme|cinema|streaming/i, "Novelas, filmes e TV nacional", "O que virou assunto no Brasil, sempre com peso menor que a rotina do Vale.", "assets/home-cache/buzz-cruzeiro-02.jpg"),
      pick(/show|festival|agenda|cultura|evento|m[uú]sica|artista|teatro/i, "Shows e agenda do Acre", "Agenda jovem do Acre: shows, festas, eventos, escolas, esporte e cultura.", "assets/home-cache/buzz-cultura-show.jpg"),
    ];
    if (!section) {
      section = document.createElement("section");
      section.id = "areaJovem";
      anchor.parentElement.insertBefore(section, anchor.nextElementSibling);
    }
    section.className = "section v8-young-zone";
    section.dataset.v8YoungReady = "1";
    section.innerHTML = `
      <div class="section-head">
        <div>
          <div class="section-kicker">Área jovem</div>
          <h2>Jogos, animes, novelas, filmes e agenda do Acre</h2>
          <p>Um corredor leve para quem quer entretenimento, mas sem tirar a home do foco principal: Vale do Juruá primeiro.</p>
        </div>
        <a class="btn ghost" href="#videos">Abrir TV CZS</a>
      </div>
      <div class="v8-young-grid">
        ${cards.map((card, index) => `
          <a class="v8-young-card ${index === 0 ? "is-featured" : ""}" href="${esc(card.href)}">
            <img src="${esc(card.image)}" alt="${esc(card.title)}" loading="lazy" onerror="this.onerror=null;this.src='${esc(realPhotoFor({ title: card.title }))}'">
            <span>${esc(card.label)}</span>
            <b>${esc(card.title)}</b>
            <p>${esc(card.text)}</p>
          </a>`).join("")}
      </div>
      <div class="v8-young-agenda">
        <b>Agenda rápida</b>
        <span>Shows do Acre</span>
        <span>Eventos de escola</span>
        <span>Festas e cultura</span>
        <span>Sinuca e apostas</span>
        <span>Filmes e TV nacional</span>
      </div>`;
  }

  function galleryItems() {
    const seen = new Set();
    const fromStories = allStories
      .map((story) => ({
        title: story.title,
        text: `${story.category || "Notícia"} • ${sourceName(story)}`,
        src: imgFor(story),
        href: v8Url(story),
        slug: story.slug,
      }))
      .filter((item) => item.src && !weakImage(item.src))
      .filter((item) => {
        const key = item.src.replace(/\?.*$/, "");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 12);
    const local = [
      ["Rio Juruá", "Paisagem, porto, cheia, vazante e vida ribeirinha", "assets/home-cache/rio-jurua-panorama.jpg"],
      ["Pessoas do Vale", "Gente, comércio, escolas, bairros e cotidiano", "assets/home-cache/footer-cruzeiro-bg.jpg"],
      ["Eventos e comunidade", "Festas, cultura, esporte e circulação local", "assets/home-cache/news-batelao-local.jpg"],
      ["Cultura do Juruá", "Agenda, artistas, encontros e memória visual", "assets/home-cache/buzz-cultura-show.jpg"],
    ].map(([title, text, src]) => ({ title, text, src, href: "#galeriaFotos" }));
    return [...local, ...fromStories].slice(0, 16);
  }

  function renderPremiumGallery() {
    const section = $("#galeriaFotos");
    if (!section) return;
    const items = galleryItems();
    let index = 0;
    section.classList.add("v8-premium-gallery");
    const anchor = $("#videos") || $("#servicos") || $("#latestThreeColumns");
    if (anchor?.parentElement && anchor.nextElementSibling !== section) {
      anchor.parentElement.insertBefore(section, anchor.nextElementSibling);
    }
    section.innerHTML = `
      <div class="section-head">
        <div>
          <div class="section-kicker">Galeria do Juruá</div>
          <h2>Fotos do Juruá</h2>
          <p>Cultura, pessoas, eventos, paisagens, bairros e imagens das matérias em uma galeria limpa.</p>
        </div>
        <button class="btn ghost" type="button" data-v8-gallery-open="0">Ver galeria</button>
      </div>
      <div class="v8-gallery-map-card">
        <div>
          <b>Mapa visual</b>
          <span>Rio Juruá, cultura, pessoas, eventos, paisagens e registros do cotidiano.</span>
        </div>
        <a class="small-btn ghost" href="https://www.google.com/maps/search/Cruzeiro+do+Sul+Acre+pontos+turisticos" target="_blank" rel="noopener">Abrir mapa</a>
      </div>
      <div class="v8-gallery-grid">
        ${items.map((item, itemIndex) => `
          <button class="v8-gallery-tile" type="button" data-v8-gallery-open="${itemIndex}">
            <img src="${esc(item.src)}" alt="${esc(item.title)}" loading="lazy" onerror="this.onerror=null;this.src='${esc(realPhotoFor({ title: item.title }))}'">
            <span><b>${esc(item.title)}</b><small>${esc(item.text)}</small></span>
          </button>`).join("")}
      </div>
      <div class="v8-gallery-lightbox" id="v8GalleryLightbox" hidden role="dialog" aria-modal="true" aria-label="Galeria premium do CZS">
        <button class="v8-gallery-close" type="button" data-v8-gallery-close aria-label="Fechar galeria">×</button>
        <button class="v8-gallery-nav prev" type="button" data-v8-gallery-prev aria-label="Foto anterior">‹</button>
        <figure>
          <img id="v8GalleryImage" alt="">
          <figcaption>
            <b id="v8GalleryTitle"></b>
            <span id="v8GalleryText"></span>
            <a id="v8GalleryLink" class="small-btn" href="#galeriaFotos">Abrir matéria</a>
          </figcaption>
        </figure>
        <button class="v8-gallery-nav next" type="button" data-v8-gallery-next aria-label="Próxima foto">›</button>
      </div>`;

    const paint = () => {
      const item = items[index] || items[0];
      const lightbox = $("#v8GalleryLightbox");
      if (!item || !lightbox) return;
      $("#v8GalleryImage").src = item.src;
      $("#v8GalleryImage").alt = item.title;
      $("#v8GalleryTitle").textContent = item.title;
      $("#v8GalleryText").textContent = item.text;
      const link = $("#v8GalleryLink");
      link.href = item.href || "#galeriaFotos";
      link.hidden = !item.slug;
      lightbox.hidden = false;
      lightbox.classList.add("is-open");
      document.body.classList.add("v8-gallery-open");
    };

    const close = () => {
      const lightbox = $("#v8GalleryLightbox");
      lightbox?.classList.remove("is-open");
      document.body.classList.remove("v8-gallery-open");
      setTimeout(() => {
        if (lightbox && !lightbox.classList.contains("is-open")) lightbox.hidden = true;
      }, 160);
    };

    section.onclick = (event) => {
      const open = event.target.closest("[data-v8-gallery-open]");
      if (open) {
        index = Number(open.dataset.v8GalleryOpen || 0);
        paint();
        return;
      }
      if (event.target.closest("[data-v8-gallery-close]")) {
        close();
        return;
      }
      if (event.target.closest("[data-v8-gallery-prev]")) {
        index = (index - 1 + items.length) % items.length;
        paint();
        return;
      }
      if (event.target.closest("[data-v8-gallery-next]")) {
        index = (index + 1) % items.length;
        paint();
      }
    };
  }

  function archiveStories() {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const monthAgo = now - 31 * 24 * 60 * 60 * 1000;
    const yearAgo = now - 365 * 24 * 60 * 60 * 1000;
    const query = normalizeText(archiveState.query);
    return allStories
      .filter((story) => {
        const stamp = storyTimestamp(story);
        if (archiveState.period === "day" && (!stamp || stamp < dayAgo)) return false;
        if (archiveState.period === "week" && (!stamp || stamp < weekAgo)) return false;
        if (archiveState.period === "month" && (!stamp || stamp < monthAgo)) return false;
        if (archiveState.period === "year" && (!stamp || stamp < yearAgo)) return false;
        if (archiveState.category !== "all" && normalizeText(story.category) !== archiveState.category) return false;
        if (archiveState.source !== "all" && normalizeText(sourceName(story)) !== archiveState.source) return false;
        if (archiveState.folder !== "all" && archiveMonthKey(story) !== archiveState.folder) return false;
        if (query) {
          const haystack = normalizeText([story.title, story.subtitle, story.summary, story.body, story.category, sourceName(story)].join(" "));
          if (!haystack.includes(query)) return false;
        }
        return true;
      })
      .sort((a, b) => storyTimestamp(b) - storyTimestamp(a));
  }

  function renderArchiveExplorer() {
    const section = $("#arquivoArtigoSystem");
    if (!section) return;
    section.classList.add("v8-archive-explorer");
    const source = archiveSourceStories.length ? archiveSourceStories : allStories;
    const categories = Array.from(new Set(source.map((story) => story.category).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
    const sources = Array.from(new Set(source.map(sourceName).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
    const months = Array.from(new Set(source.map(archiveMonthKey))).filter(Boolean)
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 18);
    const total = archiveSourceMeta.total || DATA.archiveTotal || source.length;
    section.innerHTML = `
      <div class="section-head v8-archive-head">
        <div>
          <div class="section-kicker">Arquivo CZS</div>
          <h2>${esc(total)} notícias organizadas</h2>
          <p class="v8-source-status">${esc(archiveSourceMeta.label)}</p>
        </div>
        <div class="actions">
          <button class="btn ghost" type="button" data-archive-reset>Limpar filtros</button>
          <a class="btn" href="${LIVE}/arquivo.html" target="_blank" rel="noopener">Abrir online</a>
        </div>
      </div>
      <div class="v8-archive-tools">
        <label class="v8-archive-search">
          <span>Buscar</span>
          <input type="search" data-archive-search value="${esc(archiveState.query)}" placeholder="bairro, fonte, assunto ou data">
        </label>
        <label>
          <span>Periodo</span>
          <select data-archive-period>
            ${archiveOption("all", "Tudo", archiveState.period)}
            ${archiveOption("day", "24 horas", archiveState.period)}
            ${archiveOption("week", "7 dias", archiveState.period)}
            ${archiveOption("month", "30 dias", archiveState.period)}
            ${archiveOption("year", "12 meses", archiveState.period)}
          </select>
        </label>
        <label>
          <span>Categoria</span>
          <select data-archive-category>
            ${archiveOption("all", "Todas", archiveState.category)}
            ${categories.map((item) => archiveOption(normalizeText(item), item, archiveState.category)).join("")}
          </select>
        </label>
        <label>
          <span>Fonte</span>
          <select data-archive-source>
            ${archiveOption("all", "Todas", archiveState.source)}
            ${sources.slice(0, 40).map((item) => archiveOption(normalizeText(item), item, archiveState.source)).join("")}
          </select>
        </label>
      </div>
      <div class="v8-archive-folders" aria-label="Pastas do arquivo">
        <button type="button" class="${archiveState.folder === "all" ? "is-active" : ""}" data-archive-folder="all">Tudo</button>
        ${months.map((month) => `<button type="button" class="${archiveState.folder === month ? "is-active" : ""}" data-archive-folder="${esc(month)}">${esc(archiveMonthLabel(month))}</button>`).join("")}
      </div>
      <div class="v8-archive-count" id="v8ArchiveCount"></div>
      <div class="v8-archive-list" id="v8ArchiveList"></div>
      <div class="actions v8-archive-more"><button class="btn ghost" type="button" data-archive-more>Carregar mais</button></div>`;
    bindArchiveExplorer(section);
    paintArchiveResults();
  }

  function archiveOption(value, label, selected) {
    return `<option value="${esc(value)}" ${value === selected ? "selected" : ""}>${esc(label)}</option>`;
  }

  function bindArchiveExplorer(section) {
    if (section.dataset.v8ArchiveBound) return;
    section.dataset.v8ArchiveBound = "true";
    section.addEventListener("input", (event) => {
      if (!event.target.matches("[data-archive-search]")) return;
      archiveState.query = event.target.value;
      archiveState.limit = ARCHIVE_PAGE_STEP;
      paintArchiveResults();
    });
    section.addEventListener("change", (event) => {
      if (event.target.matches("[data-archive-period]")) archiveState.period = event.target.value;
      if (event.target.matches("[data-archive-category]")) archiveState.category = event.target.value;
      if (event.target.matches("[data-archive-source]")) archiveState.source = event.target.value;
      archiveState.limit = ARCHIVE_PAGE_STEP;
      paintArchiveResults();
    });
    section.addEventListener("click", (event) => {
      const folder = event.target.closest("[data-archive-folder]");
      if (folder) {
        archiveState.folder = folder.dataset.archiveFolder;
        archiveState.limit = ARCHIVE_PAGE_STEP;
        renderArchiveExplorer();
        return;
      }
      if (event.target.closest("[data-archive-more]")) {
        archiveState.limit += ARCHIVE_PAGE_STEP;
        paintArchiveResults();
        return;
      }
      if (event.target.closest("[data-archive-reset]")) {
        Object.assign(archiveState, { query: "", period: "all", category: "all", source: "all", folder: "all", limit: ARCHIVE_PAGE_STEP });
        renderArchiveExplorer();
      }
    });
  }

  function paintArchiveResults() {
    const list = $("#v8ArchiveList");
    const count = $("#v8ArchiveCount");
    const more = $("[data-archive-more]");
    if (!list || !count) return;
    const filtered = archiveStories();
    count.textContent = `${filtered.length} resultado${filtered.length === 1 ? "" : "s"} no filtro atual`;
    list.innerHTML = filtered.slice(0, archiveState.limit).map(archiveCard).join("") ||
      `<article class="v8-archive-empty"><b>Nada encontrado</b><p>Tente outro termo, periodo, fonte ou pasta.</p></article>`;
    if (more) more.hidden = filtered.length <= archiveState.limit;
  }

  function archiveCard(story) {
    return `
      <article class="v8-archive-card">
        <a href="${esc(v8Url(story))}" data-v8-slug="${esc(story.slug)}">
          <img src="${esc(imgFor(story))}" alt="${esc(story.title)}" loading="lazy" onerror="this.onerror=null;this.src='${esc(realPhotoFor(story))}'">
          <span>
            <small>${esc(story.category || "Notícia")} • ${esc(sourceName(story))} • ${esc(archiveDateLabel(story))}</small>
            <b>${esc(story.title)}</b>
          </span>
        </a>
      </article>`;
  }

  async function loadArchiveEndpoint() {
    try {
      archiveSourceMeta = { ...archiveSourceMeta, label: "Carregando endpoint do arquivo..." };
      renderArchiveExplorer();
      const result = await apiFetchJson(API.archive);
      const payload = result.payload || {};
      const items = Array.isArray(payload.items) ? payload.items.filter(Boolean) : [];
      if (!result.ok || !items.length) throw new Error(payload.error || `HTTP ${result.status}`);
      archiveSourceStories = items;
      archiveSourceStories.forEach((story) => {
        if (story?.slug) bySlug.set(String(story.slug), story);
      });
      archiveSourceMeta = {
        status: "endpoint",
        label: "Endpoint online sincronizado",
        total: payload.archiveTotal || payload.total || items.length,
      };
      renderArchiveExplorer();
    } catch (error) {
      archiveSourceMeta = {
        status: "snapshot",
        label: "Snapshot local usado porque o endpoint não respondeu",
        total: DATA.archiveTotal || archiveSourceStories.length || allStories.length,
        error: error?.message || "",
      };
      renderArchiveExplorer();
    }
  }

  function renderNewsFooter() {
    const footer = $("#fullSiteFooter");
    if (!footer) return;
    footer.classList.add("v8-news-footer");
    footer.innerHTML = `
      <div class="v8-footer-topline" aria-hidden="true"></div>
      <div class="v8-footer-brandline">
        <a class="v8-footer-logo" href="#topo" aria-label="Voltar ao topo do Catálogo CZS">
          <img src="${BRAND_HORIZONTAL}" alt="Catálogo CZS">
          <strong>Informação que conecta</strong>
        </a>
        <nav class="v8-footer-social" aria-label="Atalhos sociais e recursos do CZS">
          <a class="ig" href="${SOCIAL_INSTAGRAM}" target="_blank" rel="noopener" aria-label="Instagram do Catálogo CZS"><b>Instagram</b><small>Bastidores e posts</small></a>
          <a class="wa" href="${SOCIAL_WHATSAPP}" target="_blank" rel="noopener" aria-label="WhatsApp do Catálogo CZS"><b>WhatsApp</b><small>Atendimento direto</small></a>
          <a class="mail" href="mailto:${SOCIAL_EMAIL}" aria-label="Enviar e-mail para o Catálogo CZS"><b>E-mail</b><small>Propostas e pautas</small></a>
          <a class="ads" href="#monetizacao" aria-label="Anunciar no Catálogo CZS"><b>Anunciar</b><small>Planos para empresas</small></a>
          <a class="game" href="pubpaid.html" aria-label="Conhecer o PubPaid"><b>PubPaid</b><small>Jogos e campanhas</small></a>
        </nav>
      </div>
      <div class="v8-footer-grid">
        ${footerColumn("Seções e notícias", [
          ["Plantão", "#ticker"],
          ["Últimas notícias", "#latestThreeColumns"],
          ["Todas as notícias", "#feed"],
          ["Arquivo CZS", "#arquivoArtigoSystem"],
          ["Vagas", "#vagasCzs"],
          ["Polícia", "#feed"],
          ["Prefeitura", "#feed"],
          ["Saúde", "#feed"],
          ["Educação", "#feed"],
          ["Cultura & Social", "#social"],
          ["Esporte", "#feed"],
          ["Galeria de fotos", "#galeriaFotos"],
          ["Vídeos", "#videos"],
        ])}
        ${footerColumn("Serviços úteis", [
          ["Serviços públicos", "#servicos"],
          ["Tempo e alertas", "#tempo"],
          ["Vagas publicadas", "#vagasCzs"],
          ["Concursos", "#servicos"],
          ["Agenda cultural", "#agenda"],
          ["Catálogo telefônico", "#servicos"],
          ["Pesquisa eleitoral", "pesquisa-acre-2026.html"],
          ["Resultados de pesquisa", "pesquisa-acre-2026.html#resultados"],
          ["Escritórios de agentes", "#agentesAutonomos"],
        ])}
        ${footerColumn("Participe", [
          ["Enviar pauta", "#comunidade"],
          ["Perguntar ao CZS", "#assistantInline"],
          ["Resumo do dia", "#newsletter"],
          ["Seja apoiador", "#fundadores"],
          ["Informar correção", "#comunidade"],
          ["Falar no WhatsApp", SOCIAL_WHATSAPP],
        ])}
        ${footerColumn("Comercial", [
          ["Anuncie no portal", "#monetizacao"],
          ["Publicidade local", "#monetizacao"],
          ["Mídia para empresas", "#monetizacao"],
          ["Parcerias", "#fundadores"],
          ["Newsletter comercial", "#newsletter"],
          ["Fale com comercial", "#monetizacao"],
        ])}
        ${footerColumn("Redação", [
          ["Agentes autônomos", "#agentesAutonomos"],
          ["Checagem", "#arquivoArtigoSystem"],
          ["Fotos e enquadramento", "#galeriaFotos"],
          ["Correções editoriais", "#comunidade"],
          ["Fontes e arquivo", "#arquivoArtigoSystem"],
          ["Mapa do jornal", "#infosGerais"],
        ])}
        ${footerColumn("Legal", [
          ["Quem somos", "legal.html"],
          ["Política de Privacidade", "legal.html#privacidade"],
          ["Termos de Uso", "legal.html#termos"],
          ["Política comercial", "#monetizacao"],
          ["Remover conteúdo", "remocao.html"],
          ["Contato", `mailto:${SOCIAL_EMAIL}`],
          ["Voltar ao topo", "#topo"],
        ])}
      </div>
      <div class="v8-footer-bottom">
        <span>Catálogo Cruzeiro do Sul • Vale do Juruá • Acre</span>
        <span>Notícias, serviços, comunidade e oportunidades em um só jornal.</span>
      </div>`;

    const compact = $("#footerCompact");
    if (compact) {
      compact.innerHTML = `
        <div class="footer-brand-mini v8-footer-mini-brand"><span><img src="${BRAND_ICON}" alt=""></span><div><strong>Catálogo CZS</strong><p id="footerMiniStatus">Mapa, notícias e serviços.</p></div></div>
        <div class="quick-links"><a href="#feed">Notícias</a><a href="#servicos">Serviços</a><a href="#pubpaidAtalhos">Pesquisa</a><a href="#monetizacao">Anunciar</a><button class="footer-jump" id="footerJumpBtn" type="button">Mapa do site</button></div>`;
      $("#footerJumpBtn")?.addEventListener("click", () => {
        footer.classList.add("revealed");
        footer.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
    normalizeInternalLinks(footer);
  }

  function footerColumn(title, links) {
    return `
      <section class="v8-footer-col">
        <h3>${esc(title)}</h3>
        ${links.map(([label, href]) => `<a href="${esc(href)}">${esc(label)}</a>`).join("")}
      </section>`;
  }

  function normalizeInternalLinks(root = document) {
    $$("a[href]", root).forEach((anchor) => {
      const href = anchor.getAttribute("href") || "";
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("https://wa.me/")) return;
      try {
        const url = new URL(href, location.href);
        if (url.origin !== LIVE) return;
        const path = url.pathname.replace(/^\/+/, "");
        anchor.href = `${path || "index.html"}${url.search}${url.hash}`;
      } catch (_) {
        // Keep the original href when it cannot be parsed.
      }
    });
  }

  function bindComingSoonSocials(root = document) {
    $$("[data-social-soon]", root).forEach((link) => {
      if (link.dataset.socialBound) return;
      link.dataset.socialBound = "1";
      link.addEventListener("click", (event) => {
        event.preventDefault();
        toast(`${link.dataset.socialSoon} em breve.`);
      });
    });
  }

  function renderResearchAndSupport() {
    const research = $("#pubpaidAtalhos");
    if (research) {
      research.classList.add("v8-research-data");
      research.innerHTML = `
        <div class="section-head">
          <div>
            <div class="section-kicker">Pesquisas políticas e dados</div>
            <h2>Pesquisa, resultado e opinião pública</h2>
            <p>Atalhos para a pesquisa eleitoral pronta, resultados, dados de opinião e leitura rápida do cenário.</p>
          </div>
        </div>
        <div class="shortcut-grid v8-research-grid">
          <a class="shortcut-card survey" href="pesquisa-acre-2026.html">
            <span class="shortcut-icon">PE</span>
            <b>Pesquisa eleitoral</b>
            <p>Abra a pesquisa pronta e acompanhe a ficha do levantamento.</p>
          </a>
          <a class="shortcut-card results" href="pesquisa-acre-2026.html#resultados">
            <span class="shortcut-icon">R</span>
            <b>Resultados</b>
            <p>Veja apuração, recortes e evolução quando houver rodada publicada.</p>
          </a>
          <a class="shortcut-card data" href="#arquivoArtigoSystem">
            <span class="shortcut-icon">D</span>
            <b>Dados de pesquisa</b>
            <p>Use arquivo, fontes e histórico para comparar política, serviços e opinião.</p>
          </a>
          <a class="shortcut-card newsletter" href="#newsletter">
            <span class="shortcut-icon">N</span>
            <b>Resumo do dia</b>
            <p>Receba no e-mail as principais notícias e o que muda hoje.</p>
          </a>
        </div>`;
    }

    const newsletter = $("#newsletter");
    if (newsletter) {
      newsletter.classList.add("v8-newsletter-daily");
      newsletter.innerHTML = `
        <div class="adbox v8-newsletter-box">
          <div>
            <div class="section-kicker">Newsletter</div>
            <h2>Resumo do dia no e-mail</h2>
            <p>O CZS envia um resumo diário com manchetes, serviços, alertas e próximos acompanhamentos.</p>
          </div>
          <form class="search" id="newsletterForm">
            <input type="email" placeholder="Seu e-mail" aria-label="Seu e-mail para receber o resumo do dia">
            <button type="submit">Receber resumo</button>
          </form>
          <div class="v8-social-login-row" aria-label="Entradas sociais opcionais">
            <button type="button" data-social-soon="Login com Google">Google</button>
            <button type="button" data-social-soon="Login com Facebook">Facebook</button>
          </div>
        </div>`;
      bindComingSoonSocials(newsletter);
    }

    const support = $("#fundadores");
    if (support) {
      support.classList.add("v8-local-support");
      const partners = [
        ["Café Cruzeiro", "assets/founders-cafe-pack-static.png", "café local"],
        ["Shopping Copacabana", "", "comércio local"],
        ["Dra. Geane Odontologia", "assets/founders-geane-logo-optimized.png", "saúde e cuidado"],
        ["Grupo AS", "assets/founders-grupo-as-logo.png", "apoio regional"],
      ];
      support.innerHTML = `
        <div class="section-head">
          <div>
            <div class="section-kicker">Apoio local</div>
            <h2>Marcas que ajudam o CZS a crescer</h2>
            <p>Café Cruzeiro, Shopping Copacabana, clínica odontológica e apoiadores locais com presença limpa no portal.</p>
          </div>
          <a class="btn ghost" href="${SOCIAL_WHATSAPP}" target="_blank" rel="noopener">Ser apoiador</a>
        </div>
        <div class="v8-support-grid">
          ${partners.map(([name, logo, label]) => `
            <article class="v8-support-card">
              <div class="v8-support-logo">
                ${logo ? `<img src="${esc(logo)}" alt="${esc(name)}" loading="lazy">` : `<span class="v8-support-logo-text">${esc(name)}</span>`}
              </div>
              <b>${esc(name)}</b>
              <p>${esc(label)}</p>
            </article>`).join("")}
        </div>`;
    }
  }

  function renderFinalResources() {
    if ($("#czsFinalResources")) return;
    const footer = $("#fullSiteFooter");
    if (!footer?.parentElement) return;

    const points = [
      ["Rio Juruá", "Vista do rio, porto, cheia, vazante e rotina ribeirinha.", "assets/home-cache/rio-jurua-panorama.jpg"],
      ["Centro de Cruzeiro", "Comércio, serviços, igrejas, praça e circulação diária.", "assets/home-cache/footer-cruzeiro-bg.jpg"],
      ["Igarapé Preto", "Banho, lazer e memória afetiva de quem vive no Vale.", "assets/home-cache/buzz-cruzeiro-01.jpg"],
      ["Porto e mercado", "Movimento de barcos, abastecimento e economia local.", "assets/home-cache/news-batelao-local.jpg"],
      ["Serra do Divisor", "Natureza, turismo e fronteira amazônica do Acre.", "assets/home-cache/buzz-cruzeiro-04.jpg"],
      ["Agenda cultural", "Festas, shows, esporte, escolas e eventos de bairro.", "assets/home-cache/buzz-cultura-show.jpg"],
    ];
    const adTypes = [
      ["Topo premium", "970x250", "abre o jornal"],
      ["Retângulo editorial", "300x250", "dentro da leitura"],
      ["Mobile fixo", "320x100", "serviço rápido"],
      ["Card patrocinado", "1:1", "feed e social"],
      ["Newsletter", "600x220", "resumo do dia"],
      ["Vídeo vertical", "9:16", "stories e reels"],
    ];
    const section = document.createElement("section");
    section.id = "czsFinalResources";
    section.className = "section v8-final-resources";
    section.innerHTML = `
      <div class="section-head">
        <div><div class="section-kicker">Cruzeiro do Sul</div></div>
        <a class="small-btn" href="https://www.google.com/maps/search/?api=1&query=Cruzeiro%20do%20Sul%2C%20Acre%2C%20Brasil" target="_blank" rel="noopener">Abrir no Maps</a>
      </div>
      <div class="v8-city-grid">
        <div class="v8-tourism-grid">
          ${points.map(([title, text, img]) => `
            <article class="v8-tour-card">
              <img src="${esc(img)}" alt="${esc(title)}" loading="lazy" onerror="this.onerror=null;this.src='${esc(realPhotoFor({ title }))}'">
              <div>
                <b>${esc(title)}</b>
                <p>${esc(text)}</p>
              </div>
            </article>`).join("")}
        </div>
        <aside class="v8-map-panel">
          <iframe title="Mapa de Cruzeiro do Sul no Google Maps" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=Cruzeiro%20do%20Sul%2C%20Acre%2C%20Brasil&output=embed"></iframe>
          <div class="v8-resource-links">
            <a href="#servicos">Serviços úteis</a>
            <a href="#agenda">Agenda</a>
            <a href="#comunidade">Enviar ponto</a>
            <a href="#monetizacao">Anunciar</a>
          </div>
        </aside>
      </div>
      <div class="section-head v8-ad-head">
        <div><div class="section-kicker">Mídia CZS</div></div>
      </div>
      <div id="czsAdsShowcase" class="v8-ads-showcase">
        ${adTypes.map(([title, size, use]) => `
          <article class="v8-ad-spec">
            <div class="v8-ad-mock" aria-hidden="true"><span>${esc(size)}</span></div>
            <b>${esc(title)}</b>
            <p>${esc(use)}</p>
            <a class="small-btn" href="${whatsappHref(`Oi, CZS. Quero saber sobre o formato ${title} ${size}.`)}" target="_blank" rel="noopener">Solicitar formato</a>
          </article>`).join("")}
      </div>`;
    footer.parentElement.insertBefore(section, footer);
  }

  function renderContinuousNewsScroll() {
    if ($("#v8ContinuousScroll")) return;
    const footer = $("#fullSiteFooter");
    if (!footer?.parentElement) return;
    const source = allStories
      .filter((story) => story?.slug && bySlug.has(story.slug))
      .slice(Math.min(36, Math.max(12, heroStories.length + 12)));
    if (!source.length) return;
    let index = 0;
    const batchSize = 18;
    const section = document.createElement("section");
    section.id = "v8ContinuousScroll";
    section.className = "section v8-continuous-scroll";
    section.innerHTML = `
      <div class="section-head">
        <div>
          <div class="section-kicker">Mais notícias</div>
          <h2>Continue rolando</h2>
          <p>Depois da apresentação principal e dos módulos secundários, o CZS entra no fluxo de notícias contínuas. O mapa da página fica no rodapé, logo abaixo.</p>
        </div>
      </div>
      <div class="v8-continuous-grid" id="v8ContinuousGrid"></div>
      <button class="btn ghost v8-continuous-more" type="button" data-v8-continuous-more>Carregar mais</button>
      <div class="v8-continuous-sentinel" id="v8ContinuousSentinel" aria-hidden="true"></div>`;
    footer.parentElement.insertBefore(section, footer);
    const grid = $("#v8ContinuousGrid", section);
    const more = $("[data-v8-continuous-more]", section);
    const paint = () => {
      const slice = source.slice(index, index + batchSize);
      index += slice.length;
      grid.insertAdjacentHTML("beforeend", slice.map((story) => `
        <article class="news-card v8-continuous-card" data-v8-slug="${esc(story.slug)}">
          <a href="${esc(v8Url(story))}" data-v8-slug="${esc(story.slug)}">
            <img src="${esc(imgFor(story))}" alt="${esc(story.title)}" loading="lazy" onerror="this.onerror=null;this.src='${esc(realPhotoFor(story))}'">
            <span class="badge">${esc(story.category || sourceName(story))}</span>
            <h3>${esc(story.title)}</h3>
            <p>${esc(story.summary || story.subtitle || localImpact(story))}</p>
            <small>${esc(sourceName(story))} • ${esc(storyDate(story))}</small>
          </a>
          <div class="actions">
            <a class="small-btn" href="${esc(v8Url(story))}" data-v8-slug="${esc(story.slug)}">Ler</a>
            <button class="small-btn ghost shareBtn" type="button">Compartilhar</button>
            <button class="small-btn ghost saveBtn" type="button">Salvar</button>
          </div>
        </article>`).join(""));
      if (index >= source.length) {
        more.hidden = true;
        $("#v8ContinuousSentinel", section).textContent = "Rodapé completo abaixo.";
      }
    };
    window.__v8LoadAllContinuousNews = () => {
      let guard = 0;
      while (index < source.length && guard < 100) {
        paint();
        guard += 1;
      }
    };
    more?.addEventListener("click", paint);
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) paint();
        if (index >= source.length) observer.disconnect();
      }, { rootMargin: "520px 0px" });
      observer.observe($("#v8ContinuousSentinel", section));
    }
    paint();
  }

  function positionPublicModulesBeforeContinuous() {
    const footer = $("#fullSiteFooter");
    const agents = $("#cheffeCallEditor");
    if (!footer?.parentElement || !agents) return;
    footer.parentElement.insertBefore(agents, footer);
  }

  function installContextSideRail() {
    if ($("#v8ContextRail")) return;
    const rail = document.createElement("aside");
    rail.id = "v8ContextRail";
    rail.className = "v8-context-rail";
    rail.setAttribute("aria-label", "Informações rápidas do CZS");
    const restore = document.createElement("button");
    restore.id = "v8ContextRailRestore";
    restore.className = "v8-context-restore";
    restore.type = "button";
    restore.innerHTML = `${iconSvg("trend")}<span>Info</span>`;
    restore.setAttribute("aria-label", "Abrir informações rápidas");
    const betCta = document.createElement("a");
    betCta.id = "v8BetRailCTA";
    betCta.className = "v8-bet-cta-float";
    betCta.href = "pubpaid.html";
    betCta.innerHTML = `${iconSvg("pool")}<span>Conhecer PubPaid</span>`;
    betCta.setAttribute("aria-label", "Conhecer o PubPaid");
    rail.innerHTML = `
      <button class="v8-context-close" type="button" aria-label="Fechar informações rápidas">×</button>
      <details open>
        <summary>Hashtags do dia</summary>
        <div class="v8-tag-cloud">
          <a href="#feed">#CruzeiroDoSul</a>
          <a href="#servicos">#ValeDoJuruá</a>
          <a href="#areaJovem">#AgendaDoAcre</a>
          <a href="#videos">#TVCZS</a>
          <a href="#galeriaFotos">#GaleriaCZS</a>
        </div>
      </details>
      <details>
        <summary>Mercado rápido</summary>
        <div class="v8-market-list">
          <span><b>Dólar</b><small>conectar API</small></span>
          <span><b>Ibovespa</b><small>conectar API</small></span>
          <span><b>Bitcoin</b><small>conectar API</small></span>
          <span><b>Ações BR</b><small>fechamento/alertas</small></span>
        </div>
      </details>
      <details>
        <summary>Agenda e jovem</summary>
        <div class="v8-market-list">
          <a href="#areaJovem">Shows do Acre</a>
          <a href="#areaJovem">Animes e games</a>
          <a href="#areaJovem">Filmes e TV</a>
          <a href="pubpaid.html">Conhecer PubPaid</a>
        </div>
      </details>`;
    document.body.appendChild(rail);
    document.body.appendChild(betCta);
    document.body.appendChild(restore);
    const setClosed = (closed) => {
      rail.classList.toggle("is-closed", closed);
      restore.classList.toggle("is-visible", closed);
      safeSetItem("czs-v8-context-rail-closed", closed ? "1" : "0");
    };
    rail.querySelector(".v8-context-close")?.addEventListener("click", () => {
      setClosed(true);
    });
    restore.addEventListener("click", () => setClosed(false));
    const storedRail = safeGetItem("czs-v8-context-rail-closed");
    setClosed(storedRail !== "0");
  }

  function installSalesLanding() {
    if ($("#v8SalesPortal")) return;
    const search = $(".search");
    const footerMapButton = $("#footerJumpTop");
    if (!$("#v8SalesOpenNearSearch")) {
      const button = document.createElement("button");
      button.id = "v8SalesOpenNearSearch";
      button.className = "chip v8-sales-search-btn";
      button.type = "button";
      button.innerHTML = `${iconSvg("bag")}<span>Oportunidade para vc e sua empresa</span>`;
      if (footerMapButton) {
        footerMapButton.insertAdjacentElement("afterend", button);
      } else if (search) {
        search.insertAdjacentElement("afterend", button);
      }
    }

    const portal = document.createElement("section");
    portal.id = "v8SalesPortal";
    portal.className = "v8-sales-portal";
    portal.hidden = true;
    portal.setAttribute("aria-label", "Página comercial do Catálogo CZS");
    portal.innerHTML = `
      <button class="v8-sales-close" type="button" aria-label="Fechar página comercial">×</button>
      <div class="v8-sales-intro">
        <img src="${RAYL_POSES.chatPresent}" alt="RAyL apresentando ofertas do CZS">
        <div>
          <span>Oportunidade para vc e sua empresa</span>
          <h2>O CZS leva sua marca para o Vale do Juruá</h2>
          <p>Notícia, serviço, galeria, TV vertical, pesquisa e atendimento comercial em uma experiência só.</p>
          <button type="button" class="v8-sales-enter">Ver oportunidades</button>
        </div>
      </div>
      <div class="v8-sales-page">
        <header>
          <img src="${BRAND_HORIZONTAL}" alt="Catálogo CZS">
          <div>
            <h2>Oportunidade para vc e sua empresa</h2>
            <p>Presença local, formatos de mídia e próximos passos de venda para marcas do Vale do Juruá.</p>
          </div>
        </header>
        <div class="v8-sales-metrics">
          <article><b>${esc(String(DATA.archiveTotal || allStories.length))}</b><span>notícias no arquivo</span></article>
          <article><b>${esc(String(new Set(allStories.map(sourceName)).size))}</b><span>fontes monitoradas</span></article>
          <article><b>9:16</b><span>TV vertical e stories</span></article>
          <article><b>24h</b><span>presença diária local</span></article>
        </div>
        <div class="v8-sales-offers">
          ${defaultCommercialCampaigns().map((item) => `
            <article>
              <span>${esc(item.size)}</span>
              <b>${esc(item.title)}</b>
              <p>${esc(item.text)}</p>
              <a href="${esc(item.href)}" target="_blank" rel="noopener">Pedir proposta</a>
            </article>`).join("")}
        </div>
        <div class="v8-sales-flow">
          <b>Como vender melhor no CZS</b>
          <span>1. Escolha o formato</span>
          <span>2. Envie foto/texto</span>
          <span>3. Publicamos com card, legenda, TV ou anúncio</span>
          <span>4. A equipe acompanha resultados e ajustes</span>
        </div>
      </div>`;
    document.body.appendChild(portal);
    const open = () => {
      portal.hidden = false;
      portal.classList.add("is-on", "is-intro");
      document.body.classList.add("v8-sales-open");
      setTimeout(() => portal.classList.add("is-ready"), 1450);
    };
    const close = () => {
      portal.classList.remove("is-on", "is-intro", "is-ready");
      document.body.classList.remove("v8-sales-open");
      setTimeout(() => { portal.hidden = true; }, 220);
    };
    $("#v8SalesOpenNearSearch")?.addEventListener("click", open);
    portal.querySelector(".v8-sales-enter")?.addEventListener("click", () => portal.classList.add("is-ready"));
    portal.querySelector(".v8-sales-close")?.addEventListener("click", close);
  }

  function watchMutations() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            remapLegacyLinks(node);
            sanitizePublicCopy(node);
            installGlobalReviewButtons(node);
            refreshVideoFrames(node);
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, characterData: true, subtree: true });
  }

  function handleHash() {
    if (!location.hash.startsWith("#noticia=")) return;
    const slug = decodeURIComponent(location.hash.replace("#noticia=", ""));
    if (bySlug.has(slug)) openReader(slug, false);
  }

  function enhanceIntroParallax() {
    const loader = $("#cinematicLoader");
    window.addEventListener("pointermove", (event) => {
      const mx = (event.clientX / Math.max(1, window.innerWidth)) - 0.5;
      const my = (event.clientY / Math.max(1, window.innerHeight)) - 0.5;
      if (loader) {
        loader.style.setProperty("--v8-mx", mx.toFixed(3));
        loader.style.setProperty("--v8-my", my.toFixed(3));
        loader.style.setProperty("--v8-mx-px", `${(mx * 28).toFixed(2)}px`);
        loader.style.setProperty("--v8-my-px", `${(my * 22).toFixed(2)}px`);
        loader.style.setProperty("--v8-mx-neg-px", `${(mx * -28).toFixed(2)}px`);
        loader.style.setProperty("--v8-my-neg-px", `${(my * -22).toFixed(2)}px`);
        loader.style.setProperty("--v8-mx-soft-px", `${(mx * 12).toFixed(2)}px`);
        loader.style.setProperty("--v8-my-soft-px", `${(my * 10).toFixed(2)}px`);
      }
      document.body.style.setProperty("--v8-page-mx", mx.toFixed(3));
      document.body.style.setProperty("--v8-page-my", my.toFixed(3));
    }, { passive: true });
    const updateScrollParallax = () => {
      document.body.style.setProperty("--v8-page-parallax", `${Math.min(window.scrollY, 900)}px`);
    };
    window.addEventListener("scroll", updateScrollParallax, { passive: true });
    updateScrollParallax();
  }

  function installDensityToggle() {
    const button = $("#densityBtn");
    if (!button || button.dataset.v8DensityReady === "1") return;
    button.dataset.v8DensityReady = "1";
    button.onclick = null;
    const apply = (mode) => {
      const compact = mode === "compact";
      document.body.classList.toggle("compact", compact);
      button.classList.toggle("is-active", compact);
      button.setAttribute("aria-pressed", compact ? "true" : "false");
      button.innerHTML = `<span class="v8-chip-glyph">${iconSvg(compact ? "home" : "grid")}</span><span>${compact ? "Modo aberto" : "Modo compacto"}</span>`;
    };
    let storedMode = "open";
    try {
      storedMode = localStorage.getItem(DENSITY_MODE_KEY) === "compact" ? "compact" : "open";
    } catch (_) {
      storedMode = "open";
    }
    apply(storedMode);
    button.addEventListener("click", (event) => {
      event.preventDefault();
      const next = document.body.classList.contains("compact") ? "open" : "compact";
      safeSetItem(DENSITY_MODE_KEY, next);
      apply(next);
      toast(next === "compact" ? "Modo compacto ligado" : "Modo aberto ligado");
    });
  }

  function sanitizePublicCopy(root = document.body) {
    const replacements = [
      [/Chefe Call/g, "Cheffe Call"],
      [/Sincronizar online/g, "Atualizar notícias"],
      [/Arquivo online:/g, "Arquivo CZS:"],
      [/amostra carregada:/g, "amostra local:"],
      [/Infinite scroll:/g, "Leitura contínua:"],
      [/Carregar até o rodapé/g, "Ver mapa do site"],
      [/Ir ao rodapé/g, "Mapa do site"],
      [/Abrir arquivo completo/g, "Ver arquivo"],
      [/Abrir galeria online/g, "Ver galeria"],
      [/Abrir no online/g, "Ler"],
      [/Ler no V8/g, "Ler"],
      [/Ler em 1 minuto/g, "Ler"],
      [/Enviar correção/g, "Enviar para revisão"],
      [/Mais compacto/g, "Modo compacto"],
      [/Festas & Social/g, "Cultura & Social"],
      [/Divulgue/g, "Anuncie"],
      [/Preparar card/g, "Gerar chamada"],
      [/Triar/g, "Priorizar"],
      [/Acionar escritório/g, "Acionar equipe"],
      [/Jogos CZS/g, "Conhecer PubPaid"],
      [/jogos CZS/g, "venha apostar"],
      [/Pesquisa e jogos/g, "Pesquisas políticas e dados"],
      [/pesquisa e jogos/g, "pesquisas políticas e dados"],
      [/Catálogo CZS acompanha sua leitura/g, "Continue pelo CZS"],
      [/\d+\s+de\s+\d+\s+mat[eé]rias carregadas\.\s*O mini rodap[eé]\s+fica no canto enquanto o feed continua\.?/gi, "Mapa, notícias e serviços sempre à mão."],
      [/O mini rodap[eé]\s+fica no canto enquanto o feed continua\.?/gi, "Mapa, notícias e serviços sempre à mão."],
    ];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || /SCRIPT|STYLE|NOSCRIPT/.test(parent.tagName)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      let text = node.nodeValue;
      replacements.forEach(([pattern, value]) => {
        text = text.replace(pattern, value);
      });
      if (text !== node.nodeValue) node.nodeValue = text;
    });
    const input = $("#searchInput");
    if (input) input.setAttribute("placeholder", "Buscar notícia, bairro ou serviço");
    trimRedundantCopy(root);
  }

  function firstFoldReady() {
    const foldSelectors = [
      ".brand img",
      ".loader-logo",
      "#leadStory img",
      "#heroSide img",
      "#latestThreeColumns img",
    ];
    const images = foldSelectors
      .flatMap((selector) => $$(selector))
      .filter((img, index, list) => img?.src && list.indexOf(img) === index)
      .slice(0, 14);
    const imagePromises = images.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      if (img.decode) return img.decode().catch(() => {});
      return new Promise((resolve) => {
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", resolve, { once: true });
      });
    });
    const fontPromise = document.fonts?.ready?.catch?.(() => {}) || Promise.resolve();
    return Promise.race([
      Promise.allSettled([fontPromise, ...imagePromises]),
      new Promise((resolve) => setTimeout(resolve, 5200)),
    ]);
  }

  function refreshAppShellCache() {
    const firstStories = heroStories.slice(0, 5).map((story) => imgFor(story)).filter(Boolean);
    const assetUrls = [
      location.href.split("#")[0],
      document.currentScript?.src,
      ...Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map((link) => link.href),
      BRAND_INTRO,
      BRAND_HORIZONTAL,
      BRAND_ICON,
      INTRO_VIDEO,
      ...AYLLA_LOADER_POSES.map(([src]) => src),
      RAYL_POSES.seatedFeature,
      RAYL_POSES.fullWave,
      RAYL_POSES.fullPoint,
      RAYL_POSES.propsPeek,
      ...REAL_PHOTO_POOL.slice(0, 6),
      ...firstStories,
    ].filter(Boolean);

    const cacheClear = window.caches?.keys
      ? caches.keys()
        .then((keys) => Promise.all(keys.filter((key) => /v8|prototype|catalogo|czs/i.test(key)).map((key) => caches.delete(key))))
        .catch(() => {})
      : Promise.resolve();

    const serviceWorkerRefresh = navigator.serviceWorker?.getRegistrations
      ? navigator.serviceWorker.getRegistrations()
        .then((regs) => Promise.all(regs.map((reg) => reg.update().catch(() => {}))))
        .catch(() => {})
      : Promise.resolve();

    const authSessionRefresh = apiFetchJson(API.authSession, { timeout: 4000 })
      .then((result) => {
        const payload = result.payload || {};
        localStorage.setItem(
          "czs-v8-boot-authenticated",
          result.ok && payload.authenticated ? "server-authenticated" : "guest"
        );
        localStorage.setItem("czs-v8-boot-auth-session-at", new Date().toISOString());
        return result;
      })
      .catch((error) => {
        localStorage.setItem("czs-v8-boot-authenticated", "session-unavailable");
        localStorage.setItem("czs-v8-boot-auth-error", error?.message || "auth session unavailable");
      });

    const fetches = assetUrls.slice(0, 22).map((url) =>
      fetch(url, {
        cache: "reload",
        credentials: "same-origin",
        mode: /^https?:\/\//i.test(url) && !String(url).startsWith(location.origin) ? "no-cors" : "same-origin",
      }).catch(() => {})
    );

    localStorage.setItem("czs-v8-boot-version", V8_BOOT_VERSION);
    localStorage.setItem("czs-v8-boot-cache-refreshed-at", new Date().toISOString());

    return Promise.allSettled([cacheClear, serviceWorkerRefresh, authSessionRefresh, ...fetches]).then((results) => {
      const loaded = results.filter((item) => item.status === "fulfilled").length;
      localStorage.setItem("czs-v8-site-weight-profile", JSON.stringify({
        version: V8_BOOT_VERSION,
        refreshedAt: new Date().toISOString(),
        assetCount: assetUrls.length,
        preloadCount: fetches.length,
        completedTasks: loaded,
        mode: "intro-total-load",
      }));
      return results;
    });
  }

  function startLoaderAssistantLife(loader) {
    const card = $(".v8-loader-welcome", loader);
    const img = $("[data-loader-aylla]", loader);
    const text = $(".v8-loader-copy span", loader);
    if (!card || !img || card.dataset.poseLife === "1") return () => {};
    card.dataset.poseLife = "1";
    let index = 0;
    const applyPose = (poseIndex) => {
      const [src, message, pose] = AYLLA_LOADER_POSES[poseIndex % AYLLA_LOADER_POSES.length];
      card.dataset.pose = pose;
      card.classList.remove("is-changing");
      requestAnimationFrame(() => {
        card.classList.add("is-changing");
        window.setTimeout(() => card.classList.remove("is-changing"), 420);
      });
      img.src = src;
      img.alt = `RAyL em pose ${pose}`;
      if (text) text.textContent = message;
    };
    applyPose(0);
    const timer = window.setInterval(() => {
      index += 1;
      applyPose(index);
    }, 920);
    return () => {
      window.clearInterval(timer);
      card.classList.remove("is-changing");
      delete card.dataset.poseLife;
    };
  }

  function runCinematicIntro() {
    const loader = $("#cinematicLoader");
    const fill = $("#progressFill");
    const text = $("#progressText");
    if (!loader || !fill || !text || window.__czsV8IntroControlled) return;
    const params = new URLSearchParams(window.location.search || "");
    const forceIntro = params.get("forceIntro") === "1" || params.get("intro") === "1";
    const skipIntro = params.get("skipIntro") === "1";
    let seenIntro = false;
    try {
      seenIntro = sessionStorage.getItem(INTRO_SESSION_KEY) === V8_BOOT_VERSION;
    } catch (_) {
      seenIntro = false;
    }
    window.__czsV8IntroControlled = true;
    if ((seenIntro && !forceIntro) || skipIntro) {
      if (skipIntro) {
        try {
          sessionStorage.setItem(INTRO_SESSION_KEY, V8_BOOT_VERSION);
          sessionStorage.setItem(ENTRY_POPUP_SESSION_KEY, V8_BOOT_VERSION);
        } catch (_) {}
      }
      loader.classList.add("done");
      loader.hidden = true;
      loader.setAttribute("aria-hidden", "true");
      loader.style.pointerEvents = "none";
      document.body.classList.remove("v8-intro-running");
      releaseIntroLock();
      return;
    }
    document.body.classList.add("v8-intro-running");
    loader.classList.remove("done", "v8-intro-exit");
    loader.hidden = false;
    loader.style.pointerEvents = "";
    loader.setAttribute("aria-hidden", "false");
    loader.dataset.stage = "swarm";

    const started = performance.now();
    const fullSequenceMs = 7800;
    const forcedFinishMs = 9800;
    let finished = false;
    let foldReady = false;
    let shellReady = false;
    let stopAssistantLife = () => {};
    firstFoldReady().then(() => {
      foldReady = true;
    });
    refreshAppShellCache().then(() => {
      shellReady = true;
    });
    const doneGuard = window.setInterval(() => {
      if (!finished) loader.classList.remove("done");
    }, 90);

    const status = $(".v8-loader-status", loader);
    const introVideo = $(".v8-loader-video", loader);
    let introVideoStarted = false;
    stopAssistantLife = startLoaderAssistantLife(loader);
    const setStatus = (message) => {
      if (status && status.textContent !== message) status.textContent = message;
    };

    const setProgress = (value) => {
      const p = Math.max(0, Math.min(100, Math.round(value)));
      fill.style.width = `${p}%`;
      text.textContent = `${p}%`;
      loader.dataset.progress = String(p);
      if (p < 24) loader.dataset.stage = "swarm";
      else if (p < 38) loader.dataset.stage = "collision";
      else if (p < 94) loader.dataset.stage = "video";
      else loader.dataset.stage = "ready";
      if (introVideo && p >= 38 && !introVideoStarted) {
        introVideoStarted = true;
        try {
          introVideo.currentTime = 0;
          introVideo.muted = true;
          introVideo.loop = true;
          introVideo.play?.().catch?.(() => {});
        } catch (_) {}
      }
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      window.clearInterval(doneGuard);
      stopAssistantLife();
      setProgress(100);
      setStatus("Tudo pronto. Abrindo o jornal.");
      loader.dataset.stage = "ready";
      loader.classList.add("v8-intro-exit");
      setTimeout(() => {
        loader.classList.add("done");
        loader.setAttribute("aria-hidden", "true");
        loader.hidden = true;
        loader.style.pointerEvents = "none";
        document.body.classList.remove("v8-intro-running");
        releaseIntroLock();
        try {
          sessionStorage.setItem(INTRO_SESSION_KEY, V8_BOOT_VERSION);
        } catch (_) {}
        showEntryPopup();
        setTimeout(showEntryPopup, 260);
      }, 260);
    };

    const tick = (now) => {
      const elapsed = now - started;
      let progress = 4;
      if (elapsed < 1500) {
        progress = 4 + (elapsed / 1500) * 20;
        setStatus("Abrindo o céu do Vale.");
      } else if (elapsed < 2500) {
        progress = 24 + ((elapsed - 1500) / 1000) * 14;
        setStatus("Chamando a vinheta CZS.");
      } else if (elapsed < fullSequenceMs) {
        progress = 38 + ((elapsed - 2500) / (fullSequenceMs - 2500)) * 56;
        setStatus("Rodando o vídeo enquanto a página carrega.");
      } else {
        progress = 94;
        setStatus(shellReady && foldReady ? "Tudo pronto. Abrindo o jornal." : "Sincronizando a primeira dobra.");
      }
      if (!foldReady || !shellReady || elapsed < fullSequenceMs) progress = Math.min(progress, 94);
      setProgress(progress);
      if (foldReady && shellReady && elapsed >= fullSequenceMs) {
        finish();
        return;
      }
      if (elapsed > forcedFinishMs) {
        finish();
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function entryPopupDue() {
    const params = new URLSearchParams(window.location.search || "");
    if (params.get("forcePopup") === "1" || params.get("popup") === "1") return true;
    try {
      if (sessionStorage.getItem(ENTRY_POPUP_SESSION_KEY) === V8_BOOT_VERSION) return false;
    } catch (_) {}
    return true;
  }

  function markEntryPopupSeen(reason = "shown") {
    localStorage.setItem(ENTRY_POPUP_LAST_SEEN_KEY, String(Date.now()));
    localStorage.setItem(ENTRY_POPUP_VERSION_KEY, V8_BOOT_VERSION);
    localStorage.setItem("czs-v8-entry-popup-last-reason", reason);
    localStorage.setItem("czs-v8-entry-popup-next-at", String(Date.now() + ENTRY_POPUP_INTERVAL_MS));
    try {
      sessionStorage.setItem(ENTRY_POPUP_SESSION_KEY, V8_BOOT_VERSION);
    } catch (_) {}
  }

  function installEntryPopup() {
    sessionStorage.setItem("czs-premium-popup-seen", "1");
    document.body.classList.remove("v8-commercial-popup-on");
    const popup = $("#pubPaidPopup");
    if (popup) {
      popup.classList.remove("on");
      popup.hidden = true;
      popup.setAttribute("aria-hidden", "true");
    }

    if (!entryPopupDue()) return;
    if ($("#v8EntryPopup")) return;
    const panel = document.createElement("aside");
    panel.id = "v8EntryPopup";
    panel.className = "v8-entry-popup v8-commercial-entry";
    panel.hidden = true;
    panel.setAttribute("aria-hidden", "true");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Serviços comerciais do Catálogo CZS");
    panel.innerHTML = `
      <button type="button" class="v8-entry-close" aria-label="Fechar atalhos">×</button>
      <img class="v8-commercial-aylla" src="${RAYL_POSES.seatedFeature}" alt="" aria-hidden="true">
      <div class="v8-commercial-speech"><b>RAyL CZS.</b> Posso te mostrar o caminho.</div>
      <div class="v8-commercial-shell">
        <header class="v8-commercial-head">
          <span>Comercial CZS</span>
          <strong>Crie, divulgue ou automatize.</strong>
          <p>Escolha uma frente e fale com a equipe.</p>
        </header>
        <div class="v8-commercial-cards" aria-label="Artes e serviços">
          <a class="v8-commercial-card" href="#monetizacao">
            <span class="v8-card-art"><img src="assets/v8-commercial/commercial-sites.png" alt="Criação de sites"></span>
            <span class="v8-card-copy"><strong>Sites</strong><small>Site, vitrine ou página para vender melhor.</small></span>
          </a>
          <a class="v8-commercial-card" href="#pubpaidAtalhos">
            <span class="v8-card-art"><img src="assets/v8-commercial/commercial-apps.png" alt="Aplicativos e experiências digitais"></span>
            <span class="v8-card-copy"><strong>Apps</strong><small>Experiência digital, jogo ou fluxo interativo.</small></span>
          </a>
          <a class="v8-commercial-card" href="#monetizacao">
            <span class="v8-card-art"><img src="assets/v8-commercial/commercial-divulgacao.png" alt="Divulgação local"></span>
            <span class="v8-card-copy"><strong>Divulgação</strong><small>Campanha, card e presença no portal.</small></span>
          </a>
          <a class="v8-commercial-card" href="#servicos">
            <span class="v8-card-art"><img src="assets/v8-commercial/commercial-automacao.png" alt="Automação de atendimento"></span>
            <span class="v8-card-copy"><strong>Automação</strong><small>Atendimento, agenda e captação.</small></span>
          </a>
        </div>
        <nav class="v8-commercial-actions" aria-label="Ações comerciais">
          <button class="v8-commercial-primary" type="button" data-aylla-open>Falar com vendas</button>
          <a class="v8-commercial-ghost" href="#monetizacao">Ver formatos de anúncio</a>
          <a class="v8-commercial-ghost" href="#feed">Continuar lendo</a>
        </nav>
      </div>`;
    document.body.appendChild(panel);
    const close = () => {
      markEntryPopupSeen("closed");
      document.body.classList.remove("v8-entry-popup-active", "v8-commercial-popup-on");
      panel.classList.remove("is-on");
      panel.setAttribute("aria-hidden", "true");
      setTimeout(() => {
        panel.hidden = true;
        panel.remove();
      }, 260);
    };
    panel.querySelector(".v8-entry-close")?.addEventListener("click", close);
    panel.querySelectorAll("a").forEach((link) => link.addEventListener("click", close));
    panel.querySelector("[data-aylla-open]")?.addEventListener("click", () => {
      close();
      const assistant = $("#assistantCard");
      assistant?.classList.add("open");
      $("#assistantToggle") && ($("#assistantToggle").textContent = "Fechar");
      setTimeout(() => assistant?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 120);
    });
  }

  function showEntryPopup() {
    if (!entryPopupDue()) return;
    let panel = $("#v8EntryPopup");
    if (!panel) {
      installEntryPopup();
      panel = $("#v8EntryPopup");
    }
    if (!panel || panel.dataset.opened === "1") return;
    panel.dataset.opened = "1";
    markEntryPopupSeen("shown-after-intro");
    document.body.classList.add("v8-entry-popup-active", "v8-commercial-popup-on");
    panel.hidden = false;
    panel.removeAttribute("hidden");
    panel.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => panel.classList.add("is-on", "is-speaking"));
    setTimeout(() => {
      if (document.body.contains(panel) && panel.classList.contains("is-on")) {
        markEntryPopupSeen("auto-closed");
        document.body.classList.remove("v8-entry-popup-active", "v8-commercial-popup-on");
        panel.classList.remove("is-on");
        panel.setAttribute("aria-hidden", "true");
        setTimeout(() => {
          panel.hidden = true;
          panel.remove();
        }, 260);
      }
    }, 18000);
  }

  function floatArrow(direction) {
    if (direction === "up") {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5"></path><path d="M5 12l7-7 7 7"></path></svg>';
    }
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"></path><path d="M19 12l-7 7-7-7"></path></svg>';
  }

  function installFloatingFooterControl() {
    const footer = $("#fullSiteFooter");
    if (!footer) return;

    let button = $("#footerJumpFloat");
    if (!button) {
      button = document.createElement("button");
      button.id = "footerJumpFloat";
      document.body.appendChild(button);
    }

    $("#v8TopFloat")?.remove();
    button.className = "footer-jump-float v8-left-scroll-control";
    button.type = "button";
    button.removeAttribute("onclick");
    button.removeAttribute("title");

    const setMode = () => {
      const rect = footer.getBoundingClientRect();
      const nearFooter = rect.top <= window.innerHeight * 0.58 && rect.bottom > 120;
      const atPageEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 96;
      const mode = nearFooter || atPageEnd ? "home" : "footer";
      button.dataset.mode = mode;
      button.innerHTML = `${floatArrow(mode === "home" ? "up" : "down")}<span>${mode === "home" ? "Topo" : "Rodapé"}<small>${mode === "home" ? "Home" : "Mapa da página"}</small></span>`;
      button.setAttribute("aria-label", mode === "home" ? "Voltar para a home" : "Ir direto ao rodapé e mapa da página");
    };

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
      if (button.dataset.mode === "home") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(setMode, 420);
        return;
      }
      window.__czsFooterDirectJump = true;
      window.__czsFooterOpenedFinal = true;
      footer.classList.add("revealed", "forced");
      if (typeof window.__v8LoadAllContinuousNews === "function") {
        window.__v8LoadAllContinuousNews();
      }
      const jumpToFooterNow = () => {
        const top = footer.getBoundingClientRect().top + window.scrollY - 12;
        window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
        setMode();
      };
      let attempts = 0;
      const settleOnFooter = () => {
        jumpToFooterNow();
        attempts += 1;
        const rect = footer.getBoundingClientRect();
        const visible = rect.top < window.innerHeight * .72 && rect.bottom > 0;
        if (!visible && attempts < 36) {
          setTimeout(settleOnFooter, 90);
        }
      };
      settleOnFooter();
    }, true);

    window.addEventListener("scroll", setMode, { passive: true });
    window.addEventListener("resize", setMode, { passive: true });
    setMode();
  }

  function installAyllaAssistant() {
    const card = $("#assistantCard");
    if (!card || card.dataset.ayllaReady) return;
    card.dataset.ayllaReady = "1";
    card.classList.add("aylla-card", "aylla-pose-wave");
    card.dataset.anchor = "floating";

    const portrait = $(".assistant-portrait", card);
    if (portrait) {
      portrait.className = "assistant-portrait aylla-portrait";
      portrait.innerHTML = `<img src="${RAYL_POSES.chatWave}" alt="RAyL, assistente virtual do CZS">`;
    }

    const title = $(".assistant-head strong", card);
    const status = $(".assistant-head p", card);
    if (title) title.textContent = "RAyL CZS";
    if (status) {
      status.textContent = "";
      status.hidden = true;
      status.setAttribute("aria-hidden", "true");
    }

    const body = $(".assistant-body", card);
    if (body) {
      body.innerHTML = `
        <div class="aylla-stage" aria-live="polite">
          <img class="aylla-full" src="${RAYL_POSES.chatWave}" alt="RAyL acenando">
          <div class="aylla-speech"><b>Oi!</b> Eu sou a RAyL. Escolha uma opção abaixo.</div>
        </div>
        <div class="aylla-faq" aria-label="Perguntas frequentes">
          <button type="button" data-aylla-faq="anunciar">Como anunciar?</button>
          <button type="button" data-aylla-faq="noticia">Enviar notícia</button>
          <button type="button" data-aylla-faq="arquivo">Arquivo</button>
          <button type="button" data-aylla-faq="servicos">Serviços úteis</button>
          <button type="button" data-aylla-faq="escritorios">Escritórios</button>
          <button type="button" data-aylla-faq="pubpaid">Conhecer PubPaid</button>
          <button type="button" data-aylla-faq="pesquisa">Pesquisa</button>
          <button type="button" data-aylla-faq="correcao">Informar erro</button>
          <button type="button" data-aylla-faq="galeria">Galeria</button>
          <button type="button" data-aylla-faq="mapa">Mapa do site</button>
          <button type="button" data-aylla-faq="whatsapp">Falar humano</button>
        </div>
        <div class="mini-list aylla-actions">
          <a class="small-btn" href="#feed" data-aylla-go="news">Notícias</a>
          <a class="small-btn" href="#arquivoArtigoSystem" data-aylla-go="archive">Arquivo</a>
          <a class="small-btn" href="#servicos" data-aylla-go="services">Serviços</a>
          <a class="small-btn" href="#pubpaidAtalhos" data-aylla-go="games">Pesquisa</a>
          <a class="small-btn" href="#comunidade" data-aylla-go="community">Enviar pauta</a>
        </div>
        <form class="aylla-ask" data-aylla-form>
          <label for="ayllaQuestion">Tire uma dúvida</label>
          <div>
            <input id="ayllaQuestion" type="search" name="question" autocomplete="off" placeholder="Ex: quero anunciar no CZS">
            <button type="submit">Perguntar</button>
          </div>
        </form>
        <div class="aylla-human-slot" hidden></div>
        <div id="assistantOut" class="aylla-log"></div>`;
    }

    const dock = document.createElement("div");
    dock.id = "ayllaDock";
    dock.className = "aylla-dock is-hidden";
    dock.setAttribute("aria-hidden", "true");
    dock.innerHTML = `
      <button class="aylla-dock-close" type="button" aria-label="Trazer RAyL para o suporte">×</button>
      <img src="${RAYL_POSES.chatPoint}" alt="">
      <span>Oi, estou aqui.</span>`;
    document.body.appendChild(dock);

    const poseMap = {
      wave: [RAYL_POSES.chatWave, "Eu sou a RAyL. Escolha uma opção abaixo."],
      polite: [RAYL_POSES.chatNeutral, "Estou aqui para ajudar com calma."],
      "point-right": [RAYL_POSES.chatPoint, "Este é o caminho mais direto."],
      "present-left": [RAYL_POSES.chatPointUp, "Tenho atalhos prontos para você."],
      "present-both": [RAYL_POSES.chatPresent, "Posso mostrar as opções principais."],
      "cute-seated": [RAYL_POSES.seatedFeature, "Fico aqui enquanto você escolhe."],
      thinking: [RAYL_POSES.chatThink, "Vou buscar o melhor atalho."],
      explain: [RAYL_POSES.chatPresent, "Vou explicar do jeito mais direto."],
      community: [RAYL_POSES.chatHoldCard, "Pauta da comunidade merece cuidado."],
      celebrate: [RAYL_POSES.chatCelebrate, "Essa parte pode ser divertida."],
      human: [RAYL_POSES.chatPhone, "Vou chamar atendimento humano."],
      peek: [RAYL_POSES.chatPoint, "Estou aqui na lateral se precisar."],
      card: [RAYL_POSES.chatPresent, "Posso destacar essa informação."],
      stand: [RAYL_POSES.chatNeutral, "Estou pronta para continuar."],
      "call-attention": [RAYL_POSES.chatPointUp, "Tem coisa importante para ver."],
      "surprised-seated": [RAYL_POSES.chatPhone, "Essa parte merece atenção."],
    };
    const whatsappNumber = "556896026649";
    const faqItems = [
      {
        id: "anunciar",
        pose: "present-both",
        title: "Como anunciar?",
        keywords: ["anunciar", "anuncio", "anúncio", "divulgar", "propaganda", "publicidade", "vendas", "site", "app"],
        answer: "Claro. Para anunciar no CZS, o caminho mais rapido e abrir a pagina Divulgue. La voce escolhe card, materia patrocinada, video, site, app ou automacao. Se preferir, eu deixo o WhatsApp pronto.",
        href: "divulgue.html",
      },
      {
        id: "noticia",
        pose: "community",
        title: "Enviar noticia",
        keywords: ["noticia", "notícia", "pauta", "denuncia", "denúncia", "foto", "video", "vídeo", "bairro", "comunidade"],
        answer: "Pode mandar a pauta com local, horario, foto ou video e uma explicacao simples do que aconteceu. A redacao checa antes de publicar, principalmente quando envolve denuncia, seguranca ou saude.",
        route: ["#comunidade", "community", "Aqui fica o caminho para pauta da comunidade."],
      },
      {
        id: "servicos",
        pose: "point-right",
        title: "Servicos uteis",
        keywords: ["servico", "serviço", "farmacia", "farmácia", "hospital", "telefone", "energia", "agua", "água", "clima", "rio"],
        answer: "Vai em Servicos. Ali ficam hospitais, farmacias, clima, rio, energia, agua, telefones e alertas locais para resolver sem ficar procurando pelo site inteiro.",
        route: ["#servicos", "point-right", "Vou te levar para os servicos uteis."],
      },
      {
        id: "escritorios",
        pose: "call-attention",
        title: "Escritórios",
        keywords: ["escritorio", "escritórios", "escritorios", "office", "redacao", "redação", "cheffe", "equipe"],
        answer: "Os escritorios trabalham pela Cheffe Call. Por ali a ordem chega para Redacao, Comercial, Comunidade, Fotos, Servicos e Cheffe, cada um cuidando da parte certa.",
        route: ["#agentesAutonomos", "call-attention", "Entrada visual dos agentes autônomos."],
      },
      {
        id: "arquivo",
        pose: "point-right",
        title: "Arquivo",
        keywords: ["arquivo", "antiga", "antigas", "mes", "mês", "ano", "semana", "dia", "buscar", "busca", "pesquisar materia"],
        answer: "O Arquivo e para achar noticia antiga sem sofrimento. Voce pode buscar por palavra, periodo, editoria, fonte ou pasta do mes.",
        route: ["#arquivoArtigoSystem", "point-right", "Arquivo completo do CZS."],
      },
      {
        id: "pubpaid",
        pose: "celebrate",
        title: "PubPaid",
        keywords: ["pubpaid", "jogo", "jogos", "sinuca", "xadrez", "ranking", "torneio"],
        answer: "O PubPaid e a area de jogos, campanhas e participacao do CZS. Eu te levo pelo atalho para abrir os jogos, ranking e novidades.",
        route: ["pubpaid.html", "celebrate", "O botão vermelho Conhecer PubPaid abre o PubPaid."],
      },
      {
        id: "pesquisa",
        pose: "present-left",
        title: "Pesquisa",
        keywords: ["pesquisa", "eleitoral", "enquete", "votar", "opiniao", "opinião"],
        answer: "Pesquisas e enquetes ficam no bloco de participacao. Quando tiver rodada ativa, o CZS mostra o caminho direto para votar ou acompanhar o resultado.",
        route: ["#pubpaidAtalhos", "present-left", "Pesquisas e resultados ficam aqui."],
      },
      {
        id: "correcao",
        pose: "call-attention",
        title: "Informar erro",
        keywords: ["erro", "corrigir", "correcao", "correção", "errado", "informar erro", "denunciar erro"],
        answer: "Se viu algo errado, mande o titulo da materia, o trecho e a fonte correta. A Cheffe Call registra a correcao para a redacao revisar.",
        route: ["#comunidade", "call-attention", "A correção pode entrar como pauta para a redação."],
      },
      {
        id: "galeria",
        pose: "present-both",
        title: "Galeria",
        keywords: ["galeria", "foto", "fotos", "imagem", "turismo", "cruzeiro do sul", "mapa"],
        answer: "A Galeria e o lugar das fotos do Vale do Jurua: pontos de Cruzeiro do Sul, imagens locais, mapa e contexto para navegar com calma.",
        route: ["#galeriaFotos", "present-both", "Galeria e pontos de Cruzeiro do Sul."],
      },
      {
        id: "mapa",
        pose: "point-right",
        title: "Mapa do site",
        keywords: ["mapa", "site", "onde fica", "rodape", "rodapé", "menu"],
        answer: "O mapa fica no rodape. Ele junta noticias, arquivo, servicos, comunidade, comercial e redacao em um caminho so.",
        route: ["#fullSiteFooter", "point-right", "Mapa completo do portal."],
      },
      {
        id: "whatsapp",
        pose: "call-attention",
        title: "WhatsApp",
        keywords: ["whatsapp", "zap", "contato", "falar", "atendente", "humano", "pessoa", "dono"],
        answer: "Sem problema. Vou deixar o WhatsApp pronto para voce falar com uma pessoa do CZS.",
      },
    ];

    const raylVoiceIntro = "Oi, eu sou a RAyL.";
    const spokenFaq = {
      anunciar: "Como anunciar no CZS.",
      noticia: "Enviar notícia para a redação.",
      arquivo: "Abrir o arquivo.",
      servicos: "Serviços úteis.",
      escritorios: "Escritórios de agentes.",
      pubpaid: "Conheça o PubPaid.",
      pesquisa: "Pesquisa e participação.",
      correcao: "Informar erro.",
      galeria: "Galeria de fotos.",
      mapa: "Mapa do site.",
      whatsapp: "Falar com humano.",
    };

    let raylVoice = null;
    const pickRaylVoice = () => {
      if (!("speechSynthesis" in window) || typeof window.speechSynthesis.getVoices !== "function") return null;
      const voices = window.speechSynthesis.getVoices();
      raylVoice = voices.find((voice) => /pt[-_]?br/i.test(voice.lang) && /maria|luciana|google|female/i.test(voice.name))
        || voices.find((voice) => /pt[-_]?br/i.test(voice.lang))
        || voices.find((voice) => /^pt/i.test(voice.lang))
        || voices[0]
        || null;
      return raylVoice;
    };
    if ("speechSynthesis" in window && typeof window.speechSynthesis.addEventListener === "function") {
      window.speechSynthesis.addEventListener("voiceschanged", pickRaylVoice);
    }
    const speakRayl = (text) => {
      try {
        if (!("speechSynthesis" in window) || typeof window.SpeechSynthesisUtterance !== "function") return;
        const clean = cleanPublicAiText(text || "", "")
          .replace(/https?:\/\/\S+/g, "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 240);
        if (!clean) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.lang = "pt-BR";
        utterance.rate = 0.96;
        utterance.pitch = 1.04;
        utterance.volume = 0.88;
        const voice = raylVoice || pickRaylVoice();
        if (voice) utterance.voice = voice;
        window.speechSynthesis.speak(utterance);
      } catch (_) {
        // Voice is optional; old browsers should keep the chat working.
      }
    };
    const idlePoseOrder = ["wave", "polite", "present-left", "point-right", "stand", "call-attention"];
    let idlePoseIndex = 0;
    let idlePoseTimer = 0;

    const scheduleIdlePose = () => {
      window.clearTimeout(idlePoseTimer);
      idlePoseTimer = window.setTimeout(() => {
        if (!document.body.contains(card)) return;
        idlePoseIndex = (idlePoseIndex + 1) % idlePoseOrder.length;
        const nextPose = idlePoseOrder[idlePoseIndex];
        setPose(nextPose, poseMap[nextPose]?.[1], { idle: true, silent: true });
        scheduleIdlePose();
      }, card.classList.contains("open") ? 5200 : 6800);
    };

    const setPose = (pose, message, options = {}) => {
      const item = poseMap[pose] || poseMap.wave;
      card.className = card.className.replace(/\baylla-pose-[\w-]+/g, "").trim();
      card.classList.add(`aylla-pose-${pose}`);
      card.classList.remove("aylla-is-changing");
      requestAnimationFrame(() => card.classList.add("aylla-is-changing"));
      clearTimeout(window.__ayllaPoseTimer);
      window.__ayllaPoseTimer = setTimeout(() => card.classList.remove("aylla-is-changing"), 480);
      const images = $$("img", card).filter((img) => img.closest(".aylla-portrait") || img.classList.contains("aylla-full"));
      images.forEach((img) => {
        img.src = item[0];
        img.alt = `RAyL em pose ${pose.replace(/-/g, " ")}`;
      });
      $$("[data-aylla-pose]", card).forEach((button) => {
        const active = button.dataset.ayllaPose === pose;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
      const speech = $(".aylla-speech", card);
      const publicMessage = cleanPublicAiText(message || item[1], item[1]);
      if (speech) speech.innerHTML = `<b>Oi!</b> ${esc(publicMessage)}`;
      const out = $("#assistantOut");
      if (out && message && !options.silent) out.insertAdjacentHTML("beforeend", `<div class="chat bot">${esc(publicMessage)}</div>`);
      if (!options.idle) scheduleIdlePose();
    };

    const normalizeQuestion = (value) => String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

    const findFaqAnswer = (questionOrId) => {
      const direct = faqItems.find((item) => item.id === questionOrId);
      if (direct) return direct;
      const normalized = normalizeQuestion(questionOrId);
      if (!normalized) return null;
      let best = null;
      let bestScore = 0;
      faqItems.forEach((item) => {
        const score = item.keywords.reduce((total, keyword) => {
          const key = normalizeQuestion(keyword);
          return total + (normalized.includes(key) ? 1 : 0);
        }, 0);
        if (score > bestScore) {
          best = item;
          bestScore = score;
        }
      });
      return bestScore > 0 ? best : null;
    };

    const whatsappUrlFor = (question) => `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Oi, CZS. Vim pelo chat da RAyL e quero falar com um atendimento humano. Minha duvida: ${question}`)}`;
    const faqRouteKeys = {
      servicos: "services",
      escritorios: "cheffe",
      pubpaid: "games",
      pesquisa: "games",
      arquivo: "archive",
      correcao: "cheffe",
      galeria: "gallery",
      mapa: "footer",
      noticia: "community",
    };

    const appendUserQuestion = (question) => {
      const out = $("#assistantOut");
      if (!out) return;
      out.insertAdjacentHTML("beforeend", `<div class="chat user">${esc(question)}</div>`);
      out.scrollTop = out.scrollHeight;
    };

    const appendWhatsappContact = (question) => {
      const out = $("#assistantOut");
      const safeQuestion = String(question || "Quero falar com atendimento humano.").trim();
      const href = whatsappUrlFor(safeQuestion);
      const message = "Essa eu prefiro nao chutar. Deixei o WhatsApp pronto com sua pergunta para alguem do CZS responder certinho.";
      setPose("human", message);
      const slot = $(".aylla-human-slot", card);
      if (slot) {
        slot.hidden = false;
        slot.innerHTML = `<a class="chat whatsapp" href="${href}" target="_blank" rel="noopener">Falar no WhatsApp</a>`;
      }
      if (out) {
        out.insertAdjacentHTML("beforeend", `<div class="chat bot">WhatsApp pronto acima.</div>`);
        out.scrollTop = out.scrollHeight;
      }
    };

    const appendRouteControl = (routeKey, title, href = "") => {
      const out = $("#assistantOut");
      if (!out) return;
      if (href) {
        out.insertAdjacentHTML("beforeend", `<a class="chat route" href="${esc(href)}">Abrir ${esc(title)}</a>`);
      } else {
        out.insertAdjacentHTML("beforeend", `<button type="button" class="chat route" data-aylla-go="${esc(routeKey)}">Abrir ${esc(title)}</button>`);
      }
      out.scrollTop = out.scrollHeight;
    };

    const askRaylBackend = async (question) => {
      const result = await apiPostJson(API.raylChat, {
        question,
        sourcePage: location.pathname + location.search,
      }, { timeout: 22000 });
      const payload = result.payload || {};
      if (!result.ok || !payload.ok || !payload.answer) throw new Error(payload.error || `HTTP ${result.status}`);
      return payload;
    };

    const answerQuestion = async (questionOrId, options = {}) => {
      const question = String(questionOrId || "").trim();
      if (!question) return;
      const directFaq = faqItems.find((item) => item.id === question);
      if (directFaq) {
        setPose(directFaq.pose, directFaq.answer);
        if (options.voice) speakRayl(`${raylVoiceIntro} ${directFaq.answer}`);
        if (directFaq.id === "whatsapp") {
          appendWhatsappContact(question);
          return;
        }
        if (directFaq.route) {
          appendRouteControl(faqRouteKeys[directFaq.id] || "community", directFaq.title);
        } else if (directFaq.href) {
          appendRouteControl("", directFaq.title, directFaq.href);
        }
        return;
      }
      try {
        const backend = await askRaylBackend(question);
        setPose(backend.pose || "explain", backend.answer);
        if (options.voice) speakRayl(backend.answer);
        if (backend.human) {
          appendWhatsappContact(question);
          return;
        }
        if (backend.routeKey || backend.href) {
          appendRouteControl(backend.routeKey || "news", backend.title || "Atalho", backend.href || "");
        }
        return;
      } catch (_) {
        // The server endpoint is optional in static previews; local FAQ keeps the assistant useful.
      }
      const faq = findFaqAnswer(question);
      if (!faq) {
        const fallbackMessage = "Essa eu nao quero chutar. Tente perguntar de outro jeito ou clique para falar com atendimento humano.";
        setPose("thinking", fallbackMessage);
        if (options.voice) speakRayl(fallbackMessage);
        return;
      }
      setPose(faq.pose, faq.answer);
      if (options.voice) speakRayl(faq.answer);
      if (faq.id === "whatsapp") {
        appendWhatsappContact(question);
        return;
      }
      if (faq.route) {
        appendRouteControl(faqRouteKeys[faq.id] || "community", faq.title);
      } else if (faq.href) {
        appendRouteControl("", faq.title, faq.href);
      }
    };

    const moveDock = (target, pose, label) => {
      const rect = target.getBoundingClientRect();
      const x = Math.min(window.innerWidth - 144, Math.max(10, rect.right - 112));
      const y = Math.min(window.innerHeight - 154, Math.max(76, rect.top - 86));
      dock.style.left = `${x}px`;
      dock.style.top = `${y}px`;
      dock.classList.remove("is-hidden");
      dock.classList.toggle("is-perched", pose === "seat");
      dock.classList.toggle("is-pointing", pose !== "seat");
      dock.setAttribute("aria-hidden", "false");
      dock.querySelector("img").src = pose === "seat" ? RAYL_POSES.seatedFeature : RAYL_POSES.fullPoint;
      dock.querySelector("span").textContent = label || "Oi, estou aqui.";
    };

    const guideTo = (selector, pose, message) => {
      const target = $(selector);
      if (!target) return;
      setPose(pose, message);
      card.classList.add("open");
      $("#assistantToggle") && ($("#assistantToggle").textContent = "Fechar");
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.add("aylla-highlight-pulse");
      setTimeout(() => target.classList.remove("aylla-highlight-pulse"), 1400);
      setTimeout(() => moveDock(target, pose === "cute-seated" ? "seat" : "point", message), 360);
    };

    card.addEventListener("click", (event) => {
      if (!card.classList.contains("open") && !event.target.closest("a, button")) {
        card.classList.add("open");
        $("#assistantToggle") && ($("#assistantToggle").textContent = "Fechar");
        return;
      }
      const poseButton = event.target.closest("[data-aylla-pose]");
      if (poseButton) {
        setPose(poseButton.dataset.ayllaPose);
        return;
      }
      const action = event.target.closest("[data-aylla-go]");
      const faqButton = event.target.closest("[data-aylla-faq]");
      if (faqButton) {
        answerQuestion(faqButton.dataset.ayllaFaq, { voice: true });
        return;
      }
      if (!action) return;
      const route = action.dataset.ayllaGo;
      const routes = {
        news: ["#feed", "point-right", "Vem comigo para as notícias mais recentes."],
        archive: ["#arquivoArtigoSystem", "point-right", "Arquivo por busca, período, fonte e mês."],
        services: ["#servicos", "present-left", "Aqui ficam os serviços úteis do dia."],
        games: ["#pubpaidAtalhos", "celebrate", "Pesquisas políticas e dados estão logo aqui."],
        community: ["#comunidade", "community", "Sentei aqui para receber sua pauta do bairro."],
        cheffe: ["#agentesAutonomos", "call-attention", "Entrada visual dos agentes autônomos."],
        gallery: ["#galeriaFotos", "present-both", "Galeria do Vale e pontos de Cruzeiro do Sul."],
        footer: ["#fullSiteFooter", "point-right", "Mapa completo no rodapé."],
      };
      const selected = routes[route];
      if (selected) {
        guideTo(selected[0], selected[1], selected[2]);
        speakRayl(`${raylVoiceIntro} ${selected[2]}`);
      }
    });

    $("[data-aylla-form]", card)?.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = $("#ayllaQuestion", card);
      const question = String(input?.value || "").trim();
      if (!question) return;
      appendUserQuestion(question);
      answerQuestion(question, { voice: true });
      if (input) input.value = "";
    });

    $$("[data-help]").forEach((button) => {
      button.addEventListener("click", () => {
        guideTo("#assistantInline", "call-attention", button.dataset.help || "Posso ajudar por aqui.");
      });
    });

    dock.querySelector(".aylla-dock-close")?.addEventListener("click", () => {
      dock.classList.add("is-hidden");
      dock.setAttribute("aria-hidden", "true");
      card.classList.add("open");
      card.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

    setTimeout(() => setPose("call-attention", "Sou a RAyL. Clique em Abrir quando quiser ajuda."), 1800);
  }

  function storyFromElement(element) {
    const holder = element?.closest?.("[data-v8-slug], .news-card, .story-row, .v8-command-card, .v8-archive-card");
    const slug = holder?.dataset?.v8Slug || holder?.dataset?.v8CommandCard || slugFromHref(holder?.querySelector?.("a[href]")?.href || "");
    return bySlug.get(slug) || heroStories[0] || allStories[0];
  }

  function paintCommunityReports() {
    const panel = $("#v8CommunityReports");
    if (!panel) return;
    const reports = safeRead(COMMUNITY_REPORTS_KEY, []);
    panel.innerHTML = reports.slice(0, 4).map((item) => `
      <div class="v8-editorial-card">
        <b>${esc(item.title || "Pauta enviada")}</b>
        <p>${esc(item.text)}</p>
        <small>${esc(compactDateTime(item.at || item.createdAt))} • ${esc(item.remoteLabel || item.status || "fila local")}</small>
      </div>`).join("") || "<div class=\"v8-editorial-card\"><b>Nenhuma pauta enviada ainda</b><p>O próximo relato aparece aqui e entra no registro público da redação.</p></div>";
  }

  async function loadCommunityReports() {
    try {
      const result = await apiFetchJson(`${API.communityReports}?limit=8`);
      const payload = result.payload || {};
      const items = Array.isArray(payload.items) ? payload.items : [];
      if (!result.ok || !items.length) return;
      const mapped = items.map((item) => ({
        id: item.id,
        title: item.topic || "Pauta enviada",
        text: item.message,
        at: item.createdAt,
        status: item.verificationStatus || item.status || "recebido",
        remoteLabel: "backend",
      }));
      safeWrite(COMMUNITY_REPORTS_KEY, mapped);
      paintCommunityReports();
    } catch (_) {
      paintCommunityReports();
    }
  }

  async function syncCommunityReport(report) {
    try {
      const result = await apiPostJson(API.communityReports, {
        topic: report.title || "Pauta do bairro",
        message: report.text,
        sourcePage: location.pathname + location.search,
      });
      const payload = result.payload || {};
      if (!result.ok || !payload.ok) throw new Error(payload.error || `HTTP ${result.status}`);
      const list = safeRead(COMMUNITY_REPORTS_KEY, []);
      const next = list.map((item) => item.id === report.id ? {
        ...item,
        id: payload.item?.id || item.id,
        remoteLabel: "backend",
        status: "recebido",
      } : item);
      safeWrite(COMMUNITY_REPORTS_KEY, next);
      paintCommunityReports();
    } catch (error) {
      const list = safeRead(COMMUNITY_REPORTS_KEY, []);
      const next = list.map((item) => item.id === report.id ? {
        ...item,
        remoteLabel: "fila local",
        remoteError: error?.message || "",
      } : item);
      safeWrite(COMMUNITY_REPORTS_KEY, next);
      paintCommunityReports();
    }
  }

  function installRealFormsAndActions() {
    const community = $("#comunidade");
    const communityButton = $("#communityBtn");
    const communityText = $("#communityText");
    if (community && !$("#v8CommunityReports")) {
      const panel = document.createElement("div");
      panel.id = "v8CommunityReports";
      panel.className = "v8-community-reports";
      community.querySelector(".panel")?.appendChild(panel);
      paintCommunityReports();
    }
    if (communityButton && communityText) {
      communityButton.onclick = null;
      communityButton.type = "button";
      communityButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        const text = communityText.value.trim();
        if (text.length < 12) {
          toast("Conte um pouco mais sobre a pauta.");
          communityText.focus();
          return;
        }
        const report = {
          id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
          at: new Date().toISOString(),
          title: "Pauta do bairro",
          text,
          remoteLabel: "enviando ao backend",
        };
        const reports = safeRead(COMMUNITY_REPORTS_KEY, []);
        reports.unshift(report);
        safeWrite(COMMUNITY_REPORTS_KEY, reports.slice(0, 24));
        queueCheffeAction({
          title: `Pauta do bairro: ${text.slice(0, 74)}`,
          sourceName: "Leitor CZS",
          slug: "",
          category: "Comunidade",
          summary: text,
        }, "community");
        syncCommunityReport(report);
        communityText.value = "";
        paintCommunityReports();
        toast("Pauta registrada para a redação");
      }, true);
    }

    const newsletter = $("#newsletterForm");
    if (newsletter) {
      newsletter.onsubmit = null;
      if (!$("#v8NewsletterStatus")) {
        const status = document.createElement("div");
        status.id = "v8NewsletterStatus";
        status.className = "v8-form-status";
        newsletter.appendChild(status);
      }
      newsletter.addEventListener("submit", (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        const input = newsletter.querySelector("input[type='email']");
        const email = String(input?.value || "").trim();
        const status = $("#v8NewsletterStatus");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          if (status) status.textContent = "Informe um e-mail válido para receber o resumo.";
          toast("E-mail inválido");
          input?.focus();
          return;
        }
        const leads = safeRead(NEWSLETTER_LEADS_KEY, []);
        if (!leads.some((item) => item.email.toLowerCase() === email.toLowerCase())) {
          leads.unshift({ email, at: new Date().toISOString(), source: "V8 newsletter" });
          safeWrite(NEWSLETTER_LEADS_KEY, leads.slice(0, 80));
        }
        if (status) status.textContent = `Resumo registrado para ${email}.`;
        queueCheffeAction({
          title: `Resumo grátis: ${email}`,
          sourceName: "Newsletter V8",
          slug: "",
          category: "Atendimento",
        }, "newsletter");
        if (input) input.value = "";
        toast("Resumo registrado");
      }, true);
    }

    document.addEventListener("click", (event) => {
      const save = event.target.closest(".saveBtn");
      if (save) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const story = storyFromElement(save);
        const saved = safeRead(SAVED_STORIES_KEY, []);
        if (story && !saved.some((item) => item.slug === story.slug)) {
          saved.unshift({
            slug: story.slug,
            title: story.title,
            at: new Date().toISOString(),
            source: sourceName(story),
          });
          safeWrite(SAVED_STORIES_KEY, saved.slice(0, 80));
        }
        save.textContent = "Salvo";
        save.classList.add("is-saved");
        toast("Notícia salva no V8");
        return;
      }
      const report = event.target.closest(".reportBtn");
      if (report) {
        event.preventDefault();
        event.stopImmediatePropagation();
        queueCheffeAction(storyFromElement(report), "correction");
      }
    }, true);
  }

  function defaultCommercialCampaigns() {
    return [
      {
        id: "topo-premium",
        title: "Topo premium",
        slot: "home-topo",
        size: "970x250",
        text: "Campanha principal para comércio, serviço ou anúncio institucional local.",
        href: whatsappHref("Oi, CZS. Quero reservar o formato Topo premium 970x250."),
      },
      {
        id: "card-patrocinado",
        title: "Card patrocinado",
        slot: "feed",
        size: "1:1",
        text: "Card para feed, grupos e redes sociais com foto real e copy curta.",
        href: whatsappHref("Oi, CZS. Quero um Card patrocinado para campanha local."),
      },
      {
        id: "video-vertical",
        title: "Vídeo vertical",
        slot: "video",
        size: "9:16",
        text: "Formato para stories, reels e seção de vídeos do CZS.",
        href: whatsappHref("Oi, CZS. Quero saber sobre vídeo vertical 9:16."),
      },
      {
        id: "site-app-automacao",
        title: "Site, app ou automação",
        slot: "servico-digital",
        size: "projeto",
        text: "Atendimento comercial para criar presença digital e automação.",
        href: whatsappHref("Oi, CZS. Quero contratar site, app ou automação."),
      },
    ];
  }

  function activeCommercialCampaigns() {
    return (commercialCampaigns.length ? commercialCampaigns : defaultCommercialCampaigns()).slice(0, 8);
  }

  function trackCommercialEvent(campaign, eventType = "click") {
    const event = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      at: new Date().toISOString(),
      eventType,
      campaignId: campaign?.id || "",
      title: campaign?.title || "",
      slot: campaign?.slot || "",
      page: location.pathname + location.search,
    };
    const cache = safeRead(AD_EVENT_CACHE_KEY, []);
    safeWrite(AD_EVENT_CACHE_KEY, [event, ...cache].slice(0, 120));
    apiPostJson(API.adsEvents, event, { timeout: 3500 }).catch(() => {});
  }

  function renderCommercialCampaigns() {
    const rail = $("#v8CampaignRail");
    if (!rail) return;
    const items = activeCommercialCampaigns();
    rail.innerHTML = items.map((item, index) => `
      <a class="v8-campaign-card ${index === 0 ? "is-active" : ""}" href="${esc(item.href || "#monetizacao")}" target="${/^https?:\/\//.test(item.href || "") ? "_blank" : "_self"}" rel="noopener" data-campaign-id="${esc(item.id)}">
        <span>${esc(item.slot || "campanha")}</span>
        <b>${esc(item.title)}</b>
        <p>${esc(item.text || item.description || "")}</p>
        <small>${esc(item.size || "sob medida")}</small>
      </a>`).join("");
    const cards = $$(".v8-campaign-card", rail);
    cards.forEach((card) => {
      card.addEventListener("click", () => {
        const campaign = items.find((item) => item.id === card.dataset.campaignId);
        trackCommercialEvent(campaign, "click");
      });
    });
    clearInterval(window.__v8CampaignTimer);
    let current = 0;
    window.__v8CampaignTimer = setInterval(() => {
      if (!cards.length) return;
      current = (current + 1) % cards.length;
      cards.forEach((card, index) => card.classList.toggle("is-active", index === current));
    }, 5600);
  }

  async function loadCommercialCampaigns() {
    try {
      const result = await apiFetchJson(API.adsCampaigns);
      const payload = result.payload || {};
      const items = Array.isArray(payload.items) ? payload.items : [];
      if (!result.ok || !items.length) throw new Error(payload.error || `HTTP ${result.status}`);
      commercialCampaigns = items;
    } catch (_) {
      commercialCampaigns = defaultCommercialCampaigns().map((item) => ({ ...item, source: "fallback-local" }));
    }
    renderCommercialCampaigns();
  }

  async function submitCommercialLead(form) {
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") || "").trim(),
      contact: String(data.get("contact") || "").trim(),
      format: String(data.get("format") || "").trim(),
      message: String(data.get("message") || "").trim(),
      sourcePage: location.pathname + location.search,
    };
    const status = $("#v8CommercialLeadStatus");
    if (!payload.contact || payload.contact.length < 6) {
      if (status) status.textContent = "Informe WhatsApp ou e-mail para o retorno.";
      toast("Contato obrigatório");
      return;
    }
    if (status) status.textContent = "Enviando pedido comercial...";
    try {
      const result = await apiPostJson(API.commercialLeads, payload);
      const response = result.payload || {};
      if (!result.ok || !response.ok) throw new Error(response.error || `HTTP ${result.status}`);
      if (status) status.textContent = "Pedido comercial registrado no backend.";
      form.reset();
      toast("Pedido comercial registrado");
    } catch (error) {
      if (status) status.textContent = "Backend indisponível. Use WhatsApp comercial para fechar agora.";
      toast(error?.message || "Falha ao registrar pedido");
    }
  }

  function enhanceCommercialAndShortcuts() {
    const section = $("#monetizacao");
    if (section) {
      section.classList.add("v8-commercial-real-section");
      section.innerHTML = `
        <div class="adbox v8-commercial-real">
          <div>
            <div class="section-kicker">Publicidade local</div>
            <h2>Espaços comerciais com atendimento real</h2>
            <p>Escolha anúncio, site, app, automação ou campanha e fale direto com o CZS.</p>
          </div>
          <div class="actions">
            <a class="btn gold" href="${whatsappHref("Oi, CZS. Quero anunciar ou contratar um serviço digital pelo V8.")}" target="_blank" rel="noopener">WhatsApp comercial</a>
            <a class="btn ghost" href="mailto:${SOCIAL_EMAIL}?subject=Comercial%20CZS%20V8">Enviar e-mail</a>
            <a class="btn ghost" href="divulgue.html">Ver página comercial</a>
          </div>
        </div>
        <div class="v8-commercial-format-grid">
          <div id="v8CampaignRail" class="v8-campaign-rail" aria-label="Campanhas comerciais em rotação"></div>
        </div>
        <form id="v8CommercialLeadForm" class="v8-commercial-lead">
          <input name="name" autocomplete="name" placeholder="Nome ou empresa">
          <input name="contact" autocomplete="tel" placeholder="WhatsApp ou e-mail">
          <select name="format">
            <option value="card-patrocinado">Card patrocinado</option>
            <option value="topo-premium">Topo premium</option>
            <option value="video-vertical">Vídeo vertical</option>
            <option value="site-app-automacao">Site, app ou automação</option>
          </select>
          <button type="submit">Enviar pedido</button>
          <p id="v8CommercialLeadStatus" class="v8-form-status"></p>
        </form>`;
      $("#v8CommercialLeadForm")?.addEventListener("submit", (event) => {
        event.preventDefault();
        submitCommercialLead(event.currentTarget);
      });
      renderCommercialCampaigns();
      loadCommercialCampaigns();
    }

    const shortcutTargets = [
      [".shortcut-card.game", "pubpaid.html"],
      [".shortcut-card.survey", "pesquisa-acre-2026.html"],
      ['#pubpaidAtalhos .shortcut-card[href*="divulgue"]', "divulgue.html"],
      ['#pubpaidAtalhos .shortcut-card[href*="fundadores"]', "#fundadores"],
    ];
    shortcutTargets.forEach(([selector, href]) => {
      const link = $(selector);
      if (link) link.href = href;
    });
    normalizeInternalLinks(document);
  }

  function disableLegacyPopup() {
    try {
      sessionStorage.setItem("czs-premium-popup-seen", "1");
    } catch (_) {}
    const popup = $("#pubPaidPopup");
    if (!popup) return;
    popup.classList.remove("on");
    popup.hidden = true;
    popup.setAttribute("aria-hidden", "true");
  }

  function guardLegacyPopup() {
    disableLegacyPopup();
    clearInterval(window.__v8LegacyPopupGuard);
    let ticks = 0;
    window.__v8LegacyPopupGuard = setInterval(() => {
      disableLegacyPopup();
      ticks += 1;
      if (ticks > 36) clearInterval(window.__v8LegacyPopupGuard);
    }, 500);
  }

  function init() {
    document.body.classList.add("v8-merge-ready");
    guardLegacyPopup();
    installEntryPopup();
    installBrandIdentity();
    installHeaderNewsCrawl();
    installSideParticles();
    installReader();
    installCopyPolish();
    sanitizePublicCopy();
    renderHero();
    renderSystemMap();
    renderOpportunityCategory();
    renderRealVideoHub();
    renderYoungArea();
    renderPremiumGallery();
    renderArchiveExplorer();
    renderCheffeCommand();
    loadArchiveEndpoint();
    loadCheffeBackendState();
    renderResearchAndSupport();
    renderFinalResources();
    enhanceCommercialAndShortcuts();
    positionPublicModulesBeforeContinuous();
    renderContinuousNewsScroll();
    renderNewsFooter();
    installSalesLanding();
    installContextSideRail();
    bindComingSoonSocials(document);
    decorateBrandMarks();
    sanitizePublicCopy();
    remapLegacyLinks();
    normalizeInternalLinks(document);
    installClickRouter();
    installDensityToggle();
    installGlobalReviewButtons();
    refreshVideoFrames();
    watchMutations();
    enhanceIntroParallax();
    installAyllaAssistant();
    installRealFormsAndActions();
    loadCommunityReports();
    installFloatingFooterControl();
    runCinematicIntro();
    guardLegacyPopup();
    handleHash();
    clearInterval(window.__v8CopyCleanupTimer);
    window.__v8CopyCleanupTimer = setInterval(() => sanitizePublicCopy(), 900);
    window.addEventListener("popstate", handleHash);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
