const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "assets", "pubpaid", "traffic");
const SHEET_DIR = path.join(OUT_DIR, "painted-v1");

const BASE_W = 192;
const BASE_H = 128;
const SCALE = 3;
const FRAME_W = BASE_W * SCALE;
const FRAME_H = BASE_H * SCALE;
const DIR_FRAMES = 4;
const TOTAL_FRAMES = 8;

const PALETTE = {
  ink: "#05070c",
  ink2: "#111721",
  shadow: "#00000066",
  white: "#f5f0db",
  chrome: "#c7d0d6",
  chrome2: "#7c8992",
  glass: "#9dbcc5",
  glassBright: "#e4f1ec",
  tire: "#08090e",
  tire2: "#1b2330",
  asphaltGlow: "#56eaff"
};

const vehicles = [
  {
    id: "taxi-32bit-painted-v1",
    label: "Taxi 32-bit lateral",
    kind: "car",
    draw: drawTaxi,
    speed: 3.1,
    scale: 0.72,
    hitbox: { width: 338, height: 94 }
  },
  {
    id: "black-sedan-painted-v1",
    label: "Sedan preto pixel",
    kind: "car",
    draw: drawBlackSedan,
    speed: 3.25,
    scale: 0.74,
    hitbox: { width: 346, height: 96 }
  },
  {
    id: "red-coupe-painted-v1",
    label: "Coupe vermelho neon",
    kind: "car",
    draw: drawRedCoupe,
    speed: 3.6,
    scale: 0.72,
    hitbox: { width: 340, height: 98 }
  },
  {
    id: "green-pickup-painted-v1",
    label: "Pickup verde urbana",
    kind: "car",
    draw: drawGreenPickup,
    speed: 3.05,
    scale: 0.75,
    hitbox: { width: 350, height: 96 }
  },
  {
    id: "orange-chopper-rider-painted-v1",
    label: "Chopper laranja com piloto",
    kind: "moto",
    draw: drawOrangeChopper,
    speed: 3.85,
    scale: 0.74,
    hitbox: { width: 246, height: 128 }
  },
  {
    id: "red-sport-rider-painted-v1",
    label: "Moto sport vermelha",
    kind: "moto",
    draw: drawRedSport,
    speed: 4.55,
    scale: 0.72,
    hitbox: { width: 252, height: 126 }
  },
  {
    id: "silver-cruiser-rider-painted-v1",
    label: "Cruiser prata com piloto",
    kind: "moto",
    draw: drawSilverCruiser,
    speed: 3.7,
    scale: 0.74,
    hitbox: { width: 260, height: 126 }
  },
  {
    id: "delivery-bike-rider-painted-v1",
    label: "Moto delivery pixel",
    kind: "moto",
    draw: drawDeliveryBike,
    speed: 3.8,
    scale: 0.72,
    hitbox: { width: 264, height: 132 }
  }
];

class Bitmap {
  constructor(width, height, offsetX = 0, offsetY = 0) {
    this.width = width;
    this.height = height;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.data = new Uint8ClampedArray(width * height * 4);
  }

  set(x, y, color) {
    const px = Math.round(x + this.offsetX);
    const py = Math.round(y + this.offsetY);
    if (px < 0 || py < 0 || px >= this.width || py >= this.height) return;
    const [r, g, b, a = 255] = color;
    const i = (py * this.width + px) * 4;
    if (a === 255 || this.data[i + 3] === 0) {
      this.data[i] = r;
      this.data[i + 1] = g;
      this.data[i + 2] = b;
      this.data[i + 3] = a;
      return;
    }
    const na = a / 255;
    const oa = this.data[i + 3] / 255;
    const outA = na + oa * (1 - na);
    this.data[i] = Math.round((r * na + this.data[i] * oa * (1 - na)) / outA);
    this.data[i + 1] = Math.round((g * na + this.data[i + 1] * oa * (1 - na)) / outA);
    this.data[i + 2] = Math.round((b * na + this.data[i + 2] * oa * (1 - na)) / outA);
    this.data[i + 3] = Math.round(outA * 255);
  }

