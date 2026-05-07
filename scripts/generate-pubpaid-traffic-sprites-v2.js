const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "assets", "pubpaid", "traffic");
const INDIVIDUAL_DIR = path.join(OUT_DIR, "vehicles-v2");
const FRAME_WIDTH = 320;
const FRAME_HEIGHT = 160;
const FRAMES = 5;

const vehicles = [
  {
    id: "teal_hatch_v2",
    label: "Compacto teal sem corte",
    kind: "car",
    body: "#1cc7c7",
    bodyDark: "#087c89",
    trim: "#d9fff7",
    glass: "#92f7ff",
    accent: "#ffdd7a",
    type: "hatch",
    speed: 3.3,
    scale: 0.86,
    hitbox: { width: 196, height: 58 }
  },
  {
    id: "amber_sedan_v2",
    label: "Sedan âmbar inteiro",
    kind: "car",
    body: "#ffb545",
    bodyDark: "#ad6322",
    trim: "#fff0b8",
    glass: "#8feaff",
    accent: "#ff5f6d",
    type: "sedan",
    speed: 3.15,
    scale: 0.9,
    hitbox: { width: 216, height: 56 }
  },
  {
    id: "magenta_city_v2",
    label: "City car magenta",
    kind: "car",
    body: "#ef4aa8",
    bodyDark: "#8f225f",
    trim: "#ffe1f5",
    glass: "#b4f6ff",
    accent: "#70ffbd",
    type: "city",
    speed: 3.55,
    scale: 0.84,
    hitbox: { width: 174, height: 58 }
  },
  {
    id: "blue_coupe_v2",
    label: "Cupê azul neon",
    kind: "car",
    body: "#377cff",
    bodyDark: "#1e327d",
    trim: "#d7e6ff",
    glass: "#9af9ff",
    accent: "#ffd35f",
    type: "coupe",
    speed: 3.25,
    scale: 0.88,
    hitbox: { width: 212, height: 52 }
  },
  {
    id: "pixel_taxi_v2",
    label: "Táxi pixel inteiro",
    kind: "car",
    body: "#ffd95a",
    bodyDark: "#9d751d",
    trim: "#fff7bf",
    glass: "#a7f2ff",
    accent: "#20233a",
    type: "taxi",
    speed: 3.05,
    scale: 0.9,
    hitbox: { width: 218, height: 56 }
  },
  {
    id: "dark_premium_v2",
    label: "Premium escuro largo",
    kind: "car",
    body: "#343c60",
    bodyDark: "#131827",
    trim: "#dce7ff",
    glass: "#79dcff",
    accent: "#ff65c8",
    type: "premium",
    speed: 3.8,
    scale: 0.93,
    hitbox: { width: 232, height: 54 }
  },
  {
    id: "navy_scooter_rider_v2",
    label: "Scooter navy com piloto",
    kind: "moto",
    body: "#3759b7",
    bodyDark: "#172052",
    trim: "#dce7ff",
    glass: "#7cecff",
    accent: "#ffd466",
    rider: "#ffe3b0",
    helmet: "#6ee7ff",
    jacket: "#f45ba6",
    type: "scooter",
    speed: 4.2,
    scale: 0.88,
    hitbox: { width: 160, height: 72 }
  },
  {
    id: "purple_sport_rider_v2",
    label: "Moto sport roxa com piloto",
    kind: "moto",
    body: "#9b5cff",
    bodyDark: "#40246f",
    trim: "#f4dcff",
    glass: "#8ff5ff",
    accent: "#7cffb2",
    rider: "#f1c08d",
    helmet: "#21182f",
    jacket: "#7cffb2",
    type: "sport",
    speed: 4.65,
    scale: 0.9,
    hitbox: { width: 178, height: 70 }
  },
  {
    id: "black_cruiser_rider_v2",
    label: "Cruiser preta com piloto",
    kind: "moto",
    body: "#252a38",
    bodyDark: "#070910",
    trim: "#d6d9e8",
    glass: "#8cecff",
    accent: "#ffcf68",
    rider: "#c88658",
    helmet: "#ffcf68",
    jacket: "#475575",
    type: "cruiser",
    speed: 3.9,
    scale: 0.92,
    hitbox: { width: 190, height: 72 }
  },
  {
    id: "delivery_moto_rider_v2",
    label: "Moto delivery com piloto e baú",
    kind: "moto",
    body: "#1dcf8f",
    bodyDark: "#0c6b52",
    trim: "#eafff6",
    glass: "#97fbff",
    accent: "#ff7a45",
    rider: "#efb27d",
    helmet: "#ff7a45",
    jacket: "#26314e",
    type: "delivery",
    speed: 3.7,
    scale: 0.9,
    hitbox: { width: 188, height: 76 }
  }
];

