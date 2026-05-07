const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "assets", "pubpaid", "traffic");
const INDIVIDUAL_DIR = path.join(OUT_DIR, "vehicles-v4-reference-pixelart");

const BASE_W = 192;
const BASE_H = 128;
const SCALE = 3;
const FRAME_W = BASE_W * SCALE;
const FRAME_H = BASE_H * SCALE;
const DIR_FRAMES = 4;
const TOTAL_FRAMES = DIR_FRAMES * 2;

const vehicles = [
  car("yellow_taxi_px_v4", "Taxi amarelo lateral", "taxi", {
    body: "#e6a936", body2: "#ffc95b", dark: "#68451a", shade: "#9d6c24",
    glass: "#9fbfc6", glass2: "#d4eef0", light: "#fff0a0", tail: "#d84d42", neon: "#37e6ff"
  }, 3.05, 0.72, { width: 340, height: 92 }),
  car("black_sedan_px_v4", "Sedan preto referencia", "box", {
    body: "#07090d", body2: "#161a22", dark: "#000000", shade: "#2e3338",
    glass: "#a7b4b7", glass2: "#e0e4df", light: "#f2a848", tail: "#ff6948", neon: "#74f2ff"
  }, 3.15, 0.76, { width: 350, height: 92 }),
  car("red_muscle_px_v4", "Coupe vermelho montanha", "muscle", {
    body: "#ba2238", body2: "#f34a48", dark: "#42141c", shade: "#7b1c2d",
    glass: "#2b4a5a", glass2: "#9adbe3", light: "#aefaff", tail: "#ff8758", neon: "#29f0ff"
  }, 3.45, 0.75, { width: 354, height: 96 }),
  car("teal_hatch_px_v4", "Hatch teal neon", "hatch", {
    body: "#1da9aa", body2: "#53e5d2", dark: "#073f49", shade: "#096571",
    glass: "#8ceaf4", glass2: "#d9fbff", light: "#ffe172", tail: "#ff5f78", neon: "#58ffcf"
  }, 3.4, 0.68, { width: 292, height: 88 }),
  car("purple_compact_px_v4", "Compacto roxo noite", "compact", {
    body: "#7148ca", body2: "#a77bff", dark: "#24154a", shade: "#432173",
    glass: "#94dcf0", glass2: "#d9f5ff", light: "#ffe16b", tail: "#ff5e6c", neon: "#ff62d2"
  }, 3.65, 0.66, { width: 276, height: 86 }),
  car("green_pickup_px_v4", "Pickup verde pixel", "pickup", {
    body: "#208a59", body2: "#56d486", dark: "#0a3d29", shade: "#125a3a",
    glass: "#9bd3c7", glass2: "#e2fff5", light: "#ffe689", tail: "#f55a52", neon: "#75ffc2"
  }, 3.1, 0.76, { width: 350, height: 94 }),
  moto("orange_chopper_rider_px_v4", "Chopper laranja com piloto", "chopper", {
    body: "#ee8d2d", body2: "#ffd06a", dark: "#331b12", shade: "#8a3c19",
    metal: "#c7d1d4", metal2: "#f2f5ee", tire: "#080a10", skin: "#d59b64",
    helmet: "#202936", jacket: "#e9e6d8", neon: "#77ecff", tail: "#ff5a4d"
  }, 3.85, 0.72, { width: 242, height: 120 }),
  moto("red_sport_rider_px_v4", "Moto sport vermelha", "sport", {
    body: "#d51f2d", body2: "#ff5a55", dark: "#3c0d14", shade: "#7b111d",
    metal: "#9daab0", metal2: "#e6edf0", tire: "#080a10", skin: "#cc8a58",
    helmet: "#e8edf2", jacket: "#1b1e26", neon: "#51eaff", tail: "#ff6d4a"
  }, 4.55, 0.72, { width: 250, height: 120 }),
  moto("silver_cruiser_rider_px_v4", "Cruiser prata com piloto", "cruiser", {
    body: "#9aa8ad", body2: "#dbe3e2", dark: "#2b3339", shade: "#5b666b",
    metal: "#c7d1d4", metal2: "#ffffff", tire: "#080a10", skin: "#b97850",
    helmet: "#dadfe5", jacket: "#222a31", neon: "#77ecff", tail: "#ff6a58"
  }, 3.65, 0.74, { width: 260, height: 118 }),
  moto("purple_street_rider_px_v4", "Moto roxa urbana", "street", {
    body: "#7246d1", body2: "#a47cff", dark: "#241243", shade: "#4d2380",
    metal: "#a7b4bc", metal2: "#e9eef2", tire: "#080a10", skin: "#d69a68",
    helmet: "#783cff", jacket: "#1a1f30", neon: "#ff63d6", tail: "#ff6a58"
  }, 4.1, 0.7, { width: 238, height: 116 }),
  moto("delivery_bike_rider_px_v4", "Moto delivery com bau", "delivery", {
    body: "#23a878", body2: "#70e0a7", dark: "#093a2b", shade: "#126046",
    metal: "#a8b8b6", metal2: "#f1fff6", tire: "#080a10", skin: "#d99a67",
    helmet: "#ff7844", jacket: "#26324a", neon: "#6bffba", tail: "#ff5d4f"
  }, 3.75, 0.72, { width: 260, height: 124 }),
  moto("blue_scooter_rider_px_v4", "Scooter azul com piloto", "scooter", {
    body: "#315bc5", body2: "#70a0ff", dark: "#152156", shade: "#243d87",
    metal: "#aab6c0", metal2: "#f0f7ff", tire: "#080a10", skin: "#d69a68",
    helmet: "#f0e6c8", jacket: "#dd4f8f", neon: "#6eeaff", tail: "#ff6372"
  }, 4.0, 0.68, { width: 230, height: 118 })
];

