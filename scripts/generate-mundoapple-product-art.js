"use strict";

const fs = require("node:fs");
const path = require("node:path");
const catalog = require("../mundoapple/data/apple-products.json");

const outputDir = path.join(__dirname, "..", "mundoapple", "public", "assets", "products");
const palettes = [
  ["#c8ff4d", "#0b6f69", "#f4f1e8"],
  ["#8de7ff", "#163a74", "#e9f8ff"],
  ["#ffb78f", "#7b3156", "#fff0e9"],
  ["#d7c4ff", "#4b3784", "#f2edff"],
  ["#ffe28a", "#7a4b16", "#fff8da"],
  ["#a8f0cc", "#155e54", "#e9fff4"],
];

function hash(value) {
  return [...String(value)].reduce((total, char, index) => (
    (total * 33 + char.charCodeAt(0) + index * 17) >>> 0
  ), 5381);
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  })[char]);
}

function deviceMarkup(product, seed, accent) {
  const cameraCount = 1 + (seed % 3);
  const cameras = Array.from({ length: cameraCount }, (_, index) => {
    const x = 410 + (index % 2) * 54;
    const y = 325 + Math.floor(index / 2) * 54;
    return `<circle cx="${x}" cy="${y}" r="20" fill="#050606" stroke="${accent}" stroke-width="4"/>`;
  }).join("");

  if (product.category === "iPhone") {
    return `<g transform="rotate(${(seed % 9) - 4} 600 590)">
      <rect x="340" y="190" width="520" height="820" rx="92" fill="url(#metal)" stroke="rgba(255,255,255,.65)" stroke-width="7"/>
      <rect x="370" y="220" width="460" height="760" rx="70" fill="url(#screen)"/>
      <rect x="525" y="242" width="150" height="36" rx="18" fill="#050606"/>
      <rect x="392" y="296" width="150" height="150" rx="42" fill="rgba(255,255,255,.12)"/>
      ${cameras}
      <path d="M420 840 Q600 710 810 820 L810 950 L390 950Z" fill="${accent}" opacity=".32"/>
    </g>`;
  }
  if (product.category === "Mac") {
    if (/mini|studio/i.test(product.name)) {
      return `<g><rect x="270" y="360" width="660" height="430" rx="80" fill="url(#metal)"/>
        <ellipse cx="600" cy="795" rx="320" ry="44" fill="#000" opacity=".35"/>
        <circle cx="835" cy="700" r="12" fill="${accent}"/>
        <path d="M345 560 H855" stroke="rgba(255,255,255,.12)" stroke-width="3"/></g>`;
    }
    if (/iMac|display/i.test(product.name)) {
      return `<g><rect x="210" y="210" width="780" height="570" rx="52" fill="url(#metal)"/>
        <rect x="245" y="245" width="710" height="455" rx="30" fill="url(#screen)"/>
        <path d="M530 780 H670 L720 930 H480Z" fill="url(#metal)"/><rect x="420" y="915" width="360" height="30" rx="15" fill="#303334"/></g>`;
    }
    return `<g><rect x="250" y="190" width="700" height="520" rx="42" fill="url(#metal)"/>
      <rect x="282" y="222" width="636" height="450" rx="24" fill="url(#screen)"/>
      <path d="M160 740 H1040 L920 900 H280Z" fill="url(#metal)"/>
      <path d="M510 755 H690 L665 795 H535Z" fill="rgba(0,0,0,.22)"/></g>`;
  }
  if (product.category === "iPad") {
    return `<g transform="rotate(${(seed % 7) - 3} 600 600)"><rect x="270" y="175" width="660" height="850" rx="60" fill="url(#metal)"/>
      <rect x="305" y="210" width="590" height="780" rx="38" fill="url(#screen)"/>
      <circle cx="600" cy="192" r="8" fill="#101112"/>
      <path d="M360 830 Q600 560 870 740 V960 H330Z" fill="${accent}" opacity=".34"/>
      <rect x="936" y="250" width="22" height="650" rx="11" fill="#f4f4f2" transform="rotate(3 947 575)"/></g>`;
  }
  if (product.category === "Apple Watch") {
    return `<g><rect x="475" y="80" width="250" height="1040" rx="120" fill="${accent}" opacity=".72"/>
      <rect x="315" y="325" width="570" height="550" rx="160" fill="url(#metal)"/>
      <rect x="355" y="365" width="490" height="470" rx="125" fill="url(#screen)"/>
      <circle cx="900" cy="500" r="38" fill="url(#metal)"/>
      <circle cx="600" cy="600" r="122" fill="none" stroke="${accent}" stroke-width="38"/>
      <path d="M600 465 V600 L690 650" stroke="#fff" stroke-width="22" stroke-linecap="round"/></g>`;
  }
  if (product.category === "AirPods") {
    if (/Max/i.test(product.name)) {
      return `<g><path d="M340 660 V470 Q340 210 600 210 Q860 210 860 470 V660" fill="none" stroke="url(#metal)" stroke-width="95"/>
        <rect x="230" y="500" width="250" height="400" rx="110" fill="url(#metal)"/>
        <rect x="720" y="500" width="250" height="400" rx="110" fill="url(#metal)"/>
        <rect x="280" y="560" width="150" height="280" rx="70" fill="${accent}" opacity=".32"/>
        <rect x="770" y="560" width="150" height="280" rx="70" fill="${accent}" opacity=".32"/></g>`;
    }
    return `<g><path d="M360 350 Q360 220 490 220 Q620 220 620 350 V540 Q620 640 520 640 H470 V930 Q470 1020 390 1020 Q310 1020 310 930 V520 Q250 455 250 350 Q250 220 360 220Z" fill="url(#metal)"/>
      <path d="M840 350 Q840 220 710 220 Q580 220 580 350 V540 Q580 640 680 640 H730 V930 Q730 1020 810 1020 Q890 1020 890 930 V520 Q950 455 950 350 Q950 220 840 220Z" fill="url(#metal)"/>
      <circle cx="355" cy="360" r="58" fill="${accent}" opacity=".42"/><circle cx="845" cy="360" r="58" fill="${accent}" opacity=".42"/></g>`;
  }
  if (product.category === "Casa e TV") {
    return /HomePod/i.test(product.name)
      ? `<g><rect x="350" y="260" width="500" height="650" rx="220" fill="url(#mesh)"/><ellipse cx="600" cy="300" rx="185" ry="70" fill="${accent}" opacity=".4"/><path d="M440 500 H760 M420 590 H780 M440 680 H760" stroke="rgba(255,255,255,.16)" stroke-width="8"/></g>`
      : `<g><rect x="280" y="350" width="640" height="500" rx="110" fill="url(#metal)"/><circle cx="600" cy="600" r="120" fill="url(#screen)"/><circle cx="600" cy="600" r="48" fill="${accent}" opacity=".72"/></g>`;
  }
  const variant = seed % 4;
  if (variant === 0) return `<g><circle cx="600" cy="590" r="280" fill="url(#metal)"/><circle cx="600" cy="590" r="120" fill="${accent}" opacity=".5"/></g>`;
  if (variant === 1) return `<g><rect x="550" y="160" width="100" height="860" rx="50" fill="url(#metal)" transform="rotate(22 600 590)"/><circle cx="405" cy="230" r="38" fill="${accent}"/></g>`;
  if (variant === 2) return `<g><path d="M260 350 Q600 160 940 350 V820 Q600 1040 260 820Z" fill="url(#glass)" stroke="rgba(255,255,255,.5)" stroke-width="8"/><circle cx="470" cy="570" r="125" fill="#071014"/><circle cx="730" cy="570" r="125" fill="#071014"/></g>`;
  return `<g><rect x="210" y="260" width="780" height="560" rx="62" fill="url(#metal)"/><rect x="250" y="300" width="700" height="480" rx="36" fill="url(#screen)"/><path d="M500 820 H700 L740 960 H460Z" fill="url(#metal)"/></g>`;
}

