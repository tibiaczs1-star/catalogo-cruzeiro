const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const OUT_DIR = path.join("assets", "pubpaid", "traffic", "pixel-vehicles-art-pass-v1");
const SOURCE_DIR = path.join("assets", "pubpaid", "traffic", "reference-sources");
const FRAME_W = 128;
const FRAME_H = 64;
const FRAMES_PER_DIR = 4;
const TOTAL_FRAMES = FRAMES_PER_DIR * 2;

const SOURCES = {
  car: path.join(SOURCE_DIR, "opengameart-chasersgaming-classiccar-cc0.png"),
  bike: path.join(SOURCE_DIR, "opengameart-chasersgaming-chopper-rider-cc0.png"),
};

const palettes = {
  taxi: ["#140f05", "#5d3c08", "#c57b10", "#f0b733", "#ffe28a"],
  black: ["#05070b", "#101826", "#25344a", "#5f7a9c", "#b8d6ef"],
  red: ["#160608", "#5f1017", "#a91c28", "#e0443e", "#ff9b6f"],
  teal: ["#061211", "#0b3b3d", "#167178", "#34b8bd", "#a8fff0"],
  blue: ["#050b18", "#102d64", "#185db8", "#45a4ff", "#b8ecff"],
  purple: ["#11081b", "#38125f", "#6727a9", "#a351f2", "#dec2ff"],
  orange: ["#150a04", "#63300a", "#a75113", "#f08122", "#ffd19a"],
  silver: ["#06090e", "#343943", "#747d8e", "#b8c0ca", "#f1f5fa"],
};

const wheelPhases = [
  { spokes: [[0, -5], [0, 5], [-5, 0], [5, 0]], glints: [[0, -5], [4, 2]] },
  { spokes: [[-4, -4], [4, 4], [-4, 4], [4, -4]], glints: [[4, -4], [2, 5]] },
  { spokes: [[-5, 0], [5, 0], [0, -5], [0, 5]], glints: [[5, 0], [-3, 4]] },
  { spokes: [[-4, 4], [4, -4], [-4, -4], [4, 4]], glints: [[3, 4], [-5, 1]] },
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function readPng(file) {
  return PNG.sync.read(fs.readFileSync(file));
}

function writePng(file, png) {
  fs.writeFileSync(file, PNG.sync.write(png));
}

function createPng(width, height) {
  return new PNG({ width, height });
}

function idx(png, x, y) {
  return (y * png.width + x) * 4;
}

function getPixel(png, x, y) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return [0, 0, 0, 0];
  const i = idx(png, x, y);
  return [png.data[i], png.data[i + 1], png.data[i + 2], png.data[i + 3]];
}

function setPixel(png, x, y, color, alpha = 255) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;
  const i = idx(png, x, y);
  png.data[i] = color[0];
  png.data[i + 1] = color[1];
  png.data[i + 2] = color[2];
  png.data[i + 3] = alpha;
}

function clonePng(src) {
  const out = createPng(src.width, src.height);
  src.data.copy(out.data);
  return out;
}

function trimAlpha(src, pad = 0) {
  let minX = src.width;
  let minY = src.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < src.height; y += 1) {
    for (let x = 0; x < src.width; x += 1) {
      if (getPixel(src, x, y)[3] > 0) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(src.width - 1, maxX + pad);
  maxY = Math.min(src.height - 1, maxY + pad);
  const out = createPng(maxX - minX + 1, maxY - minY + 1);
  blit(src, out, minX, minY, out.width, out.height, 0, 0);
  return out;
}

function resizeNearest(src, width, height) {
  const out = createPng(width, height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sx = Math.min(src.width - 1, Math.floor((x / width) * src.width));
      const sy = Math.min(src.height - 1, Math.floor((y / height) * src.height));
      const [r, g, b, a] = getPixel(src, sx, sy);
      setPixel(out, x, y, [r, g, b], a);
    }
  }
  return out;
}

function mirrorX(src) {
  const out = createPng(src.width, src.height);
  for (let y = 0; y < src.height; y += 1) {
    for (let x = 0; x < src.width; x += 1) {
      const [r, g, b, a] = getPixel(src, src.width - 1 - x, y);
      setPixel(out, x, y, [r, g, b], a);
    }
  }
  return out;
}

