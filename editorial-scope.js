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
      return { scope: "cruzeiro-do-sul", localTier: 5, priority: 6400, editorialPriority: "cruzeiro-destaque" };
    }
    if (JURUA_PATTERN.test(text)) {
      return { scope: "jurua", localTier: 4, priority: 5400, editorialPriority: "jurua-destaque" };
    }
    if (ACRE_PATTERN.test(text)) {
      return { scope: "acre", localTier: 2, priority: 3400, editorialPriority: "acre-destaque" };
    }
    return { scope: "brasil-mundo", localTier: 0, priority: 0, editorialPriority: "" };
  }

  // CZS 2026-11-09 — diversão, lazer, comida e trends.
  // A pedido editorial: essas pautas entram intercaladas, sem competir
  // com notícia local dura (que é o que o leitor precisa primeiro).
  const LEISURE_PATTERN = /\b(gastronomia|receita|restaurante|lanchonete|pizzaria|caf[eé]|bar\b|comida|culin[aá]ria|sabor|prato|card[aá]pio|feira gastron[oô]mica|happy hour)\b|\b(lazer|passeio|turismo|trilha|praia|banho de rio|parque|festival|show|m[uú]sica|cinema|teatro|esporte|futebol|jogo)\b|\b(trend|viral|meme|desafio|tiktok|reels|influenciador)\b/i;

  function isLeisureItem(item = {}) {
    return LEISURE_PATTERN.test(textOf(item));
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
      editorialSurfaceTier: lowSignalAdministrativeNotice
        ? 1
        : isLeisureItem(item) && placement.localTier < 3
          ? 1
          : placement.localTier,
      priority: lowSignalAdministrativeNotice
        ? Math.min(900, placement.priority)
        : isLeisureItem(item) && placement.localTier < 3
          ? 1200
          : placement.priority,
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
      // CZS 2026-11-10 — relevancia regional antes de frescor. Antes, uma
      // nota nacional de hoje (Trump, Mega-Sena) passava na frente de uma
      // noticia do Juruá de ontem. O portal e do Vale: o que e local vem
      // primeiro; noticia de fora so entra se nao houver local mais nova.
      const localTierDiff = Number(right.editorialLocalTier || 0) - Number(left.editorialLocalTier || 0);
      const bothForeign = Number(left.editorialLocalTier || 0) === 0 && Number(right.editorialLocalTier || 0) === 0;
      if (localTierDiff !== 0 && !bothForeign) return localTierDiff;

      const noticeDiff =
        Number(isLowSignalAdministrativeNotice(left)) - Number(isLowSignalAdministrativeNotice(right));
      if (noticeDiff !== 0) return noticeDiff;

      const leftFresh = Number(newest - timestamp(left) <= 96 * HOUR_MS);
      const rightFresh = Number(newest - timestamp(right) <= 96 * HOUR_MS);
      if (rightFresh !== leftFresh) return rightFresh - leftFresh;

      const timestampDiff = timestamp(right) - timestamp(left);
      if (timestampDiff !== 0) return timestampDiff;

      return String(left.title || "").localeCompare(String(right.title || ""), "pt-BR");
    });
  }

  return { getEditorialScope, decorateNewsItem, orderPortalStories, isLowSignalAdministrativeNotice, isLeisureItem };
});
