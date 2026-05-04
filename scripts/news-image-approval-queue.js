const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT_DIR, "data");
const AUDIT_FILE = path.join(DATA_DIR, "news-image-focus-audit.json");
const APPROVALS_FILE = path.join(DATA_DIR, "news-image-focus-approvals.json");
const STATIC_NEWS_FILE = path.join(ROOT_DIR, "news-data.js");
const RUNTIME_NEWS_FILE = path.join(DATA_DIR, "runtime-news.json");
const NEWS_ARCHIVE_FILE = path.join(DATA_DIR, "news-archive.json");

const FINAL_DECISION_STATUSES = new Set(["applied", "sent-to-agents", "superseded"]);
const RUNTIME_DECISIONS = new Set(["approve-focus", "keep-fallback", "replace-image"]);

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
}

function safeText(value, max = 400) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalizeUrl(value, max = 1200) {
  const url = safeText(value, max);
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (/^(?:\.\/|\/)?assets\//i.test(url)) return url.startsWith("/") ? `.${url}` : url;
  return "";
}

function normalizeFocus(value = "") {
  const raw = safeText(value, 80).toLowerCase();
  if (!raw) return "";
  const normalized = raw
    .replace(/\bmiddle\b/g, "center")
    .replace(/\bcentre\b/g, "center")
    .replace(/\s+/g, " ")
    .trim();
  if (/^(left|center|right)(?:\s+(top|center|bottom|\d{1,3}%))?$/.test(normalized)) {
    return normalized.includes(" ") ? normalized : `${normalized} center`;
  }
  if (/^\d{1,3}%\s+\d{1,3}%$/.test(normalized)) return normalized;
  return "";
}

function isFallbackImage(url = "") {
  return /(?:^|\/)assets\/news-fallbacks\//i.test(String(url || ""));
}

function normalizeDecision(value = "") {
  const action = safeText(value, 60).toLowerCase();
  const aliases = {
    approve: "approve-focus",
    approved: "approve-focus",
    aprovado: "approve-focus",
    "aprovar-foco": "approve-focus",
    "approve-focus": "approve-focus",
    focus: "approve-focus",
    fallback: "keep-fallback",
    "keep-fallback": "keep-fallback",
    "manter-fallback": "keep-fallback",
    "trocar-imagem": "swap-image",
    "swap-image": "swap-image",
    swap: "swap-image",
    replace: "replace-image",
    "replace-image": "replace-image",
    "substituir-imagem": "replace-image",
    redo: "redo",
    refazer: "redo",
    reabrir: "redo",
    reject: "redo",
    reprovado: "redo"
  };
  return aliases[action] || "";
}

function getDecisionLabel(action = "") {
  return {
    "approve-focus": "Aprovar foco",
    "keep-fallback": "Manter fallback",
    "swap-image": "Trocar imagem",
    "replace-image": "Substituir imagem",
    redo: "Refazer"
  }[action] || "Revisar imagem";
}

function getDecisionStatus(action = "", replacementImageUrl = "") {
  if (action === "replace-image" || (action === "swap-image" && replacementImageUrl)) {
    return "queued-for-runtime";
  }
  if (RUNTIME_DECISIONS.has(action)) return "queued-for-runtime";
  return "queued-for-agents";
}

function buildDecisionId(slug, action, createdAt) {
  const stamp = String(createdAt || new Date().toISOString()).replace(/[^\d]/g, "").slice(0, 14);
  return `img-${safeText(slug, 80).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}-${action}-${stamp}`;
}

function readApprovalStore() {
  const payload = readJson(APPROVALS_FILE, {});
  return {
    version: 1,
    updatedAt: payload.updatedAt || "",
    decisions: Array.isArray(payload.decisions) ? payload.decisions : []
  };
}

function writeApprovalStore(store) {
  writeJson(APPROVALS_FILE, {
    version: 1,
    updatedAt: new Date().toISOString(),
    decisions: Array.isArray(store.decisions) ? store.decisions.slice(-600) : []
  });
}

function getLatestDecisionMap(decisions = []) {
  const map = new Map();
  decisions.forEach((decision) => {
    const slug = safeText(decision.slug, 220);
    if (!slug) return;
    const current = map.get(slug);
    if (!current || String(decision.createdAt || "") >= String(current.createdAt || "")) {
      map.set(slug, decision);
    }
  });
  return map;
}

function getSuggestedFocus(item = {}) {
  const current = normalizeFocus(item.effectiveFocus || item.imageFocus || "");
  if (current) return current;
  if (isFallbackImage(item.imageUrl)) return "center 50%";
  const reasons = Array.isArray(item.reasons) ? item.reasons.join(" ") : "";
  const signals = item.signals && typeof item.signals === "object" ? item.signals : {};
  if (/people|group|pessoa|grupo/i.test(reasons) || signals.hasPersonSignal || signals.hasGroupSignal) {
    return "center 38%";
  }
  return "center 42%";
}

function buildImageApprovalQueue(options = {}) {
  const audit = readJson(AUDIT_FILE, {});
  const store = readApprovalStore();
  const latestBySlug = getLatestDecisionMap(store.decisions);
  const itemsBySlug = new Map(
    (Array.isArray(audit.items) ? audit.items : [])
      .filter((item) => item?.slug)
      .map((item) => [item.slug, item])
  );
  const sourceQueue = Array.isArray(audit.reviewQueue) ? audit.reviewQueue : [];
  const queue = sourceQueue.map((item) => {
    const full = itemsBySlug.get(item.slug) || {};
    const merged = { ...full, ...item };
    const latestDecision = latestBySlug.get(item.slug) || null;
    const decisionOpen = latestDecision && !FINAL_DECISION_STATUSES.has(latestDecision.status);
    return {
      slug: safeText(merged.slug, 220),
      title: safeText(merged.title || "Sem titulo", 260),
      category: safeText(merged.category, 120),
      sourceName: safeText(merged.sourceName || merged.source, 120),
      publishedAt: safeText(merged.publishedAt || merged.date || merged.createdAt, 80),
      level: safeText(merged.level || "review", 40),
      reasons: Array.isArray(merged.reasons) ? merged.reasons.map((reason) => safeText(reason, 140)).filter(Boolean) : [],
      imageUrl: safeText(merged.imageUrl, 1200),
      effectiveFocus: safeText(merged.effectiveFocus, 80),
      suggestedFocus: getSuggestedFocus(merged),
      hasManualFocus: Boolean(merged.hasManualFocus),
      isNewSinceLastAudit: Boolean(merged.isNewSinceLastAudit),
      dimensionsFromUrl: merged.dimensionsFromUrl || null,
      signals: merged.signals || {},
      articleUrl: merged.slug ? `/noticia.html?slug=${encodeURIComponent(merged.slug)}` : "",
      latestDecision,
      decisionStatus: latestDecision?.status || "pending",
      decisionOpen: Boolean(decisionOpen),
      pending: !latestDecision || decisionOpen
    };
  });

  const newBlocked = queue.filter((item) => item.isNewSinceLastAudit);
  const pending = queue.filter((item) => item.pending);
  const selectedQueue = options.newOnly ? newBlocked : queue;
  const summary = audit.summary && typeof audit.summary === "object" ? audit.summary : {};

  return {
    ok: true,
    updatedAt: audit.updatedAt || "",
    approvalsUpdatedAt: store.updatedAt || "",
    checkedLimit: Number(audit.checkedLimit || 0) || 0,
    total: Number(audit.total || 0) || 0,
    offline: Boolean(audit.offline),
    summary: {
      ok: Number(summary.ok || 0) || 0,
      review: Number(summary.review || 0) || 0,
      warning: Number(summary.warning || 0) || 0,
      error: Number(summary.error || 0) || 0,
      manualFocus: Number(summary.manualFocus || 0) || 0,
      newSinceLastAudit: Number(summary.newSinceLastAudit || 0) || 0,
      missingImage: Number(summary.missingImage || 0) || 0,
      unreachableImage: Number(summary.unreachableImage || 0) || 0,
      reviewQueue: queue.length,
      newBlocked: newBlocked.length,
      pending: pending.length,
      decided: queue.length - pending.length
    },
    queue: selectedQueue,
    allQueue: queue,
    recentDecisions: store.decisions.slice(-30).reverse()
  };
}

function findAuditItem(slug = "") {
  const payload = buildImageApprovalQueue({ newOnly: false });
  return payload.allQueue.find((item) => item.slug === slug) || null;
}

function recordImageApprovalDecision(body = {}) {
  const slug = safeText(body.slug || body.id, 220);
  const action = normalizeDecision(body.decision || body.action || body.status);
  if (!slug) return { ok: false, status: 400, error: "Informe o slug da notícia." };
  if (!action) return { ok: false, status: 400, error: "Informe a decisão de foto/foco." };

  const auditItem = findAuditItem(slug);
  if (!auditItem) return { ok: false, status: 404, error: "Item de foto/foco não encontrado na fila." };

  const replacementImageUrl = normalizeUrl(body.replacementImageUrl || body.imageUrl || "");
  const finalAction = action === "swap-image" && replacementImageUrl ? "replace-image" : action;
  const createdAt = new Date().toISOString();
  const focus = normalizeFocus(body.focus || body.imageFocus || auditItem.suggestedFocus) || auditItem.suggestedFocus;
  const decision = {
    id: buildDecisionId(slug, finalAction, createdAt),
    slug,
    title: auditItem.title,
    action: finalAction,
    actionLabel: getDecisionLabel(finalAction),
    status: getDecisionStatus(finalAction, replacementImageUrl),
    focus,
    replacementImageUrl,
    note: safeText(body.note || body.feedback || body.reason, 900),
    requestedBy: safeText(body.requestedBy || "Full Admin", 80),
    source: safeText(body.source || "cheffe-call", 80),
    currentImageUrl: auditItem.imageUrl,
    currentFocus: auditItem.effectiveFocus,
    suggestedFocus: auditItem.suggestedFocus,
    reasons: auditItem.reasons,
    articleUrl: auditItem.articleUrl,
    createdAt,
    updatedAt: createdAt
  };

  const store = readApprovalStore();
  const decisions = Array.isArray(store.decisions) ? store.decisions : [];
  const nextDecisions = decisions.map((item) => {
    if (item.slug !== slug || FINAL_DECISION_STATUSES.has(item.status)) return item;
    return {
      ...item,
      status: "superseded",
      supersededBy: decision.id,
      updatedAt: createdAt
    };
  });
  nextDecisions.push(decision);
  writeApprovalStore({ ...store, decisions: nextDecisions });

  return {
    ok: true,
    decision,
    queue: buildImageApprovalQueue({ newOnly: false })
  };
}

function loadStaticNewsData() {
  if (!fs.existsSync(STATIC_NEWS_FILE)) return [];
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(STATIC_NEWS_FILE, "utf-8"), sandbox, { filename: STATIC_NEWS_FILE });
  return Array.isArray(sandbox.window.NEWS_DATA) ? sandbox.window.NEWS_DATA : [];
}

