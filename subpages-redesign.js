(function () {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function setupReveal() {
    const items = document.querySelectorAll("[data-subpage-reveal]");
    if (!items.length) return;

    items.forEach((item, index) => {
      item.classList.add("subpage-reveal");
      item.style.transitionDelay = `${Math.min(index % 6, 5) * 45}ms`;
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    items.forEach((item) => observer.observe(item));
  }

  function setupTilt() {
    if (prefersReducedMotion) return;

    let tiltFrame = 0;
    let pendingTilt = null;

    const applyTilt = () => {
      tiltFrame = 0;

      if (!pendingTilt) return;

      const { card, clientX, clientY } = pendingTilt;
      pendingTilt = null;

      const rect = card.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width - 0.5;
      const y = (clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty("--subpage-rotate-x", `${(-y * 3.2).toFixed(2)}deg`);
      card.style.setProperty("--subpage-rotate-y", `${(x * 3.8).toFixed(2)}deg`);
    };

    document.addEventListener(
      "pointermove",
      (event) => {
        const card = event.target.closest("[data-subpage-tilt]");
        if (!card) return;
        if (card.classList.contains("is-embed-live")) return;

        pendingTilt = {
          card,
          clientX: event.clientX,
          clientY: event.clientY
        };

        if (!tiltFrame) {
          tiltFrame = window.requestAnimationFrame(applyTilt);
        }
      },
      { passive: true }
    );

    document.addEventListener(
      "pointerleave",
      (event) => {
        const card = event.target.closest("[data-subpage-tilt]");
        if (!card) return;
        if (event.relatedTarget && card.contains(event.relatedTarget)) return;
        card.style.removeProperty("--subpage-rotate-x");
        card.style.removeProperty("--subpage-rotate-y");
      },
      true
    );
  }

  function setupKidsYoutube() {
    const players = Array.from(document.querySelectorAll(".kids-youtube-player[data-youtube-id]"));
    if (!players.length) return;

    const buildEmbedUrl = (videoId) => {
      const url = new URL(`https://www.youtube.com/embed/${videoId}`);
      url.searchParams.set("autoplay", "1");
      url.searchParams.set("playsinline", "1");
      url.searchParams.set("rel", "0");
      url.searchParams.set("modestbranding", "1");

      if (window.location.protocol.startsWith("http")) {
        url.searchParams.set("origin", window.location.origin);
      }

      return url.toString();
    };

    const activatePlayer = (player) => {
      if (!player || player.classList.contains("is-active")) return;

      const videoId = String(player.dataset.youtubeId || "").trim();
      const title = String(player.dataset.youtubeTitle || "Video do YouTube").trim();
      const shell = player.querySelector(".kids-youtube-player-shell");
      const card = player.closest(".kids-video-embed-card");

      if (!videoId || !shell) return;

      const iframe = document.createElement("iframe");
      iframe.src = buildEmbedUrl(videoId);
      iframe.title = title;
      iframe.loading = "eager";
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = "strict-origin-when-cross-origin";

      shell.replaceChildren(iframe);
      player.classList.add("is-active");
      card?.classList.add("is-embed-live");
      card?.style.removeProperty("--subpage-rotate-x");
      card?.style.removeProperty("--subpage-rotate-y");
    };

    players.forEach((player) => {
      const button = player.querySelector("[data-youtube-activate]");
      button?.addEventListener("click", () => activatePlayer(player));
    });
  }

  function setupKidsStageMotion() {
    if (prefersReducedMotion) return;

    const stages = Array.from(document.querySelectorAll("[data-kids-stage]"));
    if (!stages.length) return;

    stages.forEach((stage) => {
      let frame = 0;
      let pointer = null;

      const flush = () => {
        frame = 0;
        if (!pointer) return;

        const rect = stage.getBoundingClientRect();
        const x = (pointer.clientX - rect.left) / rect.width - 0.5;
        const y = (pointer.clientY - rect.top) / rect.height - 0.5;
        const shiftX = Number((x * 34).toFixed(2));
        const shiftY = Number((y * 28).toFixed(2));

        stage.style.setProperty("--kids-stage-shift-x", `${shiftX}px`);
        stage.style.setProperty("--kids-stage-shift-y", `${shiftY}px`);
        stage.style.setProperty("--kids-stage-tilt-x", `${(-y * 5.8).toFixed(2)}deg`);
        stage.style.setProperty("--kids-stage-tilt-y", `${(x * 7.2).toFixed(2)}deg`);
        stage.style.setProperty("--kids-stage-tilt-x-soft", `${(-y * 1.8).toFixed(2)}deg`);
        stage.style.setProperty("--kids-stage-tilt-y-soft", `${(x * 2.2).toFixed(2)}deg`);
      };

      const reset = () => {
        pointer = null;
        stage.style.setProperty("--kids-stage-shift-x", "0px");
        stage.style.setProperty("--kids-stage-shift-y", "0px");
        stage.style.setProperty("--kids-stage-tilt-x", "0deg");
        stage.style.setProperty("--kids-stage-tilt-y", "0deg");
        stage.style.setProperty("--kids-stage-tilt-x-soft", "0deg");
        stage.style.setProperty("--kids-stage-tilt-y-soft", "0deg");
      };

      stage.addEventListener(
        "pointermove",
        (event) => {
          pointer = event;
          if (!frame) {
            frame = window.requestAnimationFrame(flush);
          }
        },
        { passive: true }
      );

      stage.addEventListener("pointerleave", reset);
      reset();
    });
  }

  function setupStudySearch() {
    const studyPage = document.querySelector(".study-redesign-page");
    if (!studyPage) return;

    const form = studyPage.querySelector(".study-search-panel");
    const input = studyPage.querySelector("#study-search");
    const clearButton = studyPage.querySelector("[data-clear-study-search]");
    const result = studyPage.querySelector("[data-study-search-results]");
    const chips = Array.from(studyPage.querySelectorAll("[data-study-filter]"));
    const cards = Array.from(studyPage.querySelectorAll("[data-study-search]"));

    if (!input || !chips.length || !cards.length) return;

    let activeFilter = "todos";

    const render = () => {
      const query = normalize(input.value);
      const tokens = query.split(/\s+/).filter(Boolean);
      let visible = 0;

      cards.forEach((card) => {
        const haystack = normalize(card.dataset.studySearch);
        const filterValue = normalize(card.dataset.studyFilter);
        const matchesQuery = tokens.every((token) => haystack.includes(token));
        const matchesFilter = activeFilter === "todos" || filterValue.includes(activeFilter);
        const matches = matchesQuery && matchesFilter;

        card.hidden = !matches;
        if (matches) visible += 1;
      });

      if (!result) return;
      result.textContent = visible
        ? `Mostrando ${visible} trilhas e assuntos para a busca atual.`
        : "Nenhum resultado encontrado. Tente outro assunto ou volte para o filtro Todos.";
    };

    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        activeFilter = normalize(chip.dataset.studyFilter || "todos");
        chips.forEach((item) => item.classList.toggle("is-active", item === chip));
        render();
      });
    });

    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      render();
    });

    input.addEventListener("input", render);

    clearButton?.addEventListener("click", () => {
      input.value = "";
      activeFilter = "todos";
      chips.forEach((chip) => chip.classList.toggle("is-active", chip.dataset.studyFilter === "todos"));
      render();
      input.focus();
    });

    render();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatTopicDate(value) {
    if (!value) return "agora";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return String(value);
    }

    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short"
    }).format(parsed);
  }

  function getTopicGroupLabel(item, topic) {
    const labels = {
      study: {
        campus: "campus global",
        edtech: "edtech",
        acesso: "acesso",
        mundo: "educacao no mundo"
      },
      kids: {
        anime: "anime radar",
        games: "game drop",
        creators: "creator watch",
        animation: "toon signal"
      },
      games: {
        premieres: "estreias",
        games: "game radar",
        anime: "anime radar",
        creators: "creator watch",
        analysis: "opiniao e review",
        movies: "filme e serie"
      }
    };

    const topicLabels = labels[normalize(topic)] || {};
    const groupKey = normalize(item?.topicGroup || "");
    return topicLabels[groupKey] || item?.category || "mundo";
  }

  function getTopicCardClass(item) {
    const groupKey = normalize(item?.topicGroup || "");
    return groupKey ? `topic-wire-card topic-group-${groupKey}` : "topic-wire-card";
  }

  function buildTopicCardMarkup(item, topic, isLead = false) {
    const sourceUrl = String(item?.sourceUrl || "#").trim() || "#";
    const hasPhoto = Boolean(item?.imageUrl || item?.feedImageUrl || item?.sourceImageUrl);
    const photoUrl = String(item?.imageUrl || item?.feedImageUrl || item?.sourceImageUrl || "")
      .trim()
      .replace(/'/g, "%27");
    const kicker = getTopicGroupLabel(item, topic);
    const summary = String(item?.summary || item?.lede || "").trim();
    const previewText = summary || "Abra a matéria original para acompanhar o desdobramento completo.";
    const style = hasPhoto ? ` style="--topic-image:url('${photoUrl}')"` : "";

    return `
      <article class="${getTopicCardClass(item)}${isLead ? " is-lead" : ""}${hasPhoto ? " has-photo" : ""}">
        <a class="topic-wire-link" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noreferrer">
          <div class="topic-wire-media"${style}>
            <span>${escapeHtml(kicker)}</span>
          </div>
          <div class="topic-wire-copy">
            <p class="topic-wire-meta">
              <strong>${escapeHtml(item?.sourceName || "Fonte")}</strong>
              <span>${escapeHtml(formatTopicDate(item?.publishedAt || item?.date))}</span>
            </p>
            <h3>${escapeHtml(item?.title || "Atualização")}</h3>
            <p>${escapeHtml(previewText)}</p>
          </div>
        </a>
      </article>
    `;
  }

  function renderTopicFeed(section, payload) {
    const grid = section.querySelector("[data-topic-feed-grid]");
    const status = section.querySelector("[data-topic-feed-status]");
    const topic = section.dataset.topicFeed || "";
    const items = Array.isArray(payload?.items) ? payload.items : [];

    if (!grid) return;

    if (!items.length) {
      grid.innerHTML = `
        <article class="topic-wire-empty">
          <strong>Sem headlines prontas agora.</strong>
          <p>Atualize novamente em instantes para carregar o radar global desta editoria.</p>
        </article>
      `;

      if (status) {
        status.textContent = "Nao foi possivel carregar o radar global desta editoria agora.";
      }
      return;
    }

    const [lead, ...rest] = items;
    grid.innerHTML = `
      <div class="topic-wire-layout">
        ${buildTopicCardMarkup(lead, topic, true)}
        <div class="topic-wire-stack">
          ${rest.slice(0, 8).map((item) => buildTopicCardMarkup(item, topic)).join("")}
        </div>
      </div>
    `;

    if (status) {
      const updatedAt = payload?.updatedAt ? formatTopicDate(payload.updatedAt) : "agora";
      const modeLabel = payload?.stale
        ? "cache real recente"
        : payload?.fallbackUsed
          ? "arquivo real de apoio"
          : "fontes globais ao vivo";
      status.textContent = `${modeLabel} • atualizado em ${updatedAt}`;
    }
  }

  async function loadTopicFeed(section) {
    if (!section) return;

    const topic = normalize(section.dataset.topicFeed || "");
    const limit = Number(section.dataset.topicFeedLimit || 7) || 7;
    const status = section.querySelector("[data-topic-feed-status]");

    if (status) {
      status.textContent = "Buscando novidades reais desta editoria...";
    }

    try {
      const response = await fetch(`/api/topic-feed?topic=${encodeURIComponent(topic)}&limit=${limit}`);
      const payload = await response.json();
      renderTopicFeed(section, payload);
    } catch (_error) {
      renderTopicFeed(section, { items: [] });
    }
  }

  function setupTopicFeeds() {
    const sections = Array.from(document.querySelectorAll("[data-topic-feed]"));
    if (!sections.length) return;
    sections.forEach((section) => loadTopicFeed(section));
  }

  function setupKidsGames() {
    const memoryBoard = document.querySelector("[data-memory-board]");
    const memoryStatus = document.querySelector("[data-memory-status]");
    const memoryReset = document.querySelector("[data-memory-reset]");
    const wordsearchGrid = document.querySelector("[data-wordsearch-grid]");
    const wordsearchList = document.querySelector("[data-wordsearch-list]");
    const wordsearchStatus = document.querySelector("[data-wordsearch-status]");
    const wordsearchReset = document.querySelector("[data-wordsearch-reset]");
    const mathTitle = document.querySelector("[data-math-title]");
    const mathExpression = document.querySelector("[data-math-expression]");
    const mathChoices = document.querySelector("[data-math-choices]");
    const mathFeedback = document.querySelector("[data-math-feedback]");
    const mathScore = document.querySelector("[data-math-score]");
    const mathNext = document.querySelector("[data-math-next]");
    const puzzleBoard = document.querySelector("[data-puzzle-board]");
    const puzzleStatus = document.querySelector("[data-puzzle-status]");
    const puzzleReset = document.querySelector("[data-puzzle-reset]");
    const drawTitle = document.querySelector("[data-draw-title]");
    const drawPrompt = document.querySelector("[data-draw-prompt]");
    const drawNext = document.querySelector("[data-draw-next]");
    const sequenceBoard = document.querySelector("[data-sequence-board]");
    const sequenceStatus = document.querySelector("[data-sequence-status]");
    const sequenceScore = document.querySelector("[data-sequence-score]");
    const sequenceStart = document.querySelector("[data-sequence-start]");

    if (!memoryBoard && !wordsearchGrid && !mathExpression && !puzzleBoard && !drawTitle && !sequenceBoard) return;

    const shuffle = (items) =>
      items
        .map((value) => ({ value, order: Math.random() }))
        .sort((a, b) => a.order - b.order)
        .map((item) => item.value);

    const memoryIcons = [
      { key: "rocket", emoji: "🚀", label: "Foguete" },
      { key: "ball", emoji: "⚽", label: "Bola" },
      { key: "kite", emoji: "🪁", label: "Pipa" },
      { key: "drum", emoji: "🥁", label: "Tambor" },
      { key: "cake", emoji: "🎂", label: "Bolo" },
      { key: "teddy", emoji: "🧸", label: "Ursinho" }
    ];
    let firstCard = null;
    let lockMemory = false;
    let foundPairs = 0;

    const setCardLabel = (button, open) => {
      button.classList.toggle("is-open", open);
      button.innerHTML = open
        ? `
          <span class="kids-memory-face">
            <span class="kids-memory-emoji">${button.dataset.emoji || ""}</span>
            <span class="kids-memory-label">${button.dataset.label || ""}</span>
          </span>
        `
        : '<span class="kids-memory-face is-hidden">✨</span>';
      button.setAttribute("aria-label", open ? `Carta ${button.dataset.label}` : "Carta virada");
    };

    const resetMemory = () => {
      if (!memoryBoard) return;
      firstCard = null;
      lockMemory = false;
      foundPairs = 0;
      const cards = shuffle(memoryIcons.flatMap((item) => [item, item]));
      memoryBoard.innerHTML = cards
        .map(
          (value, index) => `
            <button
              class="kids-memory-card"
              type="button"
              data-value="${value.key}"
              data-emoji="${value.emoji}"
              data-label="${value.label}"
              data-index="${index}"
            >
              <span class="kids-memory-face is-hidden">✨</span>
            </button>
          `
        )
        .join("");
      if (memoryStatus) memoryStatus.textContent = `0 de ${memoryIcons.length} pares`;
    };

    memoryBoard?.addEventListener("click", (event) => {
      const button = event.target instanceof Element ? event.target.closest(".kids-memory-card") : null;
      if (!button || lockMemory || button.disabled || button === firstCard) return;

      setCardLabel(button, true);

      if (!firstCard) {
        firstCard = button;
        return;
      }

      if (firstCard.dataset.value === button.dataset.value) {
        firstCard.disabled = true;
        button.disabled = true;
        firstCard.classList.add("is-found");
        button.classList.add("is-found");
        foundPairs += 1;
        if (memoryStatus) {
          memoryStatus.textContent =
            foundPairs === memoryIcons.length
              ? "Todos os pares encontrados!"
              : `${foundPairs} de ${memoryIcons.length} pares`;
        }
        firstCard = null;
        return;
      }

      lockMemory = true;
      window.setTimeout(() => {
        setCardLabel(firstCard, false);
        setCardLabel(button, false);
        firstCard = null;
        lockMemory = false;
      }, 720);
    });

    memoryReset?.addEventListener("click", resetMemory);
    resetMemory();

    const wordsearchRows = [
      ["B", "O", "L", "A", "X", "L", "U", "A"],
      ["Q", "G", "A", "T", "O", "R", "E", "P"],
      ["P", "I", "P", "A", "F", "O", "C", "A"],
      ["M", "E", "L", "A", "V", "I", "N", "T"],
      ["B", "O", "L", "O", "C", "A", "K", "E"],
      ["T", "E", "D", "D", "Y", "N", "U", "V"],
      ["C", "A", "S", "A", "R", "O", "C", "A"],
      ["L", "I", "V", "R", "O", "S", "O", "L"]
    ];
    const wordTargets = [
      { word: "BOLA", cells: [[0, 0], [0, 1], [0, 2], [0, 3]] },
      { word: "LUA", cells: [[0, 5], [0, 6], [0, 7]] },
      { word: "GATO", cells: [[1, 1], [1, 2], [1, 3], [1, 4]] },
      { word: "PIPA", cells: [[2, 0], [2, 1], [2, 2], [2, 3]] },
      { word: "BOLO", cells: [[4, 0], [4, 1], [4, 2], [4, 3]] },
      { word: "LIVRO", cells: [[7, 0], [7, 1], [7, 2], [7, 3], [7, 4]] }
    ];
    let wordButtons = [];
    let selectedWordCells = [];
    let foundWords = new Set();
    let foundWordCells = new Set();

    const wordCellKey = (row, column) => `${row}:${column}`;
    const pathToKeys = (path = []) => path.map(([row, column]) => wordCellKey(row, column));

    const updateWordsearchStatus = (message = "") => {
      if (!wordsearchStatus) return;
      if (message) {
        wordsearchStatus.textContent = message;
        return;
      }
      wordsearchStatus.textContent =
        foundWords.size === wordTargets.length
          ? "Voce achou todas as palavras!"
          : `${foundWords.size} de ${wordTargets.length} palavras encontradas`;
    };

    const renderWordsearchList = () => {
      if (!wordsearchList) return;
      wordsearchList.innerHTML = wordTargets
        .map(
          (item) => `
            <li class="${foundWords.has(item.word) ? "is-found" : ""}">
              <span>${item.word}</span>
            </li>
          `
        )
        .join("");
    };

    const syncWordsearchBoard = () => {
      wordButtons.forEach((button) => {
        const key = button.dataset.wordCell || "";
        button.classList.toggle("is-selected", selectedWordCells.includes(key));
        button.classList.toggle("is-found", foundWordCells.has(key));
      });
    };

    const clearWordsearchSelection = () => {
      selectedWordCells = [];
      syncWordsearchBoard();
    };

    const matchesPrefix = (selected, targetKeys) =>
      selected.every((value, index) => targetKeys[index] === value);

    const findWordsearchMatch = (selected) => {
      for (const target of wordTargets) {
        const forward = pathToKeys(target.cells);
        const reverse = [...forward].reverse();
        if (
          selected.length === forward.length &&
          (matchesPrefix(selected, forward) || matchesPrefix(selected, reverse))
        ) {
          return target;
        }
      }
      return null;
    };

    const selectionStillValid = (selected) => {
      if (!selected.length) return true;
      return wordTargets.some((target) => {
        if (foundWords.has(target.word)) return false;
        const forward = pathToKeys(target.cells);
        const reverse = [...forward].reverse();
        return matchesPrefix(selected, forward) || matchesPrefix(selected, reverse);
      });
    };

    const renderWordsearchBoard = () => {
      if (!wordsearchGrid) return;
      wordsearchGrid.innerHTML = wordsearchRows
        .map((row, rowIndex) =>
          row
            .map(
              (letter, columnIndex) => `
                <button
                  class="kids-wordsearch-cell"
                  type="button"
                  data-word-cell="${wordCellKey(rowIndex, columnIndex)}"
                  aria-label="Letra ${letter}"
                >
                  ${letter}
                </button>
              `
            )
            .join("")
        )
        .join("");
      wordButtons = Array.from(wordsearchGrid.querySelectorAll(".kids-wordsearch-cell"));
      renderWordsearchList();
      syncWordsearchBoard();
      updateWordsearchStatus();
    };

    const resetWordsearch = () => {
      foundWords = new Set();
      foundWordCells = new Set();
      selectedWordCells = [];
      renderWordsearchBoard();
    };

    wordsearchGrid?.addEventListener("click", (event) => {
      const button =
        event.target instanceof Element ? event.target.closest(".kids-wordsearch-cell") : null;
      if (!button) return;

      const key = button.dataset.wordCell || "";
      if (!key || foundWordCells.has(key) || selectedWordCells.includes(key)) return;

      selectedWordCells = [...selectedWordCells, key];
      syncWordsearchBoard();

      if (!selectionStillValid(selectedWordCells)) {
        updateWordsearchStatus("Essa trilha nao formou palavra. Tente outra.");
        window.setTimeout(() => {
          clearWordsearchSelection();
          updateWordsearchStatus();
        }, 420);
        return;
      }

      const match = findWordsearchMatch(selectedWordCells);
      if (!match) {
        updateWordsearchStatus("Boa! Continue clicando nas letras da mesma palavra.");
        return;
      }

      foundWords.add(match.word);
      pathToKeys(match.cells).forEach((item) => foundWordCells.add(item));
      clearWordsearchSelection();
      renderWordsearchList();
      updateWordsearchStatus(
        foundWords.size === wordTargets.length
          ? "Voce achou todas as palavras!"
          : `Achou ${match.word}!`
      );
      syncWordsearchBoard();
    });

    wordsearchReset?.addEventListener("click", resetWordsearch);
    renderWordsearchBoard();

    const mathObjects = ["🍎", "🧸", "⭐", "🎈", "🧩", "🚗"];
    let mathHits = 0;
    let mathAnswered = 0;
    let currentMathRound = null;

    const renderMathRound = () => {
      if (!mathChoices || !mathExpression) return;

      const object = mathObjects[Math.floor(Math.random() * mathObjects.length)];
      const useSubtraction = Math.random() > 0.55;
      const left = 1 + Math.floor(Math.random() * 5);
      const right = 1 + Math.floor(Math.random() * (useSubtraction ? left : 5));
      const answer = useSubtraction ? left - right : left + right;
      const optionPool = [];
      [0, -1, 1, -2, 2, 3].forEach((offset) => {
        const value = Math.max(0, answer + offset);
        if (!optionPool.includes(value)) {
          optionPool.push(value);
        }
      });
      while (optionPool.length < 3) {
        const fallbackValue = answer + optionPool.length + 1;
        if (!optionPool.includes(fallbackValue)) {
          optionPool.push(fallbackValue);
        }
      }
      const options = shuffle(optionPool.slice(0, 3));

      currentMathRound = { answer };

      if (mathTitle) {
        mathTitle.textContent = useSubtraction
          ? "Quantos brinquedos sobram quando alguns saem?"
          : "Quantos brinquedos ficam quando tudo se junta?";
      }

      mathExpression.innerHTML = `
        <span class="kids-math-group">${object.repeat(left)}</span>
        <span class="kids-math-operator">${useSubtraction ? "-" : "+"}</span>
        <span class="kids-math-group">${object.repeat(right)}</span>
        <span class="kids-math-operator">= ?</span>
      `;
      mathChoices.innerHTML = options
        .map(
          (option) =>
            `<button type="button" data-math-answer="${option}" aria-label="Resposta ${option}">${option}</button>`
        )
        .join("");

      if (mathFeedback) {
        mathFeedback.textContent = "Escolha uma resposta para ver o resultado.";
      }
      if (mathScore) {
        mathScore.textContent = `${mathHits} acertos de ${mathAnswered}`;
      }
    };

    mathChoices?.addEventListener("click", (event) => {
      const button = event.target instanceof Element ? event.target.closest("[data-math-answer]") : null;
      if (!button || button.disabled || !currentMathRound) return;

      const selected = Number(button.dataset.mathAnswer);
      const isCorrect = selected === currentMathRound.answer;
      mathAnswered += 1;
      if (isCorrect) mathHits += 1;

      Array.from(mathChoices.querySelectorAll("button")).forEach((item) => {
        item.disabled = true;
        item.classList.toggle(
          "is-correct",
          Number(item.dataset.mathAnswer) === currentMathRound.answer
        );
      });

      if (mathFeedback) {
        mathFeedback.textContent = isCorrect
          ? "Acertou! Essa conta ficou certinha."
          : `Quase! A resposta certa era ${currentMathRound.answer}.`;
      }
      if (mathScore) {
        mathScore.textContent = `${mathHits} acertos de ${mathAnswered}`;
      }
    });

    mathNext?.addEventListener("click", renderMathRound);
    renderMathRound();

    const puzzleSize = 3;
    const solvedPuzzle = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    let puzzleTiles = [...solvedPuzzle];

    const getPuzzleNeighbors = (index) => {
      const neighbors = [];
      const row = Math.floor(index / puzzleSize);
      const column = index % puzzleSize;

      if (row > 0) neighbors.push(index - puzzleSize);
      if (row < puzzleSize - 1) neighbors.push(index + puzzleSize);
      if (column > 0) neighbors.push(index - 1);
      if (column < puzzleSize - 1) neighbors.push(index + 1);

      return neighbors;
    };

    const isPuzzleSolved = () => puzzleTiles.every((tile, index) => tile === solvedPuzzle[index]);

    const updatePuzzleStatus = (message = "") => {
      if (!puzzleStatus) return;
      puzzleStatus.textContent =
        message || (isPuzzleSolved() ? "Imagem completa! Voce montou tudo." : "Mexa as pecas ate a figura ficar inteira.");
    };

    const renderPuzzle = () => {
      if (!puzzleBoard) return;
      const imageUrl = String(puzzleBoard.dataset.puzzleImage || "").trim().replace(/'/g, "%27");
      puzzleBoard.innerHTML = puzzleTiles
        .map((tile, index) => {
          if (!tile) {
            return `
              <button
                class="kids-puzzle-tile is-empty"
                type="button"
                data-puzzle-index="${index}"
                aria-label="Espaco vazio do quebra-cabeca"
                tabindex="-1"
                disabled
              ></button>
            `;
          }

          const sourceIndex = tile - 1;
          const row = Math.floor(sourceIndex / puzzleSize);
          const column = sourceIndex % puzzleSize;
          const positionX = (column / (puzzleSize - 1)) * 100;
          const positionY = (row / (puzzleSize - 1)) * 100;

          return `
            <button
              class="kids-puzzle-tile"
              type="button"
              data-puzzle-index="${index}"
              aria-label="Mover peca ${tile}"
              style="background-image:url('${imageUrl}');background-size:${puzzleSize * 100}% ${puzzleSize * 100}%;background-position:${positionX}% ${positionY}%"
            ></button>
          `;
        })
        .join("");

      updatePuzzleStatus();
    };

    const shufflePuzzle = () => {
      puzzleTiles = [...solvedPuzzle];
      let emptyIndex = puzzleTiles.indexOf(0);

      for (let step = 0; step < 160; step += 1) {
        const neighbors = getPuzzleNeighbors(emptyIndex);
        const nextIndex = neighbors[Math.floor(Math.random() * neighbors.length)];
        [puzzleTiles[emptyIndex], puzzleTiles[nextIndex]] = [puzzleTiles[nextIndex], puzzleTiles[emptyIndex]];
        emptyIndex = nextIndex;
      }

      if (isPuzzleSolved()) {
        [puzzleTiles[7], puzzleTiles[8]] = [puzzleTiles[8], puzzleTiles[7]];
      }

      renderPuzzle();
    };

    const movePuzzleTile = (index) => {
      const emptyIndex = puzzleTiles.indexOf(0);
      if (!getPuzzleNeighbors(emptyIndex).includes(index)) return;
      [puzzleTiles[emptyIndex], puzzleTiles[index]] = [puzzleTiles[index], puzzleTiles[emptyIndex]];
      renderPuzzle();
    };

    puzzleBoard?.addEventListener("click", (event) => {
      const button = event.target instanceof Element ? event.target.closest("[data-puzzle-index]") : null;
      if (!button) return;
      movePuzzleTile(Number(button.dataset.puzzleIndex));
    });

    puzzleReset?.addEventListener("click", shufflePuzzle);
    if (puzzleBoard) {
      shufflePuzzle();
    }

    const drawIdeas = [
      {
        title: "Desenhe um parque cheio de amigos brincando.",
        prompt: "Use escorregador, balanço, pipa, bola, nuvens e um sol grande no alto."
      },
      {
        title: "Desenhe um piquenique da Bluey.",
        prompt: "Desenhe uma toalha, frutas, copos coloridos e amigos sorrindo na grama."
      },
      {
        title: "Desenhe o fundo do mar do Bob Esponja.",
        prompt: "Use bolhas, casa-abacaxi, estrela-do-mar, caranguejo e um montao de cor."
      },
      {
        title: "Desenhe um foguete do Mundo Bita.",
        prompt: "Pinte o ceu, a lua, estrelas, fumaça colorida e uma porta bem brilhante."
      },
      {
        title: "Desenhe uma turma em roda de leitura.",
        prompt: "Coloque livros, almofadas, tapete, janelinha e bichinhos ouvindo a historia."
      }
    ];

    let drawIndex = 0;
    const renderDrawIdea = () => {
      if (!drawTitle || !drawPrompt) return;
      const idea = drawIdeas[drawIndex % drawIdeas.length];
      drawTitle.textContent = idea.title;
      drawPrompt.textContent = idea.prompt;
    };

    drawNext?.addEventListener("click", () => {
      drawIndex += 1;
      renderDrawIdea();
    });

    renderDrawIdea();

    const sequenceColors = ["sun", "sky", "leaf", "candy"];
    let sequencePattern = [];
    let sequenceInput = [];
    let sequenceRound = 0;
    let sequenceLocked = true;

    const sequencePads = Array.from(sequenceBoard?.querySelectorAll("[data-sequence-pad]") || []);

    const setSequenceText = (message) => {
      if (sequenceStatus) sequenceStatus.textContent = message;
      if (sequenceScore) sequenceScore.textContent = `rodada ${sequenceRound}`;
    };

    const flashSequencePad = (color) => {
      const pad = sequenceBoard?.querySelector(`[data-sequence-pad="${color}"]`);
      if (!pad) return;
      pad.classList.add("is-active");
      window.setTimeout(() => pad.classList.remove("is-active"), 360);
    };

    const playSequence = () => {
      if (!sequencePattern.length) return;
      sequenceLocked = true;
      setSequenceText("Observe a sequência e prepare a memória.");
      sequencePattern.forEach((color, index) => {
        window.setTimeout(() => flashSequencePad(color), 520 * index + 220);
      });
      window.setTimeout(() => {
        sequenceLocked = false;
        setSequenceText("Agora repita clicando nas mesmas cores.");
      }, 520 * sequencePattern.length + 260);
    };

    const startSequenceRound = (reset) => {
      if (reset) {
        sequencePattern = [];
        sequenceRound = 0;
      }
      sequenceInput = [];
      sequenceRound += 1;
      sequencePattern.push(sequenceColors[Math.floor(Math.random() * sequenceColors.length)]);
      playSequence();
    };

    sequenceStart?.addEventListener("click", () => {
      startSequenceRound(true);
    });

    sequenceBoard?.addEventListener("click", (event) => {
      const button = event.target instanceof Element ? event.target.closest("[data-sequence-pad]") : null;
      if (!button || sequenceLocked) return;

      const value = String(button.dataset.sequencePad || "");
      flashSequencePad(value);
      sequenceInput.push(value);

      const currentIndex = sequenceInput.length - 1;
      if (sequencePattern[currentIndex] !== value) {
        sequenceLocked = true;
        setSequenceText("Ops! A ordem escapou. Toque em iniciar para recomeçar.");
        return;
      }

      if (sequenceInput.length === sequencePattern.length) {
        sequenceLocked = true;
        setSequenceText("Boa! Mais uma cor entrou na sequência.");
        window.setTimeout(() => startSequenceRound(false), 760);
      }
    });
  }

  function setupGamesVrRentalPopup() {
    const modal = document.getElementById("vr-rental-popup");
    const form = document.querySelector("[data-vr-rental-form]");
    const feedback = document.querySelector("[data-vr-rental-feedback]");
    const directWhatsapp = document.querySelector("[data-vr-rental-whatsapp]");
    const openers = Array.from(document.querySelectorAll("[data-open-vr-rental]"));

    if (!modal || !form || !openers.length) return;

    const WHATSAPP_NUMBER = "5568992269296";
    const AUTO_OPEN_KEY = "catalogo_games_vr_popup_seen_v1";

    const setFeedback = (message, type = "") => {
      if (!feedback) return;
      feedback.textContent = message;
      feedback.classList.toggle("is-ok", type === "ok");
      feedback.classList.toggle("is-error", type === "error");
    };

    const getFormData = () => {
      const data = Object.fromEntries(new FormData(form).entries());
      return {
        name: String(data.name || "").trim(),
        phone: String(data.phone || "").trim(),
        date: String(data.date || "").trim(),
        period: String(data.period || "").trim(),
        package: String(data.package || "").trim(),
        notes: String(data.notes || "").trim()
      };
    };

    const buildWhatsappMessage = (data) => {
      const lines = [
        "Tenho interesse no aluguel VR Meta Quest.",
        data.name ? `Nome: ${data.name}` : "",
        data.phone ? `WhatsApp: ${data.phone}` : "",
        data.date ? `Data desejada: ${data.date}` : "Data desejada: a combinar",
        data.period ? `Horario: ${data.period}` : "Horario: a combinar",
        data.package ? `Pacote: ${data.package}` : "Pacote: quero orientacao",
        data.notes ? `Observacao: ${data.notes}` : "",
        `Origem: ${location.pathname || "/games.html"}`
      ].filter(Boolean);
      return lines.join("\n");
    };

    const getWhatsappUrl = (data = getFormData()) =>
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsappMessage(data))}`;

    const updateWhatsappLink = () => {
      if (directWhatsapp) {
        directWhatsapp.href = getWhatsappUrl();
      }
    };

    const getAnalyticsContext = () => {
      try {
        return window.CatalogoAnalytics?.getContext?.() || {};
      } catch (_error) {
        return {};
      }
    };

    const openModal = () => {
      modal.hidden = false;
      document.body.classList.add("games-vr-rental-open");
      try {
        sessionStorage.setItem(AUTO_OPEN_KEY, "1");
      } catch (_error) {
        // ignore
      }
      updateWhatsappLink();
      window.setTimeout(() => {
        form.querySelector("input, select, textarea, button, a")?.focus?.();
      }, 80);
    };

    const closeModal = () => {
      modal.hidden = true;
      document.body.classList.remove("games-vr-rental-open");
    };

    openers.forEach((opener) => {
      opener.addEventListener("click", (event) => {
        event.preventDefault();
        openModal();
      });
    });

    modal.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.matches("[data-close-vr-rental], .games-vr-rental-backdrop")) {
        closeModal();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) {
        closeModal();
      }
    });

    form.addEventListener("input", updateWhatsappLink);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = getFormData();

      if (!data.name || !data.phone) {
        setFeedback("Informe nome e WhatsApp para salvar o pedido de aluguel VR.", "error");
        return;
      }

      const whatsappUrl = getWhatsappUrl(data);
      const whatsappWindow = window.open("", "_blank", "noopener,noreferrer");
      setFeedback("Salvando pedido de aluguel VR...", "");

      try {
        const response = await fetch("/api/vr-rental/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            sourcePage: `${location.pathname}${location.search}`,
            ...getAnalyticsContext()
          })
        });

        if (!response.ok) {
          throw new Error("Nao foi possivel salvar agora.");
        }

        setFeedback("Pedido salvo. Abrindo WhatsApp para combinar a reserva.", "ok");
      } catch (_error) {
        setFeedback("Nao consegui salvar agora, mas o WhatsApp ja vai abrir com a reserva pronta.", "error");
      } finally {
        if (directWhatsapp) {
          directWhatsapp.href = whatsappUrl;
        }
        if (whatsappWindow) {
          whatsappWindow.location.href = whatsappUrl;
        } else {
          location.href = whatsappUrl;
        }
      }
    });

    updateWhatsappLink();

    const hashWantsPopup = location.hash === "#vr-rental-popup";
    if (hashWantsPopup) {
      openModal();
    }
  }

  function ready() {
    setupReveal();
    setupTilt();
    setupKidsStageMotion();
    setupKidsYoutube();
    setupKidsGames();
    setupGamesVrRentalPopup();
    setupStudySearch();
    setupTopicFeeds();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ready);
  } else {
    ready();
  }
})();