function blit(src, dst, sx, sy, sw, sh, dx, dy) {
  for (let y = 0; y < sh; y += 1) {
    for (let x = 0; x < sw; x += 1) {
      const [r, g, b, a] = getPixel(src, sx + x, sy + y);
      if (a > 0) setPixel(dst, dx + x, dy + y, [r, g, b], a);
    }
  }
}

function colorAt(palette, value) {
  const ramp = palette.map(hexToRgb);
  if (value < 42) return ramp[0];
  if (value < 78) return ramp[1];
  if (value < 118) return ramp[2];
  if (value < 168) return ramp[3];
  return ramp[4];
}

function recolorCarBase(src, paletteName) {
  const out = clonePng(src);
  const palette = palettes[paletteName];
  for (let y = 0; y < out.height; y += 1) {
    for (let x = 0; x < out.width; x += 1) {
      const [r, g, b, a] = getPixel(out, x, y);
      if (!a) continue;
      const luma = (r * 0.3 + g * 0.59 + b * 0.11);
      const isHardOutline = r < 6 && g < 10 && b < 14;
      const isBlueBody = b > r + 8 && b >= g + 4 && y < out.height - 6;
      const isDarkBody = r < 32 && g < 44 && b < 64 && y < out.height - 4;
      const isWindow = b > r + 12 && b > g + 8 && luma > 55 && y < out.height * 0.58;
      if (!isHardOutline && !isWindow && (isBlueBody || isDarkBody)) {
        setPixel(out, x, y, colorAt(palette, luma + 34), a);
      }
    }
  }
  return out;
}

function recolorBikeBase(src, paletteName, helmetName) {
  const out = clonePng(src);
  const bodyPalette = palettes[paletteName];
  const helmetPalette = palettes[helmetName] || palettes[paletteName];
  for (let y = 0; y < out.height; y += 1) {
    for (let x = 0; x < out.width; x += 1) {
      const [r, g, b, a] = getPixel(out, x, y);
      if (!a) continue;
      const luma = (r * 0.3 + g * 0.59 + b * 0.11);
      const saturated = Math.max(r, g, b) - Math.min(r, g, b);
      const blueOrRedPanel = saturated > 65 && Math.max(r, b) > g + 20;
      const helmetZone = x > out.width * 0.36 && x < out.width * 0.58 && y < out.height * 0.45;
      if (blueOrRedPanel) {
        setPixel(out, x, y, colorAt(helmetZone ? helmetPalette : bodyPalette, luma + 38), a);
      }
    }
  }
  return out;
}

function rect(png, x, y, w, h, color) {
  for (let yy = 0; yy < h; yy += 1) {
    for (let xx = 0; xx < w; xx += 1) setPixel(png, x + xx, y + yy, color);
  }
}

function drawDisc(png, cx, cy, radius, color, alpha = 255) {
  const rr = radius * radius;
  for (let y = cy - radius; y <= cy + radius; y += 1) {
    for (let x = cx - radius; x <= cx + radius; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= rr) setPixel(png, x, y, color, alpha);
    }
  }
}

function addTaxiDetails(base) {
  const black = hexToRgb("#111111");
  const yellow = hexToRgb("#ffd557");
  const pale = hexToRgb("#fff1a3");
  rect(base, 35, 0, 15, 1, black);
  rect(base, 34, 1, 17, 5, black);
  rect(base, 36, 2, 13, 3, yellow);
  rect(base, 38, 2, 9, 1, pale);
  for (let i = 0; i < 9; i += 1) {
    rect(base, 38 + i * 4, 19, 2, 2, i % 2 ? yellow : black);
  }
  rect(base, 75, 18, 4, 3, hexToRgb("#ffec9a"));
  rect(base, 1, 22, 4, 3, hexToRgb("#f5e6c0"));
}

function addPoliceDetails(base) {
  rect(base, 36, 1, 14, 4, hexToRgb("#101010"));
  rect(base, 38, 2, 4, 2, hexToRgb("#d4323d"));
  rect(base, 44, 2, 4, 2, hexToRgb("#3aa6ff"));
  rect(base, 30, 17, 19, 3, hexToRgb("#f7f7ff"));
  rect(base, 52, 17, 12, 3, hexToRgb("#1e2530"));
}

