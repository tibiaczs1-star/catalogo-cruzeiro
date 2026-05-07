const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "assets", "pubpaid", "traffic");
const INDIVIDUAL_DIR = path.join(OUT_DIR, "vehicles-v3-pixelart");
const BASE_W = 96;
const BASE_H = 48;
const SCALE = 4;
const FRAME_W = BASE_W * SCALE;
const FRAME_H = BASE_H * SCALE;
const FRAMES = 5;

const transparent = [0, 0, 0, 0];

const vehicles = [
  car("teal_hatch_px_v3", "Compacto teal pixel", "hatch", {
    body: "#20b9bd",
    dark: "#09616c",
    light: "#7ff8e7",
    glass: "#87eaff",
    lamp: "#ffd96a",
    tail: "#ff6176",
    trim: "#e6fff7"
  }, 3.3, 0.82, { width: 202, height: 68 }),
  car("amber_sedan_px_v3", "Sedan ambar pixel", "sedan", {
    body: "#e99b38",
    dark: "#7a3e1d",
    light: "#ffd983",
    glass: "#8bdfff",
    lamp: "#ffe780",
    tail: "#f24c69",
    trim: "#fff1b8"
  }, 3.15, 0.86, { width: 226, height: 68 }),
  car("magenta_city_px_v3", "City magenta pixel", "city", {
    body: "#df438f",
    dark: "#761b50",
    light: "#ff9ad0",
    glass: "#a0f1ff",
    lamp: "#83ffc4",
    tail: "#ff6570",
    trim: "#ffe2f3"
  }, 3.55, 0.78, { width: 178, height: 70 }),
  car("blue_coupe_px_v3", "Coupe azul pixel", "coupe", {
    body: "#3b71df",
    dark: "#17295d",
    light: "#8db0ff",
    glass: "#97f0ff",
    lamp: "#ffe064",
    tail: "#ff4d78",
    trim: "#dce7ff"
  }, 3.25, 0.84, { width: 216, height: 64 }),
  car("pixel_taxi_px_v3", "Taxi pixel", "taxi", {
    body: "#f4c84f",
    dark: "#7c5d1d",
    light: "#fff28d",
    glass: "#9deaff",
    lamp: "#fff0ad",
    tail: "#ff4f62",
    trim: "#10131e"
  }, 3.05, 0.86, { width: 226, height: 68 }),
  car("dark_premium_px_v3", "Premium escuro pixel", "premium", {
    body: "#35415f",
    dark: "#111520",
    light: "#667494",
    glass: "#75d8ff",
    lamp: "#ffd069",
    tail: "#ff60bb",
    trim: "#dce5ff"
  }, 3.8, 0.88, { width: 240, height: 66 }),
  moto("navy_scooter_rider_px_v3", "Scooter navy com piloto", "scooter", {
    body: "#3156b4",
    dark: "#151b4c",
    light: "#6d91ff",
    glass: "#7ceaff",
    lamp: "#ffd96b",
    tail: "#ff596c",
    trim: "#edf2ff",
    skin: "#e6a76f",
    helmet: "#72e9ff",
    jacket: "#d94d8e",
    box: "#303858"
  }, 4.2, 0.84, { width: 172, height: 96 }),
  moto("purple_sport_rider_px_v3", "Moto sport roxa com piloto", "sport", {
    body: "#8758dc",
    dark: "#2e1b5b",
    light: "#be91ff",
    glass: "#8df0ff",
    lamp: "#79ffc0",
    tail: "#ff566c",
    trim: "#eadbff",
    skin: "#d69a69",
    helmet: "#181225",
    jacket: "#74e9a5",
    box: "#2d1b50"
  }, 4.65, 0.86, { width: 188, height: 94 }),
  moto("black_cruiser_rider_px_v3", "Cruiser preta com piloto", "cruiser", {
    body: "#252b39",
    dark: "#070910",
    light: "#566070",
    glass: "#8bedff",
    lamp: "#ffd069",
    tail: "#ff5268",
    trim: "#d8dbe8",
    skin: "#b8744c",
    helmet: "#f4c956",
    jacket: "#414c66",
    box: "#141821"
  }, 3.9, 0.88, { width: 202, height: 96 }),
  moto("delivery_moto_rider_px_v3", "Moto delivery com piloto", "delivery", {
    body: "#21b883",
    dark: "#0b614b",
    light: "#7af0be",
    glass: "#9af4ff",
    lamp: "#ffcf6b",
    tail: "#ff5e6c",
    trim: "#eafff4",
    skin: "#d99a69",
    helmet: "#ff7844",
    jacket: "#27304a",
    box: "#ff7844"
  }, 3.7, 0.86, { width: 204, height: 100 })
];