function writeStaticNewsData(items = []) {
  fs.writeFileSync(STATIC_NEWS_FILE, `window.NEWS_DATA = ${JSON.stringify(items, null, 2)};\n`, "utf-8");
}

function updateArticleList(items, decision) {
  if (!Array.isArray(items)) return { items, touched: false };
  let touched = false;
  const nextItems = items.map((item) => {
    if (!item || item.slug !== decision.slug) return item;
    const next = { ...item };
    if (decision.action === "approve-focus") {
      next.imageFocus = decision.focus || getSuggestedFocus(item);
      next.imageReviewStatus = "focus-approved";
    } else if (decision.action === "keep-fallback") {
      next.imageFocus = decision.focus || "center 50%";
      next.imageReviewStatus = "fallback-approved";
      if (isFallbackImage(next.imageUrl || next.feedImageUrl || next.sourceImageUrl)) {
        next.imageCredit = next.imageCredit || "Arte editorial automática do Catálogo Cruzeiro do Sul";
      }
    } else if (decision.action === "replace-image" && decision.replacementImageUrl) {
      next.imageUrl = decision.replacementImageUrl;
      next.feedImageUrl = decision.replacementImageUrl;
      next.sourceImageUrl = decision.replacementImageUrl;
      next.imageFocus = decision.focus || "center 42%";
      next.imageReviewStatus = "image-replaced-by-admin";
    } else if (decision.action === "swap-image") {
      next.imageReviewStatus = "swap-image-requested";
      next.imageReviewRequest = decision.note || "Trocar imagem na próxima rodada dos agentes.";
    } else if (decision.action === "redo") {
      next.imageReviewStatus = "redo-requested";
      next.imageReviewRequest = decision.note || "Refazer foto/foco na próxima rodada dos agentes.";
    }
    next.imageReviewDecisionId = decision.id;
    next.imageReviewUpdatedAt = new Date().toISOString();
    touched = true;
    return next;
  });
  return { items: nextItems, touched };
}