  copy(src, dx, dy) {
    for (let y = 0; y < src.height; y += 1) {
      for (let x = 0; x < src.width; x += 1) {
        const i = (y * src.width + x) * 4;
        if (!src.data[i + 3]) continue;
        this.set(dx + x, dy + y, [
          src.data[i],
          src.data[i + 1],
          src.data[i + 2],
          src.data[i + 3]
        ]);
      }
    }
  }
}

function c(hex, alpha) {
  if (hex.endsWith("66")) {
    return c(hex.slice(0, 7), 102);
  }
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
    alpha ?? 255
  ];
}

function rect(img, x, y, w, h, color) {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) img.set(xx, yy, color);
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
  let x = x0;
  let y = y0;
  while (true) {
    rect(img, x - Math.floor(width / 2), y - Math.floor(width / 2), width, width, color);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

function polygon(img, points, color) {
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
      for (let x = nodes[k]; x <= nodes[k + 1]; x += 1) img.set(x, y, color);
    }
  }
}

function strokePoly(img, points, color, width = 3) {
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    line(img, point[0], point[1], next[0], next[1], color, width);
  });
}

function drawCircle(img, cx, cy, radius, color) {
  const rr = radius * radius;
  for (let y = cy - radius; y <= cy + radius; y += 1) {
    for (let x = cx - radius; x <= cx + radius; x += 1) {
      const d = (x - cx) * (x - cx) + (y - cy) * (y - cy);
      if (d <= rr) img.set(x, y, color);
    }
  }
}

function drawRing(img, cx, cy, outer, inner, color) {
  const oo = outer * outer;
  const ii = inner * inner;
  for (let y = cy - outer; y <= cy + outer; y += 1) {
    for (let x = cx - outer; x <= cx + outer; x += 1) {
      const d = (x - cx) * (x - cx) + (y - cy) * (y - cy);
      if (d <= oo && d >= ii) img.set(x, y, color);
    }
  }
}

function drawWheel(img, cx, cy, frame, size = 12, neon = c("#56eaff")) {
  drawCircle(img, cx + 1, cy + 2, size + 3, c("#000000", 95));
  drawCircle(img, cx, cy, size + 2, c(PALETTE.ink));
  drawRing(img, cx, cy, size, size - 4, c(PALETTE.tire));
  drawRing(img, cx, cy, size - 4, size - 7, c(PALETTE.chrome2));
  drawCircle(img, cx, cy, size - 8, c(PALETTE.ink2));
  drawCircle(img, cx, cy, Math.max(2, size - 11), c(PALETTE.chrome));
  const spokes = [
    [[-8, 0, 8, 0], [0, -8, 0, 8], [-6, -6, 6, 6], [-6, 6, 6, -6]],
    [[-8, -3, 8, 3], [3, -8, -3, 8], [-8, 4, 8, -4], [4, 8, -4, -8]],
    [[-8, -1, 8, 1], [1, -8, -1, 8], [-5, -7, 5, 7], [-7, 5, 7, -5]],
    [[-8, 3, 8, -3], [-3, -8, 3, 8], [-8, -4, 8, 4], [4, -8, -4, 8]]
  ];
  spokes[frame % DIR_FRAMES].forEach(([x1, y1, x2, y2], index) => {
    line(img, cx + x1, cy + y1, cx + x2, cy + y2, index % 2 ? c(PALETTE.chrome) : c("#eef5f2"), 2);
  });
  rect(img, cx - size + 1, cy + size - 1, size * 2 - 2, 1, neon);
}

function drawShadow(img, x, y, w) {
  rect(img, x + 8, y, w - 16, 2, c("#000000", 80));
  for (let i = 0; i < w; i += 5) rect(img, x + i, y - 1, 3, 1, c("#000000", 55));
}

function mirrorBitmap(src) {
  const out = new Bitmap(src.width, src.height);
  for (let y = 0; y < src.height; y += 1) {
    for (let x = 0; x < src.width; x += 1) {
      const i = (y * src.width + x) * 4;
      if (!src.data[i + 3]) continue;
      out.set(src.width - 1 - x, y, [src.data[i], src.data[i + 1], src.data[i + 2], src.data[i + 3]]);
    }
  }
  return out;
}