function car(id, label, type, palette, speed, scale, hitbox) {
  return { id, label, type, kind: "car", palette, speed, scale, hitbox };
}

function moto(id, label, type, palette, speed, scale, hitbox) {
  return { id, label, type, kind: "moto", palette, speed, scale, hitbox };
}

class SpritePixels {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
  }

  put(x, y, color) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const [r, g, b, a = 255] = color;
    const i = (y * this.width + x) * 4;
    this.data[i] = r;
    this.data[i + 1] = g;
    this.data[i + 2] = b;
    this.data[i + 3] = a;
  }

  copy(src, dx, dy) {
    for (let y = 0; y < src.height; y += 1) {
      for (let x = 0; x < src.width; x += 1) {
        const i = (y * src.width + x) * 4;
        if (!src.data[i + 3]) continue;
        this.put(dx + x, dy + y, [
          src.data[i],
          src.data[i + 1],
          src.data[i + 2],
          src.data[i + 3]
        ]);
      }
    }
  }
}

function rgba(hex, alpha = 255) {
  if (hex === ".") return transparent;
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
    alpha
  ];
}

function palette(spec) {
  const p = spec.palette;
  return {
    K: rgba("#070912"),
    k: rgba("#161b2a"),
    S: rgba("#000000", 90),
    A: rgba(p.dark),
    B: rgba(p.body),
    C: rgba(p.light),
    G: rgba(p.glass),
    g: rgba("#295667"),
    L: rgba(p.lamp),
    R: rgba(p.tail),
    W: rgba("#fff7d7"),
    T: rgba("#080a11"),
    t: rgba("#202637"),
    M: rgba(p.trim),
    m: rgba("#697080"),
    H: rgba("#ffffff"),
    P: rgba(p.skin || "#d89a68"),
    J: rgba(p.jacket || p.body),
    N: rgba(p.helmet || p.trim),
    O: rgba(p.box || p.body),
    D: rgba("#1a1e2f")
  };
}

function stamp(sprite, x, y, rows, colors) {
  rows.forEach((row, yy) => {
    [...row].forEach((char, xx) => {
      if (char === "." || char === " ") return;
      const color = colors[char];
      if (color) sprite.put(x + xx, y + yy, color);
    });
  });
}

const shadowLong = [
  "............SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS............",
  "........SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS........",
  "............SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS............"
];

const shadowMoto = [
  ".............SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS.............",
  ".........SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS.........",
  ".............SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS............."
];

const wheelFrames = [
  [
    "...TTT...",
    ".TTtttTT.",
    ".TtmMmtT.",
    "TTmH.HmTT",
    "TtmHMHmT",
    "TTmH.HmTT",
    ".TtmMmtT.",
    ".TTtttTT.",
    "...TTT..."
  ],
  [
    "...TTT...",
    ".TTtttTT.",
    ".TtHMMtT.",
    "TTmHH.mTT",
    "TtMMHMtT",
    "TTm.HHmTT",
    ".TtMMHtT.",
    ".TTtttTT.",
    "...TTT..."
  ],
  [
    "...TTT...",
    ".TTtttTT.",
    ".TtMHMtT.",
    "TTm.MHmTT",
    "TtHHHHtT",
    "TTmHM.mTT",
    ".TtMHMtT.",
    ".TTtttTT.",
    "...TTT..."
  ],
  [
    "...TTT...",
    ".TTtttTT.",
    ".TtMMHtT.",
    "TTm.HHmTT",
    "TtMHMMtT",
    "TTmHH.mTT",
    ".TtHMMtT.",
    ".TTtttTT.",
    "...TTT..."
  ],
  [
    "...TTT...",
    ".TTtttTT.",
    ".TtmHmtT.",
    "TTmMHMmTT",
    "Tt..H..tT",
    "TTmMHMmTT",
    ".TtmHmtT.",
    ".TTtttTT.",
    "...TTT..."
  ]
];