function addBikeRiderDetails(base, helmetName) {
  const helmet = palettes[helmetName] ? hexToRgb(palettes[helmetName][4]) : hexToRgb("#f2f2f2");
  const helmetDark = palettes[helmetName] ? hexToRgb(palettes[helmetName][1]) : hexToRgb("#2a2a2a");
  const visor = hexToRgb("#d7f7ff");
  const skin = hexToRgb("#d59a6b");
  const jacket = hexToRgb("#263445");
  const jacketHi = hexToRgb("#75899e");
  const glove = hexToRgb("#0a0b0d");
  rect(base, 23, 4, 8, 1, helmetDark);
  rect(base, 22, 5, 10, 5, helmet);
  rect(base, 24, 10, 7, 1, helmetDark);
  rect(base, 29, 6, 3, 2, visor);
  rect(base, 25, 11, 5, 2, skin);
  rect(base, 21, 13, 11, 6, jacket);
  rect(base, 23, 13, 7, 2, jacketHi);
  bresenham(base, 30, 14, 42, 15, jacketHi);
  bresenham(base, 40, 14, 44, 13, glove);
  bresenham(base, 24, 18, 33, 26, jacket);
  bresenham(base, 28, 18, 40, 24, jacketHi);
  rect(base, 33, 24, 4, 2, hexToRgb("#151a22"));
}

function addStreetShadow(frame, x, y, w, h) {
  const c1 = hexToRgb("#05070a");
  const c2 = hexToRgb("#111827");
  for (let xx = x; xx < x + w; xx += 1) {
    const edge = xx < x + 3 || xx > x + w - 4;
    setPixel(frame, xx, y, edge ? c1 : c2, edge ? 80 : 130);
    if (h > 1) setPixel(frame, xx, y + 1, c1, edge ? 35 : 70);
  }
}

function hardAlpha(png) {
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const i = idx(png, x, y);
      if (png.data[i + 3] > 0) png.data[i + 3] = 255;
    }
  }
  return png;
}

function fillInternalAlphaHoles(png, fallback = hexToRgb("#080c12")) {
  hardAlpha(png);
  let minX = png.width;
  let minY = png.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      if (getPixel(png, x, y)[3] > 0) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX < minX || maxY < minY) return png;

  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const exterior = new Uint8Array(width * height);
  const seen = new Uint8Array(width * height);
  const queue = [];

  const localIndex = (x, y) => y * width + x;
  const isTransparent = (x, y) => getPixel(png, minX + x, minY + y)[3] === 0;
  const enqueueExterior = (x, y) => {
    if (x >= 0 && y >= 0 && x < width && y < height && isTransparent(x, y)) queue.push([x, y]);
  };

  for (let x = 0; x < width; x += 1) {
    enqueueExterior(x, 0);
    enqueueExterior(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    enqueueExterior(0, y);
    enqueueExterior(width - 1, y);
  }

  while (queue.length) {
    const [x, y] = queue.shift();
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const li = localIndex(x, y);
    if (exterior[li] || !isTransparent(x, y)) continue;
    exterior[li] = 1;
    seen[li] = 1;
    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  const neighbors = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [-1, -1],
    [1, -1],
    [-1, 1],
  ];

  for (let sy = 0; sy < height; sy += 1) {
    for (let sx = 0; sx < width; sx += 1) {
      const startIndex = localIndex(sx, sy);
      if (seen[startIndex] || !isTransparent(sx, sy)) continue;

      const component = [];
      const colors = [];
      const componentQueue = [[sx, sy]];
      seen[startIndex] = 1;

      while (componentQueue.length) {
        const [x, y] = componentQueue.shift();
        component.push([x, y]);

        for (const [dx, dy] of neighbors) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const [r, g, b, a] = getPixel(png, minX + nx, minY + ny);
          if (a > 0) {
            colors.push([r, g, b]);
            continue;
          }

          const li = localIndex(nx, ny);
          if (seen[li] || exterior[li]) continue;
          seen[li] = 1;
          componentQueue.push([nx, ny]);
        }
      }

      const fill = colors.length
        ? [
            Math.round(colors.reduce((sum, color) => sum + color[0], 0) / colors.length),
            Math.round(colors.reduce((sum, color) => sum + color[1], 0) / colors.length),
            Math.round(colors.reduce((sum, color) => sum + color[2], 0) / colors.length),
          ]
        : fallback;

      component.forEach(([x, y]) => setPixel(png, minX + x, minY + y, fill, 255));
    }
  }

  return hardAlpha(png);
}