class PixelSurface {
  constructor(width, height, background = [0, 0, 0, 0]) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        this.set(x, y, background);
      }
    }
  }

  set(x, y, color) {
    const px = Math.round(x);
    const py = Math.round(y);
    if (px < 0 || py < 0 || px >= this.width || py >= this.height) return;
    const [r, g, b, a = 255] = colorToRgba(color);
    const index = (py * this.width + px) * 4;
    const existingA = this.data[index + 3] / 255;
    const nextA = a / 255;
    const outA = nextA + existingA * (1 - nextA);
    if (outA <= 0) {
      this.data[index] = 0;
      this.data[index + 1] = 0;
      this.data[index + 2] = 0;
      this.data[index + 3] = 0;
      return;
    }
    this.data[index] = Math.round((r * nextA + this.data[index] * existingA * (1 - nextA)) / outA);
    this.data[index + 1] = Math.round((g * nextA + this.data[index + 1] * existingA * (1 - nextA)) / outA);
    this.data[index + 2] = Math.round((b * nextA + this.data[index + 2] * existingA * (1 - nextA)) / outA);
    this.data[index + 3] = Math.round(outA * 255);
  }

  rect(x, y, width, height, color) {
    for (let yy = Math.round(y); yy < Math.round(y + height); yy += 1) {
      for (let xx = Math.round(x); xx < Math.round(x + width); xx += 1) {
        this.set(xx, yy, color);
      }
    }
  }

  strokeRect(x, y, width, height, color, thickness = 2) {
    this.rect(x, y, width, thickness, color);
    this.rect(x, y + height - thickness, width, thickness, color);
    this.rect(x, y, thickness, height, color);
    this.rect(x + width - thickness, y, thickness, height, color);
  }

  polygon(points, color) {
    const minY = Math.floor(Math.min(...points.map((p) => p[1])));
    const maxY = Math.ceil(Math.max(...points.map((p) => p[1])));
    for (let y = minY; y <= maxY; y += 1) {
      const nodes = [];
      for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
        const [xi, yi] = points[i];
        const [xj, yj] = points[j];
        if ((yi < y && yj >= y) || (yj < y && yi >= y)) {
          nodes.push(xi + ((y - yi) / (yj - yi)) * (xj - xi));
        }
      }
      nodes.sort((a, b) => a - b);
      for (let k = 0; k < nodes.length; k += 2) {
        if (nodes[k + 1] === undefined) break;
        for (let x = Math.ceil(nodes[k]); x <= Math.floor(nodes[k + 1]); x += 1) {
          this.set(x, y, color);
        }
      }
    }
  }

  ellipse(cx, cy, rx, ry, color) {
    const minX = Math.floor(cx - rx);
    const maxX = Math.ceil(cx + rx);
    const minY = Math.floor(cy - ry);
    const maxY = Math.ceil(cy + ry);
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1) {
          this.set(x, y, color);
        }
      }
    }
  }

  line(x0, y0, x1, y1, color, thickness = 1) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    if (steps === 0) {
      this.rect(x0, y0, thickness, thickness, color);
      return;
    }
    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      this.ellipse(x, y, thickness / 2, thickness / 2, color);
    }
  }

  blit(src, dx, dy) {
    for (let y = 0; y < src.height; y += 1) {
      for (let x = 0; x < src.width; x += 1) {
        const index = (y * src.width + x) * 4;
        const a = src.data[index + 3];
        if (!a) continue;
        this.set(dx + x, dy + y, [
          src.data[index],
          src.data[index + 1],
          src.data[index + 2],
          a
        ]);
      }
    }
  }
}

function colorToRgba(color) {
  if (Array.isArray(color)) return color;
  const hex = color.replace("#", "");
  if (hex.length === 3) {
    return [
      parseInt(hex[0] + hex[0], 16),
      parseInt(hex[1] + hex[1], 16),
      parseInt(hex[2] + hex[2], 16),
      255
    ];
  }
  if (hex.length === 8) {
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
      parseInt(hex.slice(6, 8), 16)
    ];
  }
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
    255
  ];
}

function shade(hex, amount) {
  const [r, g, b] = colorToRgba(hex);
  const clamp = (value) => Math.max(0, Math.min(255, Math.round(value)));
  return [
    clamp(r + amount),
    clamp(g + amount),
    clamp(b + amount),
    255
  ];
}

function alpha(hex, value) {
  const [r, g, b] = colorToRgba(hex);
  return [r, g, b, Math.round(255 * value)];
}

function drawPixelHighlights(surface, points, color) {
  points.forEach(([x, y, w, h]) => surface.rect(x, y, w, h, color));
}