const smallWheelFrames = wheelFrames.map((frame) => frame.map((row) => row.slice(1, 8)));

const carTemplates = {
  hatch: {
    x: 12,
    y: 12,
    wheels: [[28, 35], [68, 35]],
    rows: [
      "....................KKKKKKKKKKKKK....................",
      "..................KKGGGGGGGGGGGGGKK..................",
      ".................KGGGGGGGgggGGGGGGGK.................",
      "..............KKKBBBBBBBBBBBBBBBBBBBKKK..............",
      "...........KKKBBBBBBBBBBBBBBBBBBBBBBBBKKK............",
      ".........KKBBBBBCCCCBBBBBBBBBBBBBBBBBBBBBKK..........",
      ".......KKBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBK.........",
      "......KBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBK........",
      ".....KBAAAAABBBBBBBBBBBBBBBBBBBBBBBBBBAAAAABK........",
      "....KBAAAAAAABBBBBBBBBBBBBBBBBBBBBBBBAAAAAAABK.......",
      "....KBAAKKKKAABBBBBBBBBBBBBBBBBBBBBAAKKKKAABK........",
      "...KBAAK....KAABBBBBBBBBBBBBBBBBBBAAK....KAABK.......",
      "...KBAAK....KAAAAKKKKKKKKKKKKAAAAAAK....KAABK........",
      "....KAAA.KKK.AAAAKLLLLKKKRRRRKAAAAA.KKK.AAAK.........",
      ".....KKAAAAAAAAAKKKKKKKKKKKKKKKKAAAAAAAAAKK.........."
    ]
  },
  sedan: {
    x: 9,
    y: 12,
    wheels: [[29, 35], [73, 35]],
    rows: [
      ".....................KKKKKKKKKKKKKKK......................",
      "...................KKGGGGGGGGGGGGGGGGKK...................",
      ".................KKGGGGGGGGgggGGGGGGGGGKK.................",
      "..............KKKBBBBBBBBBBBBBBBBBBBBBBBBBKKK.............",
      "...........KKKBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBKKK..........",
      ".........KKBBBBCCCCBBBBBBBBBBBBBBBBBBBBBBBBBBBBBKK........",
      ".......KKBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBK.......",
      "......KBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBK......",
      ".....KBAAAAABBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBAAAAABK.....",
      "....KBAAAAAAABBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBAAAAAAABK....",
      "....KBAAKKKKAABBBBBBBBBBBBBBBBBBBBBBBBBBBBBAAKKKKAABK.....",
      "...KBAAK....KAABBBBBBBBBBBBBBBBBBBBBBBBBBBAAK....KAABK....",
      "...KBAAK....KAAAAAKKKKKKKKKKKKKKKKKKAAAAAAK....KAABK.....",
      "....KAAA.KKK.AAAAAKLLLLKKKKKKRRRRKAAAAAAA.KKK.AAAK.......",
      ".....KKAAAAAAAAAAKKKKKKKKKKKKKKKKKKAAAAAAAAAAKK.........."
    ]
  },
  city: {
    x: 17,
    y: 13,
    wheels: [[34, 36], [62, 36]],
    rows: [
      "................KKKKKKKKKKKK................",
      "..............KKGGGGGGGGGGGGKK..............",
      "............KKGGGGGggGGGGGGGGKK............",
      "..........KKBBBBBBBBBBBBBBBBBBBBKK..........",
      "........KKBBBBBCCCCBBBBBBBBBBBBBBKK........",
      ".......KBBBBBBBBBBBBBBBBBBBBBBBBBBK........",
      "......KBBBBBBBBBBBBBBBBBBBBBBBBBBBBK.......",
      ".....KBAAAAABBBBBBBBBBBBBBBBBAAAAABK......",
      "....KBAAAAAAABBBBBBBBBBBBBBBAAAAAAABK.....",
      "...KBAAKKKKAABBBBBBBBBBBBBBAAKKKKAABK.....",
      "...KBAAK...KAAAAKKKKKKKAAAAK...KAABK......",
      "....KAAA.KK.AAAKLLLKKRRRKAAA.KK.AAAK......",
      ".....KKAAAAAAKKKKKKKKKKKKKKAAAAAAKK......."
    ]
  },
  coupe: {
    x: 10,
    y: 13,
    wheels: [[30, 36], [72, 36]],
    rows: [
      ".........................KKKKKKKKKKK.......................",
      ".....................KKKGGGGGGGGGGGGKKK....................",
      "...................KKGGGGGGGgggGGGGGGGGKK.................",
      "...............KKKKBBBBBBBBBBBBBBBBBBBBBBKKK..............",
      "............KKKBBBBBBBBBBBBBBBBBBBBBBBBBBBBBKK............",
      ".........KKKBBBBBCCCCBBBBBBBBBBBBBBBBBBBBBBBBBK...........",
      ".......KKBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBK..........",
      "......KBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBK.........",
      ".....KBAAAAABBBBBBBBBBBBBBBBBBBBBBBBBBBBBBAAAAABK........",
      "....KBAAAAAAABBBBBBBBBBBBBBBBBBBBBBBBBBBBAAAAAAABK.......",
      "...KBAAKKKKAABBBBBBBBBBBBBBBBBBBBBBBBBAAKKKKAABK........",
      "...KBAAK....KAAAAAAKKKKKKKKKKKAAAAAAAK....KAABK.........",
      "....KAAA.KKK.AAAAKLLLLKKKKRRRRKAAAAA.KKK.AAAK..........",
      ".....KKAAAAAAAAKKKKKKKKKKKKKKKKAAAAAAAAKK..............."
    ]
  },
  taxi: {
    x: 9,
    y: 9,
    wheels: [[29, 38], [73, 38]],
    rows: [
      "..........................KKKKKKKK.........................",
      "..........................KCCCCCCK.........................",
      ".....................KKKKKKKKKKKKKKKKK.....................",
      "...................KKGGGGGGGGGGGGGGGGKK...................",
      ".................KKGGGGGGGGgggGGGGGGGGGKK.................",
      "..............KKKBBBBBBBBBBBBBBBBBBBBBBBBBKKK.............",
      "...........KKKBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBKKK..........",
      ".........KKBBBBCCCCBBBBBBBBBBBBBBBBBBBBBBBBBBBBBKK........",
      ".......KKBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBK.......",
      "......KBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBK......",
      ".....KBAAAAABBBBKKKKBBBBBKKKKBBBBBKKKKBBBBBBAAAAABK......",
      "....KBAAAAAAABBBKMMMMKBBBKMMMMKBBBKMMMMKBBBAAAAAAABK.....",
      "....KBAAKKKKAABBBBBBBBBBBBBBBBBBBBBBBBBBBAAKKKKAABK......",
      "...KBAAK....KAAAAAKKKKKKKKKKKKKKKKKKAAAAAK....KAABK.....",
      "....KAAA.KKK.AAAAAKLLLLKKKKKKRRRRKAAAAAAA.KKK.AAAK......",
      ".....KKAAAAAAAAAAKKKKKKKKKKKKKKKKKKAAAAAAAAAAKK........."
    ]
  },
  premium: {
    x: 7,
    y: 14,
    wheels: [[28, 36], [76, 36]],
    rows: [
      "........................KKKKKKKKKKKK.......................",
      ".....................KKKGGGGGGGGGGGGKKK....................",
      "..................KKKGGGGGGGGggGGGGGGGGKKK.................",
      "...............KKKBBBBBBBBBBBBBBBBBBBBBBBBBKKK.............",
      "............KKKBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBKKK..........",
      ".........KKKBBBBCCCCBBBBBBBBBBBBBBBBBBBBBBBBBBBBBKK........",
      ".......KKBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBK.......",
      ".....KKBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBK......",
      "....KBAAAAABBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBAAAAABK.....",
      "...KBAAAAAAABBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBAAAAAAABK....",
      "...KBAAKKKKAABBBBBBBBBBBBBBBBBBBBBBBBBBBBBAAKKKKAABK.....",
      "..KBAAK....KAAAAAAKKKKKKKKKKKKKKKKAAAAAAAK....KAABK......",
      "...KAAA.KKK.AAAAAKLLLLKKKKKKRRRRKAAAAAAA.KKK.AAAK.......",
      "....KKAAAAAAAAAAKKKKKKKKKKKKKKKKKKAAAAAAAAAAKK.........."
    ]
  }
};

