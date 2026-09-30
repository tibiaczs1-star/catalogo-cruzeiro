const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..', '..');

test('homepage hero chooses safe media fit and never crops graphic/news cards', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

  assert.match(html, /function\s+czsHeroMediaClass\s*\(/, 'missing hero media classifier');
  assert.match(html, /class="lead-image\s+\$\{czsHeroMediaClass\(lead\)\}"/, 'lead image must receive safe fit class');
  assert.match(html, /<h1 title="\$\{esc\(lead\.title\)\}">\$\{esc\(czsCompactTitle\(lead\.title,\s*82\)\)\}<\/h1>/, 'hero title must be compacted with full title preserved');
  assert.match(html, /<p title="\$\{esc\(lead\.subtitle\|\|lead\.summary\)\}">\$\{esc\(czsCompactSummary\(lead\.subtitle\|\|lead\.summary,\s*150\)\)\}<\/p>/, 'hero summary must be compacted with full text preserved');
});

test('homepage hero CSS documents the image rules and keeps text visible', () => {
  const css = fs.readFileSync(path.join(ROOT, 'assets', 'v8-final', 'v8-merge-ready.css'), 'utf8');

  assert.match(css, /CZS hero media rules/, 'missing documented hero media rules');
  assert.match(css, /\.lead-image\.czs-media-contain[\s\S]*background-size:\s*contain/, 'graphic cards must use contain');
  assert.match(css, /\.lead-image\.czs-media-cover[\s\S]*background-size:\s*cover/, 'photos must keep cover');
  assert.match(css, /#leadStory \.lead-copy h1[\s\S]*-webkit-line-clamp:\s*3/, 'hero title must be clamped safely');
  assert.match(css, /#leadStory \.lead-copy p[\s\S]*-webkit-line-clamp:\s*3/, 'hero summary must be clamped safely');
});
