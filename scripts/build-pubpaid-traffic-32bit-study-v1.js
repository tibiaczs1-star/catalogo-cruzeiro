const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const OUT_DIR = path.join("assets", "pubpaid", "traffic", "hibi-vehicles-study-v1");
const FRAME_W = 128;
const FRAME_H = 64;
const FRAMES_PER_DIR = 4;
const TOTAL_FRAMES = 8;

const palettes = {
  taxi: {
    ink: "#040509",
    outline: "#101014",
    dark: "#5b3908",
    mid: "#b46b0d",
    body: "#e8a81d",
    light: "#ffe48a",
    neon: "#66f3ff",
    glass: "#b7eff8",
    glassDark: "#49727c",
    red: "#ff4e62"
  },
  bike: {
    ink: "#040509",
    outline: "#101014",
    dark: "#251018",
    mid: "#6f1624",
    body: "#d62b36",
    light: "#ff8b72",
    neon: "#5de8ff",
    metal: "#aeb8c4",
    metalDark: "#4d5664",
    skin: "#c88a63",
    visor: "#d8fbff"
  }
};

const wheelPhases = [
  { spokes: [[0, -5], [5, 0], [0, 5], [-5, 0]], glints: [[0, -5], [4, 2]] },
  { spokes: [[4, -4], [4, 4], [-4, 4], [-4, -4]], glints: [[4, -3], [1, 5]] },
  { spokes: [[5, 0], [0, 5], [-5, 0], [0, -5]], glints: [[5, 0], [-3, 4]] },
  { spokes: [[4, 4], [-4, 4], [-4, -4], [4, -4]], glints: [[3, 4], [-5, 1]] }
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function png(width, height) {
  return new PNG({ width, height });
}

function rgb(hex) {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16)
  ];
}

function idx(img, x, y) {
  return (y * img.width + x) * 4;
}

function set(img, x, y, color, alpha = 255) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
  const i = idx(img, x, y);
  img.data[i] = color[0];
  img.data[i + 1] = color[1];
  img.data[i + 2] = color[2];
  img.data[i + 3] = alpha;
}

function get(img, x, y) {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return [0, 0, 0, 0];
  const i = idx(img, x, y);
  return [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]];
}

function rect(img, x, y, w, h, color, alpha = 255) {
  for (let yy = 0; yy < h; yy += 1) {
    for (let xx = 0; xx < w; xx += 1) set(img, x + xx, y + yy, color, alpha);
  }
}

function line(img, x0, y0, x1, y1, color, width = 1) {
  x0 = Math.round(x0);
  y0 = Math.round(y0);
  x1 = Math.round(x1);
  y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  while (true) {
    rect(img, x0 - Math.floor(width / 2), y0 - Math.floor(width / 2), width, width, color);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
}

function poly(img, points, color) {
  const minY = Math.floor(Math.min(...points.map((p) => p[1])));
  const maxY = Math.ceil(Math.max(...points.map((p) => p[1])));
  for (let y = minY; y <= maxY; y += 1) {
    const nodes = [];
    for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
      const [xi, yi] = points[i];
      const [xj, yj] = points[j];
      if ((yi < y && yj >= y) || (yj < y && yi >= y)) {
        nodes.push(Math.round(xi + ((y - yi) / (yj - yi)) * (xj - xi)));
      }
    }
    nodes.sort((a, b) => a - b);
    for (let k = 0; k < nodes.length; k += 2) {
      if (nodes[k + 1] === undefined) break;
      for (let x = nodes[k]; x <= nodes[k + 1]; x += 1) set(img, x, y, color);
    }
  }
}

function disc(img, cx, cy, radius, color, alpha = 255) {
  const rr = radius * radius;
  for (let y = cy - radius; y <= cy + radius; y += 1) {
    for (let x = cx - radius; x <= cx + radius; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= rr) set(img, x, y, color, alpha);
    }
  }
}

function blit(src, dst, dx, dy) {
  for (let y = 0; y < src.height; y += 1) {
    for (let x = 0; x < src.width; x += 1) {
      const [r, g, b, a] = get(src, x, y);
      if (a) set(dst, dx + x, dy + y, [r, g, b], a);
    }
  }
}

function mirror(src) {
  const out = png(src.width, src.height);
  for (let y = 0; y < src.height; y += 1) {
    for (let x = 0; x < src.width; x += 1) {
      const [r, g, b, a] = get(src, src.width - 1 - x, y);
      if (a) set(out, x, y, [r, g, b], a);
    }
  }
  return out;
}

function drawWheelWell(img, cx, cy, radius, p) {
  disc(img, cx, cy, radius + 3, rgb(p.ink));
  for (let x = cx - radius - 4; x <= cx + radius + 4; x += 1) {
    const d = Math.abs(x - cx) / (radius + 4);
    const y = cy - Math.round(Math.sqrt(Math.max(0, 1 - d * d)) * (radius + 1));
    set(img, x, y, rgb(p.outline));
  }
}