function drawWheel(surface, cx, cy, radius, frame, palette = {}) {
  const tire = palette.tire || "#090b13";
  const tireLight = palette.tireLight || "#252b3b";
  const rim = palette.rim || "#c8d0dc";
  const rimDark = palette.rimDark || "#596271";
  const glow = palette.glow || "#64f5ff";
  surface.ellipse(cx + 2, cy + 2, radius + 5, Math.max(4, radius * 0.78), [0, 0, 0, 110]);
  surface.ellipse(cx, cy, radius + 2, radius + 2, tire);
  surface.ellipse(cx, cy, radius, radius, tireLight);
  surface.ellipse(cx, cy, radius - 4, radius - 4, "#10131d");
  surface.ellipse(cx, cy, radius - 7, radius - 7, rimDark);
  surface.ellipse(cx, cy, radius - 11, radius - 11, rim);
  surface.ellipse(cx, cy, Math.max(3, radius - 17), Math.max(3, radius - 17), "#20273a");

  const angleOffset = (Math.PI * 2 * frame) / FRAMES;
  for (let spoke = 0; spoke < 5; spoke += 1) {
    const angle = angleOffset + (Math.PI * 2 * spoke) / 5;
    const x1 = cx + Math.cos(angle) * 4;
    const y1 = cy + Math.sin(angle) * 4;
    const x2 = cx + Math.cos(angle) * (radius - 8);
    const y2 = cy + Math.sin(angle) * (radius - 8);
    surface.line(x1, y1, x2, y2, spoke % 2 ? rimDark : rim, 2);
  }
  surface.rect(cx - radius + 4, cy - radius - 3, radius * 2 - 8, 2, alpha(glow, 0.28));
  surface.rect(cx - radius + 10, cy + radius + 1, radius * 2 - 20, 2, alpha(glow, 0.14));
}

function drawDriverInCar(surface, x, y, spec) {
  surface.ellipse(x, y, 8, 9, "#24202a");
  surface.rect(x - 6, y + 8, 14, 10, "#151a27");
  surface.rect(x - 3, y - 2, 5, 5, alpha(spec.accent, 0.5));
}

function drawCar(surface, spec, frame) {
  const bob = Math.round(Math.sin((frame / FRAMES) * Math.PI * 2) * 1);
  const baseY = 118 + bob;
  const left = spec.type === "city" ? 70 : spec.type === "premium" ? 42 : 52;
  const right = spec.type === "city" ? 250 : spec.type === "premium" ? 284 : 270;
  const wheelA = spec.type === "city" ? 108 : spec.type === "premium" ? 90 : 96;
  const wheelB = spec.type === "city" ? 212 : spec.type === "premium" ? 242 : 226;
  const wheelRadius = spec.type === "premium" ? 19 : 18;

  surface.ellipse(160, 130, (right - left) / 2 + 18, 11, [0, 0, 0, 95]);
  drawWheel(surface, wheelA, baseY, wheelRadius, frame, { glow: spec.glass });
  drawWheel(surface, wheelB, baseY, wheelRadius, frame + 2, { glow: spec.accent });

  surface.polygon([
    [left + 10, baseY - 30],
    [left + 28, baseY - 50],
    [right - 30, baseY - 50],
    [right - 8, baseY - 30],
    [right, baseY - 15],
    [right - 16, baseY - 8],
    [left + 14, baseY - 8],
    [left, baseY - 18]
  ], spec.bodyDark);
  surface.polygon([
    [left + 6, baseY - 38],
    [left + 32, baseY - 62],
    [right - 48, baseY - 62],
    [right - 14, baseY - 38],
    [right - 6, baseY - 18],
    [left + 10, baseY - 18]
  ], spec.body);
  surface.rect(left + 22, baseY - 20, right - left - 44, 13, shade(spec.bodyDark, -15));
  surface.rect(left + 38, baseY - 64, right - left - 88, 7, shade(spec.body, 35));
  surface.rect(left + 22, baseY - 40, 14, 8, shade(spec.body, 42));
  surface.rect(right - 33, baseY - 40, 18, 8, shade(spec.bodyDark, -18));

  const cabinStart = spec.type === "coupe" ? left + 72 : left + 62;
  const cabinEnd = spec.type === "city" ? right - 50 : right - 68;
  surface.polygon([
    [cabinStart, baseY - 60],
    [cabinStart + 28, baseY - 84],
    [cabinEnd - 20, baseY - 84],
    [cabinEnd + 20, baseY - 60]
  ], "#182135");
  surface.polygon([
    [cabinStart + 8, baseY - 61],
    [cabinStart + 31, baseY - 79],
    [cabinStart + 64, baseY - 79],
    [cabinStart + 56, baseY - 61]
  ], spec.glass);
  surface.polygon([
    [cabinStart + 70, baseY - 61],
    [cabinStart + 78, baseY - 79],
    [cabinEnd - 22, baseY - 79],
    [cabinEnd + 9, baseY - 61]
  ], shade(spec.glass, -36));
  drawDriverInCar(surface, cabinStart + 92, baseY - 71, spec);
  surface.line(cabinStart + 66, baseY - 80, cabinStart + 62, baseY - 59, "#060811", 3);

  surface.rect(left + 4, baseY - 25, 16, 8, spec.accent);
  surface.rect(right - 18, baseY - 25, 12, 8, "#ff5e6f");
  surface.rect(left + 48, baseY - 12, 38, 4, alpha(spec.glass, 0.45));
  surface.rect(right - 92, baseY - 12, 52, 4, alpha(spec.glass, 0.32));
  surface.rect(right - 26, baseY - 12, 13, 5, spec.trim);

  if (spec.type === "taxi") {
    surface.rect(142, baseY - 94, 44, 14, "#151515");
    surface.rect(150, baseY - 91, 28, 8, "#ffe572");
    surface.rect(88, baseY - 51, 36, 8, "#1d1d23");
    surface.rect(129, baseY - 51, 13, 8, "#ffe572");
  }
  if (spec.type === "premium") {
    surface.rect(left + 58, baseY - 27, 128, 5, "#121622");
    surface.rect(left + 62, baseY - 24, 12, 3, spec.accent);
    surface.rect(right - 70, baseY - 24, 22, 3, alpha(spec.glass, 0.55));
  }
  drawPixelHighlights(surface, [
    [left + 42, baseY - 54, 46, 3],
    [right - 96, baseY - 53, 42, 3],
    [left + 22, baseY - 33, 38, 3],
    [right - 78, baseY - 33, 24, 3]
  ], alpha("#ffffff", 0.24));
}