function scaleBitmap(src) {
  const out = new Bitmap(src.width * SCALE, src.height * SCALE);
  for (let y = 0; y < src.height; y += 1) {
    for (let x = 0; x < src.width; x += 1) {
      const i = (y * src.width + x) * 4;
      if (!src.data[i + 3]) continue;
      const color = [src.data[i], src.data[i + 1], src.data[i + 2], src.data[i + 3]];
      rect(out, x * SCALE, y * SCALE, SCALE, SCALE, color);
    }
  }
  return out;
}

function drawCarBase(img, cfg, frame) {
  const body = c(cfg.body);
  const body2 = c(cfg.body2);
  const dark = c(cfg.dark);
  const shade = c(cfg.shade);
  const glass = c(cfg.glass);
  const glass2 = c(cfg.glass2);
  const lamp = c(cfg.lamp);
  const tail = c(cfg.tail);
  const neon = c(cfg.neon);
  const y = cfg.y + (frame % 2);

  drawShadow(img, cfg.x + 6, y + 33, cfg.w - 6);
  drawWheel(img, cfg.x + cfg.wa, y + 22, frame, cfg.r, neon);
  drawWheel(img, cfg.x + cfg.wb, y + 22, (frame + 2) % DIR_FRAMES, cfg.r, neon);

  const outline = [
    [cfg.x, y + 2], [cfg.x + 12, y - 9], [cfg.x + cfg.hood, y - 14],
    [cfg.x + cfg.hood + 17, y - 38], [cfg.x + cfg.w - cfg.trunk, y - 38],
    [cfg.x + cfg.w - 10, y - 16], [cfg.x + cfg.w, y - 8],
    [cfg.x + cfg.w - 2, y + 17], [cfg.x + cfg.w - 12, y + 25],
    [cfg.x + 10, y + 25], [cfg.x - 2, y + 17]
  ];
  polygon(img, outline, c(PALETTE.ink));
  strokePoly(img, outline, c(PALETTE.ink), 4);
  polygon(img, [
    [cfg.x + 4, y + 3], [cfg.x + 16, y - 7], [cfg.x + cfg.hood + 3, y - 11],
    [cfg.x + cfg.hood + 18, y - 31], [cfg.x + cfg.w - cfg.trunk - 3, y - 31],
    [cfg.x + cfg.w - 13, y - 13], [cfg.x + cfg.w - 4, y - 6],
    [cfg.x + cfg.w - 7, y + 13], [cfg.x + cfg.w - 18, y + 18],
    [cfg.x + 16, y + 18], [cfg.x + 5, y + 12]
  ], body);
  polygon(img, [
    [cfg.x + 10, y - 2], [cfg.x + cfg.w - 16, y - 5],
    [cfg.x + cfg.w - 9, y + 10], [cfg.x + 18, y + 14]
  ], body2);
  rect(img, cfg.x + 20, y + 15, cfg.w - 42, 5, shade);
  rect(img, cfg.x + 3, y + 8, 14, 8, lamp);
  rect(img, cfg.x + cfg.w - 12, y + 7, 7, 8, tail);
  rect(img, cfg.x + 34, y + 18, 24, 3, neon);
  rect(img, cfg.x + cfg.w - 66, y + 18, 36, 3, neon);

  const cabin = [
    [cfg.x + cfg.hood + 12, y - 31], [cfg.x + cfg.hood + 28, y - 55],
    [cfg.x + cfg.w - cfg.trunk - 14, y - 55], [cfg.x + cfg.w - cfg.trunk + 15, y - 31]
  ];
  polygon(img, cabin, c(PALETTE.ink));
  strokePoly(img, cabin, c(PALETTE.ink), 4);
  polygon(img, [
    [cfg.x + cfg.hood + 18, y - 33], [cfg.x + cfg.hood + 31, y - 50],
    [cfg.x + cfg.hood + 57, y - 50], [cfg.x + cfg.hood + 53, y - 33]
  ], glass2);
  polygon(img, [
    [cfg.x + cfg.hood + 60, y - 33], [cfg.x + cfg.hood + 64, y - 50],
    [cfg.x + cfg.w - cfg.trunk - 19, y - 50], [cfg.x + cfg.w - cfg.trunk + 7, y - 33]
  ], glass);
  line(img, cfg.x + cfg.hood + 59, y - 51, cfg.x + cfg.hood + 54, y - 30, c(PALETTE.ink), 3);
  rect(img, cfg.x + cfg.hood + 73, y - 39, 8, 11, c(PALETTE.ink2));
  line(img, cfg.x + cfg.hood + 22, y - 34, cfg.x + cfg.w - cfg.trunk + 8, y - 35, c("#ffffff", 145), 1);
  line(img, cfg.x + 30, y - 8, cfg.x + 79, y - 11, c("#ffffff", 125), 2);
  line(img, cfg.x + cfg.w - 69, y - 10, cfg.x + cfg.w - 31, y - 8, c("#ffffff", 95), 2);
  rect(img, cfg.x + cfg.w - 82, y + 1, 10, 3, dark);
  line(img, cfg.x + cfg.hood + 61, y - 30, cfg.x + cfg.hood + 58, y + 18, c(PALETTE.ink), 2);
}