function drawWheel(img, cx, cy, radius, phase, p) {
  const tire = rgb("#050609");
  const tireHi = rgb("#202735");
  const rimDark = rgb("#4d5867");
  const rim = rgb("#aeb8c4");
  const hub = rgb("#eef3f5");
  disc(img, cx, cy, radius + 1, tire);
  disc(img, cx, cy, radius - 2, tireHi);
  disc(img, cx, cy, radius - 4, rgb("#111722"));
  const wheelPhase = wheelPhases[phase % wheelPhases.length];
  wheelPhase.spokes.forEach(([dx, dy]) => {
    line(img, cx, cy, cx + Math.round(dx * radius / 8), cy + Math.round(dy * radius / 8), rim, 1);
  });
  wheelPhase.glints.forEach(([dx, dy]) => {
    set(img, cx + Math.round(dx * radius / 9), cy + Math.round(dy * radius / 9), hub);
  });
  rect(img, cx - 1, cy - 1, 3, 3, hub);
  set(img, cx, cy, rimDark);
}

function drawContactShadow(img, x, y, w) {
  rect(img, x, y, w, 2, rgb("#03050a"), 115);
  rect(img, x + 10, y + 2, w - 20, 1, rgb("#101a24"), 80);
}

function drawTaxiFrame(phase = 0) {
  const p = palettes.taxi;
  const img = png(FRAME_W, FRAME_H);
  const x = 12;
  const y = 14;
  drawContactShadow(img, x + 6, y + 38, 94);

  poly(img, [[16, 35], [24, 25], [49, 17], [82, 18], [104, 29], [112, 39], [103, 43], [27, 43]], rgb(p.ink));
  poly(img, [[18, 34], [27, 27], [49, 20], [79, 21], [100, 30], [107, 38], [101, 40], [28, 40]], rgb(p.dark));
  poly(img, [[23, 33], [32, 27], [51, 22], [76, 23], [94, 31], [99, 36], [91, 37], [31, 37]], rgb(p.body));
  rect(img, x + 12, y + 22, 70, 10, rgb(p.mid));
  rect(img, x + 23, y + 16, 45, 9, rgb(p.body));
  poly(img, [[43, 20], [53, 10], [76, 11], [91, 22]], rgb(p.ink));
  poly(img, [[47, 20], [56, 13], [73, 14], [84, 22]], rgb(p.glassDark));
  rect(img, 58, 15, 13, 5, rgb(p.glass));
  rect(img, 75, 16, 9, 5, rgb(p.glass));
  rect(img, 54, 11, 25, 3, rgb(p.ink));
  rect(img, 57, 12, 18, 2, rgb(p.light));
  rect(img, 39, 29, 18, 2, rgb(p.light));
  rect(img, 61, 29, 18, 2, rgb(p.dark));
  rect(img, 83, 30, 14, 2, rgb(p.light));
  rect(img, 31, 36, 24, 2, rgb(p.ink));
  rect(img, 60, 36, 36, 2, rgb(p.ink));
  rect(img, 19, 34, 7, 4, rgb("#fff1b1"));
  rect(img, 105, 35, 4, 4, rgb(p.red));
  rect(img, 88, 25, 2, 8, rgb(p.outline));
  rect(img, 54, 24, 2, 13, rgb(p.outline));
  rect(img, 50, 25, 4, 2, rgb(p.neon));
  rect(img, 72, 34, 24, 1, rgb(p.neon));
  rect(img, 29, 31, 16, 1, rgb("#fff4bd"));
  rect(img, 23, 22, 18, 2, rgb(p.mid));

  drawWheelWell(img, 35, 40, 8, p);
  drawWheelWell(img, 91, 40, 8, p);
  drawWheel(img, 35, 40, 7, phase, p);
  drawWheel(img, 91, 40, 7, phase, p);
  return img;
}

