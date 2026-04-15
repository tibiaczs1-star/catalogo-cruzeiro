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
      status.textContent = "Carregando pautas reais desta editoria...";
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
    const tetrisBoard = document.querySelector("[data-tetris-board]");
    const tetrisNext = document.querySelector("[data-tetris-next]");
    const tetrisScore = document.querySelector("[data-tetris-score]");
    const tetrisLines = document.querySelector("[data-tetris-lines]");
    const tetrisLevel = document.querySelector("[data-tetris-level]");
    const tetrisMessage = document.querySelector("[data-tetris-message]");
    const tetrisToggle = document.querySelector("[data-tetris-toggle]");
    const tetrisReset = document.querySelector("[data-tetris-reset]");
    const tetrisLeft = document.querySelector("[data-tetris-left]");
    const tetrisRight = document.querySelector("[data-tetris-right]");
    const tetrisRotate = document.querySelector("[data-tetris-rotate]");
    const tetrisDown = document.querySelector("[data-tetris-down]");
    const storyOutput = document.querySelector("[data-story-output]");
    const storyMix = document.querySelector("[data-story-mix]");
    const quizQuestion = document.querySelector("[data-quiz-question]");
    const quizOptions = document.querySelector("[data-quiz-options]");
    const quizFeedback = document.querySelector("[data-quiz-feedback]");
    const quizScore = document.querySelector("[data-quiz-score]");
    const quizNext = document.querySelector("[data-quiz-next]");
    const drawTitle = document.querySelector("[data-draw-title]");
    const drawPrompt = document.querySelector("[data-draw-prompt]");
    const drawNext = document.querySelector("[data-draw-next]");

    if (!memoryBoard && !tetrisBoard && !storyOutput && !quizQuestion && !drawTitle) return;

    const shuffle = (items) =>
      items
        .map((value) => ({ value, order: Math.random() }))
        .sort((a, b) => a.order - b.order)
        .map((item) => item.value);

    const memoryIcons = [
      { key: "monica", icon: "MO", label: "Monica da Turma da Monica" },
      { key: "cebolinha", icon: "CE", label: "Cebolinha da Turma da Monica" },
      { key: "roblox", icon: "RBX", label: "Roblox" },
      { key: "minecraft", icon: "MC", label: "Minecraft" },
      { key: "mario", icon: "M", label: "Mario" },
      { key: "sonic", icon: "S", label: "Sonic" }
    ];
    let firstCard = null;
    let lockMemory = false;
    let foundPairs = 0;

    const setCardLabel = (button, open) => {
      button.classList.toggle("is-open", open);
      button.innerHTML = open
        ? `<span class="kids-memory-face">${button.dataset.icon || ""}</span>`
        : '<span class="kids-memory-face is-hidden">?</span>';
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
              data-icon="${value.icon}"
              data-label="${value.label}"
              data-index="${index}"
            >
              <span class="kids-memory-face is-hidden">?</span>
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

    if (tetrisBoard && tetrisNext) {
      const columns = 10;
      const rows = 16;
      const previewSize = 4;
      const createMatrix = (height, width) => Array.from({ length: height }, () => Array(width).fill(""));
      const cloneMatrix = (matrix) => matrix.map((row) => [...row]);
      const tetrisPieces = [
        { key: "monica", icon: "MO", matrix: [[1, 1], [1, 1]] },
        { key: "cebolinha", icon: "CE", matrix: [[1, 0, 0], [1, 1, 1]] },
        { key: "magali", icon: "MA", matrix: [[0, 0, 1], [1, 1, 1]] },
        { key: "roblox", icon: "RBX", matrix: [[1, 1, 1, 1]] },
        { key: "mario", icon: "M", matrix: [[0, 1, 0], [1, 1, 1]] },
        { key: "sonic", icon: "S", matrix: [[1, 1, 0], [0, 1, 1]] },
        { key: "pokemon", icon: "PK", matrix: [[0, 1, 1], [1, 1, 0]] }
      ];

      const findPiece = (key) => tetrisPieces.find((piece) => piece.key === key) || tetrisPieces[0];
      const randomPiece = () => {
        const template = tetrisPieces[Math.floor(Math.random() * tetrisPieces.length)];
        return {
          key: template.key,
          matrix: cloneMatrix(template.matrix),
          x: Math.floor((columns - template.matrix[0].length) / 2),
          y: 0
        };
      };

      const rotateMatrix = (matrix) =>
        matrix[0].map((_value, columnIndex) => matrix.map((row) => row[columnIndex]).reverse());

      let frozenBoard = createMatrix(rows, columns);
      let boardCells = [];
      let previewCells = [];
      let currentPiece = null;
      let nextPiece = randomPiece();
      let score = 0;
      let lines = 0;
      let level = 1;
      let isRunning = false;
      let ticker = null;

      const setTetrisMessage = (message) => {
        if (tetrisMessage) tetrisMessage.textContent = message;
      };

      const setToggleLabel = () => {
        if (!tetrisToggle) return;
        if (isRunning) {
          tetrisToggle.textContent = "Pausar";
          return;
        }
        tetrisToggle.textContent = score || lines || currentPiece ? "Continuar" : "Comecar";
      };

      const renderStats = () => {
        if (tetrisScore) tetrisScore.textContent = `${score} estrelas`;
        if (tetrisLines) tetrisLines.textContent = String(lines);
        if (tetrisLevel) tetrisLevel.textContent = String(level);
        setToggleLabel();
      };

      const paintGrid = (cells, matrix) => {
        matrix.forEach((row, y) => {
          row.forEach((value, x) => {
            const cell = cells[y * matrix[0].length + x];
            const piece = value ? findPiece(value) : null;
            cell.className = "kids-tetris-cell";
            cell.textContent = "";
            if (piece) {
              cell.classList.add("is-filled", `piece-${piece.key}`);
              cell.textContent = piece.icon;
            }
          });
        });
      };

      const renderNextPiece = () => {
        const previewMatrix = createMatrix(previewSize, previewSize);
        if (nextPiece) {
          const startY = Math.floor((previewSize - nextPiece.matrix.length) / 2);
          const startX = Math.floor((previewSize - nextPiece.matrix[0].length) / 2);
          nextPiece.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
              if (!value) return;
              previewMatrix[startY + y][startX + x] = nextPiece.key;
            });
          });
        }
        paintGrid(previewCells, previewMatrix);
      };

      const buildSnapshot = () => {
        const snapshot = frozenBoard.map((row) => row.slice());
        if (!currentPiece) return snapshot;
        currentPiece.matrix.forEach((row, y) => {
          row.forEach((value, x) => {
            if (!value) return;
            const targetY = currentPiece.y + y;
            const targetX = currentPiece.x + x;
            if (targetY >= 0 && targetY < rows && targetX >= 0 && targetX < columns) {
              snapshot[targetY][targetX] = currentPiece.key;
            }
          });
        });
        return snapshot;
      };

      const renderBoard = () => {
        paintGrid(boardCells, buildSnapshot());
        renderNextPiece();
        renderStats();
      };

      const collides = (piece, offsetX = 0, offsetY = 0, matrix = piece.matrix) => {
        for (let y = 0; y < matrix.length; y += 1) {
          for (let x = 0; x < matrix[y].length; x += 1) {
            if (!matrix[y][x]) continue;
            const nextX = piece.x + x + offsetX;
            const nextY = piece.y + y + offsetY;
            if (nextX < 0 || nextX >= columns || nextY >= rows) return true;
            if (nextY >= 0 && frozenBoard[nextY][nextX]) return true;
          }
        }
        return false;
      };

      const stopTicker = () => {
        if (!ticker) return;
        window.clearInterval(ticker);
        ticker = null;
      };

      const getDropDelay = () => Math.max(180, 720 - (level - 1) * 55);

      const startTicker = () => {
        stopTicker();
        ticker = window.setInterval(() => {
          if (!isRunning) return;
          movePieceDown();
        }, getDropDelay());
      };

      const clearLines = () => {
        let cleared = 0;
        frozenBoard = frozenBoard.filter((row) => {
          const full = row.every(Boolean);
          if (full) cleared += 1;
          return !full;
        });
        while (frozenBoard.length < rows) frozenBoard.unshift(Array(columns).fill(""));
        if (cleared) {
          lines += cleared;
          score += cleared * 12;
          level = 1 + Math.floor(lines / 4);
        }
        return cleared;
      };

      const spawnPiece = () => {
        currentPiece = nextPiece || randomPiece();
        currentPiece.x = Math.floor((columns - currentPiece.matrix[0].length) / 2);
        currentPiece.y = 0;
        nextPiece = randomPiece();
        if (collides(currentPiece)) {
          currentPiece = null;
          isRunning = false;
          stopTicker();
          setTetrisMessage("A pilha encostou no teto. Aperte Novo jogo para brincar outra vez.");
          renderBoard();
          return false;
        }
        renderBoard();
        return true;
      };

      const resetTetris = () => {
        frozenBoard = createMatrix(rows, columns);
        currentPiece = null;
        nextPiece = randomPiece();
        score = 0;
        lines = 0;
        level = 1;
        isRunning = false;
        stopTicker();
        setTetrisMessage("Junte os blocos conhecidos em linhas completas para ganhar estrelas.");
        renderBoard();
      };

      const beginTetris = () => {
        if (!currentPiece && !spawnPiece()) return;
        isRunning = true;
        setTetrisMessage("Valendo! Empilhe Roblox, Mario, Sonic e Turma da Monica com calma.");
        startTicker();
        renderBoard();
      };

      const lockPiece = () => {
        if (!currentPiece) return;
        currentPiece.matrix.forEach((row, y) => {
          row.forEach((value, x) => {
            if (!value) return;
            const targetY = currentPiece.y + y;
            const targetX = currentPiece.x + x;
            if (targetY >= 0 && targetY < rows) {
              frozenBoard[targetY][targetX] = currentPiece.key;
            }
          });
        });
        currentPiece = null;
        const cleared = clearLines();
        if (cleared) {
          setTetrisMessage(
            cleared > 1
              ? `Boa! Voce limpou ${cleared} linhas de uma vez.`
              : "Linha completa! Mais uma estrela para a turma."
          );
        }
        if (!spawnPiece()) return;
        startTicker();
      };

      function movePieceDown() {
        if (!currentPiece) return;
        if (collides(currentPiece, 0, 1)) {
          lockPiece();
          return;
        }
        currentPiece.y += 1;
        renderBoard();
      }

      const movePieceSide = (direction) => {
        if (!isRunning || !currentPiece || collides(currentPiece, direction, 0)) return;
        currentPiece.x += direction;
        renderBoard();
      };

      const rotatePiece = () => {
        if (!isRunning || !currentPiece) return;
        const rotated = rotateMatrix(currentPiece.matrix);
        const kicks = [0, -1, 1, -2, 2];
        for (const kick of kicks) {
          if (!collides(currentPiece, kick, 0, rotated)) {
            currentPiece.matrix = rotated;
            currentPiece.x += kick;
            renderBoard();
            return;
          }
        }
      };

      const softDrop = () => {
        if (!isRunning || !currentPiece) return;
        if (collides(currentPiece, 0, 1)) {
          lockPiece();
          return;
        }
        currentPiece.y += 1;
        score += 1;
        renderBoard();
      };

      const toggleTetris = () => {
        if (isRunning) {
          isRunning = false;
          stopTicker();
          setTetrisMessage("Jogo pausado. Aperte continuar quando quiser.");
          renderBoard();
          return;
        }
        if (!score && !lines && !currentPiece) {
          resetTetris();
        }
        beginTetris();
      };

      tetrisBoard.innerHTML = Array.from({ length: rows * columns }, () => '<div class="kids-tetris-cell"></div>').join("");
      tetrisNext.innerHTML = Array.from({ length: previewSize * previewSize }, () => '<div class="kids-tetris-cell"></div>').join("");
      boardCells = Array.from(tetrisBoard.querySelectorAll(".kids-tetris-cell"));
      previewCells = Array.from(tetrisNext.querySelectorAll(".kids-tetris-cell"));

      tetrisToggle?.addEventListener("click", toggleTetris);
      tetrisReset?.addEventListener("click", () => {
        resetTetris();
        beginTetris();
      });
      tetrisLeft?.addEventListener("click", () => movePieceSide(-1));
      tetrisRight?.addEventListener("click", () => movePieceSide(1));
      tetrisRotate?.addEventListener("click", rotatePiece);
      tetrisDown?.addEventListener("click", softDrop);

      window.addEventListener("keydown", (event) => {
        if (!document.body.classList.contains("infantil-child-page")) return;
        const keyMap = {
          ArrowLeft: () => movePieceSide(-1),
          ArrowRight: () => movePieceSide(1),
          ArrowUp: rotatePiece,
          ArrowDown: softDrop,
          " ": () => toggleTetris()
        };
        const handler = keyMap[event.key];
        if (!handler) return;
        event.preventDefault();
        handler();
      });

      resetTetris();
    }

    const heroes = ["Monica", "Cebolinha", "Mario", "Sonic", "um avatar do Roblox", "um construtor do Minecraft"];
    const objects = ["um portal de mapa seguro", "uma placa de modo familia", "uma mochila de blocos", "um controle colorido"];
    const places = ["na rua do Limoeiro", "em um mapa de Roblox revisado", "perto de uma base do Minecraft", "em uma pista de corrida"];
    const endings = ["e chamou a familia para conferir as regras.", "e marcou os favoritos antes de jogar.", "e combinou tempo de tela antes da proxima fase.", "e guardou a senha em segredo."];

    storyMix?.addEventListener("click", () => {
      const pick = (list) => list[Math.floor(Math.random() * list.length)];
      if (storyOutput) {
        storyOutput.textContent = `${pick(heroes)} encontrou ${pick(objects)} ${pick(places)} ${pick(endings)}`;
      }
    });

    const quiz = [
      {
        question: "Qual atitude deixa o Roblox mais seguro?",
        options: ["Passar a senha", "Combinar regras com a familia", "Aceitar qualquer convite"],
        answer: 1,
        feedback: "Combinar regras ajuda em chat, compras, amizades e tempo de tela."
      },
      {
        question: "Qual grupo tem Monica, Cebolinha, Cascao e Magali?",
        options: ["Turma da Monica", "Patrulha Canina", "Mario Kart"],
        answer: 0,
        feedback: "A Turma da Monica e uma das referencias brasileiras mais conhecidas para criancas."
      },
      {
        question: "No Minecraft, o que ajuda a voltar para a base?",
        options: ["Anotar coordenadas", "Jogar tudo fora", "Esconder a cama"],
        answer: 0,
        feedback: "Coordenadas, tochas e pontos de referencia ajudam a crianca a nao se perder."
      }
    ];
    let quizIndex = 0;
    let quizHits = 0;
    let quizAnswered = 0;

    const renderQuiz = () => {
      if (!quizQuestion || !quizOptions) return;
      const current = quiz[quizIndex % quiz.length];
      quizQuestion.textContent = current.question;
      quizOptions.innerHTML = current.options
        .map((option, index) => `<button type="button" data-quiz-answer="${index}">${option}</button>`)
        .join("");
      if (quizFeedback) quizFeedback.textContent = "Responda e veja a explicacao.";
      if (quizScore) quizScore.textContent = `${quizHits} acertos de ${quizAnswered}`;
    };

    quizOptions?.addEventListener("click", (event) => {
      const button = event.target instanceof Element ? event.target.closest("[data-quiz-answer]") : null;
      if (!button || button.disabled) return;
      const current = quiz[quizIndex % quiz.length];
      const selected = Number(button.dataset.quizAnswer);
      const isCorrect = selected === current.answer;
      quizAnswered += 1;
      if (isCorrect) quizHits += 1;
      Array.from(quizOptions.querySelectorAll("button")).forEach((item) => {
        item.disabled = true;
        item.classList.toggle("is-correct", Number(item.dataset.quizAnswer) === current.answer);
      });
      if (quizFeedback) {
        quizFeedback.textContent = `${isCorrect ? "Acertou!" : "Quase!"} ${current.feedback}`;
      }
      if (quizScore) quizScore.textContent = `${quizHits} acertos de ${quizAnswered}`;
    });

    quizNext?.addEventListener("click", () => {
      quizIndex += 1;
      renderQuiz();
    });

    renderQuiz();

    const drawIdeas = [
      {
        title: "Desenhe uma cidade estilo Roblox.",
        prompt: "Crie uma praca, um portal, uma loja de itens e uma placa de seguranca digital."
      },
      {
        title: "Desenhe uma tirinha da Turma da Monica.",
        prompt: "Use tres quadros: chegada, confusao divertida e final com uma licao leve."
      },
      {
        title: "Desenhe uma base segura no Minecraft.",
        prompt: "Coloque cama, bau, tochas, plantacao e uma placa dizendo onde fica a entrada."
      },
      {
        title: "Desenhe uma pista do Mario e do Sonic.",
        prompt: "Misture curva, moeda, anel, rampa, placa de atalho e uma chegada bem colorida."
      },
      {
        title: "Desenhe um card de creator infantil.",
        prompt: "Crie titulo grande, cor forte, aviso de modo familia e um tema do video."
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
    const autoSeen = (() => {
      try {
        return sessionStorage.getItem(AUTO_OPEN_KEY) === "1";
      } catch (_error) {
        return false;
      }
    })();

    if (hashWantsPopup) {
      openModal();
    } else if (document.body.classList.contains("games-hub-page") && !autoSeen) {
      window.setTimeout(() => {
        if (modal.hidden) {
          openModal();
        }
      }, 1400);
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