function drawMotoRider(surface, spec, anchorX, anchorY, frame) {
  const bob = Math.round(Math.sin((frame / FRAMES) * Math.PI * 2) * 2);
  const lean = spec.type === "sport" ? -10 : spec.type === "cruiser" ? 7 : -4;
  const hipX = anchorX + lean;
  const hipY = anchorY - 44 + bob;
  const shoulderX = hipX + (spec.type === "sport" ? 18 : spec.type === "cruiser" ? -2 : 10);
  const shoulderY = hipY - 28;

  surface.line(hipX, hipY, shoulderX, shoulderY, spec.jacket, 10);
  surface.rect(shoulderX - 9, shoulderY - 3, 20, 16, spec.jacket);
  surface.ellipse(shoulderX + 9, shoulderY - 18, 13, 13, spec.helmet);
  surface.rect(shoulderX + 10, shoulderY - 20, 10, 4, spec.glass);
  surface.rect(shoulderX + 4, shoulderY - 7, 7, 6, spec.rider);
  surface.line(shoulderX + 7, shoulderY + 4, anchorX + 54, anchorY - 48, spec.jacket, 5);
  surface.line(shoulderX - 2, shoulderY + 5, anchorX + 28, anchorY - 43, spec.jacket, 4);
  surface.line(hipX - 4, hipY + 7, anchorX - 22, anchorY - 16, "#1a1d2d", 7);
  surface.line(hipX + 8, hipY + 7, anchorX + 42, anchorY - 12, "#1a1d2d", 7);
  surface.rect(anchorX - 30, anchorY - 14, 18, 6, "#070910");
  surface.rect(anchorX + 36, anchorY - 12, 20, 6, "#070910");
}

function drawMotorcycle(surface, spec, frame) {
  const bob = Math.round(Math.sin((frame / FRAMES) * Math.PI * 2) * 1);
  const baseY = 119 + bob;
  const rearX = spec.type === "scooter" ? 100 : spec.type === "cruiser" ? 91 : 96;
  const frontX = spec.type === "scooter" ? 222 : spec.type === "cruiser" ? 238 : 230;
  const radius = spec.type === "scooter" ? 17 : 20;
  const centerX = (rearX + frontX) / 2;

  surface.ellipse(centerX, 132, (frontX - rearX) / 2 + 34, 9, [0, 0, 0, 95]);
  drawWheel(surface, rearX, baseY, radius, frame, { rim: spec.trim, glow: spec.accent });
  drawWheel(surface, frontX, baseY, radius, frame + 2, { rim: spec.trim, glow: spec.glass });

  surface.line(rearX, baseY - 14, centerX - 18, baseY - 48, spec.bodyDark, 6);
  surface.line(centerX - 18, baseY - 48, frontX - 12, baseY - 18, spec.bodyDark, 6);
  surface.line(rearX + 8, baseY - 18, frontX - 10, baseY - 18, "#151827", 5);
  surface.line(frontX - 12, baseY - 18, frontX + 22, baseY - 60, "#161b28", 5);
  surface.line(frontX + 22, baseY - 60, frontX + 40, baseY - 57, spec.trim, 3);
  surface.rect(centerX - 42, baseY - 57, 70, 22, spec.body);
  surface.polygon([
    [centerX - 44, baseY - 48],
    [centerX - 10, baseY - 68],
    [centerX + 42, baseY - 57],
    [centerX + 30, baseY - 36],
    [centerX - 44, baseY - 34]
  ], spec.body);
  surface.rect(centerX - 34, baseY - 35, 52, 8, spec.bodyDark);
  surface.rect(centerX + 24, baseY - 55, 20, 9, spec.accent);

  if (spec.type === "scooter") {
    surface.rect(centerX - 56, baseY - 61, 34, 34, spec.bodyDark);
    surface.rect(centerX - 50, baseY - 67, 25, 12, spec.body);
    surface.rect(frontX + 14, baseY - 58, 16, 16, spec.glass);
  }
  if (spec.type === "delivery") {
    surface.rect(rearX - 52, baseY - 74, 44, 36, spec.accent);
    surface.strokeRect(rearX - 52, baseY - 74, 44, 36, "#33140a", 3);
    surface.rect(rearX - 44, baseY - 64, 28, 6, "#fff0cc");
  }
  if (spec.type === "cruiser") {
    surface.rect(centerX - 60, baseY - 48, 36, 10, spec.trim);
    surface.line(frontX - 14, baseY - 20, frontX + 22, baseY - 45, spec.trim, 3);
  }
  if (spec.type === "sport") {
    surface.polygon([
      [centerX + 8, baseY - 64],
      [centerX + 64, baseY - 55],
      [centerX + 50, baseY - 35],
      [centerX + 18, baseY - 37]
    ], shade(spec.body, 18));
  }

  drawMotoRider(surface, spec, centerX - 8, baseY - 4, frame);
  surface.rect(frontX + 31, baseY - 57, 10, 6, spec.accent);
  surface.rect(rearX - 30, baseY - 39, 9, 7, "#ff6071");
  drawPixelHighlights(surface, [
    [centerX - 28, baseY - 57, 28, 3],
    [centerX + 15, baseY - 51, 22, 3],
    [frontX - 8, baseY - 26, 19, 3]
  ], alpha("#ffffff", 0.22));
}

