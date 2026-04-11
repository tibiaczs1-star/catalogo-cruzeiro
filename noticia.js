const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");

const titleNode = document.querySelector("#detail-title");
const eyebrowNode = document.querySelector("#detail-eyebrow");
const metaNode = document.querySelector("#detail-meta");
const thumbNode = document.querySelector("#detail-thumb");
const categoryNode = document.querySelector("#detail-category");
const ledeNode = document.querySelector("#detail-lede");
const contentNode = document.querySelector("#detail-content");
const sourceNameNode = document.querySelector("#detail-source-name");
const sourceLabelNode = document.querySelector("#detail-source-label");
const sourceLinkNode = document.querySelector("#detail-source-link");
const mediaKindNode = document.querySelector("#detail-media-kind");
const mediaNoteNode = document.querySelector("#detail-media-note");
const mediaLinkNode = document.querySelector("#detail-media-link");
const highlightsNode = document.querySelector("#detail-highlights");
const analysisContainer = document.querySelector("#detail-analysis-container");
const analysisText = document.querySelector("#detail-analysis");

const apiBase = window.location.protocol.startsWith("http")
  ? ""
  : "http://localhost:3000";

const applyMediaBadge = (node, media) => {
  if (!node || !media || !media.badge) {
    return;
  }

  const badge = document.createElement("span");
  badge.className = "thumb-media-badge";
  badge.textContent = media.badge;
  node.appendChild(badge);
};

const resetDetailThumb = () => {
  if (!thumbNode) {
    return;
  }

  thumbNode.className = "detail-hero-thumb";
  thumbNode.style.removeProperty("--bg-image");
  thumbNode.style.removeProperty("--bg-position");
  thumbNode.style.removeProperty("--bg-size");
  thumbNode.querySelectorAll(".thumb-media-badge").forEach((node) => node.remove());
};

const normalizeParagraph = (value) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

const getExpandedBodyParagraphs = (article) => {
  const baseParagraphs = Array.isArray(article.body)
    ? article.body.map(normalizeParagraph).filter(Boolean)
    : [];
  const fallbackLede = normalizeParagraph(article.lede || "");
  const source = article.sourceName || "fonte local";
  const sourceLabel = normalizeParagraph(article.sourceLabel || article.title || "");
  const category = normalizeParagraph(article.category || "tema local").toLowerCase();
  const dateLabel = normalizeParagraph(article.date || "data recente");
  const highlights = Array.isArray(article.highlights)
    ? article.highlights.map(normalizeParagraph).filter(Boolean)
    : [];

  const highlightSentence = highlights.length > 0 ? highlights.join(", ") : "atualizacao da pauta";
  const analysisSentence = normalizeParagraph(article.analysis || "");

  const generated = [
    fallbackLede
      ? `No recorte do Catalogo Cruzeiro do Sul, esta pauta entra como uma leitura de ${category}, com impacto direto no dia a dia da cidade e no servico publico local. ${fallbackLede}`
      : `No recorte do Catalogo Cruzeiro do Sul, esta pauta entra como uma leitura de ${category}, com impacto direto no dia a dia da cidade e no servico publico local.`,
    `Em ${dateLabel}, a fonte ${source} destacou o seguinte eixo principal: ${sourceLabel}. A repercussao local costuma ir alem do fato inicial e atinge rotas de trabalho, atendimento e rotina dos bairros.`,
    `Os pontos mais observados nesta cobertura sao: ${highlightSentence}. Esse conjunto ajuda a entender o que ja aconteceu e o que ainda pode evoluir nos proximos dias.`,
    analysisSentence
      ? `Leitura editorial complementar: ${analysisSentence}`
      : "Leitura editorial complementar: a tendencia local depende da resposta institucional, do acompanhamento comunitario e de nova atualizacao da fonte original.",
    "Para continuar bem informado, vale acompanhar o link da fonte consultada e as proximas atualizacoes do Catalogo, especialmente quando houver mudanca de status, novos numeros ou decisao oficial."
  ].filter(Boolean);

  const merged = [...baseParagraphs];
  while (merged.length < 5 && generated.length > 0) {
    merged.push(generated.shift());
  }

  if (merged.length === 0) {
    return generated.slice(0, 5);
  }

  return merged;
};

const renderNotFound = () => {
  titleNode.textContent = "Noticia nao encontrada";
  eyebrowNode.textContent = "atlas czs";
  metaNode.textContent = "O link pode estar incompleto ou a noticia ainda nao foi cadastrada.";
  ledeNode.textContent = "Volte para a home e escolha outra pauta.";
  sourceLinkNode.href = "./index.html";
  sourceLinkNode.removeAttribute("target");
  sourceLinkNode.textContent = "Voltar para a home";

  if (mediaKindNode && mediaNoteNode && mediaLinkNode) {
    mediaKindNode.textContent = "Foto real";
    mediaNoteNode.textContent = "Esta capa e apenas um apoio visual interno do Atlas.";
    mediaLinkNode.href = "./index.html";
    mediaLinkNode.removeAttribute("target");
    mediaLinkNode.textContent = "Voltar para a home";
  }
};

