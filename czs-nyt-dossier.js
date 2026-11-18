(function () {
  "use strict";

  var currentSlug = "";
  var activeCommentFilter = "todos";
  var READ_STORAGE_KEY = "czs_read_articles_v1";
  var UPVOTE_STORAGE_KEY = "czs_upvoted_comments_v1";

  function esc(value) {
    return String(value || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function getReadSlugs() {
    try {
      return JSON.parse(localStorage.getItem(READ_STORAGE_KEY) || "{}") || {};
    } catch (_e) {
      return {};
    }
  }

  function markSlugAsRead(slug) {
    if (!slug) return;
    try {
      var map = getReadSlugs();
      map[slug] = Date.now();
      localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(map));
      document.querySelectorAll('a[href*="' + slug + '"]').forEach(function (a) {
        a.classList.add("czs-story-read");
      });
    } catch (_e) {}
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

  function getVisibleSlugsList() {
    var slugs = [];
    var seen = new Set();
    document.querySelectorAll('a[href*="slug="]').forEach(function (a) {
      var s = extractSlugFromHref(a.getAttribute("href") || "");
      if (s && !seen.has(s)) {
        seen.add(s);
        slugs.push(s);
      }
    });
    return slugs;
  }

  function navigateAdjacentStory(offset) {
    var list = getVisibleSlugsList();
    if (!list.length || !currentSlug) return;
    var idx = list.indexOf(currentSlug);
    var nextIdx = idx === -1 ? 0 : (idx + offset + list.length) % list.length;
    openCzsDossierModal(list[nextIdx]);
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
      '<article class="czs-dossier-sheet" id="czsDossierSheet">',
      '  <div class="czs-dossier-progress-track"><span id="czsDossierProgressBar"></span></div>',
      '  <header class="czs-dossier-topbar">',
      '    <div class="czs-dossier-nav-left">',
      '      <button type="button" class="czs-dossier-back" data-czs-dossier-close>← Voltar ao jornal</button>',
      '      <button type="button" class="czs-nyt-tool-btn" data-czs-prev-story title="Matéria anterior (←)">◀ Anterior</button>',
      '      <button type="button" class="czs-nyt-tool-btn" data-czs-next-story title="Próxima matéria (→)">Próxima ▶</button>',
      "    </div>",
      '    <span class="czs-dossier-masthead">CATÁLOGO CZS • JORNALISMO ORIGINAL &amp; CHECAGEM</span>',
      '    <div class="czs-dossier-nav-right">',
      '      <button type="button" class="czs-nyt-tool-btn" data-czs-night-toggle title="Alternar Papel Creme / Modo Noturno">🌙 Modo Noturno</button>',
      '      <button type="button" class="czs-nyt-tool-btn" data-czs-print title="Imprimir ou Salvar PDF">🖨️ PDF</button>',
      '      <a class="czs-dossier-direct" id="czsDossierDirectLink" href="/noticia.html" target="_blank" rel="noopener">Nova guia ↗</a>',
      "    </div>",
      "  </header>",
      '  <div class="czs-dossier-body" id="czsDossierContent">',
      '    <p class="czs-dossier-loading">Verificando fontes, checando fatos e preparando a reportagem…</p>',
      "  </div>",
      "</article>"
    ].join("\n");

    document.body.appendChild(modal);

    modal.addEventListener("click", function (ev) {
      if (ev.target && ev.target.hasAttribute("data-czs-dossier-close")) {
        closeCzsDossierModal();
      } else if (ev.target && ev.target.closest("[data-czs-prev-story]")) {
        navigateAdjacentStory(-1);
      } else if (ev.target && ev.target.closest("[data-czs-next-story]")) {
        navigateAdjacentStory(1);
      } else if (ev.target && ev.target.closest("[data-czs-print]")) {
        window.print();
      } else if (ev.target && ev.target.closest("[data-czs-night-toggle]")) {
        var sheet = document.getElementById("czsDossierSheet");
        var btn = ev.target.closest("[data-czs-night-toggle]");
        if (sheet) {
          var isNight = sheet.classList.toggle("is-night-mode");
          if (btn) btn.textContent = isNight ? "📜 Papel Creme" : "🌙 Modo Noturno";
        }
      }
    });

    modal.addEventListener(
      "scroll",
      function () {
        var bar = document.getElementById("czsDossierProgressBar");
        if (!bar) return;
        var max = Math.max(1, modal.scrollHeight - modal.clientHeight);
        var pct = Math.min(100, Math.max(0, (modal.scrollTop / max) * 100));
        bar.style.width = pct.toFixed(1) + "%";
      },
      { passive: true }
    );

    document.addEventListener("keydown", function (ev) {
      if (modal.hidden) return;
      if (ev.key === "Escape") {
        closeCzsDossierModal();
      } else if (ev.key === "ArrowRight" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) {
        navigateAdjacentStory(1);
      } else if (ev.key === "ArrowLeft" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) {
        navigateAdjacentStory(-1);
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
    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (window.location.search.indexOf("materia=") !== -1) {
        history.pushState({}, "", window.location.pathname);
      }
    } catch (_e) {}
  }

  function renderCommentsList(comments, filterType) {
    var list = Array.isArray(comments) ? comments : [];
    if (filterType && filterType !== "todos") {
      list = list.filter(function (c) {
        return (c.contributionType || "relato") === filterType;
      });
    }
    if (!list.length) {
      return '<p class="czs-citizen-empty">Nenhum comentário ou relato nesta categoria ainda. Seja o primeiro cidadão a contribuir com informações verificáveis do seu bairro.</p>';
    }
    return list
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
        var upvotes = Number(c.upvotes || 0);
        var verifiedClass = c.verifiedByEditor ? " is-verified-comment" : "";
        return [
          '<div class="czs-citizen-card' + verifiedClass + '">',
          '  <div class="czs-citizen-meta">',
          "    <strong>" + esc(c.name || "Cidadão") + "</strong>",
          '    <span class="czs-citizen-badge' + (c.verifiedByEditor ? " is-verified" : "") + '">' +
            esc(c.badge || c.neighborhood || "Cruzeiro do Sul") +
            "</span>",
          dateLabel ? "    <time>" + esc(dateLabel) + "</time>" : "",
          '    <button type="button" class="czs-citizen-upvote" data-czs-upvote-id="' + esc(c.id || "") + '">👍 Confirmo no meu bairro (' + upvotes + ")</button>",
          "  </div>",
          '  <p class="czs-citizen-msg">' + esc(c.message || c.text || "") + "</p>",
          c.evidenceUrl
            ? '  <p class="czs-citizen-evidence"><a href="' + esc(c.evidenceUrl) + '" target="_blank" rel="noopener noreferrer">📎 Evidência / Link anexado pelo cidadão ↗</a></p>'
            : "",
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
    var municipality = dossier.municipality || article.municipality || "Cruzeiro do Sul";
    var illustrationFallback = "/api/articles/" + encodeURIComponent(slug) + "/illustration.svg";
    var imgUrl = dossier.imageUrl || article.imageUrl || illustrationFallback;
    var isIllustration = imgUrl.indexOf("/illustration.svg") !== -1 || dossier.mediaKind === "ilustracao-editorial";

    var paragraphs = Array.isArray(dossier.authorialBody) && dossier.authorialBody.length
      ? dossier.authorialBody
      : Array.isArray(article.body) && article.body.length
      ? article.body
      : [article.summary || article.lede || ""];

    var q30 = dossier.quickSummary30s || {
      fact: dossier.headline || article.title || "",
      keyNumber: (factCheck.sourcesCount || 1) + " fonte(s) verificada(s)",
      impact: dossier.nutGraph || ""
    };

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

    var headlinesTableHtml = "";
    if (Array.isArray(dossier.headlinesComparison) && dossier.headlinesComparison.length > 1) {
      headlinesTableHtml = [
        '<div class="czs-headlines-compare">',
        "  <h4>Comparador Lado a Lado: Como cada redação titulou o fato</h4>",
        '  <table class="czs-nyt-table">',
        "    <thead><tr><th>Veículo / Fonte</th><th>Abordagem / Manchete Publicada</th></tr></thead>",
        "    <tbody>",
        dossier.headlinesComparison
          .map(function (h) {
            return "<tr><td><strong>" + esc(h.outlet) + "</strong></td><td>" + esc(h.headline) + "</td></tr>";
          })
          .join("\n"),
        "    </tbody>",
        "  </table>",
        "</div>"
      ].join("\n");
    }

    var openQuestionsHtml = "";
    if (Array.isArray(dossier.openQuestions) && dossier.openQuestions.length) {
      openQuestionsHtml = [
        '<div class="czs-open-questions-box" id="czsSecPerguntas">',
        "  <h3>O que falta responder (Acompanhamento Público CZS)</h3>",
        "  <ul>",
        dossier.openQuestions
          .map(function (q) {
            return "<li>" + esc(q) + "</li>";
          })
          .join("\n"),
        "  </ul>",
        "</div>"
      ].join("\n");
    }

    var glossaryHtml = "";
    if (Array.isArray(dossier.glossary) && dossier.glossary.length) {
      glossaryHtml = [
        '<div class="czs-glossary-box">',
        "  <h4>Glossário &amp; Siglas desta Reportagem</h4>",
        "  <dl>",
        dossier.glossary
          .map(function (g) {
            return "<dt>" + esc(g.term) + "</dt><dd>" + esc(g.definition) + "</dd>";
          })
          .join("\n"),
        "  </dl>",
        "</div>"
      ].join("\n");
    }

    var timelineHtml = "";
    if (Array.isArray(dossier.timeline) && dossier.timeline.length) {
      timelineHtml = [
        '<div class="czs-timeline-box" id="czsSecTimeline">',
        "  <h4>Linha do Tempo • Contexto e Desdobramentos no Vale do Juruá</h4>",
        "  <ul>",
        dossier.timeline
          .map(function (t) {
            return (
              '<li><a href="/noticia.html?slug=' +
              esc(t.slug) +
              '" data-v8-slug="' +
              esc(t.slug) +
              '"><strong>' +
              esc(t.date) +
              ":</strong> " +
              esc(t.title) +
              "</a></li>"
            );
          })
          .join("\n"),
        "  </ul>",
        "</div>"
      ].join("\n");
    }

    var sourcesHtml = (Array.isArray(factCheck.sourcesChecked) ? factCheck.sourcesChecked : [])
      .map(function (s) {
        var tierBadge = s.trustTier ? ' <span class="czs-trust-tier">[' + esc(s.trustTier) + "]</span>" : "";
        var label = "<strong>" + esc(s.name || "Fonte") + "</strong>" + (s.role ? " — " + esc(s.role) : "") + tierBadge;
        if (s.url && /^https?:\/\//i.test(s.url)) {
          return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' + label + " ↗</a></li>";
        }
        return "<li>" + label + "</li>";
      })
      .join("");

    return [
      '<div class="czs-nyt-article">',
      dossier.freshnessAlert ? '  <div class="czs-freshness-alert">' + esc(dossier.freshnessAlert) + "</div>" : "",
      '  <nav class="czs-nyt-toc" aria-label="Índice da reportagem">',
      '    <a href="#czsSecResumo">Resumo 30s</a>',
      '    <a href="#czsSecProsa">Reportagem Autoral</a>',
      '    <a href="#czsSecChecagem">Checagem &amp; Incoerências</a>',
      openQuestionsHtml ? '    <a href="#czsSecPerguntas">O que falta responder</a>' : "",
      '    <a href="#czsSecCidadao">Voz do Cidadão (' + comments.length + ")</a>",
      "  </nav>",
      '  <div class="czs-nyt-kicker-row">',
      '    <span class="czs-nyt-municipality-tag">[' + esc(municipality.toUpperCase()) + "]</span>",
      '    <span class="czs-nyt-kicker">' + esc(article.category || "Reportagem") + "</span>",
      '    <span class="czs-nyt-fact-badge">' + esc(factCheck.label || "Fato Checado • Síntese Autoral CZS") + "</span>",
      dossier.coverageThermometer
        ? '    <span class="czs-nyt-thermometer">' + esc(dossier.coverageThermometer) + "</span>"
        : "",
      "  </div>",
      '  <h1 class="czs-nyt-headline">' + esc(dossier.headline || article.title || "") + "</h1>",
      dossier.nutGraph
        ? '  <p class="czs-nyt-nutgraph"><strong>Por que importa:</strong> ' + esc(dossier.nutGraph) + "</p>"
        : "",
      '  <div class="czs-nyt-byline">',
      '    <span>Por <strong>Redação Catálogo CZS</strong> (Síntese Autoral &amp; Checagem)</span>',
      '    <span>' + esc(article.date || "18 de nov. de 2026") + "</span>",
      '    <span>' + esc((article.readMin || 3) + " min de leitura") + "</span>",
      '    <div class="czs-nyt-tools">',
      '      <button type="button" class="czs-nyt-tool-btn" data-czs-tts-toggle>🔊 Ouvir reportagem</button>',
      '      <button type="button" class="czs-nyt-tool-btn" data-czs-font-delta="-1" aria-label="Diminuir fonte">A-</button>',
      '      <button type="button" class="czs-nyt-tool-btn" data-czs-font-delta="1" aria-label="Aumentar fonte">A+</button>',
      '      <button type="button" class="czs-nyt-tool-btn" data-czs-copy-wa="' + esc(slug) + '">📲 Copiar resumo p/ WhatsApp</button>',
      "    </div>",
      "  </div>",
      '  <div class="czs-nyt-quick30" id="czsSecResumo">',
      '    <div class="czs-nyt-quick30-title">LEITURA EXECUTIVA EM 30 SEGUNDOS</div>',
      '    <div class="czs-nyt-quick30-grid">',
      "      <div><b>O Fato</b><p>" + esc(q30.fact) + "</p></div>",
      "      <div><b>Dados &amp; Fontes</b><p>" + esc(q30.keyNumber) + "</p></div>",
      "      <div><b>Impacto no Juruá</b><p>" + esc(q30.impact) + "</p></div>",
      "    </div>",
      "  </div>",
      '  <figure class="czs-nyt-figure">',
      '    <img src="' +
        esc(imgUrl) +
        '" alt="' +
        esc(article.title || "Ilustração da matéria") +
        '" onerror="if(this.src.indexOf(\'illustration.svg\')===-1){this.src=\'' +
        esc(illustrationFallback) +
        '\';}" />',
      "    <figcaption>" +
        (isIllustration
          ? "Ilustração Editorial Vetorial • Catálogo CZS"
          : esc(dossier.imageCredit || article.imageCredit || "Foto captada / Registro jornalístico • " + (article.sourceName || "Catálogo CZS"))) +
        "</figcaption>",
      "  </figure>",
      '  <div class="czs-nyt-prose" id="czsSecProsa">',
      paragraphs
        .map(function (p, i) {
          return '<p class="' + (i === 0 ? "czs-dropcap" : "") + '">' + esc(p) + "</p>";
        })
        .join("\n"),
      "  </div>",
      dossier.errata ? '  <p class="czs-nyt-errata"><strong>Nota de Atualização / Errata:</strong> ' + esc(dossier.errata) + "</p>" : "",
      glossaryHtml,
      timelineHtml,
      '  <section class="czs-nyt-factcheck-panel" id="czsSecChecagem" aria-label="Checagem de Fatos e Incoerências">',
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
      headlinesTableHtml,
      openQuestionsHtml,
      sourcesHtml
        ? '    <div class="czs-nyt-sources-box"><h4>Fontes e registros cruzados (' +
          esc(String(factCheck.sourcesCount || 1)) +
          ")</h4><ul>" +
          sourcesHtml +
          "</ul></div>"
        : "",
      "  </section>",
      '  <section class="czs-nyt-citizen-panel" id="czsSecCidadao" aria-label="Comentários dos Cidadãos">',
      '    <div class="czs-nyt-panel-head">',
      "      <div>",
      '        <span class="czs-nyt-panel-eyebrow">PARTICIPAÇÃO PÚBLICA &amp; DIREITO DE RESPOSTA</span>',
      '        <h2>Comentários e Relatos dos Cidadãos (<span id="czsCitizenCount">' + comments.length + "</span>)</h2>",
      "      </div>",
      '      <div class="czs-citizen-filter-tabs" role="tablist">',
      '        <button type="button" class="is-active" data-czs-cfilter="todos">Todos</button>',
      '        <button type="button" data-czs-cfilter="relato">Relatos do Bairro</button>',
      '        <button type="button" data-czs-cfilter="checagem">Correções / Dados</button>',
      '        <button type="button" data-czs-cfilter="opiniao">Opiniões</button>',
      "      </div>",
      "    </div>",
      '    <form class="czs-citizen-form" id="czsCitizenForm" data-czs-comment-slug="' + esc(slug) + '">',
      '      <div class="czs-citizen-form-row">',
      '        <label>Seu nome<input type="text" name="name" maxlength="80" placeholder="Ex.: João Silva" required /></label>',
      '        <label>Bairro ou Município<input type="text" name="neighborhood" maxlength="80" placeholder="Ex.: Aeroporto Velho, Centro, Mâncio Lima" required /></label>',
      '        <label>Tipo de participação<select name="contributionType">',
      '          <option value="relato">Relato do bairro / Testemunho local</option>',
      '          <option value="checagem">Correção / Apontar dado, documento ou direito de resposta</option>',
      '          <option value="opiniao">Opinião do cidadão</option>',
      "        </select></label>",
      "      </div>",
      '      <label>Seu comentário, relato ou checagem<textarea name="message" rows="3" maxlength="1200" placeholder="Compartilhe informações verificáveis da sua rua/bairro, envie direito de resposta ou comente a reportagem..." required></textarea></label>',
      '      <label>Link de documento, foto ou evidência pública (opcional)<input type="url" name="evidenceUrl" maxlength="300" placeholder="https://..." /></label>',
      '      <div class="czs-citizen-form-actions">',
      '        <span class="czs-citizen-status" id="czsCitizenStatus"></span>',
      '        <button type="submit" class="czs-citizen-submit">Publicar comentário cidadão</button>',
      "      </div>",
      "    </form>",
      '    <div class="czs-citizen-list" id="czsCitizenList">',
      renderCommentsList(comments, activeCommentFilter),
      "    </div>",
      "  </section>",
      "</div>"
    ].join("\n");
  }

  function bindDossierInteractions(container, slug, cachedComments) {
    if (!container) return;
    var currentComments = Array.isArray(cachedComments) ? cachedComments : [];

    var ttsBtn = container.querySelector("[data-czs-tts-toggle]");
    if (ttsBtn && window.speechSynthesis) {
      ttsBtn.addEventListener("click", function () {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
          ttsBtn.textContent = "🔊 Ouvir reportagem";
          return;
        }
        var h1 = container.querySelector(".czs-nyt-headline")?.textContent || "";
        var nut = container.querySelector(".czs-nyt-nutgraph")?.textContent || "";
        var bodyTxt = Array.from(container.querySelectorAll(".czs-nyt-prose p"))
          .map(function (p) {
            return p.textContent;
          })
          .join(". ");
        var utter = new SpeechSynthesisUtterance(h1 + ". " + nut + ". " + bodyTxt);
        utter.lang = "pt-BR";
        utter.rate = 1.03;
        utter.onend = function () {
          ttsBtn.textContent = "🔊 Ouvir reportagem";
        };
        ttsBtn.textContent = "⏹ Parar áudio";
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utter);
      });
    }

    var fontSize = 18.5;
    container.querySelectorAll("[data-czs-font-delta]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var delta = Number(btn.getAttribute("data-czs-font-delta") || 0);
        fontSize = Math.max(15, Math.min(24, fontSize + delta * 1.5));
        container.querySelectorAll(".czs-nyt-prose p").forEach(function (p) {
          p.style.setProperty("font-size", fontSize + "px", "important");
        });
      });
    });

    var waBtn = container.querySelector("[data-czs-copy-wa]");
    if (waBtn) {
      waBtn.addEventListener("click", function () {
        var h1 = container.querySelector(".czs-nyt-headline")?.textContent || "";
        var badge = container.querySelector(".czs-nyt-fact-badge")?.textContent || "Fato Checado CZS";
        var nut = container.querySelector(".czs-nyt-nutgraph")?.textContent || "";
        var shareUrl = window.location.origin + "/?materia=" + encodeURIComponent(slug);
        var text =
          "📰 *CATÁLOGO CZS — " +
          badge +
          "*\n\n*" +
          h1 +
          "*\n\n" +
          nut +
          "\n\nLeia a checagem completa: " +
          shareUrl;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text);
        }
        waBtn.textContent = "✓ Copiado p/ WhatsApp!";
        setTimeout(function () {
          waBtn.textContent = "📲 Copiar resumo p/ WhatsApp";
        }, 2400);
      });
    }

    container.querySelectorAll("[data-czs-cfilter]").forEach(function (tabBtn) {
      tabBtn.addEventListener("click", function () {
        activeCommentFilter = tabBtn.getAttribute("data-czs-cfilter") || "todos";
        container.querySelectorAll("[data-czs-cfilter]").forEach(function (b) {
          b.classList.toggle("is-active", b === tabBtn);
        });
        var listEl = container.querySelector("#czsCitizenList");
        if (listEl) listEl.innerHTML = renderCommentsList(currentComments, activeCommentFilter);
        bindCommentUpvotes(container, slug);
      });
    });

    function bindCommentUpvotes(root, artSlug) {
      root.querySelectorAll("[data-czs-upvote-id]").forEach(function (upBtn) {
        upBtn.addEventListener("click", async function () {
          var cid = upBtn.getAttribute("data-czs-upvote-id");
          if (!cid) return;
          upBtn.disabled = true;
          try {
            var r = await fetch("/api/articles/" + encodeURIComponent(artSlug) + "/comments/upvote", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: cid })
            });
            var d = await r.json();
            if (d && d.ok) {
              upBtn.textContent = "👍 Confirmado (" + d.upvotes + ")";
            }
          } catch (_e) {}
        });
      });
    }
    bindCommentUpvotes(container, slug);

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
            currentComments = cJson.items || [];
            container.innerHTML = renderDossierMarkup({
              article: d.article || {},
              dossier: d.dossier,
              comments: currentComments
            });
            bindDossierInteractions(container, slug, currentComments);
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
          message: String(fd.get("message") || "").trim(),
          evidenceUrl: String(fd.get("evidenceUrl") || "").trim()
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
            currentComments = listData.items || [];
            var listEl = container.querySelector("#czsCitizenList");
            var countEl = container.querySelector("#czsCitizenCount");
            if (listEl) listEl.innerHTML = renderCommentsList(currentComments, activeCommentFilter);
            if (countEl) countEl.textContent = String(currentComments.length);
            bindCommentUpvotes(container, slug);
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
    currentSlug = slug;
    markSlugAsRead(slug);

    var modal = ensureModalElement();
    var content = document.getElementById("czsDossierContent");
    var directLink = document.getElementById("czsDossierDirectLink");
    if (directLink) {
      directLink.href = "/noticia.html?slug=" + encodeURIComponent(slug);
    }

    modal.hidden = false;
    modal.classList.add("is-open");
    modal.scrollTop = 0;
    document.body.classList.add("czs-dossier-open");
    try {
      if (window.location.pathname === "/" || window.location.pathname.endsWith("index.html")) {
        history.pushState({ czsMateria: slug }, "", "/?materia=" + encodeURIComponent(slug));
      }
    } catch (_e) {}

    if (fallbackStory && fallbackStory.title) {
      content.innerHTML = renderDossierMarkup({
        article: fallbackStory,
        dossier: {
          slug: slug,
          headline: fallbackStory.title,
          nutGraph: fallbackStory.nutGraph || "Verificando fontes cruzadas e incoerências em tempo real…",
          authorialBody: Array.isArray(fallbackStory.body) && fallbackStory.body.length
            ? fallbackStory.body
            : [fallbackStory.summary || fallbackStory.subtitle || "Carregando reportagem completa…"],
          imageUrl: fallbackStory.imageUrl || "/api/articles/" + encodeURIComponent(slug) + "/illustration.svg",
          factCheck: {
            label: fallbackStory.editorialBadge || "Fato Checado • Síntese Autoral CZS",
            verifiedFacts: ["Consultando base de dados e fontes cruzadas do Catálogo CZS…"],
            sourcesChecked: []
          },
          inconsistencies: fallbackStory.inconsistencies || []
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
          bindDossierInteractions(content, slug, data.comments || []);
          return;
        }
      }
    } catch (_e) {}
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
        bindDossierInteractions(targetElement, slug, data.comments || []);
      }
    } catch (_e) {}
  };

  document.addEventListener(
    "click",
    function (ev) {
      if (ev.defaultPrevented) return;
      if (ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      if (window.location.pathname.indexOf("noticia.html") !== -1) return;

      var anchor = ev.target && ev.target.closest ? ev.target.closest("a[href]") : null;
      if (!anchor) return;
      if (anchor.id === "czsDossierDirectLink" || anchor.target === "_blank") return;
      if (anchor.getAttribute("href")?.startsWith("#czsSec")) return;

      var href = anchor.getAttribute("href") || "";
      var slug = extractSlugFromHref(href) || anchor.dataset.v8Slug || "";
      if (!slug) return;

      ev.preventDefault();
      ev.stopImmediatePropagation();
      openCzsDossierModal(slug);
    },
    true
  );

  // Atalho de teclado "/" para focar a busca global
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) {
      var searchInput = document.getElementById("searchInput");
      if (searchInput) {
        ev.preventDefault();
        searchInput.focus();
      }
    }
  });

  window.addEventListener("DOMContentLoaded", function () {
    var q = new URLSearchParams(window.location.search);
    var mSlug = q.get("materia");
    if (mSlug && window.location.pathname.indexOf("noticia.html") === -1) {
      setTimeout(function () {
        openCzsDossierModal(mSlug);
      }, 250);
    }
  });
})();
