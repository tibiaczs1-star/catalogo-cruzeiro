(function () {
  const PERSON_HINTS = [
    "retrato",
    "rosto",
    "face",
    "portrait",
    "person",
    "people",
    "woman",
    "man",
    "girl",
    "boy",
    "model",
    "cantor",
    "cantora",
    "artista",
    "ator",
    "atriz",
    "jogador",
    "jogadora",
    "ciclista",
    "atleta",
    "deputado",
    "deputada",
    "senador",
    "senadora",
    "governador",
    "governadora",
    "prefeito",
    "prefeita",
    "ministro",
    "ministra",
    "presidente",
    "entrevista",
    "bbb",
    "viral",
    "famos",
    "social"
  ];
  const GENERIC_POSITIONS = new Set([
    "",
    "center",
    "center center",
    "50% 50%",
    "center 30%",
    "50% 30%",
    "center 35%",
    "50% 35%"
  ]);
  const imageMetricsCache = new Map();
  let faceDetector = null;

  const normalize = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  const extractImageFromStyle = (styleText) => {
    const rawStyle = String(styleText || "");
    if (!rawStyle) return "";

    const match = rawStyle.match(/--bg-image\s*:\s*url\((['"]?)(.*?)\1\)/i);
    return match?.[2] ? String(match[2]).replace(/&amp;/gi, "&").trim() : "";
  };

  const getImageForCard = (card) => {
    const thumb = card.querySelector(".news-thumb, .archive-thumb, .live-feed-thumb, .feed-thumb, .mini-thumb");
    const explicit =
      card.getAttribute("data-source-image") ||
      card.getAttribute("data-image-url") ||
      card.querySelector("[data-image-url]")?.getAttribute("data-image-url") ||
      thumb?.getAttribute("data-source-image") ||
      thumb?.getAttribute("data-image-url") ||
      extractImageFromStyle(thumb?.getAttribute("style")) ||
      extractImageFromStyle(card.getAttribute("style"));

    return explicit ? String(explicit) : "";
  };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const normalizeFrameValue = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  const hasCustomPosition = (value) => {
    const normalized = normalizeFrameValue(value);
    return Boolean(normalized) && !GENERIC_POSITIONS.has(normalized);
  };

  const hasCustomSize = (value) => {
    const normalized = normalizeFrameValue(value);
    return Boolean(normalized) && normalized !== "cover";
  };

  const getBaseFrame = (node) => {
    const existingPosition = String(node?.style?.getPropertyValue("--bg-position") || "").trim();
    const existingSize = String(node?.style?.getPropertyValue("--bg-size") || "").trim();
    const fallbackPosition = node?.classList?.contains("mosaic-item") ? "center 35%" : "center 30%";

    return {
      position: existingPosition || fallbackPosition,
      size: existingSize || "cover",
      hasCustomPosition: hasCustomPosition(existingPosition),
      hasCustomSize: hasCustomSize(existingSize)
    };
  };

  const getFaceDetector = () => {
    if (!("FaceDetector" in window)) {
      return null;
    }

    if (!faceDetector) {
      faceDetector = new window.FaceDetector({
        fastMode: true,
        maxDetectedFaces: 3
      });
    }

    return faceDetector;
  };

  const detectPrimaryFace = async (img) => {
    const detector = getFaceDetector();
    if (!detector || !img?.naturalWidth || !img?.naturalHeight) {
      return null;
    }

    try {
      const faces = await detector.detect(img);
      if (!faces?.length) {
        return null;
      }

      const primaryFace = faces
        .slice()
        .sort((a, b) => {
          const aa = (a.boundingBox?.width || 0) * (a.boundingBox?.height || 0);
          const bb = (b.boundingBox?.width || 0) * (b.boundingBox?.height || 0);
          return bb - aa;
        })[0];
      const box = primaryFace?.boundingBox;
      if (!box) {
        return null;
      }

      const x = ((box.x + box.width / 2) / img.naturalWidth) * 100;
      const y = ((box.y + box.height * 0.42) / img.naturalHeight) * 100;
      const portraitish = img.naturalWidth / Math.max(1, img.naturalHeight) < 1.05;

      return {
        x: clamp(x, 18, 82),
        y: clamp(y, portraitish ? 14 : 18, portraitish ? 38 : 54)
      };
    } catch {
      return null;
    }
  };

  const getImageMetrics = (imageUrl) => {
    if (!imageUrl) {
      return Promise.resolve(null);
    }

    if (!imageMetricsCache.has(imageUrl)) {
      imageMetricsCache.set(
        imageUrl,
        new Promise((resolve) => {
          const img = new Image();
          img.decoding = "async";
          img.onload = async () => {
            const metrics = {
              width: img.naturalWidth || 0,
              height: img.naturalHeight || 0,
              face: await detectPrimaryFace(img)
            };
            resolve(metrics);
          };
          img.onerror = () => resolve(null);
          img.src = imageUrl;
        })
      );
    }

    return imageMetricsCache.get(imageUrl);
  };

  const buildContext = (node, imageUrl) => {
    const ownerCard = node?.closest?.(".news-card, .archive-card, .live-feed-card, .feed-card, .mosaic-item");
    return normalize(
      [
        node?.className,
        node?.getAttribute?.("aria-label"),
        node?.getAttribute?.("data-topic"),
        node?.dataset?.topic,
        ownerCard?.className,
        ownerCard?.getAttribute?.("aria-label"),
        ownerCard?.dataset?.category,
        ownerCard?.textContent,
        node?.textContent,
        imageUrl
      ].join(" ")
    );
  };

  const hasPersonHint = (node, imageUrl) => {
    const context = buildContext(node, imageUrl);
    return PERSON_HINTS.some((hint) => context.includes(hint));
  };

  const inferSmartFrame = (node, imageUrl, metrics) => {
    const baseFrame = getBaseFrame(node);
    const ratio = (metrics?.width || 0) / Math.max(1, metrics?.height || 1);
    const prefersPerson = hasPersonHint(node, imageUrl);
    const face = metrics?.face || null;

    const smartFrame = {
      position: baseFrame.position,
      size: baseFrame.size,
      mode: "default"
    };

    if (face) {
      smartFrame.position = `${face.x}% ${face.y}%`;
      smartFrame.size = ratio < 0.68 ? "contain" : "cover";
      smartFrame.mode = "face";
    } else if (ratio > 0 && ratio < 0.68) {
      smartFrame.position = prefersPerson ? "center 14%" : "center 18%";
      smartFrame.size = "contain";
      smartFrame.mode = "portrait-contain";
    } else if (ratio > 0 && ratio < 0.95) {
      smartFrame.position = prefersPerson ? "center 16%" : "center 20%";
      smartFrame.size = "cover";
      smartFrame.mode = "portrait-cover";
    } else if (prefersPerson || (ratio >= 0.95 && ratio < 1.24)) {
      smartFrame.position = "center 22%";
      smartFrame.size = "cover";
      smartFrame.mode = "person-safe";
    } else if (ratio > 2.35) {
      smartFrame.position = "center 44%";
      smartFrame.size = "cover";
      smartFrame.mode = "panorama";
    } else if (ratio > 1.75) {
      smartFrame.position = "center 36%";
      smartFrame.size = "cover";
      smartFrame.mode = "wide";
    }

    if (baseFrame.hasCustomPosition) {
      smartFrame.position = baseFrame.position;
      smartFrame.mode = "manual-position";
    }

    if (baseFrame.hasCustomSize) {
      smartFrame.size = baseFrame.size;
      smartFrame.mode = baseFrame.hasCustomPosition ? "manual" : "manual-size";
    }

    return smartFrame;
  };

  const applyPhoto = (thumb, imageUrl, frame = {}) => {
    const position = String(frame.position || "").trim() || "center 30%";
    const size = String(frame.size || "").trim() || "cover";
    thumb.style.setProperty("--bg-image", `url("${imageUrl}")`);
    thumb.style.setProperty("--news-photo", `url("${imageUrl}")`);
    thumb.style.setProperty("--bg-position", position);
    thumb.style.setProperty("--bg-size", size);
    thumb.style.backgroundImage = `linear-gradient(180deg, rgba(9, 24, 39, 0.02), rgba(9, 24, 39, 0.3)), url("${imageUrl}")`;
    thumb.style.backgroundSize = size;
    thumb.style.backgroundPosition = position;
    thumb.classList.add("has-real-photo");
    thumb.dataset.photoFrame = String(frame.mode || "base");
  };

  const framePhoto = (node, imageUrl) => {
    const baseFrame = getBaseFrame(node);
    applyPhoto(node, imageUrl, baseFrame);

    const frameKey = `${imageUrl}::${node.className}`;
    if (node.dataset.photoFrameKey === frameKey) {
      return;
    }

    node.dataset.photoFrameKey = frameKey;
    getImageMetrics(imageUrl).then((metrics) => {
      if (!metrics || node.dataset.photoFrameKey !== frameKey) {
        return;
      }

      applyPhoto(node, imageUrl, inferSmartFrame(node, imageUrl, metrics));
    });
  };

  const fixNewsPhotos = () => {
    document
      .querySelectorAll(".news-card, .archive-card, .live-feed-card, .feed-card, .mosaic-item")
      .forEach((card) => {
        const imageUrl = getImageForCard(card);
        if (!imageUrl) return;
        card.style.setProperty("--news-photo", `url("${imageUrl}")`);
        card.classList.add("news-photo-fixed");

        if (card.classList.contains("mosaic-item")) {
          framePhoto(card, imageUrl);
          card.classList.add("has-photo");
          return;
        }

        card
          .querySelectorAll(".news-thumb, .archive-thumb, .live-feed-thumb, .feed-thumb, .mini-thumb")
          .forEach((thumb) => framePhoto(thumb, imageUrl));
      });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fixNewsPhotos);
  } else {
    fixNewsPhotos();
  }

  window.addEventListener("load", () => {
    fixNewsPhotos();
    window.setTimeout(fixNewsPhotos, 400);
    window.setTimeout(fixNewsPhotos, 1200);
  });

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(fixNewsPhotos);
  });

  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
})();