function car(id, label, type, palette, speed, scale, hitbox) {
  return { id, label, kind: "car", type, palette, speed, scale, hitbox };
}

function moto(id, label, type, palette, speed, scale, hitbox) {
  return { id, label, kind: "moto", type, palette, speed, scale, hitbox };
}

class PixelSheet {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
  }

  put(x, y, color) {
    const px = Math.round(x);
    const py = Math.round(y);
    if (px < 0 || py < 0 || px >= this.width || py >= this.height) return;
    const index = (py * this.width + px) * 4;
    this.data[index] = color[0];
    this.data[index + 1] = color[1];
    this.data[index + 2] = color[2];
    this.data[index + 3] = color[3] ?? 255;
  }

  copy(src, dx, dy) {
    for (let y = 0; y < src.height; y += 1) {
      for (let x = 0; x < src.width; x += 1) {
        const index = (y * src.width + x) * 4;
        const alpha = src.data[index + 3];
        if (!alpha) continue;
        this.put(dx + x, dy + y, [
          src.data[index],
          src.data[index + 1],
          src.data[index + 2],
          alpha
        ]);
      }
    }
  }
}

function hex(value, alpha = 255) {
  const clean = value.replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
    alpha
  ];
}

function colors(spec) {
  const p = spec.palette;
  return {
    O: hex("#05070d"),
    o: hex("#101521"),
    s: hex("#000000", 72),
    A: hex(p.dark),
    B: hex(p.body),
    C: hex(p.body2),
    D: hex(p.shade),
    G: hex(p.glass || p.neon || "#8feaff"),
    H: hex(p.glass2 || p.metal2 || "#e6edf0"),
    L: hex(p.light || p.neon || p.body2),
    R: hex(p.tail),
    N: hex(p.neon),
    M: hex(p.metal || "#9ca8ad"),
    W: hex(p.metal2 || "#e6edf0"),
    T: hex(p.tire || "#080a10"),
    K: hex("#000000"),
    P: hex(p.skin || "#d19a68"),
    E: hex(p.helmet || p.metal2 || "#f2f2f2"),
    J: hex(p.jacket || "#202431")
  };
}

function rect(img, x, y, w, h, color) {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) img.put(xx, yy, color);
  }
}

