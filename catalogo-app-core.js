"use strict";

(() => {
  const VERSION = "20260513-editorial-flow2";
  const ROOT = window.__CATALOGO_APP__ || {};
  const supportsIdle = typeof window.requestIdleCallback === "function";
  const scheduleIdle = (task, timeout = 1400) => {
    if (supportsIdle) {
      return window.requestIdleCallback(task, { timeout });
    }
    return window.setTimeout(() => task({ didTimeout: true, timeRemaining: () => 0 }), 120);
  };

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
  const memoryGb = Number(navigator.deviceMemory || 4);
  const cores = Number(navigator.hardwareConcurrency || 4);
  const reducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const compact =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(max-width: 820px)").matches;

  const AdaptiveQualityManager = {
    state: {
      compact,
      connection: connection?.effectiveType || "unknown",
      lowData: Boolean(connection?.saveData),
      memoryGb,
      cores,
      reducedMotion,
      tier: "cinematic"
    },
    detect() {
      const slowConnection = /(^slow-2g$|^2g$|^3g$)/i.test(this.state.connection);
      const weakHardware = this.state.memoryGb <= 2 || this.state.cores <= 4;
      const lite = this.state.reducedMotion || this.state.lowData || slowConnection || (compact && weakHardware);
      this.state.tier = lite ? "lite" : compact ? "balanced" : "cinematic";
      document.documentElement.dataset.qualityTier = this.state.tier;
      document.body?.classList.toggle("fx-lite", lite);
      document.body?.classList.toggle("catalogo-quality-balanced", this.state.tier === "balanced");
      document.body?.classList.toggle("catalogo-quality-cinematic", this.state.tier === "cinematic");
      return this.state;
    }
  };

  const PerformanceMonitor = {
    samples: [],
    longTasks: 0,
    observe() {
      if ("PerformanceObserver" in window) {
        try {
          const longTaskObserver = new PerformanceObserver((list) => {
            this.longTasks += list.getEntries().length;
          const canAutoDowngrade = compact || AdaptiveQualityManager.state.memoryGb <= 2 || AdaptiveQualityManager.state.lowData;
          if (canAutoDowngrade && this.longTasks > 3 && document.body.classList.contains("site-loaded")) {
            document.body.classList.add("fx-lite");
            document.documentElement.dataset.qualityTier = "lite";
          }
          });
          longTaskObserver.observe({ entryTypes: ["longtask"] });
        } catch (_error) {
          // Long task observation is optional.
        }
      }

      let last = performance.now();
      let frames = 0;
      const tick = (now) => {
        frames += 1;
        const elapsed = now - last;
        if (elapsed >= 1000) {
          const fps = Math.round((frames * 1000) / elapsed);
          this.samples.push(fps);
          this.samples = this.samples.slice(-6);
          document.documentElement.dataset.fpsHint = String(fps);
          const canAutoDowngrade = compact || AdaptiveQualityManager.state.memoryGb <= 2 || AdaptiveQualityManager.state.lowData;
          if (
            canAutoDowngrade &&
            document.body.classList.contains("site-loaded") &&
            this.samples.length >= 3 &&
            this.samples.slice(-3).every((value) => value < 42)
          ) {
            document.body.classList.add("fx-lite");
            document.documentElement.dataset.qualityTier = "lite";
          }
          frames = 0;
          last = now;
        }
        if (!document.hidden && this.samples.length < 8) {
          window.requestAnimationFrame(tick);
        }
      };
      window.setTimeout(() => {
        if (!document.hidden) {
          window.requestAnimationFrame(tick);
        }
      }, compact ? 3200 : 4200);
    }
  };

  const CacheManager = {
    name: `catalogo-shell-${VERSION}`,
    critical: [
      "./",
      "./index.html",
      "./styles.css?v=20260513-editorial-flow2",
      "./premium-home-redesign.css?v=20260513-founder-premium1",
      "./mobile-home-final.css?v=20260430-public-sync1",
      "./assets/logo-czs.svg?v=20260513-editorial-flow2",
      "./assets/favicon.svg",
      "./assets/icon-192.png",
      "./assets/icon-512.png",
      "./catalogo-app-core.js?v=20260513-editorial-flow2"
    ],
    async register() {
      if (!("serviceWorker" in navigator) || location.protocol === "file:") {
        return false;
      }
      try {
        const registration = await navigator.serviceWorker.register("./catalogo-sw.js?v=20260513-editorial-flow2");
        scheduleIdle(() => this.warm(), 2200);
        return registration;
      } catch (_error) {
        return false;
      }
    },
    async warm() {
      if (!("caches" in window)) {
        return;
      }
      try {
        const cache = await caches.open(this.name);
        await cache.addAll(this.critical);
      } catch (_error) {
        // Cache API failures should never block the page.
      }
    }
  };

  const AssetManager = {
    preloadImage(src, priority = "low") {
      if (!src || document.querySelector(`link[rel="preload"][href="${src}"]`)) {
        return;
      }
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = src;
      link.fetchPriority = priority;
      document.head.appendChild(link);
    },
    warmCriticalImages() {
      const urls = new Set();
      document.querySelectorAll("[style*='--thumb'], img[src]").forEach((node) => {
        if (node.tagName === "IMG") {
          urls.add(node.getAttribute("src"));
          return;
        }
        const style = node.getAttribute("style") || "";
        const match = style.match(/--thumb\s*:\s*url\(['"]?([^'")]+)['"]?\)/i);
        if (match?.[1]) urls.add(match[1]);
      });
      [...urls].slice(0, compact ? 6 : 12).forEach((src) => this.preloadImage(src));
    }
  };

  const RoutePreloader = {
    routes: ["./arquivo.html", "./catalogo-servicos.html", "./noticia.html", "./lifestile.html"],
    seen: new Set(),
    prefetch(href) {
      if (!href || this.seen.has(href) || location.protocol === "file:") return;
      this.seen.add(href);
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = href;
      link.as = "document";
      document.head.appendChild(link);
    },
    init() {
      scheduleIdle(() => this.routes.slice(0, compact ? 2 : 4).forEach((href) => this.prefetch(href)), 2600);
      document.addEventListener(
        "pointerover",
        (event) => {
          const anchor = event.target.closest?.("a[href]");
          if (!anchor) return;
          const href = anchor.getAttribute("href");
          if (href && !href.startsWith("#") && !/^https?:/i.test(href)) this.prefetch(href);
        },
        { passive: true }
      );
    }
  };

  const MemoryCleaner = {
    init() {
      document.addEventListener("visibilitychange", () => {
        document.body.classList.toggle("catalogo-tab-hidden", document.hidden);
      });
      window.addEventListener(
        "pagehide",
        () => {
          document.body.classList.add("catalogo-page-disposing");
        },
        { once: true }
      );
    }
  };

  const LoaderManager = {
    setInstantSplashCopy() {
      const copy = document.querySelector(".logo-splash-copy");
      const status = document.querySelector("#logo-splash-status");
      if (copy) copy.textContent = "Inicializando experiência...";
      if (status) status.textContent = "Inicializando experiência...";
    },
    waitUntilReady(timeout = compact ? 5200 : 6400) {
      const promises = [
        document.fonts?.ready?.catch?.(() => undefined) || Promise.resolve(),
        window.__CATALOGO_DEFERRED_BOOT_PROMISE__?.catch?.(() => undefined) || Promise.resolve()
      ];
      return Promise.race([
        Promise.allSettled(promises),
        new Promise((resolve) => window.setTimeout(resolve, timeout))
      ]);
    }
  };

  function start() {
    AdaptiveQualityManager.detect();
    LoaderManager.setInstantSplashCopy();
    PerformanceMonitor.observe();
    MemoryCleaner.init();
    RoutePreloader.init();
    scheduleIdle(() => AssetManager.warmCriticalImages(), 1900);
    scheduleIdle(() => CacheManager.register(), 2400);
    window.dispatchEvent(new CustomEvent("catalogo:core-ready", { detail: { version: VERSION } }));
  }

  window.__CATALOGO_APP__ = {
    ...ROOT,
    VERSION,
    AdaptiveQualityManager,
    PerformanceMonitor,
    CacheManager,
    AssetManager,
    RoutePreloader,
    LoaderManager,
    MemoryCleaner
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