function updateRuntimeNewsFile(decision) {
  const payload = readJson(RUNTIME_NEWS_FILE, null);
  if (!payload || !Array.isArray(payload.items)) return false;
  const result = updateArticleList(payload.items, decision);
  if (!result.touched) return false;
  writeJson(RUNTIME_NEWS_FILE, {
    ...payload,
    items: result.items,
    imageApprovalsAppliedAt: new Date().toISOString()
  });
  return true;
}

function updateArchiveNewsFile(decision) {
  const items = readJson(NEWS_ARCHIVE_FILE, null);
  if (!Array.isArray(items)) return false;
  const result = updateArticleList(items, decision);
  if (!result.touched) return false;
  writeJson(NEWS_ARCHIVE_FILE, result.items);
  return true;
}

function updateStaticNewsFile(decision) {
  const items = loadStaticNewsData();
  const result = updateArticleList(items, decision);
  if (!result.touched) return false;
  writeStaticNewsData(result.items);
  return true;
}

function applyPendingImageApprovalDecisions(options = {}) {
  const source = safeText(options.source || "real-agents-runtime", 80);
  const store = readApprovalStore();
  const now = new Date().toISOString();
  const decisions = Array.isArray(store.decisions) ? store.decisions : [];
  let applied = 0;
  let sentToAgents = 0;
  let fileTouches = 0;

  const nextDecisions = decisions.map((decision) => {
    if (!decision || FINAL_DECISION_STATUSES.has(decision.status)) return decision;
    if (!["queued-for-runtime", "queued-for-agents"].includes(decision.status)) return decision;

    const runtimeAction = RUNTIME_DECISIONS.has(decision.action) || (decision.action === "replace-image" && decision.replacementImageUrl);
    let touched = false;
    if (runtimeAction) {
      touched = updateStaticNewsFile(decision) || touched;
      touched = updateRuntimeNewsFile(decision) || touched;
      touched = updateArchiveNewsFile(decision) || touched;
      if (touched) {
        applied += 1;
        fileTouches += 1;
        return {
          ...decision,
          status: "applied",
          appliedAt: now,
          appliedBy: source,
          updatedAt: now
        };
      }
    }

    sentToAgents += 1;
    return {
      ...decision,
      status: "sent-to-agents",
      sentToAgentsAt: now,
      sentToAgentsBy: source,
      updatedAt: now
    };
  });

  if (applied || sentToAgents) {
    writeApprovalStore({ ...store, decisions: nextDecisions });
  }

  return {
    ok: true,
    applied,
    sentToAgents,
    fileTouches,
    pendingBefore: decisions.filter((item) => ["queued-for-runtime", "queued-for-agents"].includes(item?.status)).length,
    updatedAt: applied || sentToAgents ? now : store.updatedAt || ""
  };
}

module.exports = {
  APPROVALS_FILE,
  buildImageApprovalQueue,
  recordImageApprovalDecision,
  applyPendingImageApprovalDecisions,
  getDecisionLabel
};
