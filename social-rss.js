(function () {
  const feed = Array.isArray(window.SOCIAL_RSS_DATA) ? window.SOCIAL_RSS_DATA : [];
  const list = document.getElementById("social-rss-list");
  const note = document.getElementById("social-rss-note");

  if (!list || !feed.length) return;

  const getRelevance = (item) => {
    const engagement = Number(item.engagement || 0);
    const velocity = Number(item.velocity || 0);
    const trust = Number(item.trust || 0);
    const utility = Number(item.utility || 0);

    return Math.round(
      engagement * 0.35 +
        velocity * 0.25 +
        trust * 0.25 +
        utility * 0.15
    );
  };

  const escapeHtml = (value) =>
    String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const sorted = feed
    .map((item) => ({ ...item, relevance: getRelevance(item) }))
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 5);

  list.innerHTML = sorted
    .map((item) => {
      const signals = Array.isArray(item.signals) ? item.signals.slice(0, 3) : [];
      const signalText = signals.length ? signals.join(" • ") : "sinal social";

      return `
        <article class="social-rss-item">
          <div>
            <span class="social-rss-network">${escapeHtml(item.network)}</span>
            <strong>${escapeHtml(item.title)}</strong>
            <p>${escapeHtml(item.summary)}</p>
            <a class="social-rss-link" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(signalText)}</a>
          </div>
          <b>${item.relevance}</b>
        </article>
      `;
    })
    .join("");

  if (note) {
    note.textContent =
      "Critério: 35% engajamento, 25% velocidade, 25% confiabilidade e 15% utilidade pública.";
  }
})();