function line(img, x0, y0, x1, y1, color, width = 1) {
  let dx = Math.abs(x1 - x0);
  let sx = x0 < x1 ? 1 : -1;
  let dy = -Math.abs(y1 - y0);
  let sy = y0 < y1 ? 1 : -1;
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

function poly(img, points, color) {
  const minY = Math.floor(Math.min(...points.map((point) => point[1])));
  const maxY = Math.ceil(Math.max(...points.map((point) => point[1])));
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
      for (let x = nodes[k]; x <= nodes[k + 1]; x += 1) img.put(x, y, color);
    }
  }
}

function outlinePoly(img, points, fill, outline) {
  const expanded = points.map(([x, y]) => [x, y]);
  poly(img, expanded, outline);
  lineLoop(img, points, outline, 5);
  const centerX = points.reduce((sum, point) => sum + point[0], 0) / points.length;
  const centerY = points.reduce((sum, point) => sum + point[1], 0) / points.length;
  const inset = points.map(([x, y]) => [
    Math.round(x + (centerX - x) * 0.045),
    Math.round(y + (centerY - y) * 0.08)
  ]);
  poly(img, inset, fill);
}

function lineLoop(img, points, color, width) {
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    line(img, a[0], a[1], b[0], b[1], color, width);
  }
}

function mirror(src) {
  const out = new PixelSheet(src.width, src.height);
  for (let y = 0; y < src.height; y += 1) {
    for (let x = 0; x < src.width; x += 1) {
      const index = (y * src.width + x) * 4;
      if (!src.data[index + 3]) continue;
      out.put(src.width - 1 - x, y, [
        src.data[index],
        src.data[index + 1],
        src.data[index + 2],
        src.data[index + 3]
      ]);
    }
  }
  return out;
}

function scale(src) {
  const out = new PixelSheet(src.width * SCALE, src.height * SCALE);
  for (let y = 0; y < src.height; y += 1) {
    for (let x = 0; x < src.width; x += 1) {
      const index = (y * src.width + x) * 4;
      if (!src.data[index + 3]) continue;
      const color = [src.data[index], src.data[index + 1], src.data[index + 2], src.data[index + 3]];
      rect(out, x * SCALE, y * SCALE, SCALE, SCALE, color);
    }
  }
  return out;
}

function drawRing(img, cx, cy, r, color) {
  const rr = r * r;
  const inner = (r - 4) * (r - 4);
  for (let y = cy - r - 1; y <= cy + r + 1; y += 1) {
    for (let x = cx - r - 1; x <= cx + r + 1; x += 1) {
      const d = (x - cx) * (x - cx) + (y - cy) * (y - cy);
      if (d <= rr && d >= inner) img.put(x, y, color);
    }
  }
}

function drawDisc(img, cx, cy, r, color) {
  const rr = r * r;
  for (let y = cy - r; y <= cy + r; y += 1) {
    for (let x = cx - r; x <= cx + r; x += 1) {
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= rr) img.put(x, y, color);
    }
  }
}

function wheel(img, cx, cy, frame, palette, size = 13) {
  drawDisc(img, cx + 1, cy + 2, size + 2, palette.s);
  drawDisc(img, cx, cy, size + 2, palette.O);
  drawRing(img, cx, cy, size, palette.T);
  drawRing(img, cx, cy, size - 3, palette.M);
  drawDisc(img, cx, cy, size - 7, palette.o);
  drawDisc(img, cx, cy, Math.max(2, size - 10), palette.W);
  const spokeSets = [
    [[-9, 0, 9, 0], [0, -9, 0, 9], [-6, -6, 6, 6], [-6, 6, 6, -6]],
    [[-8, -3, 8, 3], [3, -8, -3, 8], [-8, 4, 8, -4], [4, 8, -4, -8]],
    [[-9, -1, 9, 1], [1, -9, -1, 9], [-5, -7, 5, 7], [-7, 5, 7, -5]],
    [[-8, 3, 8, -3], [-3, -8, 3, 8], [-8, -4, 8, 4], [4, -8, -4, 8]]
  ];
  spokeSets[frame % DIR_FRAMES].forEach(([x1, y1, x2, y2], index) => {
    line(img, cx + x1, cy + y1, cx + x2, cy + y2, index % 2 ? palette.W : palette.M, 2);
  });
  drawDisc(img, cx, cy, 3, palette.O);
}

