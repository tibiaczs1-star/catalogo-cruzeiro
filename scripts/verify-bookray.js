const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
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
    const response = await page.goto("http://127.0.0.1:8765/bookray/", {
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
    }));
    console.log(JSON.stringify({ ...viewport, status: response.status(), errors, ...result }));
    await page.close();
  }
  await browser.close();
})();