function drawTaxi(img, frame) {
  drawCarBase(img, {
    x: 16, y: 54, w: 142, hood: 41, trunk: 35, wa: 43, wb: 121, r: 13,
    body: "#e3a531", body2: "#ffc654", dark: "#624318", shade: "#9b6720",
    glass: "#8fb3bd", glass2: "#d7ecea", lamp: "#fff0a8", tail: "#d64b40", neon: "#61eaff"
  }, frame);
  const y = 54 + (frame % 2);
  rect(img, 78, y - 67, 24, 6, c(PALETTE.ink));
  rect(img, 82, y - 65, 16, 3, c("#ffe783"));
  rect(img, 54, y - 4, 34, 6, c(PALETTE.ink));
  rect(img, 58, y - 2, 7, 2, c("#ffe783"));
  rect(img, 69, y - 2, 7, 2, c("#ffe783"));
  rect(img, 80, y - 2, 5, 2, c("#ffe783"));
}

function drawBlackSedan(img, frame) {
  drawCarBase(img, {
    x: 12, y: 55, w: 148, hood: 38, trunk: 42, wa: 42, wb: 124, r: 14,
    body: "#07080b", body2: "#171c24", dark: "#000000", shade: "#2b3137",
    glass: "#a7b3b5", glass2: "#e2e6e0", lamp: "#f1a24c", tail: "#ff6b49", neon: "#76eaff"
  }, frame);
  const y = 55 + (frame % 2);
  line(img, 21, y - 21, 44, y - 34, c("#dbe1db"), 2);
  line(img, 43, y - 35, 132, y - 35, c("#dbe1db"), 2);
  line(img, 143, y - 31, 158, y - 15, c("#dbe1db"), 2);
  rect(img, 23, y - 2, 118, 3, c("#5c6268"));
}

function drawRedCoupe(img, frame) {
  drawCarBase(img, {
    x: 13, y: 56, w: 150, hood: 45, trunk: 28, wa: 47, wb: 126, r: 14,
    body: "#bb2238", body2: "#f04b49", dark: "#421019", shade: "#7b1d2b",
    glass: "#263f4c", glass2: "#92dce6", lamp: "#a9fbff", tail: "#ff8357", neon: "#24ecff"
  }, frame);
  const y = 56 + (frame % 2);
  line(img, 29, y - 12, 111, y - 21, c("#ff9a70"), 2);
  rect(img, 111, y - 4, 28, 5, c(PALETTE.ink));
  rect(img, 118, y - 2, 16, 2, c("#f04b49"));
}

function drawGreenPickup(img, frame) {
  drawCarBase(img, {
    x: 13, y: 55, w: 150, hood: 41, trunk: 49, wa: 45, wb: 128, r: 14,
    body: "#218a58", body2: "#56d487", dark: "#0a3d29", shade: "#135d3d",
    glass: "#9ed5c9", glass2: "#e3fff5", lamp: "#ffe689", tail: "#f55d52", neon: "#75ffc4"
  }, frame);
  const y = 55 + (frame % 2);
  rect(img, 111, y - 30, 43, 22, c(PALETTE.ink));
  rect(img, 115, y - 27, 35, 15, c("#135d3d"));
  line(img, 116, y - 27, 148, y - 25, c("#56d487"), 2);
}