function svgFor(product) {
  const seed = hash(product.key);
  const [accent, secondary, paper] = palettes[seed % palettes.length];
  const orbit = 370 + (seed % 120);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200" width="1200" height="1200" role="img" aria-labelledby="title desc">
  <title id="title">${esc(product.name)}</title><desc id="desc">Ilustração editorial exclusiva do produto ${esc(product.name)}</desc>
  <defs>
    <radialGradient id="bg" cx="${30 + seed % 45}%" cy="${25 + seed % 30}%"><stop stop-color="${secondary}"/><stop offset=".48" stop-color="#101515"/><stop offset="1" stop-color="#050606"/></radialGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${paper}"/><stop offset=".36" stop-color="#8d9697"/><stop offset=".72" stop-color="#222728"/><stop offset="1" stop-color="#dce4e3"/></linearGradient>
    <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#020405"/><stop offset=".48" stop-color="${secondary}"/><stop offset=".75" stop-color="${accent}"/><stop offset="1" stop-color="#030505"/></linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#cfe8ef" stop-opacity=".82"/><stop offset=".45" stop-color="${secondary}" stop-opacity=".45"/><stop offset="1" stop-color="#0b0e10" stop-opacity=".88"/></linearGradient>
    <pattern id="mesh" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="#273030"/><circle cx="5" cy="5" r="3" fill="${accent}" opacity=".48"/></pattern>
    <filter id="shadow"><feDropShadow dx="0" dy="34" stdDeviation="28" flood-color="#000" flood-opacity=".55"/></filter>
    <filter id="blur"><feGaussianBlur stdDeviation="26"/></filter>
  </defs>
  <rect width="1200" height="1200" rx="100" fill="url(#bg)"/>
  <circle cx="${230 + seed % 280}" cy="${250 + seed % 170}" r="${orbit}" fill="none" stroke="${accent}" stroke-width="4" opacity=".16"/>
  <ellipse cx="600" cy="930" rx="390" ry="95" fill="${accent}" opacity=".16" filter="url(#blur)"/>
  <g filter="url(#shadow)">${deviceMarkup(product, seed, accent)}</g>
  <path d="M95 1035 H1105" stroke="rgba(255,255,255,.12)"/>
  <circle cx="${1050 - seed % 180}" cy="${160 + seed % 160}" r="11" fill="${accent}"/>
</svg>`;
}

fs.mkdirSync(outputDir, { recursive: true });
const selected = catalog
  .slice()
  .sort((a, b) => b.year - a.year || a.name.localeCompare(b.name, "pt-BR"));
for (const product of selected) {
  fs.writeFileSync(path.join(outputDir, `${product.key}.svg`), svgFor(product), "utf8");
}
fs.writeFileSync(
  path.join(outputDir, "manifest.json"),
  JSON.stringify(selected.map((product) => ({
    key: product.key,
    name: product.name,
    category: product.category,
    src: `assets/products/${product.key}.svg`,
  })), null, 2),
  "utf8",
);
console.log(`Generated ${selected.length} product illustrations in ${outputDir}`);