function drawBikeFrame(phase = 0) {
  const p = palettes.bike;
  const img = png(FRAME_W, FRAME_H);
  const x = 26;
  const y = 18;
  drawContactShadow(img, x + 2, y + 34, 74);

  line(img, 35, 49, 58, 32, rgb(p.metalDark), 2);
  line(img, 58, 32, 86, 47, rgb(p.metalDark), 2);
  line(img, 42, 49, 92, 48, rgb(p.ink), 2);
  poly(img, [[52, 30], [60, 20], [76, 18], [87, 25], [83, 31]], rgb(p.ink));
  poly(img, [[55, 28], [62, 21], [75, 20], [83, 25], [79, 29]], rgb(p.body));
  rect(img, 61, 21, 13, 2, rgb(p.light));
  rect(img, 75, 26, 18, 3, rgb(p.metal));
  line(img, 87, 24, 94, 47, rgb(p.metal), 2);
  line(img, 88, 24, 101, 24, rgb(p.metalDark), 1);
  line(img, 96, 23, 103, 20, rgb(p.metal), 1);
  rect(img, 86, 31, 17, 2, rgb(p.metalDark));
  rect(img, 100, 29, 6, 2, rgb(p.red || "#ff4e62"));

  poly(img, [[54, 19], [61, 8], [68, 10], [63, 22]], rgb(p.ink));
  poly(img, [[56, 18], [62, 9], [67, 11], [63, 20]], rgb("#191d25"));
  rect(img, 62, 6, 8, 6, rgb(p.body));
  rect(img, 64, 7, 6, 2, rgb(p.visor));
  rect(img, 62, 12, 4, 3, rgb(p.skin));
  line(img, 63, 20, 93, 24, rgb("#151922"), 2);
  line(img, 60, 21, 51, 34, rgb("#151922"), 2);
  line(img, 64, 22, 72, 33, rgb("#38404c"), 1);
  rect(img, 91, 23, 3, 2, rgb("#050609"));
  rect(img, 52, 20, 4, 2, rgb(p.light));

  drawWheelWell(img, 34, 49, 8, p);
  drawWheelWell(img, 91, 48, 8, p);
  drawWheel(img, 34, 49, 7, phase, p);
  drawWheel(img, 91, 48, 7, phase, p);
  return img;
}

function makeStrip(drawFn) {
  const strip = png(FRAME_W * TOTAL_FRAMES, FRAME_H);
  const rightFrames = [];
  for (let f = 0; f < FRAMES_PER_DIR; f += 1) rightFrames.push(drawFn(f));
  const leftFrames = rightFrames.map(mirror);
  [...rightFrames, ...leftFrames].forEach((frame, index) => blit(frame, strip, index * FRAME_W, 0));
  return strip;
}

function makePreview(items) {
  const scale = 4;
  const gap = 16;
  const labelH = 10;
  const out = png(FRAME_W * 4 * scale + gap * 2, items.length * (FRAME_H * scale + labelH + gap) + gap);
  rect(out, 0, 0, out.width, out.height, rgb("#07101c"));
  items.forEach(({ strip }, row) => {
    const top = gap + row * (FRAME_H * scale + labelH + gap) + labelH;
    for (let f = 0; f < FRAMES_PER_DIR; f += 1) {
      for (let sy = 0; sy < FRAME_H; sy += 1) {
        for (let sx = 0; sx < FRAME_W; sx += 1) {
          const [r, g, b, a] = get(strip, f * FRAME_W + sx, sy);
          if (!a) continue;
          for (let yy = 0; yy < scale; yy += 1) {
            for (let xx = 0; xx < scale; xx += 1) {
              set(out, gap + f * FRAME_W * scale + sx * scale + xx, top + sy * scale + yy, [r, g, b], a);
            }
          }
        }
      }
    }
  });
  return out;
}

function write(file, image) {
  fs.writeFileSync(file, PNG.sync.write(image));
}

function main() {
  ensureDir(OUT_DIR);
  const car = makeStrip(drawTaxiFrame);
  const bike = makeStrip(drawBikeFrame);
  const items = [
    { id: "taxi-32bit-study", label: "Taxi 32-bit study", type: "car", strip: car },
    { id: "moto-rider-32bit-study", label: "Moto com piloto 32-bit study", type: "bike", strip: bike }
  ];

  items.forEach((item) => write(path.join(OUT_DIR, `${item.id}-8f.png`), item.strip));
  const atlas = png(FRAME_W * TOTAL_FRAMES, FRAME_H * items.length);
  items.forEach((item, index) => blit(item.strip, atlas, 0, index * FRAME_H));
  write(path.join("assets", "pubpaid", "traffic", "pubpaid-traffic-32bit-study-8f-v1.png"), atlas);
  write(path.join("assets", "pubpaid", "traffic", "pubpaid-traffic-32bit-study-8f-v1-preview.png"), makePreview(items));
  fs.writeFileSync(
    path.join("assets", "pubpaid", "traffic", "pubpaid-traffic-32bit-study-8f-v1.json"),
    `${JSON.stringify({
      version: "pubpaid-traffic-32bit-study-v1",
      prompt: "PROMPT_PUBPAID_VEICULOS_32BIT_HIBIT_2026-04-28.md",
      status: "study-only-not-runtime",
      frameWidth: FRAME_W,
      frameHeight: FRAME_H,
      framesPerDirection: FRAMES_PER_DIR,
      totalFramesPerVehicle: TOTAL_FRAMES,
      vehicles: items.map((item) => ({
        id: item.id,
        label: item.label,
        type: item.type,
        frames: TOTAL_FRAMES,
        sheet: `assets/pubpaid/traffic/hibi-vehicles-study-v1/${item.id}-8f.png`
      }))
    }, null, 2)}\n`
  );
  console.log("created PubPaid 32-bit study v1");
}

main();