function drawRider(img, x, y, cfg) {
  drawCircle(img, x + cfg.lean, y - 32, 8, c(PALETTE.ink));
  drawCircle(img, x + cfg.lean, y - 32, 6, c(cfg.helmet));
  rect(img, x + cfg.lean + 2, y - 34, 7, 3, c(cfg.visor));
  rect(img, x + cfg.lean - 2, y - 25, 6, 5, c(cfg.skin));
  line(img, x + cfg.lean - 2, y - 21, x - 4, y - 4, c(cfg.jacket), 7);
  line(img, x + cfg.lean + 1, y - 18, x + 26, y - 12, c(cfg.jacket), 4);
  line(img, x - 4, y - 5, x - 24, y + 10, c(PALETTE.ink2), 5);
  line(img, x - 1, y - 4, x + 24, y + 12, c(PALETTE.ink2), 5);
  rect(img, x + 25, y - 14, 8, 4, c(cfg.skin));
}

function drawMotoBase(img, cfg, frame) {
  const y = cfg.y + (frame % 2);
  drawShadow(img, cfg.rear - 28, y + 20, cfg.front - cfg.rear + 58);
  drawWheel(img, cfg.rear, y, frame, cfg.r, c(cfg.neon));
  drawWheel(img, cfg.front, y, (frame + 2) % DIR_FRAMES, cfg.r, c(cfg.neon));
  line(img, cfg.rear + 3, y - 9, cfg.rear + 38, y - 30, c(PALETTE.ink), 4);
  line(img, cfg.rear + 38, y - 30, cfg.front - 14, y - 12, c(PALETTE.ink), 4);
  line(img, cfg.rear + 12, y - 8, cfg.front - 11, y - 8, c(PALETTE.ink), 4);
  line(img, cfg.rear + 16, y - 13, cfg.front - 22, y - 30, c(PALETTE.chrome2), 2);
  line(img, cfg.front - 10, y - 10, cfg.front + 21, y - 44, c(PALETTE.ink), 4);
  line(img, cfg.front + 21, y - 44, cfg.front + 36, y - 41, c(PALETTE.chrome), 3);
  rect(img, cfg.rear + 52, y - 26, 22, 15, c(PALETTE.ink));
  rect(img, cfg.rear + 55, y - 23, 16, 9, c(PALETTE.chrome2));
  rect(img, cfg.rear + 59, y - 21, 8, 5, c(PALETTE.chrome));
  polygon(img, [
    [cfg.rear + 31, y - 42], [cfg.rear + 62, y - 52], [cfg.rear + 92, y - 40],
    [cfg.rear + 82, y - 25], [cfg.rear + 31, y - 25]
  ], c(PALETTE.ink));
  polygon(img, [
    [cfg.rear + 36, y - 39], [cfg.rear + 63, y - 47], [cfg.rear + 87, y - 38],
    [cfg.rear + 78, y - 29], [cfg.rear + 35, y - 28]
  ], c(cfg.body));
  rect(img, cfg.rear + 43, y - 35, 38, 6, c(cfg.body2));
  rect(img, cfg.rear + 31, y - 47, 28, 7, c(PALETTE.ink));
  rect(img, cfg.rear + 35, y - 50, 21, 5, c("#202632"));
  rect(img, cfg.front + 20, y - 44, 8, 6, c(cfg.light));
  rect(img, cfg.rear - 22, y - 24, 7, 5, c(cfg.tail));
  line(img, cfg.rear + 43, y - 27, cfg.front - 16, y - 16, c(cfg.neon), 2);
  line(img, cfg.rear + 27, y - 36, cfg.rear + 12, y - 52, c(PALETTE.ink), 3);
  rect(img, cfg.rear + 2, y - 55, 24, 7, c(PALETTE.ink));
  rect(img, cfg.rear + 6, y - 58, 17, 4, c(PALETTE.chrome));
  if (cfg.box) {
    rect(img, cfg.rear - 43, y - 57, 31, 28, c(PALETTE.ink));
    rect(img, cfg.rear - 39, y - 53, 23, 20, c(cfg.box));
    rect(img, cfg.rear - 35, y - 45, 14, 4, c(PALETTE.white));
  }
  drawRider(img, cfg.riderX, y - 10, cfg);
}