function drawFrame(spec, frame) {
  const surface = new PixelSurface(FRAME_WIDTH, FRAME_HEIGHT);
  if (spec.kind === "car") drawCar(surface, spec, frame);
  else drawMotorcycle(surface, spec, frame);
  return surface;
}

function crc32(buffer) {
  let crc = ~0;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([len, typeBuffer, data, crc]);
}

function encodePng(surface) {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(surface.width, 0);
  ihdr.writeUInt32BE(surface.height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc((surface.width * 4 + 1) * surface.height);
  for (let y = 0; y < surface.height; y += 1) {
    const rowStart = y * (surface.width * 4 + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < surface.width; x += 1) {
      const src = (y * surface.width + x) * 4;
      const dst = rowStart + 1 + x * 4;
      raw[dst] = surface.data[src];
      raw[dst + 1] = surface.data[src + 1];
      raw[dst + 2] = surface.data[src + 2];
      raw[dst + 3] = surface.data[src + 3];
    }
  }

  return Buffer.concat([
    header,
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

function writeSurface(filePath, surface) {
  fs.writeFileSync(filePath, encodePng(surface));
}

function buildIndividualSheet(spec) {
  const sheet = new PixelSurface(FRAME_WIDTH * FRAMES, FRAME_HEIGHT);
  for (let frame = 0; frame < FRAMES; frame += 1) {
    sheet.blit(drawFrame(spec, frame), frame * FRAME_WIDTH, 0);
  }
  return sheet;
}

function buildAtlas(sheets) {
  const atlas = new PixelSurface(FRAME_WIDTH * FRAMES, FRAME_HEIGHT * vehicles.length);
  sheets.forEach((sheet, row) => atlas.blit(sheet, 0, row * FRAME_HEIGHT));
  return atlas;
}

function buildPreview(sheets) {
  const gutter = 18;
  const labelH = 18;
  const previewScale = 1;
  const width = FRAME_WIDTH * FRAMES + gutter * 2;
  const height = (FRAME_HEIGHT + labelH + gutter) * sheets.length + gutter;
  const preview = new PixelSurface(width, height, [8, 11, 20, 255]);
  sheets.forEach((sheet, index) => {
    const y = gutter + index * (FRAME_HEIGHT + labelH + gutter) + labelH;
    preview.rect(gutter - 2, y - 2, FRAME_WIDTH * FRAMES + 4, FRAME_HEIGHT + 4, [28, 39, 61, 255]);
    preview.blit(sheet, gutter, y);
    for (let frame = 1; frame < FRAMES; frame += 1) {
      preview.rect(gutter + frame * FRAME_WIDTH - 1, y, 2, FRAME_HEIGHT, [80, 239, 255, 70]);
    }
    drawTinyText(preview, gutter, y - 14, `${index + 1}. ${vehicles[index].label}`, [224, 242, 255, 255]);
  });
  return preview;
}

const FONT = {
  A: ["111", "101", "111", "101", "101"],
  B: ["110", "101", "110", "101", "110"],
  C: ["111", "100", "100", "100", "111"],
  D: ["110", "101", "101", "101", "110"],
  E: ["111", "100", "110", "100", "111"],
  F: ["111", "100", "110", "100", "100"],
  G: ["111", "100", "101", "101", "111"],
  H: ["101", "101", "111", "101", "101"],
  I: ["111", "010", "010", "010", "111"],
  J: ["001", "001", "001", "101", "111"],
  K: ["101", "101", "110", "101", "101"],
  L: ["100", "100", "100", "100", "111"],
  M: ["101", "111", "111", "101", "101"],
  N: ["101", "111", "111", "111", "101"],
  O: ["111", "101", "101", "101", "111"],
  P: ["111", "101", "111", "100", "100"],
  Q: ["111", "101", "101", "111", "001"],
  R: ["110", "101", "110", "101", "101"],
  S: ["111", "100", "111", "001", "111"],
  T: ["111", "010", "010", "010", "010"],
  U: ["101", "101", "101", "101", "111"],
  V: ["101", "101", "101", "101", "010"],
  W: ["101", "101", "111", "111", "101"],
  X: ["101", "101", "010", "101", "101"],
  Y: ["101", "101", "010", "010", "010"],
  Z: ["111", "001", "010", "100", "111"],
  "0": ["111", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "111"],
  "2": ["111", "001", "111", "100", "111"],
  "3": ["111", "001", "111", "001", "111"],
  "4": ["101", "101", "111", "001", "001"],
  "5": ["111", "100", "111", "001", "111"],
  "6": ["111", "100", "111", "101", "111"],
  "7": ["111", "001", "010", "010", "010"],
  "8": ["111", "101", "111", "101", "111"],
  "9": ["111", "101", "111", "001", "111"],
  ".": ["000", "000", "000", "000", "010"],
  "-": ["000", "000", "111", "000", "000"],
  " ": ["000", "000", "000", "000", "000"]
};

function drawTinyText(surface, x, y, text, color) {
  const normalized = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  let cursor = x;
  for (const char of normalized) {
    const glyph = FONT[char] || FONT[" "];
    glyph.forEach((row, yy) => {
      [...row].forEach((pixel, xx) => {
        if (pixel === "1") surface.rect(cursor + xx * 2, y + yy * 2, 2, 2, color);
      });
    });
    cursor += 8;
  }
}

function buildHtml() {
  const cards = vehicles.map((vehicle) => {
    const src = `assets/pubpaid/traffic/vehicles-v2/${vehicle.id}-5f.png?v=20260428v2`;
    return `
        <article class="vehicle-card" data-kind="${vehicle.kind}">
          <div class="vehicle-card__head">
            <span>${vehicle.kind === "car" ? "Carro" : "Moto + piloto"}</span>
            <strong>${vehicle.label}</strong>
          </div>
          <div class="sprite-stage">
            <div class="sprite" data-sheet="${src}" style="background-image:url('${src}')"></div>
          </div>
          <dl>
            <div><dt>Frames</dt><dd>5, rodas animadas dentro da imagem</dd></div>
            <div><dt>Corte</dt><dd>frame ${FRAME_WIDTH}x${FRAME_HEIGHT}, com margem transparente</dd></div>
          </dl>
        </article>`;
  }).join("");

  const laneItems = vehicles.map((vehicle, index) => {
    const src = `assets/pubpaid/traffic/vehicles-v2/${vehicle.id}-5f.png?v=20260428v2`;
    const y = index % 2 === 0 ? 52 : 134;
    const delay = -(index * 0.73).toFixed(2);
    const duration = vehicle.kind === "moto" ? 5.2 + (index % 3) * 0.4 : 6.8 + (index % 4) * 0.45;
    return `<div class="lane-vehicle ${vehicle.kind}" data-direction="${index % 2 === 0 ? "right" : "left"}" data-sheet="${src}" style="--lane-y:${y}px; --delay:${delay}s; --duration:${duration}s; background-image:url('${src}')"></div>`;
  }).join("");

  const manifest = {
    frameWidth: FRAME_WIDTH,
    frameHeight: FRAME_HEIGHT,
    framesPerVehicle: FRAMES,
    atlas: "assets/pubpaid/traffic/pubpaid-traffic-vehicles-5f-v2.png",
    vehicles
  };

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PubPaid 2.0 | Demo sprites de tráfego v2</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #070a12;
      --panel: #101726;
      --line: rgba(116, 239, 255, .32);
      --cyan: #50efff;
      --mint: #71ffbb;
      --cream: #fff2d7;
      --muted: #9eb7cc;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background:
        radial-gradient(circle at 15% 10%, rgba(80, 239, 255, .14), transparent 28rem),
        radial-gradient(circle at 84% 12%, rgba(255, 76, 184, .12), transparent 25rem),
        linear-gradient(180deg, #050812 0%, #0a0d16 52%, #05070c 100%);
      color: var(--cream);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    header, main {
      width: min(1180px, calc(100% - 32px));
      margin: 0 auto;
    }
    header {
      padding: 28px 0 18px;
    }
    .eyebrow {
      color: var(--cyan);
      font: 800 12px/1.2 "Courier New", monospace;
      letter-spacing: 3px;
      text-transform: uppercase;
    }
    h1 {
      margin: 10px 0 10px;
      max-width: 900px;
      font-size: clamp(34px, 5vw, 68px);
      line-height: .94;
      letter-spacing: 0;
    }
    .lead {
      max-width: 820px;
      color: #c6d9ed;
      font-size: 17px;
      line-height: 1.55;
    }
    .hud {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 18px;
    }
    .hud span {
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 9px 12px;
      background: rgba(6, 11, 22, .72);
      color: #dcefff;
      font-size: 13px;
    }
    .street-demo {
      position: relative;
      overflow: hidden;
      height: 260px;
      margin: 18px 0 22px;
      border: 1px solid rgba(80, 239, 255, .28);
      border-radius: 8px;
      background:
        linear-gradient(180deg, rgba(19, 28, 44, .98) 0 25%, rgba(11, 14, 21, .98) 25% 100%),
        #0b0e15;
      box-shadow: 0 18px 80px rgba(0, 0, 0, .38);
    }
    .street-demo::before {
      content: "";
      position: absolute;
      inset: 78px 0 auto;
      height: 2px;
      background: repeating-linear-gradient(90deg, rgba(255, 242, 215, .86) 0 54px, transparent 54px 96px);
      opacity: .52;
    }
    .street-demo::after {
      content: "";
      position: absolute;
      inset: auto 0 0;
      height: 84px;
      background:
        linear-gradient(90deg, rgba(80,239,255,.08), rgba(255,79,184,.08), rgba(255,207,104,.08)),
        repeating-linear-gradient(90deg, rgba(255,255,255,.04) 0 1px, transparent 1px 48px);
      opacity: .8;
    }
    .lane-label {
      position: absolute;
      left: 16px;
      top: 14px;
      z-index: 3;
      color: var(--muted);
      font: 700 12px/1 "Courier New", monospace;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .lane-vehicle {
      position: absolute;
      left: -360px;
      top: var(--lane-y);
      z-index: 2;
      width: ${FRAME_WIDTH}px;
      height: ${FRAME_HEIGHT}px;
      background-repeat: no-repeat;
      background-size: ${FRAME_WIDTH * FRAMES}px ${FRAME_HEIGHT}px;
      image-rendering: pixelated;
      transform: translateX(-340px);
      animation: driveRight var(--duration) linear infinite;
      animation-delay: var(--delay);
      filter: drop-shadow(0 18px 14px rgba(0,0,0,.38));
    }
    .lane-vehicle[data-direction="left"] {
      left: auto;
      right: -360px;
      animation-name: driveLeft;
      transform: translateX(340px) scaleX(-1);
    }
    .lane-vehicle.moto { z-index: 4; }
    @keyframes driveRight {
      from { transform: translateX(-360px); }
      to { transform: translateX(calc(100vw + 620px)); }
    }
    @keyframes driveLeft {
      from { transform: translateX(360px) scaleX(-1); }
      to { transform: translateX(calc(-100vw - 620px)) scaleX(-1); }
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 14px;
      padding-bottom: 30px;
    }
    .vehicle-card {
      border: 1px solid rgba(80, 239, 255, .22);
      border-radius: 8px;
      background: rgba(10, 15, 27, .78);
      padding: 14px;
    }
    .vehicle-card__head {
      display: flex;
      justify-content: space-between;
      align-items: start;
      gap: 10px;
      min-height: 44px;
    }
    .vehicle-card__head span {
      color: var(--mint);
      font: 800 11px/1.2 "Courier New", monospace;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .vehicle-card__head strong {
      text-align: right;
      font-size: 15px;
      line-height: 1.25;
    }
    .sprite-stage {
      height: 168px;
      display: grid;
      place-items: center;
      margin: 10px 0;
      border-radius: 8px;
      background:
        linear-gradient(180deg, rgba(255,255,255,.04), transparent),
        repeating-linear-gradient(90deg, rgba(80,239,255,.08) 0 1px, transparent 1px 32px),
        #060912;
      overflow: hidden;
    }
    .sprite {
      width: ${FRAME_WIDTH}px;
      height: ${FRAME_HEIGHT}px;
      background-repeat: no-repeat;
      background-size: ${FRAME_WIDTH * FRAMES}px ${FRAME_HEIGHT}px;
      image-rendering: pixelated;
      filter: drop-shadow(0 16px 10px rgba(0,0,0,.38));
    }
    dl {
      display: grid;
      gap: 8px;
      margin: 0;
    }
    dl div {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      border-top: 1px solid rgba(255,255,255,.08);
      padding-top: 8px;
    }
    dt {
      color: var(--muted);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    dd {
      margin: 0;
      color: #dcefff;
      text-align: right;
      font-size: 12px;
    }
    .atlas {
      margin: 0 0 28px;
      border: 1px solid rgba(80,239,255,.2);
      border-radius: 8px;
      background: rgba(7,10,18,.84);
      padding: 14px;
    }
    .atlas h2 {
      margin: 0 0 8px;
      font-size: 18px;
    }
    .atlas code {
      color: var(--mint);
      overflow-wrap: anywhere;
    }
    @media (max-width: 720px) {
      header, main { width: min(100% - 18px, 1180px); }
      .street-demo { height: 236px; }
      .sprite, .lane-vehicle { transform-origin: center; }
      .sprite-stage { height: 136px; }
      .sprite { scale: .76; }
      .lane-vehicle { scale: .7; }
      .vehicle-card__head { flex-direction: column; }
      .vehicle-card__head strong { text-align: left; }
    }
  </style>
</head>
<body>
  <header>
    <div class="eyebrow">PubPaid 2.0 • Tráfego V2</div>
    <h1>Sprites novos para carros e motos, com rodas em 5 frames.</h1>
    <p class="lead">Pacote feito para avaliação antes de entrar no jogo principal. Cada veículo está inteiro no frame, com margem transparente para evitar cortes. Nas motos, o piloto já faz parte da própria imagem.</p>
    <div class="hud">
      <span>${vehicles.length} veículos refeitos</span>
      <span>${FRAMES} frames por veículo</span>
      <span>${FRAME_WIDTH}x${FRAME_HEIGHT}px por frame</span>
      <span>atlas + sheets individuais</span>
    </div>
  </header>
  <main>
    <section class="street-demo" aria-label="Demonstração dos veículos em movimento">
      <div class="lane-label">Rua de teste • animação real das sheets</div>
      ${laneItems}
    </section>
    <section class="atlas">
      <h2>Arquivos gerados</h2>
      <p>Atlas principal: <code>${manifest.atlas}</code></p>
      <p>Manifesto: <code>assets/pubpaid/traffic/pubpaid-traffic-vehicles-5f-v2.json</code></p>
      <p>Sheets individuais: <code>assets/pubpaid/traffic/vehicles-v2/*-5f.png</code></p>
    </section>
    <section class="grid" aria-label="Todos os sprites animados">
      ${cards}
    </section>
  </main>
  <script>
    const frameWidth = ${FRAME_WIDTH};
    const frames = ${FRAMES};
    let frame = 0;
    function tick() {
      document.querySelectorAll(".sprite, .lane-vehicle").forEach((el) => {
        el.style.backgroundPosition = (-frame * frameWidth) + "px 0";
      });
      frame = (frame + 1) % frames;
    }
    tick();
    setInterval(tick, 115);
  </script>
</body>
</html>`;
}

function main() {
  fs.mkdirSync(INDIVIDUAL_DIR, { recursive: true });
  const sheets = [];
  vehicles.forEach((vehicle) => {
    const sheet = buildIndividualSheet(vehicle);
    sheets.push(sheet);
    writeSurface(path.join(INDIVIDUAL_DIR, `${vehicle.id}-5f.png`), sheet);
  });

  writeSurface(path.join(OUT_DIR, "pubpaid-traffic-vehicles-5f-v2.png"), buildAtlas(sheets));
  writeSurface(path.join(OUT_DIR, "pubpaid-traffic-vehicles-5f-v2-preview.png"), buildPreview(sheets));

  const manifest = {
    frameWidth: FRAME_WIDTH,
    frameHeight: FRAME_HEIGHT,
    framesPerVehicle: FRAMES,
    generatedAt: new Date().toISOString(),
    source: "scripts/generate-pubpaid-traffic-sprites-v2.js",
    note: "V2 de avaliacao: veiculos inteiros, motos com piloto integrado e rodas animadas em cinco frames.",
    atlas: "assets/pubpaid/traffic/pubpaid-traffic-vehicles-5f-v2.png",
    individualDir: "assets/pubpaid/traffic/vehicles-v2",
    vehicles: vehicles.map((vehicle, row) => ({
      id: vehicle.id,
      label: vehicle.label,
      kind: vehicle.kind,
      row,
      frames: FRAMES,
      speed: vehicle.speed,
      scale: vehicle.scale,
      hitbox: vehicle.hitbox,
      sheet: `assets/pubpaid/traffic/vehicles-v2/${vehicle.id}-5f.png`
    }))
  };
  fs.writeFileSync(path.join(OUT_DIR, "pubpaid-traffic-vehicles-5f-v2.json"), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(path.join(ROOT, "pubpaid-traffic-sprites-demo.html"), buildHtml());
  console.log(`generated ${vehicles.length} vehicles with ${FRAMES} frames each`);
  console.log("demo: pubpaid-traffic-sprites-demo.html");
}

main();