function drawWheelWell(png, cx, cy, radius) {
  const well = hexToRgb("#030407");
  const lip = hexToRgb("#121824");
  drawDisc(png, cx, cy, radius + 2, well);
  for (let x = cx - radius - 3; x <= cx + radius + 3; x += 1) {
    const d = Math.abs(x - cx) / (radius + 3);
    const y = cy - Math.round(Math.sqrt(Math.max(0, 1 - d * d)) * (radius - 1));
    setPixel(png, x, y, lip);
  }
}

function bresenham(png, x0, y0, x1, y1, color) {
  let dx = Math.abs(x1 - x0);
  let sx = x0 < x1 ? 1 : -1;
  let dy = -Math.abs(y1 - y0);
  let sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  while (true) {
    setPixel(png, x0, y0, color);
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

function drawWheel(png, cx, cy, radius, phase) {
  const tire = hexToRgb("#050608");
  const tireHi = hexToRgb("#252b34");
  const rim = hexToRgb("#9aa5b5");
  const rimDark = hexToRgb("#4e5868");
  const hub = hexToRgb("#d9e0e8");
  const hot = hexToRgb("#eef6ff");
  for (let y = cy - radius - 1; y <= cy + radius + 1; y += 1) {
    for (let x = cx - radius - 1; x <= cx + radius + 1; x += 1) {
      const d = Math.hypot(x - cx, y - cy);
      if (d <= radius + 0.2) {
        if (d > radius - 1.6) setPixel(png, x, y, tire);
        else if (d > radius - 3.0) setPixel(png, x, y, tireHi);
        else if (d > radius - 4.2) setPixel(png, x, y, rimDark);
        else setPixel(png, x, y, tire);
      }
    }
  }
  const wheelPhase = wheelPhases[phase % wheelPhases.length];
  for (const [ex, ey] of wheelPhase.spokes) {
    bresenham(png, cx, cy, cx + Math.round(ex * radius / 8), cy + Math.round(ey * radius / 8), rim);
  }
  for (const [dx, dy] of wheelPhase.glints) {
    const px = cx + Math.round(dx * radius / 9);
    const py = cy + Math.round(dy * radius / 9);
    setPixel(png, px, py, hot);
    setPixel(png, px + Math.sign(dx || 1), py, rim);
  }
  rect(png, cx - 1, cy - 1, 3, 3, hub);
  setPixel(png, cx, cy, rimDark);
}

function addCarPixelDetails(framePng, x, y, paletteName) {
  const palette = palettes[paletteName].map(hexToRgb);
  const ink = hexToRgb("#030407");
  const glass = hexToRgb("#bce8f6");
  const glassDark = hexToRgb("#4b6b7a");
  const chrome = hexToRgb("#dbe5ec");
  rect(framePng, x + 10, y + 10, 42, 2, palette[3]);
  rect(framePng, x + 18, y + 7, 22, 1, glass);
  rect(framePng, x + 41, y + 8, 11, 1, glassDark);
  rect(framePng, x + 53, y + 14, 10, 2, palette[4]);
  rect(framePng, x + 65, y + 18, 12, 2, palette[2]);
  rect(framePng, x + 5, y + 21, 8, 2, chrome);
  rect(framePng, x + 79, y + 20, 4, 2, hexToRgb("#ff5d6a"));
  rect(framePng, x + 21, y + 25, 45, 2, ink);
  bresenham(framePng, x + 12, y + 16, x + 29, y + 16, palette[3]);
  bresenham(framePng, x + 47, y + 16, x + 69, y + 16, palette[1]);
}

function addBikePixelDetails(framePng, x, y, paletteName) {
  const palette = palettes[paletteName].map(hexToRgb);
  rect(framePng, x + 12, y + 25, 35, 2, hexToRgb("#050608"));
  rect(framePng, x + 27, y + 11, 4, 2, palette[4]);
  rect(framePng, x + 32, y + 20, 14, 2, palette[3]);
  bresenham(framePng, x + 18, y + 26, x + 35, y + 15, palette[2]);
  bresenham(framePng, x + 35, y + 15, x + 50, y + 26, palette[1]);
}

function makeVehicleStrip(spec, base) {
  const strip = createPng(FRAME_W * TOTAL_FRAMES, FRAME_H);
  const right = clonePng(base);
  const left = mirrorX(base);
  const placements = {
    car: { x: Math.floor((FRAME_W - base.width) / 2), y: 20, shadowW: base.width - 8, wheels: [[19, 22, 6], [70, 22, 6]] },
    bike: { x: Math.floor((FRAME_W - base.width) / 2), y: 24, shadowW: base.width - 8, wheels: [[12, 28, 6], [50, 27, 6]] },
  };
  const place = placements[spec.type];
  for (let frame = 0; frame < TOTAL_FRAMES; frame += 1) {
    const phase = frame % FRAMES_PER_DIR;
    const facingLeft = frame >= FRAMES_PER_DIR;
    const framePng = createPng(FRAME_W, FRAME_H);
    blit(facingLeft ? left : right, framePng, 0, 0, base.width, base.height, place.x, place.y);
    if (spec.type === "car") addCarPixelDetails(framePng, place.x, place.y, spec.palette);
    if (spec.type === "bike") addBikePixelDetails(framePng, place.x, place.y, spec.palette);
    for (const [wx, wy, radius] of place.wheels) {
      const realX = facingLeft ? FRAME_W - 1 - (place.x + wx) : place.x + wx;
      drawWheelWell(framePng, realX, place.y + wy, radius + 1);
      const wheelPhase = facingLeft ? (FRAMES_PER_DIR - phase) % FRAMES_PER_DIR : phase;
      drawWheel(framePng, realX, place.y + wy, radius, wheelPhase);
    }
    fillInternalAlphaHoles(framePng);
    blit(framePng, strip, 0, 0, FRAME_W, FRAME_H, frame * FRAME_W, 0);
  }
  return hardAlpha(strip);
}

function drawPreviewLabelDot(png, x, y, color) {
  rect(png, x, y, 6, 6, color);
  rect(png, x + 8, y + 2, 30, 2, color);
}

function makePreview(strips, specs) {
  const scale = 3;
  const gap = 12;
  const labelH = 18;
  const rowH = FRAME_H * scale + labelH + gap;
  const out = createPng(FRAME_W * 4 * scale + gap * 2, strips.length * rowH + gap);
  for (let y = 0; y < out.height; y += 1) {
    for (let x = 0; x < out.width; x += 1) setPixel(out, x, y, hexToRgb("#07101c"), 255);
  }
  strips.forEach((strip, row) => {
    const top = gap + row * rowH;
    drawPreviewLabelDot(out, gap, top, hexToRgb(specs[row].swatch));
    for (let f = 0; f < 4; f += 1) {
      for (let sy = 0; sy < FRAME_H; sy += 1) {
        for (let sx = 0; sx < FRAME_W; sx += 1) {
          const [r, g, b, a] = getPixel(strip, f * FRAME_W + sx, sy);
          if (!a) continue;
          for (let yy = 0; yy < scale; yy += 1) {
            for (let xx = 0; xx < scale; xx += 1) {
              setPixel(out, gap + f * FRAME_W * scale + sx * scale + xx, top + labelH + sy * scale + yy, [r, g, b], a);
            }
          }
        }
      }
    }
  });
  return out;
}

function saveJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function main() {
  ensureDir(OUT_DIR);

  const rawCar = trimAlpha(readPng(SOURCES.car), 0);
  const rawBike = readPng(SOURCES.bike);
  const carBase = resizeNearest(rawCar, 85, 27);
  const bikeBase = resizeNearest(rawBike, 59, 34);

  const specs = [
    { id: "taxi-yellow", label: "Taxi amarelo", type: "car", palette: "taxi", details: "taxi", swatch: "#f0b733" },
    { id: "black-sedan", label: "Sedan preto", type: "car", palette: "black", swatch: "#5f7a9c" },
    { id: "red-coupe", label: "Coupe vermelho", type: "car", palette: "red", swatch: "#e0443e" },
    { id: "teal-compact", label: "Compacto teal", type: "car", palette: "teal", swatch: "#34b8bd" },
    { id: "blue-police", label: "Carro azul com giroflex", type: "car", palette: "blue", details: "police", swatch: "#45a4ff" },
    { id: "orange-chopper-rider", label: "Chopper laranja com piloto", type: "bike", palette: "orange", helmet: "black", swatch: "#f08122" },
    { id: "red-sport-rider", label: "Moto sport vermelha com piloto", type: "bike", palette: "red", helmet: "silver", swatch: "#e0443e" },
    { id: "purple-rider", label: "Moto roxa com piloto", type: "bike", palette: "purple", helmet: "purple", swatch: "#a351f2" },
    { id: "delivery-blue-rider", label: "Moto delivery azul com piloto", type: "bike", palette: "blue", helmet: "orange", swatch: "#45a4ff" },
  ];

  const strips = [];
  const manifest = {
    version: "pixel-vehicles-art-pass-v1",
    sourceNote: "Sprites derivados de referencias CC0 do OpenGameArt por Chasersgaming; usados para estudo/base legal, recoloridos e animados para avaliacao PubPaid. Nao integrado no runtime.",
    frameWidth: FRAME_W,
    frameHeight: FRAME_H,
    framesPerDirection: FRAMES_PER_DIR,
    totalFramesPerVehicle: TOTAL_FRAMES,
    directions: {
      right: [0, 1, 2, 3],
      left: [4, 5, 6, 7],
    },
    styleContract: [
      "2D pixel art game asset",
      "sprite sheet",
      "retro 16-bit and 32-bit game style",
      "32x32 / 64x64 pixel art vocabulary",
      "no blur, no smoothing",
      "limited color palette",
      "2-4 tones per color",
      "transparent background",
      "external background alpha 0 only",
      "vehicle pixels alpha 255 only",
      "no alpha holes inside body, wheels, windows, rider, or interior",
      "no smooth gradients",
      "no 3D look",
    ],
    sources: [
      {
        title: "2D car sprite",
        author: "Chasersgaming",
        url: "https://opengameart.org/content/2d-car-sprite-2",
        license: "CC0",
        localFile: SOURCES.car,
      },
      {
        title: "2D Bike Sprite",
        author: "Chasersgaming",
        url: "https://opengameart.org/content/2d-bike-sprite-1",
        license: "CC0",
        localFile: SOURCES.bike,
      },
    ],
    vehicles: [],
  };

  for (const spec of specs) {
    let base;
    if (spec.type === "car") {
      base = recolorCarBase(carBase, spec.palette);
      if (spec.details === "taxi") addTaxiDetails(base);
      if (spec.details === "police") addPoliceDetails(base);
    } else {
      base = recolorBikeBase(bikeBase, spec.palette, spec.helmet);
      addBikeRiderDetails(base, spec.helmet);
    }
    const strip = makeVehicleStrip(spec, base);
    const file = path.join(OUT_DIR, `${spec.id}-8f.png`);
    writePng(file, strip);
    strips.push(strip);
    manifest.vehicles.push({
      id: spec.id,
      label: spec.label,
      type: spec.type,
      frames: TOTAL_FRAMES,
      sheet: file.replaceAll("\\", "/"),
    });
  }

  const atlas = createPng(FRAME_W * TOTAL_FRAMES, FRAME_H * strips.length);
  strips.forEach((strip, row) => blit(strip, atlas, 0, 0, strip.width, strip.height, 0, row * FRAME_H));
  hardAlpha(atlas);
  writePng(path.join("assets", "pubpaid", "traffic", "pubpaid-pixel-vehicles-art-pass-8f-v1.png"), atlas);
  writePng(path.join("assets", "pubpaid", "traffic", "pubpaid-pixel-vehicles-art-pass-8f-v1-preview.png"), makePreview(strips, specs));
  saveJson(path.join("assets", "pubpaid", "traffic", "pubpaid-pixel-vehicles-art-pass-8f-v1.json"), manifest);

  console.log(`created ${strips.length} vehicles, ${TOTAL_FRAMES} frames each`);
}

main();