function shadow(img, x, y, w, palette) {
  for (let i = 0; i < w; i += 2) {
    const height = i % 8 === 0 ? 3 : 2;
    rect(img, x + i, y, 1, height, palette.s);
  }
  rect(img, x + 12, y + 2, w - 24, 2, palette.s);
}

function drawCar(spec, frame) {
  const img = new PixelSheet(BASE_W, BASE_H);
  const c = colors(spec);
  const y = spec.type === "muscle" ? 66 : 68;
  const bob = frame % 2 === 0 ? 0 : 1;
  const profiles = {
    taxi: { x: 18, w: 156, roof: 35, hood: 45, trunk: 42, wa: 51, wb: 137, r: 14 },
    box: { x: 14, w: 162, roof: 29, hood: 43, trunk: 44, wa: 50, wb: 141, r: 15 },
    muscle: { x: 15, w: 164, roof: 34, hood: 39, trunk: 38, wa: 54, wb: 140, r: 15 },
    hatch: { x: 29, w: 134, roof: 35, hood: 39, trunk: 34, wa: 61, wb: 128, r: 13 },
    compact: { x: 35, w: 122, roof: 37, hood: 37, trunk: 32, wa: 63, wb: 123, r: 12 },
    pickup: { x: 15, w: 164, roof: 36, hood: 42, trunk: 48, wa: 53, wb: 142, r: 14 }
  };
  const p = profiles[spec.type];
  shadow(img, p.x + 4, y + 16, p.w - 8, c);
  wheel(img, p.wa, y + 11, frame, c, p.r);
  wheel(img, p.wb, y + 11, (frame + 2) % DIR_FRAMES, c, p.r);

  const body = [
    [p.x + 1, y - 22], [p.x + 14, y - 32], [p.x + p.hood, y - 36],
    [p.x + p.hood + 18, p.roof], [p.x + p.w - p.trunk, p.roof],
    [p.x + p.w - 13, y - 35], [p.x + p.w - 1, y - 24],
    [p.x + p.w - 4, y + 2], [p.x + p.w - 14, y + 8],
    [p.x + 11, y + 8], [p.x, y]
  ];
  outlinePoly(img, body.map(([x, yy]) => [x, yy + bob]), c.B, c.O);
  poly(img, [[p.x + 10, y - 24 + bob], [p.x + 35, y - 31 + bob], [p.x + p.w - 28, y - 28 + bob], [p.x + p.w - 11, y - 19 + bob], [p.x + p.w - 17, y - 13 + bob], [p.x + 14, y - 13 + bob]], c.C);
  poly(img, [[p.x + 14, y - 18 + bob], [p.x + p.w - 19, y - 18 + bob], [p.x + p.w - 14, y - 9 + bob], [p.x + 11, y - 8 + bob]], c.D);

  const cabin = [
    [p.x + p.hood + 10, p.roof + 1 + bob],
    [p.x + p.hood + 27, p.roof - 22 + bob],
    [p.x + p.w - p.trunk - 8, p.roof - 22 + bob],
    [p.x + p.w - p.trunk + 16, p.roof + 1 + bob]
  ];
  outlinePoly(img, cabin, c.G, c.O);
  const mid = p.x + p.hood + Math.floor((p.w - p.hood - p.trunk) / 2);
  line(img, mid, p.roof - 19 + bob, mid - 6, p.roof + 4 + bob, c.O, 3);
  poly(img, [[p.x + p.hood + 16, p.roof - 1 + bob], [p.x + p.hood + 29, p.roof - 17 + bob], [mid - 7, p.roof - 17 + bob], [mid - 10, p.roof - 1 + bob]], c.H);
  poly(img, [[mid + 2, p.roof - 1 + bob], [mid + 2, p.roof - 17 + bob], [p.x + p.w - p.trunk - 13, p.roof - 17 + bob], [p.x + p.w - p.trunk + 5, p.roof - 1 + bob]], c.G);
  rect(img, mid + 10, p.roof - 5 + bob, 8, 10, c.o);

  rect(img, p.x + 6, y - 15 + bob, 9, 7, c.L);
  rect(img, p.x + p.w - 13, y - 15 + bob, 7, 7, c.R);
  rect(img, p.x + 32, y - 3 + bob, 25, 3, c.N);
  rect(img, p.x + p.w - 62, y - 3 + bob, 34, 3, c.N);
  rect(img, p.x + p.w - 78, y - 24 + bob, 10, 3, c.H);
  rect(img, p.x + 58, y - 24 + bob, 12, 3, c.H);

  if (spec.type === "taxi") {
    rect(img, p.x + 66, p.roof - 27 + bob, 24, 7, c.O);
    rect(img, p.x + 70, p.roof - 25 + bob, 16, 4, c.L);
    rect(img, p.x + 38, y - 23 + bob, 30, 6, c.O);
    rect(img, p.x + 72, y - 23 + bob, 8, 6, c.L);
  }
  if (spec.type === "box") {
    line(img, p.x + 20, y - 40 + bob, p.x + 2, y - 26 + bob, c.W, 2);
    line(img, p.x + 24, y - 43 + bob, p.x + 150, y - 43 + bob, c.W, 2);
    line(img, p.x + p.w - 15, y - 38 + bob, p.x + p.w - 3, y - 23 + bob, c.W, 2);
  }
  if (spec.type === "muscle") {
    line(img, p.x + 24, y - 31 + bob, p.x + 120, y - 37 + bob, c.N, 2);
    rect(img, p.x + 114, y - 17 + bob, 28, 4, c.O);
  }
  if (spec.type === "pickup") {
    rect(img, p.x + p.w - 59, y - 39 + bob, 50, 23, c.D);
    lineLoop(img, [[p.x + p.w - 62, y - 41 + bob], [p.x + p.w - 8, y - 41 + bob], [p.x + p.w - 8, y - 13 + bob], [p.x + p.w - 62, y - 13 + bob]], c.O, 3);
  }
  return img;
}

