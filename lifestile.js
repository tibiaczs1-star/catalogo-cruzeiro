(function () {
  const feed = document.querySelector("[data-lifestile-feed]");
  if (!feed) {
    return;
  }

  const fallback = [
    {
      title: "Acre em modo street style: roupa, calor, evento e rotina viram pauta visual.",
      summary: "A editoria observa rua, comércio, beleza e cultura para montar uma leitura de estilo local.",
      imageUrl: "./assets/home-cache/buzz-cruzeiro-03.jpg",
      tag: "acre"
    },
    {
      title: "Redes sociais ajudam a medir quais criadores e lugares entraram na conversa.",
      summary: "Reels, stories e perfis públicos entram como sinal, sempre com curadoria e contexto.",
      imageUrl: "./assets/home-cache/buzz-cruzeiro-01.jpg",
      tag: "redes"
    },
    {
      title: "Moda conversa com beleza, gastronomia, festa, turismo e pequenos negócios.",
      summary: "O Lifestile liga Esttíles, Festas & Social, Trending e a vitrine real do Acre.",
      imageUrl: "./assets/home-cache/buzz-acai-bowl.jpg",
      tag: "lifestile"
    }
  ];

  const escapeHtml = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const truncate = (value, limit) => {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    return text.length > limit ? `${text.slice(0, limit - 1).trim()}…` : text;
  };

  const scoreLifestyle = (item) => {
    const haystack = [
      item.title,
      item.summary,
      item.lede,
      item.category,
      item.categoryKey,
      item.sourceName,
      item.topicGroup
    ].join(" ").toLowerCase();
    let score = 0;
    if (/\b(acre|cruzeiro|jurua|rio branco|tarauaca|sena madureira|xapuri)\b/.test(haystack)) score += 30;
    if (/\b(moda|look|beleza|modelo|vitrine|loja|marca|estilo|make|cabelo)\b/.test(haystack)) score += 34;
    if (/\b(rede|social|instagram|tiktok|reels|story|stories|creator|influenc|viral|buzz)\b/.test(haystack)) score += 26;
    if (/\b(festa|show|evento|cultura|turismo|gastronomia|agenda|festival)\b/.test(haystack)) score += 18;
    if (/\b(abus|morte|crime|prisao|homicidio|violencia|estupro)\b/.test(haystack)) score -= 80;
    return score;
  };

  const normalizeItem = (item, index) => {
    const imageUrl =
      item.imageUrl ||
      item.feedImageUrl ||
      item.sourceImageUrl ||
      fallback[index % fallback.length].imageUrl;
    return {
      title: item.title || fallback[index % fallback.length].title,
      summary: item.summary || item.lede || fallback[index % fallback.length].summary,
      imageUrl,
      tag: item.category || item.eyebrow || fallback[index % fallback.length].tag
    };
  };

  const render = (items) => {
    const selected = [...items]
      .sort((a, b) => scoreLifestyle(b) - scoreLifestyle(a))
      .filter((item) => scoreLifestyle(item) > 8)
      .slice(0, 3)
      .map(normalizeItem);

    while (selected.length < 3) {
      selected.push(fallback[selected.length]);
    }

    feed.innerHTML = selected
      .map(
        (item) => `
          <article style="--feed-image:url('${escapeHtml(item.imageUrl)}')">
            <span>${escapeHtml(item.tag)}</span>
            <h3>${escapeHtml(truncate(item.title, 92))}</h3>
            <p>${escapeHtml(truncate(item.summary, 132))}</p>
          </article>
        `
      )
      .join("");
  };

  fetch("./api/topic-feed?topic=buzz&limit=18", { headers: { Accept: "application/json" } })
    .then((response) => (response.ok ? response.json() : null))
    .then((payload) => render(Array.isArray(payload?.items) ? payload.items : fallback))
    .catch(() => render(fallback));
})();