function drawOrangeChopper(img, frame) {
  drawMotoBase(img, {
    rear: 49, front: 130, y: 76, r: 14, riderX: 86, lean: 1,
    body: "#ed8b2f", body2: "#ffd06d", light: "#ffe78a", tail: "#ff5a4e", neon: "#77ecff",
    skin: "#d99b62", helmet: "#202938", visor: "#9feaff", jacket: "#e9e5d6"
  }, frame);
}

function drawRedSport(img, frame) {
  drawMotoBase(img, {
    rear: 48, front: 132, y: 77, r: 14, riderX: 89, lean: 7,
    body: "#d51f2d", body2: "#ff5a55", light: "#aefaff", tail: "#ff714b", neon: "#52eaff",
    skin: "#cc8a58", helmet: "#e7edf2", visor: "#243342", jacket: "#1b1f29"
  }, frame);
}

function drawSilverCruiser(img, frame) {
  drawMotoBase(img, {
    rear: 46, front: 136, y: 77, r: 15, riderX: 91, lean: 0,
    body: "#9aa8ad", body2: "#dbe3e2", light: "#efffff", tail: "#ff6a58", neon: "#77ecff",
    skin: "#b97850", helmet: "#dce2e7", visor: "#2c3c44", jacket: "#222a31"
  }, frame);
}

function drawDeliveryBike(img, frame) {
  drawMotoBase(img, {
    rear: 50, front: 134, y: 78, r: 14, riderX: 90, lean: 5,
    body: "#23a878", body2: "#70e0a7", light: "#fff0a0", tail: "#ff5d4f", neon: "#70ffba",
    skin: "#d99a67", helmet: "#ff7844", visor: "#1c2a34", jacket: "#26324a", box: "#ff7844"
  }, frame);
}

function buildFrame(vehicle, frame) {
  const img = new Bitmap(BASE_W, BASE_H, 0, 18);
  vehicle.draw(img, frame);
  return img;
}

function buildVehicleSheet(vehicle) {
  const sheet = new Bitmap(FRAME_W * TOTAL_FRAMES, FRAME_H);
  for (let frame = 0; frame < DIR_FRAMES; frame += 1) {
    const right = buildFrame(vehicle, frame);
    sheet.copy(scaleBitmap(right), frame * FRAME_W, 0);
    sheet.copy(scaleBitmap(mirrorBitmap(right)), (DIR_FRAMES + frame) * FRAME_W, 0);
  }
  return sheet;
}

function buildAtlas(sheets) {
  const atlas = new Bitmap(FRAME_W * TOTAL_FRAMES, FRAME_H * sheets.length);
  sheets.forEach((sheet, row) => atlas.copy(sheet, 0, row * FRAME_H));
  return atlas;
}

function buildPreview(sheets) {
  const gap = 18;
  const preview = new Bitmap(FRAME_W * TOTAL_FRAMES + gap * 2, (FRAME_H + gap) * sheets.length + gap);
  sheets.forEach((sheet, row) => preview.copy(sheet, gap, gap + row * (FRAME_H + gap)));
  return preview;
}

function crc32(buffer) {
  let crc = ~0;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])), 0);
  return Buffer.concat([len, name, data, crc]);
}

