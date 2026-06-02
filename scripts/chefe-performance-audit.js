/**
 * CHEFE CALL — Audit de Performance
 * Roda via cron para verificar Core Web Vitals
 */
const SITE_URL = 'https://catalogo-cruzeiro.github.io/catalogo-cruzeiro/';

async function auditPerformance() {
  console.log('[Chefe Call] Audit de performance...');

  try {
    const url = encodeURIComponent(SITE_URL);
    const res = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&strategy=mobile&category=performance&category=accessibility&category=best-practices&category=seo`
    );

    if (!res.ok) {
      console.log('[Audit] Erro na API:', res.status);
      return;
    }

    const data = await res.json();
    const perf = data?.lighthouseResult?.categories;

    const score = perf?.performance?.score ? Math.round(perf.performance.score * 100) : 'N/A';
    const accessibility = perf?.accessibility?.score ? Math.round(perf.accessibility.score * 100) : 'N/A';
    const bestPractices = perf?.['best-practices']?.score ? Math.round(perf['best-practices'].score * 100) : 'N/A';
    const seo = perf?.seo?.score ? Math.round(perf.seo.score * 100) : 'N/A';

    console.log(`Performance Score: ${score}/100`);
    console.log(`Accessibility: ${accessibility}/100`);
    console.log(`Best Practices: ${bestPractices}/100`);
    console.log(`SEO: ${seo}/100`);

    const metrics = data?.lighthouseResult?.audits;
    if (metrics) {
      const lcp = metrics['largest-contentful-paint']?.numericValue;
      const cls = metrics['cumulative-layout-shift']?.numericValue;
      const fcp = metrics['first-contentful-paint']?.numericValue;
      const tbt = metrics['total-blocking-time']?.numericValue;

      if (lcp) console.log(`LCP: ${(lcp/1000).toFixed(1)}s ${lcp > 2500 ? '⚠️' : '✅'}`);
      if (cls) console.log(`CLS: ${cls.toFixed(3)} ${cls > 0.1 ? '⚠️' : '✅'}`);
      if (fcp) console.log(`FCP: ${(fcp/1000).toFixed(1)}s`);
      if (tbt) console.log(`TBT: ${(tbt/1000).toFixed(1)}s`);
    }

    // Salva resultado em artifact (via stdout — o GitHub Action captura)
    console.log(`::set-output name=perf_score::${score}`);
    console.log(`::set-output name=accessibility_score::${accessibility}`);

  } catch (e) {
    console.error('[Chefe Call] Erro no audit:', e.message);
  }
}

auditPerformance();