const motoTemplates = {
  scooter: {
    x: 16,
    y: 7,
    wheels: [[35, 37], [70, 37]],
    rows: [
      "...............................NNN.........................",
      "..............................NNGNN........................",
      "...............................PP..........................",
      ".............................JJJJJ.........................",
      "............................JJJDDJ.........................",
      "...........................JJJ.DDJJ........................",
      ".........................JJJ...DD.JJ.......................",
      "........................JJ.....DD..J.......................",
      "......................KKBBBBBBBBBBBBBK.....................",
      "....................KKBBBBCCCCBBBBBBBBK....................",
      ".................KKKBBBBBBBBBBBBBBBBBBBK...................",
      "...............KKAAAABBBBBBBBBBBBBBBBBBBK..................",
      "..............KAAAAAKKKBBBBBBBBBBBKKKBBBBK.................",
      ".............KAAAAK...KAAAALLLLAAK...KBBBK................",
      "............KAAAAK.....KAAAKRRRK......KBBK................",
      ".............KKKK.......KKKKKKK........KKK................."
    ]
  },
  sport: {
    x: 14,
    y: 6,
    wheels: [[33, 38], [75, 38]],
    rows: [
      "................................NNNN.......................",
      "...............................NNKGN.......................",
      "................................PP.........................",
      ".............................JJJJJ.........................",
      "...........................JJJJDDJJ........................",
      ".........................JJJJ..DD.JJ.......................",
      ".......................JJJ.....DD..J.......................",
      ".....................KKBBBBBBBBBBBBBBKK....................",
      "..................KKKBBBBCCCCBBBBBBBBBBK...................",
      "...............KKKBBBBBBBBBBBBBBBBBBBBBBBKK................",
      ".............KKAAAABBBBBBBBBBBBBBBBBBBBBBBBKK..............",
      "............KAAAAAKKKBBBBBBBBBBBBBBBBKKKBBBBK.............",
      "...........KAAAAK...KAAAALLLLAAAAAAK...KBBBBK............",
      "..........KAAAAK.....KAAAKRRRKAAAAK.....KBBBK............",
      "...........KKKK.......KKKKKKKKKKKK.......KKK.............."
    ]
  },
  cruiser: {
    x: 11,
    y: 7,
    wheels: [[33, 38], [78, 38]],
    rows: [
      "..................................NNN......................",
      ".................................NNGNN.....................",
      "..................................PP.......................",
      ".................................JJJ.......................",
      "...............................JJJDJ.......................",
      "............................JJJJ..DJ.......................",
      ".........................JJJJ.....DD.......................",
      "......................KKBBBBBBBBBBBBBBKK...................",
      "...................KKKBBBBCCCCBBBBBBBBBBK..................",
      ".................KKBBBBBBBBBBBBBBBBBBBBBBBKK...............",
      "..............KKAAAABBBBBBBBBBBBBBBBBBBBBBBBKK............",
      "............KKAAAAKKKBBBBBBBBBBBBBBBBBBKKKBBBBK...........",
      "...........KAAAAK...KAAALLLLLLLLAAAAAK...KBBBBK..........",
      "..........KAAAAK.....KAAAKRRRRKAAAAK.....KBBBBK..........",
      "...........KKKK.......KKKKKKKKKKKKK.......KKKK............"
    ]
  },
  delivery: {
    x: 10,
    y: 4,
    wheels: [[35, 40], [78, 40]],
    rows: [
      "..................KKKKKKK................NNN...............",
      ".................KOOOOOOK...............NNGNN..............",
      ".................KOWWWOOK................PP................",
      ".................KOOOOOOK..............JJJJJ...............",
      ".................KOOOOOOK............JJJDDJJ...............",
      ".................KKKKKKK..........JJJ..DD.JJ..............",
      "...............................JJJ.....DD..J...............",
      ".........................KKBBBBBBBBBBBBBBKK................",
      "......................KKKBBBBCCCCBBBBBBBBBBK...............",
      "...................KKBBBBBBBBBBBBBBBBBBBBBBBKK............",
      "................KKAAAABBBBBBBBBBBBBBBBBBBBBBBBKK..........",
      "..............KKAAAAKKKBBBBBBBBBBBBBBBBBBKKKBBBBK.........",
      ".............KAAAAK...KAAALLLLLLLLAAAAAK...KBBBBK........",
      "............KAAAAK.....KAAAKRRRRKAAAAK.....KBBBBK........",
      ".............KKKK.......KKKKKKKKKKKKK.......KKKK.........."
    ]
  }
};

