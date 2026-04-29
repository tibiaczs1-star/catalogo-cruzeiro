"use strict";

(function () {
  const VISITOR_KEY = "catalogo_visitor_id";
  const SESSION_KEY = "catalogo_session_id";
  const QUEUE_KEY = "catalogo_analytics_queue";
  const CONSENT_KEY = "catalogo_lgpd_consent_v1";
  const VISITOR_COOKIE = "catalogo_visitor_id";
  const SESSION_COOKIE = "catalogo_session_id";
  const CONSENT_COOKIE = "catalogo_tracking_consent";
  const CONSENT_BANNER_ID = "catalogo-cookie-consent";
  const WELCOME_SESSION_ACCEPT_KEY = "catalogo_terms_session_accept_v1";
  const COOKIE_MAX_AGE_DAYS = 180;
  const HEARTBEAT_SEC = 30;

  let visitorId = "";
  let sessionId = "";
  let heartbeatTimer = null;
  let elapsed = 0;
  let trackingActive = false;
  let voteTrackingBound = false;

  function safeText(value, max = 250) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, max);
  }

  function storageAvailable(type) {
    try {
      const storage = window[type];
      if (!storage) return false;
      const probe = "__catalogo_probe__";
      storage.setItem(probe, "1");
      storage.removeItem(probe);
      return true;
    } catch {
      return false;
    }
  }

  const HAS_LOCAL_STORAGE = storageAvailable("localStorage");
  const HAS_SESSION_STORAGE = storageAvailable("sessionStorage");

  function isHomePage() {
    return location.pathname === "/" || /\/index\.html$/i.test(location.pathname || "");
  }

  function getLocalItem(key) {
    if (!HAS_LOCAL_STORAGE) return "";
    try {
      return localStorage.getItem(key) || "";
    } catch {
      return "";
    }
  }

  function setLocalItem(key, value) {
    if (!HAS_LOCAL_STORAGE) return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  }

  function removeLocalItem(key) {
    if (!HAS_LOCAL_STORAGE) return;
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }

  function getSessionItem(key) {
    if (!HAS_SESSION_STORAGE) return "";
    try {
      return sessionStorage.getItem(key) || "";
    } catch {
      return "";
    }
  }

  function setSessionItem(key, value) {
    if (!HAS_SESSION_STORAGE) return;
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // ignore
    }
  }

  function removeSessionItem(key) {
    if (!HAS_SESSION_STORAGE) return;
    try {
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  }

  function getCookie(name) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : "";
  }

  function setCookie(name, value, options = {}) {
    let cookie = `${name}=${encodeURIComponent(value)}; path=${options.path || "/"}; SameSite=${options.sameSite || "Lax"}`;

    if (typeof options.days === "number") {
      const expiresAt = new Date(Date.now() + options.days * 24 * 60 * 60 * 1000);
      cookie += `; Expires=${expiresAt.toUTCString()}`;
    }

    if (options.secure || location.protocol === "https:") {
      cookie += "; Secure";
    }

    document.cookie = cookie;
  }

  function clearCookie(name) {
    document.cookie = `${name}=; path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
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

  function generateId(prefix) {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
  }

  function getConsentState() {
    if (getSessionItem(WELCOME_SESSION_ACCEPT_KEY) === "1") {
      return "accepted";
    }

    if (isHomePage()) {
      return "";
    }

    return getLocalItem(CONSENT_KEY) || getCookie(CONSENT_COOKIE) || "";
  }

  function hasAcceptedConsent() {
    return getConsentState() === "accepted";
  }

  function setConsentState(state, source = "banner") {
    if (state !== "accepted" && state !== "rejected") {
      return;
    }

    setLocalItem(CONSENT_KEY, state);
    setCookie(CONSENT_COOKIE, state, { days: COOKIE_MAX_AGE_DAYS });

    window.dispatchEvent(
      new CustomEvent("catalogo:consent", {
        detail: {
          accepted: state === "accepted",
          state,
          source
        }
      })
    );
  }

  function getOrCreateVisitorId() {
    let value = getCookie(VISITOR_COOKIE) || getLocalItem(VISITOR_KEY);
    if (!value) {
      value = generateId("visitor");
    }

    setCookie(VISITOR_COOKIE, value, { days: COOKIE_MAX_AGE_DAYS });
    setLocalItem(VISITOR_KEY, value);
    return value;
  }

  function getOrCreateSessionId() {
    let value = getCookie(SESSION_COOKIE) || getSessionItem(SESSION_KEY);
    if (!value) {
      value = generateId("session");
    }

    setCookie(SESSION_COOKIE, value);
    setSessionItem(SESSION_KEY, value);
    return value;
  }

  function resetTrackingIds() {
    visitorId = "";
    sessionId = "";
    clearCookie(VISITOR_COOKIE);
    clearCookie(SESSION_COOKIE);
    removeLocalItem(VISITOR_KEY);
    removeSessionItem(SESSION_KEY);
  }

  function ensureTrackingIds() {
    if (!hasAcceptedConsent()) {
      return false;
    }

    visitorId = visitorId || getOrCreateVisitorId();
    sessionId = sessionId || getOrCreateSessionId();
    return Boolean(visitorId && sessionId);
  }

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

  function getTrackingMethod() {
    const methods = [];
    if (navigator.cookieEnabled) methods.push("cookie");
    if (HAS_LOCAL_STORAGE || HAS_SESSION_STORAGE) methods.push("storage");
    return methods.join("+") || "runtime";
  }

  function getQueue() {
    if (!HAS_LOCAL_STORAGE) return [];
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function setQueue(queue) {
    if (!HAS_LOCAL_STORAGE) return;
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
    if (!hasAcceptedConsent()) return;

    const queue = getQueue();
    if (!queue.length) return;

    const next = [];
    for (const item of queue) {
      const ok = await send(item.endpoint, item.payload);
      if (!ok) next.push(item);
    }

    setQueue(next);
  }

  function getUtmParams() {
    const params = new URLSearchParams(location.search);
    return {
      utmSource: safeText(params.get("utm_source"), 120),
      utmMedium: safeText(params.get("utm_medium"), 120),
      utmCampaign: safeText(params.get("utm_campaign"), 160),
      utmContent: safeText(params.get("utm_content"), 160),
      utmTerm: safeText(params.get("utm_term"), 160)
    };
  }

  function buildVisitPayload() {
    const ua = navigator.userAgent || "";
    const utm = getUtmParams();

    return {
      visitorId,
      sessionId,
      cookieVisitorId: getCookie(VISITOR_COOKIE),
      cookieSessionId: getCookie(SESSION_COOKIE),
      pagePath: `${location.pathname || "/"}${location.search || ""}`,
      pageTitle: safeText(document.title, 160),
      referrer: document.referrer || "",
      userAgent: ua,
      deviceType: getDeviceType(ua),
      browser: getBrowser(ua),
      language: navigator.language || "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
      screen: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
      viewport: `${window.innerWidth || 0}x${window.innerHeight || 0}`,
      platform: safeText(navigator.platform || "", 80),
      cookiesEnabled: Boolean(navigator.cookieEnabled),
      storageEnabled: HAS_LOCAL_STORAGE || HAS_SESSION_STORAGE,
      trackingConsent: getConsentState() || "accepted",
      trackingMethod: getTrackingMethod(),
      consentSource: getCookie(CONSENT_COOKIE) ? "cookie+storage" : "storage",
      city: safeText(getLocalItem("catalogo_user_city"), 80),
      country: safeText(getLocalItem("catalogo_user_country"), 40),
      ...utm
    };
  }

  function buildPayloadBase() {
    return {
      visitorId,
      sessionId,
      cookieVisitorId: getCookie(VISITOR_COOKIE),
      cookieSessionId: getCookie(SESSION_COOKIE),
      pagePath: `${location.pathname || "/"}${location.search || ""}`,
      pageTitle: safeText(document.title, 160),
      trackingConsent: getConsentState() || "accepted",
      trackingMethod: getTrackingMethod(),
      consentSource: getCookie(CONSENT_COOKIE) ? "cookie+storage" : "storage",
      cookiesEnabled: Boolean(navigator.cookieEnabled),
      storageEnabled: HAS_LOCAL_STORAGE || HAS_SESSION_STORAGE,
      viewport: `${window.innerWidth || 0}x${window.innerHeight || 0}`,
      platform: safeText(navigator.platform || "", 80)
    };
  }

  async function track(endpoint, payload) {
    if (!hasAcceptedConsent()) return;
    if (!ensureTrackingIds()) return;

    const finalPayload = {
      ...buildPayloadBase(),
      ...payload,
      visitorId: payload?.visitorId || visitorId,
      sessionId: payload?.sessionId || sessionId,
      cookieVisitorId: payload?.cookieVisitorId || getCookie(VISITOR_COOKIE),
      cookieSessionId: payload?.cookieSessionId || getCookie(SESSION_COOKIE)
    };

    const ok = await send(endpoint, finalPayload);
    if (!ok) enqueue(endpoint, finalPayload);
  }

  function startHeartbeat() {
    if (!hasAcceptedConsent() || heartbeatTimer) return;

    heartbeatTimer = window.setInterval(() => {
      elapsed += HEARTBEAT_SEC;
      track("/api/analytics/heartbeat", {
        durationSec: HEARTBEAT_SEC
      });
    }, HEARTBEAT_SEC * 1000);
  }

  function stopHeartbeat() {
    if (heartbeatTimer) {
      window.clearInterval(heartbeatTimer);
    }
    heartbeatTimer = null;
  }

  function setupVoteTracking() {
    if (voteTrackingBound) return;
    voteTrackingBound = true;

    document.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      const voteAction = target.closest(
        "[data-vote-candidate], [data-action='vote-candidate'], button, a"
      );
      if (!voteAction) return;

      // A enquete principal de eleicoes ja grava o voto completo no backend proprio.
      if (
        voteAction.matches(".vote-button[data-office][data-candidate]") ||
        voteAction.matches(".election-vote-button[data-static-vote]") ||
        voteAction.closest("#eleicoes")
      ) {
        return;
      }

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
        candidateName,
        office,
        scope,
        rankingUrl,
        sourcePage: `${location.pathname || "/"}${location.search || ""}`
      });
    });
  }

  function getContext() {
    return {
      visitorId,
      sessionId,
      cookieVisitorId: getCookie(VISITOR_COOKIE),
      cookieSessionId: getCookie(SESSION_COOKIE),
      consent: getConsentState(),
      trackingMethod: getTrackingMethod()
    };
  }

  function removeConsentBanner() {
    document.getElementById(CONSENT_BANNER_ID)?.remove();
  }

  function mountConsentBanner() {
    removeConsentBanner();
  }

  function activateTracking(options = {}) {
    if (!ensureTrackingIds()) {
      return;
    }

    trackingActive = true;
    elapsed = 0;
    flushQueue();

    if (options.sendVisit) {
      track("/api/analytics/visit", buildVisitPayload());
    }

    startHeartbeat();
  }

  function init() {
    window.CatalogoAnalytics = {
      getContext
    };

    setupVoteTracking();

    window.addEventListener("catalogo:consent", (event) => {
      removeConsentBanner();

      if (event?.detail?.accepted) {
        activateTracking({ sendVisit: true });
      } else {
        trackingActive = false;
        stopHeartbeat();
        setQueue([]);
        resetTrackingIds();
      }
    });

    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        if (trackingActive && hasAcceptedConsent()) {
          track("/api/analytics/heartbeat", {
            durationSec: Math.max(1, elapsed || HEARTBEAT_SEC)
          });
        }
        stopHeartbeat();
      } else if (trackingActive && hasAcceptedConsent()) {
        startHeartbeat();
      }
    });

    if (hasAcceptedConsent()) {
      activateTracking({ sendVisit: true });
    } else {
      mountConsentBanner();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
