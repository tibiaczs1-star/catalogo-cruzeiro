const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const bookrayUrl = new URL(
    process.env.BOOKRAY_URL || 'http://127.0.0.1:8765/bookray/'
  );
  const mediaKitUrl = new URL('media-kit.html', bookrayUrl);
  const capture = async (viewport, path) => {
    const page = await browser.newPage({ viewport });
    await page.goto(bookrayUrl.href, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 650) {
        scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 35));
      }
      scrollTo(0, 0);
    });
    await page.waitForTimeout(250);
    await page.screenshot({ path, fullPage: true });
    await page.close();
  };

  await capture({ width: 1440, height: 1000 }, 'outputs/bookray-desktop-final.png');
  await capture({ width: 390, height: 844 }, 'outputs/bookray-mobile-final.png');

  const mediaKit = await browser.newPage();
  await mediaKit.goto(mediaKitUrl.href, { waitUntil: 'networkidle' });
  const sheets = mediaKit.locator('.page');
  for (let index = 0; index < (await sheets.count()); index += 1) {
    await sheets.nth(index).screenshot({
      path: `tmp/pdfs/rendered/page-${String(index + 1).padStart(2, '0')}.png`,
    });
  }
  await mediaKit.pdf({
    path: 'output/pdf/media-kit-raiane-2026.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });
  await mediaKit.close();
  await browser.close();
})();