function drawHelmet(img, x, y, c, forward = 1) {
  drawDisc(img, x, y, 8, c.O);
  drawDisc(img, x, y, 6, c.E);
  rect(img, x + forward * 2, y - 2, 6, 3, c.G);
  rect(img, x - 3, y + 5, 5, 3, c.P);
}

function drawRider(img, x, y, lean, c) {
  drawHelmet(img, x + lean, y - 32, c, 1);
  line(img, x + lean - 2, y - 23, x - 4, y - 5, c.J, 7);
  line(img, x + lean + 1, y - 20, x + 26, y - 13, c.J, 4);
  line(img, x - 4, y - 5, x - 24, y + 9, c.o, 5);
  line(img, x - 2, y - 4, x + 24, y + 12, c.o, 5);
  rect(img, x + 22, y - 15, 8, 4, c.P);
}

function drawMoto(spec, frame) {
  const img = new PixelSheet(BASE_W, BASE_H);
  const c = colors(spec);
  const configs = {
    chopper: { rear: 52, front: 133, y: 72, r: 14, riderX: 88, riderY: 61, lean: 2 },
    sport: { rear: 50, front: 134, y: 73, r: 14, riderX: 92, riderY: 60, lean: 8 },
    cruiser: { rear: 48, front: 139, y: 73, r: 15, riderX: 94, riderY: 61, lean: 0 },
    street: { rear: 54, front: 132, y: 72, r: 13, riderX: 91, riderY: 60, lean: 5 },
    delivery: { rear: 52, front: 137, y: 74, r: 14, riderX: 92, riderY: 61, lean: 5 },
    scooter: { rear: 58, front: 128, y: 73, r: 13, riderX: 92, riderY: 61, lean: -1 }
  };
  const p = configs[spec.type];
  shadow(img, p.rear - 26, p.y + 15, p.front - p.rear + 56, c);
  wheel(img, p.rear, p.y, frame, c, p.r);
  wheel(img, p.front, p.y, (frame + 2) % DIR_FRAMES, c, p.r);
  line(img, p.rear, p.y - 9, p.rear + 36, p.y - 35, c.O, 6);
  line(img, p.rear + 36, p.y - 35, p.front - 11, p.y - 13, c.O, 6);
  line(img, p.rear + 9, p.y - 10, p.front - 9, p.y - 9, c.O, 5);
  line(img, p.front - 10, p.y - 10, p.front + 24, p.y - 45, c.O, 5);
  line(img, p.front + 21, p.y - 45, p.front + 36, p.y - 42, c.M, 3);
  poly(img, [[p.rear + 30, p.y - 41], [p.rear + 61, p.y - 51], [p.rear + 90, p.y - 39], [p.rear + 82, p.y - 25], [p.rear + 30, p.y - 25]], c.O);
  poly(img, [[p.rear + 34, p.y - 39], [p.rear + 62, p.y - 47], [p.rear + 86, p.y - 38], [p.rear + 78, p.y - 29], [p.rear + 34, p.y - 28]], c.B);
  rect(img, p.rear + 43, p.y - 35, 38, 6, c.C);
  rect(img, p.front + 20, p.y - 44, 8, 6, c.L);
  rect(img, p.rear - 22, p.y - 24, 7, 5, c.R);
  line(img, p.rear + 44, p.y - 27, p.front - 17, p.y - 16, c.N, 2);
  line(img, p.rear + 27, p.y - 36, p.rear + 10, p.y - 55, c.O, 5);
  rect(img, p.rear + 1, p.y - 58, 24, 8, c.O);
  rect(img, p.rear + 5, p.y - 61, 18, 5, c.M);
  if (spec.type === "delivery") {
    rect(img, p.rear - 44, p.y - 55, 31, 28, c.O);
    rect(img, p.rear - 40, p.y - 51, 23, 20, c.paletteBox || c.palette || c.L);
    rect(img, p.rear - 36, p.y - 43, 15, 4, c.W);
  }
  if (spec.type === "scooter") {
    rect(img, p.rear + 23, p.y - 54, 23, 27, c.O);
    rect(img, p.rear + 26, p.y - 50, 17, 20, c.B);
    rect(img, p.front + 12, p.y - 45, 16, 15, c.G);
  }
  if (spec.type === "chopper" || spec.type === "cruiser") {
    line(img, p.front - 10, p.y - 10, p.front + 30, p.y - 36, c.M, 3);
    rect(img, p.rear + 24, p.y - 23, 32, 5, c.W);
  }
  drawRider(img, p.riderX, p.riderY, p.lean, c);
  return img;
}