const renderArticle = (article) => {
  if (!article) {
    renderNotFound();
    return;
  }

  document.title = `Catalogo Cruzeiro do Sul | ${article.title}`;
  eyebrowNode.textContent = article.eyebrow || "atlas czs";
  titleNode.textContent = article.title || "Abrindo noticia";
  metaNode.textContent = `${article.date || "Sem data"} • ${article.category || "Noticia"}`;

  resetDetailThumb();
  categoryNode.textContent = article.category || "Noticia";
  ledeNode.textContent = article.lede || "";
  sourceNameNode.textContent = article.sourceName || "Fonte local";
  sourceLabelNode.textContent = article.sourceLabel || article.title || "";
  sourceLinkNode.href = article.sourceUrl || "./index.html";

  if (article.sourceUrl && article.sourceUrl.startsWith("http")) {
    sourceLinkNode.setAttribute("target", "_blank");
    sourceLinkNode.setAttribute("rel", "noreferrer");
  } else {
    sourceLinkNode.removeAttribute("target");
    sourceLinkNode.removeAttribute("rel");
  }

  if (article.analysis && analysisContainer && analysisText) {
    analysisText.textContent = article.analysis;
    analysisContainer.hidden = false;
    analysisContainer.classList.add("active");
  } else if (analysisContainer) {
    analysisContainer.hidden = true;
  }

  const topImageUrl =
    article.imageUrl ||
    (typeof article.media?.creditUrl === "string" &&
    /\.(png|jpe?g|webp|avif)$/i.test(article.media.creditUrl)
      ? article.media.creditUrl
      : "");

  if (topImageUrl) {
    thumbNode.classList.add("has-image");
    thumbNode.style.setProperty("--bg-image", `url('${topImageUrl}')`);
    thumbNode.style.setProperty("--bg-position", "center 30%");
    thumbNode.style.setProperty("--bg-size", "cover");
  } else {
    thumbNode.classList.add("no-image");
  }

  if (topImageUrl) {
    applyMediaBadge(thumbNode, article.media);
  }

  if (mediaKindNode && mediaNoteNode && mediaLinkNode) {
    if (article.media) {
      mediaKindNode.textContent = article.media.label || "";
      mediaNoteNode.textContent = article.media.note || "";
      mediaLinkNode.href = article.media.creditUrl || "./index.html";
      mediaLinkNode.textContent = article.media.creditLabel || "Ver fonte";

      if (article.media.creditUrl && article.media.creditUrl.startsWith("http")) {
        mediaLinkNode.setAttribute("target", "_blank");
        mediaLinkNode.setAttribute("rel", "noreferrer");
      } else {
        mediaLinkNode.removeAttribute("target");
        mediaLinkNode.removeAttribute("rel");
      }
    } else if (article.imageUrl) {
      mediaKindNode.textContent = "Imagem da materia";
      mediaNoteNode.textContent = article.imageCredit || "";
      mediaLinkNode.href = article.sourceUrl || "./index.html";
      mediaLinkNode.textContent = "Ver fonte";
      mediaLinkNode.setAttribute("target", "_blank");
      mediaLinkNode.setAttribute("rel", "noreferrer");
    } else {
      mediaKindNode.textContent = "";
      mediaNoteNode.textContent = "";
      mediaLinkNode.href = "./index.html";
      mediaLinkNode.textContent = "Voltar para a home";
      mediaLinkNode.removeAttribute("target");
      mediaLinkNode.removeAttribute("rel");
    }
  }

  contentNode.innerHTML = "";
  getExpandedBodyParagraphs(article).forEach((paragraph) => {
    const p = document.createElement("p");
    p.textContent = paragraph;
    contentNode.appendChild(p);
  });

  const generatedDevelopment = Array.isArray(article.development)
    ? article.development
    : [
        `${article.title || "A pauta"} continua em acompanhamento no Catalogo Cruzeiro do Sul com foco nos impactos práticos para a rotina da cidade.`,
        `Na leitura local, o ponto central envolve ${String(article.category || "o tema principal").toLowerCase()} e seus efeitos diretos nos bairros, nos serviços e na vida de quem acompanha o caso.`,
        "O portal segue atualizando esta matéria conforme novas informações oficiais forem publicadas pela fonte original e pelos órgãos locais."
      ];

  const developmentBox = document.createElement("section");
  developmentBox.className = "detail-development";
  const developmentTitle = document.createElement("h4");
  developmentTitle.textContent = "Desenvolvimento da Materia";
  developmentBox.appendChild(developmentTitle);
  generatedDevelopment.forEach((line) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = line;
    developmentBox.appendChild(paragraph);
  });
  contentNode.appendChild(developmentBox);

  highlightsNode.innerHTML = "";
  (article.highlights || []).forEach((highlight) => {
    const li = document.createElement("li");
    li.textContent = highlight;
    highlightsNode.appendChild(li);
  });
};

const loadRuntimeArticle = async (targetSlug) => {
  if (!targetSlug) {
    return null;
  }

  try {
    const response = await fetch(`${apiBase}/api/news/${encodeURIComponent(targetSlug)}`);

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    return payload.item || null;
  } catch (error) {
    return null;
  }
};

const loadArticle = async () => {
  const fallbackArticle = window.NEWS_MAP?.[slug] || null;
  const runtimeArticle = await loadRuntimeArticle(slug);
  renderArticle(runtimeArticle || fallbackArticle);
};

loadArticle();
