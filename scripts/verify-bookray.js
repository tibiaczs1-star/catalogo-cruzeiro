const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const baseUrl = process.env.BOOKRAY_URL || "http://127.0.0.1:8765/bookray/";
  for (const viewport of [
    { width: 1440, height: 1000, name: "desktop" },
    { width: 390, height: 844, name: "mobile" },
  ]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    const response = await page.goto(baseUrl, {
      waitUntil: "networkidle",
    });
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 700) {
        scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
    });
    await page.waitForTimeout(400);
    const result = await page.evaluate(() => ({
      images: document.images.length,
      brokenImages: [...document.images].filter(
        (image) => image.hasAttribute("src") && (!image.complete || !image.naturalWidth),
      )
        .length,
      brokenSources: [...document.images]
        .filter(
          (image) => image.hasAttribute("src") && (!image.complete || !image.naturalWidth),
        )
        .map((image) => image.getAttribute("src")),
      height: document.documentElement.scrollHeight,
      title: document.title,
      scenes: document.querySelectorAll(".scene").length,
      sourceImages: [...document.images].filter((image) => image.hasAttribute("src")).length,
      uniqueSources: new Set(
        [...document.images]
          .filter((image) => image.hasAttribute("src"))
          .map((image) => image.currentSrc || image.src),
      ).size,
    }));
    console.log(JSON.stringify({ ...viewport, status: response.status(), errors, ...result }));
    await page.close();
  }

  const mediaPage = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const mediaErrors = [];
  mediaPage.on("pageerror", (error) => mediaErrors.push(error.message));
  mediaPage.on("console", (message) => {
    if (message.type() === "error") mediaErrors.push(message.text());
  });
  const mediaResponse = await mediaPage.goto(new URL("media-kit.html", baseUrl).href, {
    waitUntil: "networkidle",
  });
  const mediaResult = await mediaPage.evaluate(async () => {
    await Promise.all(
      [...document.images].map((image) =>
        image.complete
          ? Promise.resolve()
          : new Promise((resolve) => {
              image.addEventListener("load", resolve, { once: true });
              image.addEventListener("error", resolve, { once: true });
            }),
      ),
    );
    const archiveImages = [...document.querySelectorAll(".archive-photo img")];
    return {
      pages: document.querySelectorAll(".page").length,
      archivePages: document.querySelectorAll(".archive-page").length,
      archiveImages: archiveImages.length,
      uniqueArchiveSources: new Set(archiveImages.map((image) => image.currentSrc || image.src)).size,
      brokenImages: [...document.images].filter(
        (image) => image.hasAttribute("src") && (!image.complete || !image.naturalWidth),
      ).length,
    };
  });
  console.log(JSON.stringify({ name: "media-kit", status: mediaResponse.status(), errors: mediaErrors, ...mediaResult }));
  await mediaPage.close();
  await browser.close();
})();