function drawVehicle(spec, frame) {
  const sprite = new SpritePixels(BASE_W, BASE_H);
  const colors = palette(spec);
  const template = spec.kind === "car" ? carTemplates[spec.type] : motoTemplates[spec.type];
  stamp(sprite, template.x + (spec.kind === "car" ? 3 : 6), 42, spec.kind === "car" ? shadowLong : shadowMoto, colors);
  template.wheels.forEach(([cx, cy], index) => {
    const wheel = spec.kind === "car" ? wheelFrames[(frame + index * 2) % FRAMES] : smallWheelFrames[(frame + index * 2) % FRAMES];
    stamp(sprite, cx - Math.floor(wheel[0].length / 2), cy - Math.floor(wheel.length / 2), wheel, colors);
  });
  stamp(sprite, template.x, template.y, template.rows, colors);
  return scaleSprite(sprite, SCALE);
}

function scaleSprite(src, scale) {
  const out = new SpritePixels(src.width * scale, src.height * scale);
  for (let y = 0; y < src.height; y += 1) {
    for (let x = 0; x < src.width; x += 1) {
      const i = (y * src.width + x) * 4;
      if (!src.data[i + 3]) continue;
      const color = [src.data[i], src.data[i + 1], src.data[i + 2], src.data[i + 3]];
      for (let yy = 0; yy < scale; yy += 1) {
        for (let xx = 0; xx < scale; xx += 1) {
          out.put(x * scale + xx, y * scale + yy, color);
        }
      }
    }
  }
  return out;
}

