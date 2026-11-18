(function () {
  "use strict";

  function esc(value) {
    return String(value || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function extractSlugFromHref(href) {
    if (!href) return "";
    var m = String(href).match(/[?&]slug=([^&#]+)/i);
    if (m && m[1]) {
      try {
        return decodeURIComponent(m[1]).trim();
      } catch (_e) {
        return m[1].trim();
      }
    }
    var hashMatch = String(href).match(/#noticia=([^&#]+)/i);
    if (hashMatch && hashMatch[1]) {
      try {
        return decodeURIComponent(hashMatch[1]).trim();
      } catch (_e) {
        return hashMatch[1].trim();
      }
    }
    return "";
  }

  function ensureModalElement() {
    var existing = document.getElementById("czsDossierModal");
    if (existing) return existing;

    var modal = document.createElement("div");
    modal.id = "czsDossierModal";
    modal.className = "czs-dossier-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Leitor de Reportagem e Checagem de Fatos");
    modal.hidden = true;
    modal.innerHTML = [
      '<div class="czs-dossier-backdrop" data-czs-dossier-close></div>',
      '<article class="czs-dossier-sheet">',
      '  <header class="czs-dossier-topbar">',
      '    <button type="button" class="czs-dossier-back" data-czs-dossier-close>← Voltar ao jornal</button>',
      '    <span class="czs-dossier-masthead">CATÁLOGO CZS • JORNALISMO ORIGINAL &amp; CHECAGEM</span>',
      '    <a class="czs-dossier-direct" id="czsDossierDirectLink" href="/noticia.html" target="_blank" rel="noopener">Abrir em nova guia ↗</a>',
      '  </header>',
      '  <div class="czs-dossier-body" id="czsDossierContent">',
      '    <p class="czs-dossier-loading">Verificando fontes, checando fatos e preparando a reportagem…</p>',
      '  </div>',
      '</article>'
    ].join("\n");

    document.body.appendChild(modal);

    modal.addEventListener("click", function (ev) {
      if (ev.target && ev.target.hasAttribute("data-czs-dossier-close")) {
        closeCzsDossierModal();
      }
    });

    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && !modal.hidden) {
        closeCzsDossierModal();
      }
    });

    return modal;
  }

  function closeCzsDossierModal() {
    var modal = document.getElementById("czsDossierModal");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.hidden = true;
    document.body.classList.remove("czs-dossier-open");
  }

  function renderCommentsList(comments) {
    if (!Array.isArray(comments) || !comments.length) {
      return '<p class="czs-citizen-empty">Nenhum comentário ou relato registrado ainda nesta matéria. Seja o primeiro cidadão a contribuir com informações do seu bairro ou opinião.</p>';
    }
    return comments
      .map(function (c) {
        var dateLabel = "";
        try {
          if (c.createdAt) {
            dateLabel = new Date(c.createdAt).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit"
            });
          }
        } catch (_e) {}
        return [
          '<div class="czs-citizen-card">',
          '  <div class="czs-citizen-meta">',
          '    <strong>' + esc(c.name || "Cidadão") + "</strong>",
          '    <span class="czs-citizen-badge">' + esc(c.badge || c.neighborhood || "Cruzeiro do Sul") + "</span>",
          dateLabel ? '    <time>' + esc(dateLabel) + "</time>" : "",
          "  </div>",
          '  <p class="czs-citizen-msg">' + esc(c.message || c.text || "") + "</p>",
          "</div>"
        ].join("\n");
      })
      .join("\n");
  }

  function renderDossierMarkup(payload) {
    var article = payload.article || {};
    var dossier = payload.dossier || {};
    var factCheck = dossier.factCheck || {};
    var inconsistencies = Array.isArray(dossier.inconsistencies) ? dossier.inconsistencies : [];
    var comments = Array.isArray(payload.comments) ? payload.comments : [];
    var slug = dossier.slug || article.slug || "materia";
    var illustrationFallback = "/api/articles/" + encodeURIComponent(slug) + "/illustration.svg";
    var imgUrl = dossier.imageUrl || article.imageUrl || illustrationFallback;
    var isIllustration = imgUrl.indexOf("/illustration.svg") !== -1 || dossier.mediaKind === "ilustracao-editorial";

    var paragraphs = Array.isArray(dossier.authorialBody) && dossier.authorialBody.length
      ? dossier.authorialBody
      : Array.isArray(article.body) && article.body.length
      ? article.body
      : [article.summary || article.lede || ""];

    var verifiedFactsHtml = (Array.isArray(factCheck.verifiedFacts) ? factCheck.verifiedFacts : [])
      .map(function (f) {
        return "<li>" + esc(f) + "</li>";
      })
      .join("");

    var inconsistenciesHtml = "";
    if (inconsistencies.length > 0) {
      inconsistenciesHtml = [
        '<div class="czs-inconsistency-box">',
        '  <div class="czs-inconsistency-header">',
        '    <span class="czs-inconsistency-pill">DIVERGÊNCIA ENTRE JORNAIS</span>',
        '    <strong>Pontos e incoerências identificados na cobertura de outros veículos</strong>',
        "  </div>",
        '  <ul class="czs-inconsistency-list">',
        inconsistencies
          .map(function (inc) {
            return [
              "<li>",
              "  <strong>" + esc(inc.topic || "Comparação entre fontes") + ":</strong> ",
              "  <span>" + esc(inc.comparison || "") + "</span>",
              inc.editorialFinding
                ? '  <div class="czs-inconsistency-finding"><em>Veredito CZS:</em> ' + esc(inc.editorialFinding) + "</div>"
                : "",
              "</li>"
            ].join("\n");
          })
          .join("\n"),
        "  </ul>",
        "</div>"
      ].join("\n");
    } else {
      inconsistenciesHtml = [
        '<div class="czs-inconsistency-box is-convergent">',
        '  <div class="czs-inconsistency-header">',
        '    <span class="czs-inconsistency-pill is-ok">CONVERGÊNCIA FACTUAL</span>',
        '    <strong>Sem contradições numéricas entre as fontes consultadas até o momento</strong>',
        "  </div>",
        '  <p class="czs-inconsistency-note">Os dados objetivos verificados não apresentaram divergência material entre os registros consultados. Caso você tenha um documento ou relato que contradiga algum ponto, envie abaixo na seção de Checagem Cidadã.</p>',
        "</div>"
      ].join("\n");
    }

    var sourcesHtml = (Array.isArray(factCheck.sourcesChecked) ? factCheck.sourcesChecked : [])
      .map(function (s) {
        var label = esc(s.name || "Fonte") + (s.role ? " (" + esc(s.role) + ")" : "");
        if (s.url && /^https?:\/\//i.test(s.url)) {
          return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' + label + " ↗</a></li>";
        }
        return "<li>" + label + "</li>";
      })
      .join("");

    return [
      '<div class="czs-nyt-article">',
      '  <div class="czs-nyt-kicker-row">',
      '    <span class="czs-nyt-kicker">' + esc(article.category || "Reportagem") + "</span>",
      '    <span class="czs-nyt-fact-badge">' + esc(factCheck.label || "Fato Checado • Síntese Autoral CZS") + "</span>",
      "  </div>",
      '  <h1 class="czs-nyt-headline">' + esc(dossier.headline || article.title || "") + "</h1>",
      dossier.nutGraph
        ? '  <p class="czs-nyt-nutgraph"><strong>Por que importa:</strong> ' + esc(dossier.nutGraph) + "</p>"
        : "",
      '  <div class="czs-nyt-byline">',
      '    <span>Por <strong>Redação Catálogo CZS</strong> (Síntese Autoral &amp; Checagem)</span>',
      '    <span>' + esc(article.date || "18 de nov. de 2026") + "</span>",
      '    <span>' + esc((article.readMin || 3) + " min de leitura") + "</span>",
      "  </div>",
      '  <figure class="czs-nyt-figure">',
      '    <img src="' + esc(imgUrl) + '" alt="' + esc(article.title || "Ilustração da matéria") + '" onerror="if(this.src.indexOf(\'illustration.svg\')===-1){this.src=\'' + esc(illustrationFallback) + '\';}" />',
      '    <figcaption>' +
        (isIllustration
          ? "Ilustração Editorial Vetorial • Catálogo CZS"
          : esc(article.imageCredit || "Foto captada / Registro jornalístico • " + (article.sourceName || "Catálogo CZS"))) +
        "</figcaption>",
      "  </figure>",
      '  <div class="czs-nyt-prose">',
      paragraphs
        .map(function (p) {
          return "<p>" + esc(p) + "</p>";
        })
        .join("\n"),
      "  </div>",
      '  <section class="czs-nyt-factcheck-panel" aria-label="Checagem de Fatos e Incoerências">',
      '    <div class="czs-nyt-panel-head">',
      "      <div>",
      '        <span class="czs-nyt-panel-eyebrow">AUDITORIA JORNALÍSTICA CZS</span>',
      "        <h2>Checagem de Fatos &amp; Comparação entre Jornais</h2>",
      "      </div>",
      '      <button type="button" class="czs-nyt-ai-check-btn" data-czs-run-ai-check="' + esc(slug) + '">🔎 Aprofundar checagem com IA</button>',
      "    </div>",
      '    <p class="czs-nyt-methodology">' + esc(factCheck.methodology || "") + "</p>",
      '    <div class="czs-nyt-verified-box">',
      "      <h3>Fatos objetivos verificados</h3>",
      "      <ul>" + verifiedFactsHtml + "</ul>",
      "    </div>",
      inconsistenciesHtml,
      sourcesHtml
        ? '    <div class="czs-nyt-sources-box"><h4>Fontes e registros cruzados (' +
          esc(String(factCheck.sourcesCount || 1)) +
          ")</h4><ul>" +
          sourcesHtml +
          "</ul></div>"
        : "",
      "  </section>",
      '  <section class="czs-nyt-citizen-panel" aria-label="Comentários dos Cidadãos">',
      '    <div class="czs-nyt-panel-head">',
      "      <div>",
      '        <span class="czs-nyt-panel-eyebrow">PARTICIPAÇÃO PÚBLICA</span>',
      '        <h2>Comentários e Relatos dos Cidadãos (<span id="czsCitizenCount">' + comments.length + "</span>)</h2>",
      "      </div>",
      "    </div>",
      '    <form class="czs-citizen-form" id="czsCitizenForm" data-czs-comment-slug="' + esc(slug) + '">',
      '      <div class="czs-citizen-form-row">',
      '        <label>Seu nome<input type="text" name="name" maxlength="80" placeholder="Ex.: João Silva" required /></label>',
      '        <label>Bairro ou Município<input type="text" name="neighborhood" maxlength="80" placeholder="Ex.: Aeroporto Velho, Centro, Mâncio Lima" required /></label>',
      '        <label>Tipo de participação<select name="contributionType">',
      '          <option value="relato">Relato do bairro / Testemunho local</option>',
      '          <option value="checagem">Correção / Apontar dado ou incoerência</option>',
      '          <option value="opiniao">Opinião do cidadão</option>',
      "        </select></label>",
      "      </div>",
      '      <label>Seu comentário, relato ou checagem<textarea name="message" rows="3" maxlength="1200" placeholder="Compartilhe informações verificáveis da sua rua/bairro ou comente a reportagem..." required></textarea></label>',
      '      <div class="czs-citizen-form-actions">',
      '        <span class="czs-citizen-status" id="czsCitizenStatus"></span>',
      '        <button type="submit" class="czs-citizen-submit">Publicar comentário cidadão</button>',
      "      </div>",
      "    </form>",
      '    <div class="czs-citizen-list" id="czsCitizenList">',
      renderCommentsList(comments),
      "    </div>",
      "  </section>",
      "</div>"
    ].join("\n");
  }

  function bindDossierInteractions(container, slug) {
    if (!container) return;

    var checkBtn = container.querySelector("[data-czs-run-ai-check]");
    if (checkBtn) {
      checkBtn.addEventListener("click", async function () {
        checkBtn.disabled = true;
        var origText = checkBtn.textContent;
        checkBtn.textContent = "Analisando fontes e checando incoerências…";
        try {
          var r = await fetch("/api/articles/" + encodeURIComponent(slug) + "/check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug: slug })
          });
          var d = await r.json();
          if (d && d.ok && d.dossier) {
            var cRes = await fetch("/api/articles/" + encodeURIComponent(slug) + "/comments");
            var cJson = cRes.ok ? await cRes.json() : { items: [] };
            container.innerHTML = renderDossierMarkup({
              article: d.article || {},
              dossier: d.dossier,
              comments: cJson.items || []
            });
            bindDossierInteractions(container, slug);
          } else {
            checkBtn.textContent = origText;
            checkBtn.disabled = false;
          }
        } catch (_e) {
          checkBtn.textContent = origText;
          checkBtn.disabled = false;
        }
      });
    }

    var form = container.querySelector("#czsCitizenForm");
    if (form) {
      form.addEventListener("submit", async function (ev) {
        ev.preventDefault();
        var statusEl = container.querySelector("#czsCitizenStatus");
        var submitBtn = form.querySelector("button[type='submit']");
        var fd = new FormData(form);
        var payload = {
          name: String(fd.get("name") || "").trim(),
          neighborhood: String(fd.get("neighborhood") || "").trim(),
          contributionType: String(fd.get("contributionType") || "relato").trim(),
          message: String(fd.get("message") || "").trim()
        };
        if (!payload.message) return;
        if (submitBtn) submitBtn.disabled = true;
        if (statusEl) statusEl.textContent = "Publicando comentário…";
        try {
          var res = await fetch("/api/articles/" + encodeURIComponent(slug) + "/comments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          var data = await res.json();
          if (res.ok && data.ok) {
            form.reset();
            if (statusEl) statusEl.textContent = "Comentário publicado com sucesso!";
            var listRes = await fetch("/api/articles/" + encodeURIComponent(slug) + "/comments");
            var listData = listRes.ok ? await listRes.json() : { items: [] };
            var listEl = container.querySelector("#czsCitizenList");
            var countEl = container.querySelector("#czsCitizenCount");
            if (listEl) listEl.innerHTML = renderCommentsList(listData.items || []);
            if (countEl) countEl.textContent = String((listData.items || []).length);
          } else {
            if (statusEl) statusEl.textContent = (data && data.error) || "Não foi possível publicar.";
          }
        } catch (_e) {
          if (statusEl) statusEl.textContent = "Erro de conexão ao enviar comentário.";
        } finally {
          if (submitBtn) submitBtn.disabled = false;
        }
      });
    }
  }

  async function openCzsDossierModal(slug, fallbackStory) {
    if (!slug && fallbackStory && fallbackStory.slug) slug = fallbackStory.slug;
    if (!slug) return;

    var modal = ensureModalElement();
    var content = document.getElementById("czsDossierContent");
    var directLink = document.getElementById("czsDossierDirectLink");
    if (directLink) {
      directLink.href = "/noticia.html?slug=" + encodeURIComponent(slug);
    }

    modal.hidden = false;
    modal.classList.add("is-open");
    document.body.classList.add("czs-dossier-open");

    if (fallbackStory && fallbackStory.title) {
      content.innerHTML = renderDossierMarkup({
        article: fallbackStory,
        dossier: {
          slug: slug,
          headline: fallbackStory.title,
          nutGraph: "Verificando fontes cruzadas e incoerências em tempo real…",
          authorialBody: [fallbackStory.summary || fallbackStory.subtitle || "Carregando reportagem completa…"],
          imageUrl: fallbackStory.imageUrl || "/api/articles/" + encodeURIComponent(slug) + "/illustration.svg",
          factCheck: {
            label: "Checando fatos…",
            verifiedFacts: ["Consultando base de dados e fontes cruzadas do Catálogo CZS…"],
            sourcesChecked: []
          },
          inconsistencies: []
        },
        comments: []
      });
    } else {
      content.innerHTML = '<p class="czs-dossier-loading">Verificando fontes, checando fatos e abrindo a reportagem…</p>';
    }

    try {
      var res = await fetch("/api/articles/" + encodeURIComponent(slug) + "/dossier", { cache: "no-store" });
      if (res.ok) {
        var data = await res.json();
        if (data && data.ok) {
          content.innerHTML = renderDossierMarkup(data);
          bindDossierInteractions(content, slug);
          return;
        }
      }
    } catch (_e) {
      // keep fallback rendered if offline
    }
  }

  window.openCzsDossierModal = openCzsDossierModal;
  window.closeCzsDossierModal = closeCzsDossierModal;
  window.renderCzsNytDossierInto = async function (targetElement, slug) {
    if (!targetElement || !slug) return;
    try {
      var res = await fetch("/api/articles/" + encodeURIComponent(slug) + "/dossier", { cache: "no-store" });
      if (!res.ok) return;
      var data = await res.json();
      if (data && data.ok) {
        targetElement.innerHTML = renderDossierMarkup(data);
        bindDossierInteractions(targetElement, slug);
      }
    } catch (_e) {}
  };

  // Intercepta cliques em "Leia matéria completa", "Ler" e cards de notícia na Home
  document.addEventListener(
    "click",
    function (ev) {
      if (ev.defaultPrevented) return;
      if (ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      if (window.location.pathname.indexOf("noticia.html") !== -1) return;

      var anchor = ev.target && ev.target.closest ? ev.target.closest("a[href]") : null;
      if (!anchor) return;
      if (anchor.id === "czsDossierDirectLink" || anchor.target === "_blank") return;

      var href = anchor.getAttribute("href") || "";
      var slug = extractSlugFromHref(href) || anchor.dataset.v8Slug || "";
      if (!slug) return;

      ev.preventDefault();
      ev.stopImmediatePropagation();
      openCzsDossierModal(slug);
    },
    true
  );
})();