function encodePng(bitmap) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(bitmap.width, 0);
  ihdr.writeUInt32BE(bitmap.height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc((bitmap.width * 4 + 1) * bitmap.height);
  for (let y = 0; y < bitmap.height; y += 1) {
    const row = y * (bitmap.width * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < bitmap.width; x += 1) {
      const src = (y * bitmap.width + x) * 4;
      const dst = row + 1 + x * 4;
      raw[dst] = bitmap.data[src];
      raw[dst + 1] = bitmap.data[src + 1];
      raw[dst + 2] = bitmap.data[src + 2];
      raw[dst + 3] = bitmap.data[src + 3];
    }
  }
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

function writePng(file, bitmap) {
  fs.writeFileSync(file, encodePng(bitmap));
}

function buildHtml() {
  const cards = vehicles.map((vehicle) => {
    const src = `assets/pubpaid/traffic/painted-v1/${vehicle.id}-8f.png?v=20260428paint1`;
    return `
      <article class="card">
        <div class="card-head">
          <span>${vehicle.kind === "moto" ? "Moto com piloto" : "Carro lateral"}</span>
          <strong>${vehicle.label}</strong>
        </div>
        <div class="card-stage">
          <div class="sprite right" style="background-image:url('${src}')"></div>
          <div class="sprite left" style="background-image:url('${src}')"></div>
        </div>
      </article>`;
  }).join("");

  const runners = vehicles.map((vehicle, index) => {
    const src = `assets/pubpaid/traffic/painted-v1/${vehicle.id}-8f.png?v=20260428paint1`;
    const top = index % 2 ? 110 : 36;
    const dir = index % 2 ? "left" : "right";
    const duration = vehicle.kind === "moto" ? 5.2 + (index % 3) * 0.35 : 6.8 + (index % 3) * 0.4;
    return `<div class="runner ${dir} ${vehicle.kind}" style="--top:${top}px; --delay:${-(index * 0.61).toFixed(2)}s; --duration:${duration}s; background-image:url('${src}')"></div>`;
  }).join("");

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PubPaid 2.0 | Veículos pintados V1</title>
  <style>
    :root { --bg:#050812; --panel:#07101c; --line:#285367; --ink:#fff0d6; --cyan:#50efff; --mint:#7dffc1; }
    * { box-sizing:border-box; }
    body { margin:0; min-height:100vh; background:#050812; color:var(--ink); font-family:Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    header, main { width:min(1220px, calc(100% - 32px)); margin:0 auto; }
    header { padding:28px 0 16px; }
    .eyebrow { color:var(--cyan); font:800 12px/1.2 "Courier New", monospace; letter-spacing:3px; text-transform:uppercase; }
    h1 { margin:10px 0; max-width:900px; font-size:clamp(34px, 5vw, 64px); line-height:.96; letter-spacing:0; }
    p { max-width:880px; color:#c8d9e8; line-height:1.55; }
    .chips { display:flex; flex-wrap:wrap; gap:9px; margin-top:16px; }
    .chips span { border:1px solid var(--line); border-radius:8px; padding:8px 10px; background:#07101c; color:#e3f6ff; font-size:13px; }
    .street { position:relative; overflow:hidden; height:280px; border:1px solid var(--line); border-radius:8px; margin:18px 0; background:linear-gradient(#111927 0 33%, #080b12 33% 100%); }
    .street:before { content:""; position:absolute; left:0; right:0; top:92px; height:3px; background:repeating-linear-gradient(90deg, rgba(255,240,214,.78) 0 46px, transparent 46px 90px); opacity:.55; }
    .label { position:absolute; left:14px; top:12px; z-index:8; color:#bce8f2; font:800 12px/1 "Courier New", monospace; letter-spacing:2px; text-transform:uppercase; }
    .runner, .sprite { width:${FRAME_W}px; height:${FRAME_H}px; background-repeat:no-repeat; background-size:${FRAME_W * TOTAL_FRAMES}px ${FRAME_H}px; image-rendering:pixelated; image-rendering:crisp-edges; }
    .runner { position:absolute; top:var(--top); left:-610px; z-index:4; scale:.58; transform-origin:left top; animation:driveRight var(--duration) linear infinite; animation-delay:var(--delay); }
    .runner.left { left:auto; right:-610px; animation-name:driveLeft; }
    @keyframes driveRight { from { translate:-610px 0; } to { translate:calc(100vw + 740px) 0; } }
    @keyframes driveLeft { from { translate:610px 0; } to { translate:calc(-100vw - 740px) 0; } }
    .files { border:1px solid var(--line); border-radius:8px; background:#07101c; padding:14px; margin-bottom:16px; }
    code { color:var(--mint); overflow-wrap:anywhere; }
    .grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:14px; padding-bottom:34px; }
    .card { border:1px solid var(--line); border-radius:8px; background:#07101c; padding:12px; }
    .card-head { display:flex; justify-content:space-between; gap:12px; align-items:start; min-height:42px; }
    .card-head span { color:var(--mint); font:800 11px/1.2 "Courier New", monospace; letter-spacing:1.5px; text-transform:uppercase; }
    .card-head strong { text-align:right; font-size:15px; }
    .card-stage { display:grid; min-height:230px; overflow:hidden; background:#03070f; border-radius:8px; margin-top:10px; padding:4px; place-items:center; }
    .sprite { scale:.5; transform-origin:center; }
    .sprite.left { margin-top:-126px; }
    @media (max-width:720px) {
      header, main { width:min(100% - 18px, 1220px); }
      .runner { scale:.44; }
      .sprite { scale:.4; }
      .card-head { flex-direction:column; }
      .card-head strong { text-align:left; }
    }
  </style>
</head>
<body>
  <header>
    <div class="eyebrow">PubPaid 2.0 - painted pixel art V1</div>
    <h1>Pacote novo: veículos pintados para avaliação.</h1>
    <p>Refiz a direção para sprites laterais 32-bit, com contorno forte, rodas grandes, highlights blocados e motos com piloto integrado. Esta página é só avaliação visual; nada foi integrado no jogo.</p>
    <div class="chips">
      <span>${vehicles.length} veículos</span>
      <span>4 frames direita + 4 esquerda</span>
      <span>base ${BASE_W}x${BASE_H}</span>
      <span>PNG sheets transparentes</span>
    </div>
  </header>
  <main>
    <section class="street">
      <div class="label">Rua teste - veículos pintados</div>
      ${runners}
    </section>
    <section class="files">
      <p>Atlas: <code>assets/pubpaid/traffic/pubpaid-traffic-painted-8f-v1.png</code></p>
      <p>Manifesto: <code>assets/pubpaid/traffic/pubpaid-traffic-painted-8f-v1.json</code></p>
      <p>Sheets individuais: <code>assets/pubpaid/traffic/painted-v1/*-8f.png</code></p>
    </section>
    <section class="grid">${cards}</section>
  </main>
  <script>
    const frameWidth = ${FRAME_W};
    const dirFrames = ${DIR_FRAMES};
    let frame = 0;
    function tick() {
      document.querySelectorAll(".right, .runner.right").forEach((el) => {
        el.style.backgroundPosition = (-frame * frameWidth) + "px 0";
      });
      document.querySelectorAll(".left, .runner.left").forEach((el) => {
        el.style.backgroundPosition = (-(dirFrames + frame) * frameWidth) + "px 0";
      });
      frame = (frame + 1) % dirFrames;
    }
    tick();
    setInterval(tick, 120);
  </script>
</body>
</html>`;
}

function main() {
  fs.mkdirSync(SHEET_DIR, { recursive: true });
  const sheets = vehicles.map((vehicle) => {
    const sheet = buildVehicleSheet(vehicle);
    writePng(path.join(SHEET_DIR, `${vehicle.id}-8f.png`), sheet);
    return sheet;
  });
  writePng(path.join(OUT_DIR, "pubpaid-traffic-painted-8f-v1.png"), buildAtlas(sheets));
  writePng(path.join(OUT_DIR, "pubpaid-traffic-painted-8f-v1-preview.png"), buildPreview(sheets));
  fs.writeFileSync(path.join(OUT_DIR, "pubpaid-traffic-painted-8f-v1.json"), JSON.stringify({
    frameWidth: FRAME_W,
    frameHeight: FRAME_H,
    baseFrameWidth: BASE_W,
    baseFrameHeight: BASE_H,
    scale: SCALE,
    framesPerDirection: DIR_FRAMES,
    framesPerVehicle: TOTAL_FRAMES,
    rightFrames: [0, 1, 2, 3],
    leftFrames: [4, 5, 6, 7],
    generatedAt: new Date().toISOString(),
    source: "scripts/export-pubpaid-painted-traffic-v1.js",
    status: "avaliacao visual; nao integrado no runtime",
    atlas: "assets/pubpaid/traffic/pubpaid-traffic-painted-8f-v1.png",
    individualDir: "assets/pubpaid/traffic/painted-v1",
    vehicles: vehicles.map((vehicle, row) => ({
      id: vehicle.id,
      label: vehicle.label,
      kind: vehicle.kind,
      row,
      framesPerDirection: DIR_FRAMES,
      speed: vehicle.speed,
      scale: vehicle.scale,
      hitbox: vehicle.hitbox,
      sheet: `assets/pubpaid/traffic/painted-v1/${vehicle.id}-8f.png`
    }))
  }, null, 2));
  fs.writeFileSync(path.join(ROOT, "pubpaid-traffic-sprites-demo.html"), buildHtml());
  console.log(`painted traffic v1 exported: ${vehicles.length} vehicles`);
}

main();
