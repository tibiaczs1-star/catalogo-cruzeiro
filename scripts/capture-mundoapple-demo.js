/*
 * Records the real local Mundo Apple experience for handoff/review.
 * The administrator password is deliberately supplied only through the
 * MUNDOAPPLE_ADMIN_PASSWORD environment variable, never committed here.
 */
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("C:/claude/node_modules/@playwright/test");

const baseUrl = process.argv[2] || "http://127.0.0.1:3013";
const outputDir = path.resolve(process.cwd(), "output/playwright/mundoapple-demo");
const rawVideoDir = path.join(outputDir, "raw");
const finalVideoPath = path.join(outputDir, "mundoapple-cinematic-tour.webm");
const adminPassword = process.env.MUNDOAPPLE_ADMIN_PASSWORD;

if (!adminPassword) {
  throw new Error("Defina MUNDOAPPLE_ADMIN_PASSWORD apenas no ambiente para gravar o painel administrativo.");
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function moveThroughIntro(page) {
  await page.goto(`${baseUrl}/mundoapple/?intro=1&v=cinema`, { waitUntil: "networkidle" });
  const hold = page.locator("#intro-hold");
  await hold.waitFor({ state: "visible" });
  const box = await hold.boundingBox();
  if (!box) throw new Error("A abertura cinematográfica não ficou visível.");

  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  await page.mouse.move(centerX - 90, centerY + 70, { steps: 12 });
  // The hold must begin inside its interactive area; starting outside makes
  // the cinematic overlay remain on top of the catalog during a real capture.
  await page.mouse.move(centerX, centerY, { steps: 12 });
  await page.mouse.down();
  for (let index = 0; index < 6; index += 1) {
    const orbit = index * Math.PI / 3;
    await page.mouse.move(centerX + Math.cos(orbit) * 42, centerY + Math.sin(orbit) * 26, { steps: 8 });
    await wait(260);
  }
  await wait(500);
  await page.mouse.up();
  await page.locator("#intro-experience").waitFor({ state: "detached", timeout: 5000 });
}

async function tourStore(page) {
  await page.locator("#catalog-grid").scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 420);
  await wait(1000);

  const cards = page.locator("article.product-card[data-product-id]");
  await cards.first().waitFor({ state: "visible" });
  await cards.first().click();

  const productDialog = page.locator("#product-dialog");
  await productDialog.waitFor({ state: "visible" });
  await wait(850);

  const colors = productDialog.locator(".color-option[data-select-color]");
  if (await colors.count() > 1) {
    await colors.nth(1).click();
    await wait(1100);
  }

  await productDialog.locator("[data-start-checkout]").click();
  const checkout = page.locator("#checkout-dialog");
  await checkout.waitFor({ state: "visible" });
  await checkout.locator('input[name="deliveryMode"][value="delivery"]').check();
  await wait(500);

  await checkout.locator('input[name="customerName"]').fill("Cliente demonstração");
  await checkout.locator('input[name="customerPhone"]').fill("(68) 99999-9999");
  await checkout.locator('input[name="street"]').fill("Rua do Mercado");
  await checkout.locator('input[name="number"]').fill("170");
  await checkout.locator('input[name="neighborhood"]').fill("Centro");
  await checkout.locator('input[name="postalCode"]').fill("69980-000");
  await wait(1600);
}

async function tourAdmin(page) {
  await page.goto(`${baseUrl}/mundoapple/admin/`, { waitUntil: "networkidle" });
  const login = page.locator("#login-form");
  await login.waitFor({ state: "visible" });
  await login.locator('input[name="username"]').fill("matheus");
  await login.locator('input[name="password"]').fill(adminPassword);
  await login.locator('button[type="submit"]').click();
  await page.locator('[data-section="dashboard"]').waitFor({ state: "visible" });
  await wait(1500);

  await page.locator('[data-section="inventory"]').click();
  await wait(1600);
  await page.locator('[data-section="reports"]').click();
  await wait(1900);
}

async function main() {
  await fs.mkdir(rawVideoDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: "dark",
    recordVideo: { dir: rawVideoDir, size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();
  const video = page.video();

  try {
    await moveThroughIntro(page);
    await tourStore(page);
    await tourAdmin(page);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }

  const recordedPath = await video.path();
  await fs.rm(finalVideoPath, { force: true });
  await fs.rename(recordedPath, finalVideoPath);
  process.stdout.write(`${JSON.stringify({ video: finalVideoPath })}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
