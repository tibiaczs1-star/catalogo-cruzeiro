(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CzsEditorialScope = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const HOUR_MS = 60 * 60 * 1000;
  const CRUZEIRO_PATTERN = /\b(cruzeiro do sul|cruzeiro-do-sul|cruzeirodosul|czs)\b/i;
  const JURUA_PATTERN = /\b(juru[aá]|vale do juru[aá]|m[âa]ncio lima|rodrigues alves|porto walter|marechal thaumaturgo|tarauac[aá]|feij[oó])\b/i;
  const ACRE_PATTERN = /\b(acre|rio branco|sena madureira|xapuri|brasil[eé]ia|epitaciol[aâ]ndia|assis brasil|pl[aá]cido de castro|capixaba|bujari|manuel urbano)\b/i;

  function textOf(item = {}) {
    return [item.title, item.summary, item.lede, item.description, item.subtitle]
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .filter(Boolean)
      .join(" ");
  }

  function sourceIsOfficialCruzeiro(item = {}) {
    const source = `${item.sourceName || ""} ${item.sourceUrl || ""}`;
    return /prefeitura\s+(municipal\s+)?de\s+cruzeiro\s+do\s+sul|cruzeirodosul\.ac\.gov\.br/i.test(source);
  }

  function getEditorialScope(item = {}) {
    const text = textOf(item);
    if (CRUZEIRO_PATTERN.test(text) || sourceIsOfficialCruzeiro(item)) {
      return { scope: "cruzeiro-do-sul", localTier: 4, priority: 5400, editorialPriority: "cruzeiro-destaque" };
    }
    if (JURUA_PATTERN.test(text)) {
      return { scope: "jurua", localTier: 3, priority: 4400, editorialPriority: "jurua-destaque" };
    }
    if (ACRE_PATTERN.test(text)) {
      return { scope: "acre", localTier: 2, priority: 3400, editorialPriority: "acre-destaque" };
    }
    return { scope: "brasil-mundo", localTier: 0, priority: 0, editorialPriority: "" };
  }

  function isLowSignalAdministrativeNotice(item = {}) {
    const haystack = `${item.title || ""} ${item.summary || ""} ${item.lede || ""} ${item.sourceLabel || ""}`;
    const normalized = haystack
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    return /\b(cotacao de precos?|aviso de cotacao|aviso de licitacao|extrato de contrato|decreto n[ºo]?|portaria n[ºo]?|ata de registro|termo de homologacao)\b/.test(
      normalized
    );
  }

  function decorateNewsItem(item = {}) {
    const placement = getEditorialScope(item);
    const lowSignalAdministrativeNotice = isLowSignalAdministrativeNotice(item);
    return {
      ...item,
      editorialScope: placement.scope,
      editorialLocalTier: placement.localTier,
      editorialSurfaceTier: lowSignalAdministrativeNotice ? 1 : placement.localTier,
      priority: lowSignalAdministrativeNotice ? Math.min(900, placement.priority) : placement.priority,
      editorialPriority: lowSignalAdministrativeNotice ? "arquivo-administrativo" : placement.editorialPriority
    };
  }

  function timestamp(item = {}) {
    const value = Date.parse(item.publishedAt || item.createdAt || item.date || "");
    return Number.isNaN(value) ? 0 : value;
  }

  function orderPortalStories(items = []) {
    const decorated = (Array.isArray(items) ? items : []).filter(Boolean).map(decorateNewsItem);
    const newest = decorated.reduce((latest, item) => Math.max(latest, timestamp(item)), 0);

    return decorated.sort((left, right) => {
      const leftFresh = Number(newest - timestamp(left) <= 96 * HOUR_MS);
      const rightFresh = Number(newest - timestamp(right) <= 96 * HOUR_MS);
      if (rightFresh !== leftFresh) return rightFresh - leftFresh;

      const noticeDiff =
        Number(isLowSignalAdministrativeNotice(left)) - Number(isLowSignalAdministrativeNotice(right));
      if (noticeDiff !== 0) return noticeDiff;

      const localTierDiff = Number(right.editorialLocalTier || 0) - Number(left.editorialLocalTier || 0);
      if (localTierDiff !== 0) return localTierDiff;

      const timestampDiff = timestamp(right) - timestamp(left);
      if (timestampDiff !== 0) return timestampDiff;

      return String(left.title || "").localeCompare(String(right.title || ""), "pt-BR");
    });
  }

  return { getEditorialScope, decorateNewsItem, orderPortalStories, isLowSignalAdministrativeNotice };
});
