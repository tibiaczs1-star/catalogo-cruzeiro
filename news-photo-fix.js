(function () {

  const normalize = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
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

  const applyPhoto = (thumb, imageUrl) => {
    thumb.style.setProperty("--bg-image", `url("${imageUrl}")`);
    thumb.style.setProperty("--news-photo", `url("${imageUrl}")`);
    thumb.style.backgroundImage = `linear-gradient(180deg, rgba(9, 24, 39, 0.02), rgba(9, 24, 39, 0.3)), url("${imageUrl}")`;
    thumb.style.backgroundSize = "cover";
    thumb.style.backgroundPosition = "center";
    thumb.classList.add("has-real-photo");
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
          card.style.setProperty("--bg-image", `url("${imageUrl}")`);
          card.style.setProperty("--bg-size", "cover");
          card.style.setProperty("--bg-position", "center 35%");
          card.classList.add("has-photo", "has-real-photo");
          return;
        }

        card
          .querySelectorAll(".news-thumb, .archive-thumb, .live-feed-thumb, .feed-thumb, .mini-thumb")
          .forEach((thumb) => applyPhoto(thumb, imageUrl));
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
