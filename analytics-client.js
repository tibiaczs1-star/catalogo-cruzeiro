"use strict";

(function () {
  const VISITOR_KEY = "catalogo_visitor_id";
  const SESSION_KEY = "catalogo_session_id";
  const QUEUE_KEY = "catalogo_analytics_queue";
  const CONSENT_KEY = "catalogo_lgpd_consent_v1";
  const HEARTBEAT_SEC = 30;

  function safeText(value, max = 250) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, max);
  }

  function getOrCreateId(key, prefix) {
    let value = "";
    try {
      value = localStorage.getItem(key) || "";
    } catch {
      value = "";
    }

    if (!value) {
      value = `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
      try {
        localStorage.setItem(key, value);
      } catch {
        // ignore
      }
    }

    return value;
  }

  function getSessionId() {
    let value = "";
    try {
      value = sessionStorage.getItem(SESSION_KEY) || "";
    } catch {
      value = "";
    }

    if (!value) {
      value = `session_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
      try {
        sessionStorage.setItem(SESSION_KEY, value);
      } catch {
        // ignore
      }
    }
    return value;
  }

  function resolveApiBase() {
    if (typeof window.CATALOGO_API_BASE === "string" && window.CATALOGO_API_BASE) {
      return window.CATALOGO_API_BASE.replace(/\/$/, "");
    }
    if (location.protocol === "file:") {
      return "http://localhost:8787";
    }
    return location.origin;
  }

  const API_BASE = resolveApiBase();
  const visitorId = getOrCreateId(VISITOR_KEY, "visitor");
  const sessionId = getSessionId();
  let heartbeatTimer = null;
  let elapsed = 0;

  function getDeviceType(uaRaw) {
    const ua = String(uaRaw || "").toLowerCase();
    if (/mobile|iphone|android|ipod|blackberry|opera mini/i.test(ua)) {
      return "mobile";
    }
    if (/ipad|tablet/i.test(ua)) return "tablet";
    return "desktop";
  }

  function getBrowser(uaRaw) {
    const ua = String(uaRaw || "").toLowerCase();
    if (ua.includes("edg/")) return "Edge";
    if (ua.includes("opr/") || ua.includes("opera")) return "Opera";
    if (ua.includes("firefox/")) return "Firefox";
    if (ua.includes("chrome/")) return "Chrome";
    if (ua.includes("safari/")) return "Safari";
    return "Outro";
  }

  function getQueue() {
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function setQueue(queue) {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-120)));
    } catch {
      // ignore
    }
  }

  async function send(endpoint, payload) {
    const url = `${API_BASE}${endpoint}`;
    const body = JSON.stringify(payload);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  function enqueue(endpoint, payload) {
    const queue = getQueue();
    queue.push({ endpoint, payload, at: Date.now() });
    setQueue(queue);
  }

  async function flushQueue() {
    const queue = getQueue();
    if (!queue.length) return;

    const next = [];
    for (const item of queue) {
      const ok = await send(item.endpoint, item.payload);
      if (!ok) next.push(item);
    }
    setQueue(next);
  }

  async function track(endpoint, payload) {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent || consent === "rejected") return;

    const ok = await send(endpoint, payload);
    if (!ok) enqueue(endpoint, payload);
  }

  function buildVisitPayload() {
    const ua = navigator.userAgent || "";
    return {
      visitorId,
      sessionId,
      pagePath: `${location.pathname || "/"}${location.search || ""}`,
      referrer: document.referrer || "",
      userAgent: ua,
      deviceType: getDeviceType(ua),
      browser: getBrowser(ua),
      language: navigator.language || "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
      screen: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
      city: safeText(localStorage.getItem("catalogo_user_city"), 80),
      country: safeText(localStorage.getItem("catalogo_user_country"), 40)
    };
  }

  function setupVoteTracking() {
    document.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      const voteAction = target.closest(
        "[data-vote-candidate], [data-action='vote-candidate'], button, a"
      );
      if (!voteAction) return;

      const text = safeText(voteAction.textContent || "", 80).toLowerCase();
      const isVoteButton =
        voteAction.hasAttribute("data-vote-candidate") ||
        text.includes("simular voto") ||
        text.includes("votar");
      if (!isVoteButton) return;

      const card = voteAction.closest(
        "[data-candidate-card], .candidate-card, .election-card, article, .card"
      );

      const candidateName =
        safeText(voteAction.getAttribute("data-vote-candidate"), 120) ||
        safeText(
          card?.querySelector?.(".candidate-name, h3, h4, strong")?.textContent || "",
          120
        ) ||
        "Candidato não identificado";
      const office =
        safeText(voteAction.getAttribute("data-vote-office"), 120) ||
        safeText(card?.querySelector?.(".candidate-office, .party")?.textContent || "", 120) ||
        "Cargo não informado";
      const scope =
        safeText(voteAction.getAttribute("data-vote-scope"), 30) || "indefinido";
      const rankingUrl =
        safeText(voteAction.getAttribute("data-ranking-url"), 400) ||
        "https://www.politicos.org.br/Ranking";

      track("/api/votes", {
        visitorId,
        sessionId,
        candidateName,
        office,
        scope,
        rankingUrl,
        sourcePage: `${location.pathname || "/"}${location.search || ""}`
      });
    });
  }

  function startHeartbeat() {
    heartbeatTimer = window.setInterval(() => {
      elapsed += HEARTBEAT_SEC;
      track("/api/analytics/heartbeat", {
        visitorId,
        sessionId,
        pagePath: `${location.pathname || "/"}${location.search || ""}`,
        durationSec: HEARTBEAT_SEC
      });
    }, HEARTBEAT_SEC * 1000);
  }

  function stopHeartbeat() {
    if (heartbeatTimer) window.clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }

  function init() {
    flushQueue();

    track("/api/analytics/visit", buildVisitPayload());
    setupVoteTracking();
    startHeartbeat();

    window.addEventListener("catalogo:consent", (event) => {
      if (event?.detail?.accepted) {
        flushQueue();
        track("/api/analytics/visit", buildVisitPayload());
      }
    });

    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        track("/api/analytics/heartbeat", {
          visitorId,
          sessionId,
          pagePath: `${location.pathname || "/"}${location.search || ""}`,
          durationSec: Math.max(1, elapsed || HEARTBEAT_SEC)
        });
        stopHeartbeat();
      } else if (!heartbeatTimer) {
        startHeartbeat();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