function buildSheet(spec) {
  const sheet = new SpritePixels(FRAME_W * FRAMES, FRAME_H);
  for (let frame = 0; frame < FRAMES; frame += 1) {
    sheet.copy(drawVehicle(spec, frame), frame * FRAME_W, 0);
  }
  return sheet;
}

function buildAtlas(sheets) {
  const atlas = new SpritePixels(FRAME_W * FRAMES, FRAME_H * sheets.length);
  sheets.forEach((sheet, row) => atlas.copy(sheet, 0, row * FRAME_H));
  return atlas;
}

function buildPreview(sheets) {
  const gap = 16;
  const preview = new SpritePixels(FRAME_W * FRAMES + gap * 2, (FRAME_H + gap) * sheets.length + gap);
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
  const typeBuffer = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([len, typeBuffer, data, crc]);
}

function png(sprite) {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(sprite.width, 0);
  ihdr.writeUInt32BE(sprite.height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc((sprite.width * 4 + 1) * sprite.height);
  for (let y = 0; y < sprite.height; y += 1) {
    const row = y * (sprite.width * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < sprite.width; x += 1) {
      const src = (y * sprite.width + x) * 4;
      const dst = row + 1 + x * 4;
      raw[dst] = sprite.data[src];
      raw[dst + 1] = sprite.data[src + 1];
      raw[dst + 2] = sprite.data[src + 2];
      raw[dst + 3] = sprite.data[src + 3];
    }
  }
  return Buffer.concat([
    header,
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

function writePng(file, sprite) {
  fs.writeFileSync(file, png(sprite));
}

function buildHtml() {
  const cards = vehicles.map((vehicle) => {
    const src = `assets/pubpaid/traffic/vehicles-v3-pixelart/${vehicle.id}-5f.png?v=20260428px3`;
    return `
      <article class="card">
        <div class="card-head"><span>${vehicle.kind === "moto" ? "Moto com piloto" : "Carro"}</span><strong>${vehicle.label}</strong></div>
        <div class="sprite-box"><div class="sprite" style="background-image:url('${src}')"></div></div>
      </article>`;
  }).join("");
  const lane = vehicles.map((vehicle, index) => {
    const src = `assets/pubpaid/traffic/vehicles-v3-pixelart/${vehicle.id}-5f.png?v=20260428px3`;
    const top = index % 2 ? 102 : 38;
    const duration = vehicle.kind === "moto" ? 5.4 + (index % 3) * 0.3 : 7 + (index % 3) * 0.35;
    return `<div class="runner ${vehicle.kind}" data-dir="${index % 2 ? "left" : "right"}" style="--top:${top}px; --delay:${-(index * 0.62).toFixed(2)}s; --duration:${duration}s; background-image:url('${src}')"></div>`;
  }).join("");
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PubPaid 2.0 | Pixel art trafego v3</title>
  <style>
    :root { --bg:#050812; --panel:#0c1422; --line:#22576b; --ink:#fff1d6; --cyan:#50efff; --mint:#76ffbd; }
    * { box-sizing:border-box; }
    body {
      margin:0;
      min-height:100vh;
      background:#050812;
      color:var(--ink);
      font-family:Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    header, main { width:min(1180px, calc(100% - 32px)); margin:0 auto; }
    header { padding:28px 0 16px; }
    .eyebrow { color:var(--cyan); font:800 12px/1.2 "Courier New", monospace; letter-spacing:3px; text-transform:uppercase; }
    h1 { margin:10px 0; max-width:880px; font-size:clamp(34px, 5vw, 64px); line-height:.96; letter-spacing:0; }
    p { max-width:820px; color:#c8d9eb; line-height:1.55; }
    .chips { display:flex; flex-wrap:wrap; gap:9px; margin-top:16px; }
    .chips span { border:1px solid var(--line); border-radius:8px; padding:8px 10px; color:#dff6ff; background:#07101d; font-size:13px; }
    .street {
      position:relative;
      overflow:hidden;
      height:250px;
      margin:18px 0 20px;
      border:1px solid var(--line);
      border-radius:8px;
      background:
        repeating-linear-gradient(90deg, rgba(255,255,255,.04) 0 2px, transparent 2px 32px),
        linear-gradient(#111928 0 34%, #070b12 34% 100%);
    }
    .street:before {
      content:"";
      position:absolute;
      left:0;
      right:0;
      top:80px;
      height:3px;
      background:repeating-linear-gradient(90deg, rgba(255,241,214,.85) 0 48px, transparent 48px 92px);
      opacity:.5;
    }
    .label { position:absolute; left:14px; top:12px; z-index:5; color:#abdcef; font:800 12px/1 "Courier New", monospace; letter-spacing:2px; text-transform:uppercase; }
    .runner, .sprite {
      width:${FRAME_W}px;
      height:${FRAME_H}px;
      background-repeat:no-repeat;
      background-size:${FRAME_W * FRAMES}px ${FRAME_H}px;
      image-rendering:pixelated;
      image-rendering:crisp-edges;
    }
    .runner {
      position:absolute;
      top:var(--top);
      left:-430px;
      z-index:3;
      animation:driveRight var(--duration) linear infinite;
      animation-delay:var(--delay);
    }
    .runner[data-dir="left"] {
      left:auto;
      right:-430px;
      transform:scaleX(-1);
      animation-name:driveLeft;
    }
    @keyframes driveRight { from { translate:-430px 0; } to { translate:calc(100vw + 680px) 0; } }
    @keyframes driveLeft { from { translate:430px 0; } to { translate:calc(-100vw - 680px) 0; } }
    .files {
      border:1px solid var(--line);
      border-radius:8px;
      background:#07101d;
      padding:14px;
      margin-bottom:16px;
    }
    code { color:var(--mint); overflow-wrap:anywhere; }
    .grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:14px; padding-bottom:30px; }
    .card { border:1px solid var(--line); border-radius:8px; background:#07101d; padding:12px; }
    .card-head { display:flex; justify-content:space-between; gap:12px; align-items:start; min-height:40px; }
    .card-head span { color:var(--mint); font:800 11px/1.2 "Courier New", monospace; letter-spacing:1.5px; text-transform:uppercase; }
    .card-head strong { text-align:right; font-size:15px; }
    .sprite-box { height:172px; display:grid; place-items:center; overflow:hidden; background:#03070f; border-radius:8px; margin-top:10px; }
    .sprite { scale:.78; }
    @media (max-width:720px) {
      header, main { width:min(100% - 18px, 1180px); }
      .street { height:220px; }
      .runner { scale:.66; transform-origin:center; }
      .runner[data-dir="left"] { transform:scaleX(-1); }
      .sprite { scale:.62; }
      .card-head { flex-direction:column; }
      .card-head strong { text-align:left; }
    }
  </style>
</head>
<body>
  <header>
    <div class="eyebrow">PubPaid 2.0 - pixel art v3</div>
    <h1>Agora e matriz de pixels, sem desenho por formas.</h1>
    <p>Esta versao foi feita em grade pequena: cada bloco nasce como pixel de sprite e so depois e ampliado sem suavizacao. As rodas continuam com 5 frames dentro da propria imagem, e as motos ja incluem o piloto.</p>
    <div class="chips">
      <span>${vehicles.length} sprites</span>
      <span>${FRAMES} frames</span>
      <span>base ${BASE_W}x${BASE_H}</span>
      <span>matriz de pixels</span>
    </div>
  </header>
  <main>
    <section class="street">
      <div class="label">Rua teste - sheets pixel art</div>
      ${lane}
    </section>
    <section class="files">
      <p>Atlas: <code>assets/pubpaid/traffic/pubpaid-traffic-vehicles-pixelart-5f-v3.png</code></p>
      <p>Manifesto: <code>assets/pubpaid/traffic/pubpaid-traffic-vehicles-pixelart-5f-v3.json</code></p>
      <p>Sheets: <code>assets/pubpaid/traffic/vehicles-v3-pixelart/*-5f.png</code></p>
    </section>
    <section class="grid">${cards}</section>
  </main>
  <script>
    const frameWidth = ${FRAME_W};
    const frames = ${FRAMES};
    let current = 0;
    function paintFrame() {
      document.querySelectorAll(".runner,.sprite").forEach((el) => {
        el.style.backgroundPosition = (-current * frameWidth) + "px 0";
      });
      current = (current + 1) % frames;
    }
    paintFrame();
    setInterval(paintFrame, 130);
  </script>
</body>
</html>`;
}

function main() {
  fs.mkdirSync(INDIVIDUAL_DIR, { recursive: true });
  const sheets = vehicles.map((vehicle) => {
    const sheet = buildSheet(vehicle);
    writePng(path.join(INDIVIDUAL_DIR, `${vehicle.id}-5f.png`), sheet);
    return sheet;
  });
  writePng(path.join(OUT_DIR, "pubpaid-traffic-vehicles-pixelart-5f-v3.png"), buildAtlas(sheets));
  writePng(path.join(OUT_DIR, "pubpaid-traffic-vehicles-pixelart-5f-v3-preview.png"), buildPreview(sheets));
  fs.writeFileSync(path.join(OUT_DIR, "pubpaid-traffic-vehicles-pixelart-5f-v3.json"), JSON.stringify({
    frameWidth: FRAME_W,
    frameHeight: FRAME_H,
    baseFrameWidth: BASE_W,
    baseFrameHeight: BASE_H,
    scale: SCALE,
    framesPerVehicle: FRAMES,
    generatedAt: new Date().toISOString(),
    source: "scripts/generate-pubpaid-traffic-pixelart-v3.js",
    atlas: "assets/pubpaid/traffic/pubpaid-traffic-vehicles-pixelart-5f-v3.png",
    individualDir: "assets/pubpaid/traffic/vehicles-v3-pixelart",
    vehicles: vehicles.map((vehicle, row) => ({
      id: vehicle.id,
      label: vehicle.label,
      kind: vehicle.kind,
      row,
      frames: FRAMES,
      speed: vehicle.speed,
      scale: vehicle.scale,
      hitbox: vehicle.hitbox,
      sheet: `assets/pubpaid/traffic/vehicles-v3-pixelart/${vehicle.id}-5f.png`
    }))
  }, null, 2));
  fs.writeFileSync(path.join(ROOT, "pubpaid-traffic-sprites-demo.html"), buildHtml());
  console.log(`pixel-art v3 generated: ${vehicles.length} vehicles, ${FRAMES} frames`);
}

main();