function drawFrame(spec, frame) {
  return spec.kind === "car" ? drawCar(spec, frame) : drawMoto(spec, frame);
}

function buildVehicleSheet(spec) {
  const sheet = new PixelSheet(FRAME_W * TOTAL_FRAMES, FRAME_H);
  for (let frame = 0; frame < DIR_FRAMES; frame += 1) {
    const base = drawFrame(spec, frame);
    sheet.copy(scale(base), frame * FRAME_W, 0);
    sheet.copy(scale(mirror(base)), (DIR_FRAMES + frame) * FRAME_W, 0);
  }
  return sheet;
}

function buildAtlas(sheets) {
  const atlas = new PixelSheet(FRAME_W * TOTAL_FRAMES, FRAME_H * sheets.length);
  sheets.forEach((sheet, row) => atlas.copy(sheet, 0, row * FRAME_H));
  return atlas;
}

function buildPreview(sheets) {
  const gap = 18;
  const preview = new PixelSheet(FRAME_W * TOTAL_FRAMES + gap * 2, (FRAME_H + gap) * sheets.length + gap);
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

function png(sheet) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(sheet.width, 0);
  ihdr.writeUInt32BE(sheet.height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc((sheet.width * 4 + 1) * sheet.height);
  for (let y = 0; y < sheet.height; y += 1) {
    const row = y * (sheet.width * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < sheet.width; x += 1) {
      const src = (y * sheet.width + x) * 4;
      const dst = row + 1 + x * 4;
      raw[dst] = sheet.data[src];
      raw[dst + 1] = sheet.data[src + 1];
      raw[dst + 2] = sheet.data[src + 2];
      raw[dst + 3] = sheet.data[src + 3];
    }
  }
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

function writePng(file, sheet) {
  fs.writeFileSync(file, png(sheet));
}

function buildHtml() {
  const cards = vehicles.map((vehicle) => {
    const src = `assets/pubpaid/traffic/vehicles-v4-reference-pixelart/${vehicle.id}-8f.png?v=20260428px4`;
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
    const src = `assets/pubpaid/traffic/vehicles-v4-reference-pixelart/${vehicle.id}-8f.png?v=20260428px4`;
    const y = index % 2 ? 100 : 32;
    const dir = index % 2 ? "left" : "right";
    const duration = vehicle.kind === "moto" ? 5.2 + (index % 4) * 0.25 : 6.8 + (index % 4) * 0.3;
    return `<div class="runner ${dir} ${vehicle.kind}" style="--top:${y}px; --delay:${-(index * 0.52).toFixed(2)}s; --duration:${duration}s; background-image:url('${src}')"></div>`;
  }).join("");

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PubPaid 2.0 | Tráfego pixel art V4</title>
  <style>
    :root { --bg:#060810; --panel:#0b111d; --line:#254f63; --ink:#fff0d6; --cyan:#50efff; --mint:#7dffc1; }
    * { box-sizing:border-box; }
    body { margin:0; min-height:100vh; background:#060810; color:var(--ink); font-family:Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    header, main { width:min(1220px, calc(100% - 32px)); margin:0 auto; }
    header { padding:28px 0 16px; }
    .eyebrow { color:var(--cyan); font:800 12px/1.2 "Courier New", monospace; letter-spacing:3px; text-transform:uppercase; }
    h1 { margin:10px 0; max-width:920px; font-size:clamp(34px, 5vw, 66px); line-height:.96; letter-spacing:0; }
    p { max-width:890px; color:#c8d9e8; line-height:1.55; }
    .chips { display:flex; flex-wrap:wrap; gap:9px; margin-top:16px; }
    .chips span { border:1px solid var(--line); border-radius:8px; padding:8px 10px; background:#07101c; color:#e3f6ff; font-size:13px; }
    .street { position:relative; overflow:hidden; height:270px; border:1px solid var(--line); border-radius:8px; margin:18px 0; background:linear-gradient(#111927 0 32%, #080b12 32% 100%); }
    .street:before { content:""; position:absolute; left:0; right:0; top:88px; height:3px; background:repeating-linear-gradient(90deg, rgba(255,240,214,.78) 0 46px, transparent 46px 90px); opacity:.55; }
    .label { position:absolute; left:14px; top:12px; z-index:8; color:#bce8f2; font:800 12px/1 "Courier New", monospace; letter-spacing:2px; text-transform:uppercase; }
    .runner, .sprite { width:${FRAME_W}px; height:${FRAME_H}px; background-repeat:no-repeat; background-size:${FRAME_W * TOTAL_FRAMES}px ${FRAME_H}px; image-rendering:pixelated; image-rendering:crisp-edges; }
    .runner { position:absolute; top:var(--top); left:-650px; z-index:4; scale:.62; transform-origin:left top; animation:driveRight var(--duration) linear infinite; animation-delay:var(--delay); }
    .runner.left { left:auto; right:-650px; animation-name:driveLeft; }
    @keyframes driveRight { from { translate:-650px 0; } to { translate:calc(100vw + 760px) 0; } }
    @keyframes driveLeft { from { translate:650px 0; } to { translate:calc(-100vw - 760px) 0; } }
    .files { border:1px solid var(--line); border-radius:8px; background:#07101c; padding:14px; margin-bottom:16px; }
    code { color:var(--mint); overflow-wrap:anywhere; }
    .grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:14px; padding-bottom:34px; }
    .card { border:1px solid var(--line); border-radius:8px; background:#07101c; padding:12px; }
    .card-head { display:flex; justify-content:space-between; gap:12px; align-items:start; min-height:42px; }
    .card-head span { color:var(--mint); font:800 11px/1.2 "Courier New", monospace; letter-spacing:1.5px; text-transform:uppercase; }
    .card-head strong { text-align:right; font-size:15px; }
    .card-stage { display:grid; grid-template-columns:1fr; gap:8px; min-height:222px; overflow:hidden; background:#03070f; border-radius:8px; margin-top:10px; padding:4px; place-items:center; }
    .sprite { scale:.48; transform-origin:center; }
    .sprite.left { margin-top:-120px; }
    @media (max-width:720px) {
      header, main { width:min(100% - 18px, 1220px); }
      .runner { scale:.46; }
      .sprite { scale:.4; }
      .card-head { flex-direction:column; }
      .card-head strong { text-align:left; }
    }
  </style>
</head>
<body>
  <header>
    <div class="eyebrow">PubPaid 2.0 - pixel art V4</div>
    <h1>Referência obedecida: sprite lateral, contorno forte e rodas grandes.</h1>
    <p>Esta versão usa a referência enviada como direção visual: veículos laterais de sprite comercial, blocos aparentes, contorno preto, highlights duros, motos com piloto integrado e quatro frames de roda para cada direção.</p>
    <div class="chips">
      <span>${vehicles.length} variações</span>
      <span>4 frames direita + 4 esquerda</span>
      <span>base ${BASE_W}x${BASE_H}</span>
      <span>PNG sheets, sem desenho no navegador</span>
    </div>
  </header>
  <main>
    <section class="street">
      <div class="label">Rua teste - V4 referencia visual</div>
      ${runners}
    </section>
    <section class="files">
      <p>Atlas: <code>assets/pubpaid/traffic/pubpaid-traffic-vehicles-reference-8f-v4.png</code></p>
      <p>Manifesto: <code>assets/pubpaid/traffic/pubpaid-traffic-vehicles-reference-8f-v4.json</code></p>
      <p>Sheets individuais: <code>assets/pubpaid/traffic/vehicles-v4-reference-pixelart/*-8f.png</code></p>
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
  fs.mkdirSync(INDIVIDUAL_DIR, { recursive: true });
  const sheets = vehicles.map((vehicle) => {
    const sheet = buildVehicleSheet(vehicle);
    writePng(path.join(INDIVIDUAL_DIR, `${vehicle.id}-8f.png`), sheet);
    return sheet;
  });
  writePng(path.join(OUT_DIR, "pubpaid-traffic-vehicles-reference-8f-v4.png"), buildAtlas(sheets));
  writePng(path.join(OUT_DIR, "pubpaid-traffic-vehicles-reference-8f-v4-preview.png"), buildPreview(sheets));
  fs.writeFileSync(path.join(OUT_DIR, "pubpaid-traffic-vehicles-reference-8f-v4.json"), JSON.stringify({
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
    source: "scripts/generate-pubpaid-traffic-pixelart-v4.js",
    visualReferenceRule: "Quando o usuario falar estilo visual para veiculos PubPaid, usar pixel art lateral tipo sprite comercial: contorno preto grosso, rodas grandes, highlights blocados e motorista integrado nas motos. Nao copiar assets de bancos de imagem.",
    atlas: "assets/pubpaid/traffic/pubpaid-traffic-vehicles-reference-8f-v4.png",
    individualDir: "assets/pubpaid/traffic/vehicles-v4-reference-pixelart",
    vehicles: vehicles.map((vehicle, row) => ({
      id: vehicle.id,
      label: vehicle.label,
      kind: vehicle.kind,
      row,
      framesPerDirection: DIR_FRAMES,
      speed: vehicle.speed,
      scale: vehicle.scale,
      hitbox: vehicle.hitbox,
      sheet: `assets/pubpaid/traffic/vehicles-v4-reference-pixelart/${vehicle.id}-8f.png`
    }))
  }, null, 2));
  fs.writeFileSync(path.join(ROOT, "pubpaid-traffic-sprites-demo.html"), buildHtml());
  console.log(`pixel-art v4 generated: ${vehicles.length} vehicles, ${DIR_FRAMES} frames per direction`);
}

main();
