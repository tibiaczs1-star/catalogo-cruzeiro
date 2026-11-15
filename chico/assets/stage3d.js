import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const loader = new GLTFLoader();
const texLoader = new THREE.TextureLoader();
const gltfCache = new Map();
let lowpolyAtlasPromise = null;

function getLowpolyAtlas() {
  if (!lowpolyAtlasPromise) {
    lowpolyAtlasPromise = texLoader.loadAsync("./assets/models/textures/atlas_lowpoly.png").then(tex => {
      tex.flipY = false;
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    });
  }
  return lowpolyAtlasPromise;
}

function loadGLTF(url) {
  if (!gltfCache.has(url)) {
    gltfCache.set(url, loader.loadAsync(url));
  }
  return gltfCache.get(url);
}

// Presets fieis aos moradores canonicos do Juruá (character3d.gd & npc_system.gd)
const CHARACTER_PRESETS = {
  chico: {
    name: "Chico Gatão",
    role: "Protagonista · Agricultor Caboclo",
    parts: ["hair_short", "hat_straw", "top_tee", "bottom_trousers", "boots_low"],
    colors: {
      skin: "#c98a5e",
      hair: "#241914",
      shirt: "#2f7d47",
      linen: "#efe3c6",
      belt: "#6b4226",
      trousers: "#395d84",
      boots: "#4e301d",
      hat: "#e5c16c",
      hatband: "#9d3c28"
    },
    defaultAnim: "Idle_A",
    scale: 1.0
  },
  raiane: {
    name: "Raiane",
    role: "Parceira na Praça & Coreto",
    parts: ["hair_ponytail", "top_tee", "bottom_trousers", "boots_low"],
    colors: {
      skin: "#d3976d",
      hair: "#2b1914",
      shirt: "#c7583e",
      collar: "#f4e7c8",
      trousers: "#3f536e",
      boots: "#5c3424"
    },
    defaultAnim: "Interact",
    scale: 0.94
  },
  rosa: {
    name: "Dona Rosa",
    role: "Padaria & Café Central",
    parts: ["hair_bun", "top_long", "bottom_trousers", "boots_low"],
    colors: {
      skin: "#b9794f",
      hair: "#4f3f39",
      shirt: "#d4943a",
      cuff: "#f7eed9",
      trousers: "#523a2c",
      boots: "#3c261b"
    },
    defaultAnim: "Working_A",
    scale: 0.95
  },
  sebastiao: {
    name: "Vovô Sebastião",
    role: "Guardião do Rio & Varadouro",
    parts: ["hair_balding", "beard_short", "hat_straw", "top_tee", "bottom_trousers", "boots_low"],
    colors: {
      skin: "#bf8158",
      hair: "#dedad2",
      beard: "#dedad2",
      shirt: "#49798c",
      linen: "#e7decb",
      belt: "#5a3921",
      trousers: "#474a48",
      boots: "#462c1c",
      hat: "#dcc074",
      hatband: "#3c5f48"
    },
    defaultAnim: "Fishing_Idle",
    scale: 0.97
  },
  celso: {
    name: "Sr. Celso",
    role: "Casa das Sementes",
    parts: ["hair_short", "hat_cap", "top_long", "bottom_trousers", "boots_low"],
    colors: {
      skin: "#c68960",
      hair: "#3c2c23",
      hat: "#5d7d47",
      hatband: "#d59b45",
      shirt: "#8d6338",
      cuff: "#ebdcb9",
      trousers: "#3f463d",
      boots: "#422a1b"
    },
    defaultAnim: "Walking_A",
    scale: 0.99
  }
};

// Cache de texturas procedurais (albedo + normal map) espelhando character3d.gd do jogo
const clothTexCache = new Map();

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function getClothTextures(kind) {
  if (clothTexCache.has(kind)) return clothTexCache.get(kind);

  let w = 192;
  let h = 192;
  if (kind === "belt") {
    w = 256;
    h = 64;
  } else if (kind === "hat") {
    w = 128;
    h = 128;
  }

  const albedoCanvas = document.createElement("canvas");
  albedoCanvas.width = w;
  albedoCanvas.height = h;
  const aCtx = albedoCanvas.getContext("2d");
  const aImg = aCtx.createImageData(w, h);
  const heights = new Float32Array(w * h);

  for (let y = 0; y < h; y++) {
    const v = y / h;
    for (let x = 0; x < w; x++) {
      const u = x / w;
      let r = 1, g = 1, b = 1;
      let bh = 0.5;

      if (kind === "shirt") {
        const weave = 0.91 + 0.07 * Math.sin(x * 1.45) * Math.cos(y * 1.45);
        r = weave; g = weave; b = weave;
        bh = 0.45 + 0.12 * Math.sin(x * 1.45) * Math.cos(y * 1.45);
        // Carcela frontal e 4 botoes
        if (Math.abs(u - 0.25) < 0.016 && v > 0.06 && v < 0.93) {
          r *= 0.9; g *= 0.9; b *= 0.9;
          bh = 0.62;
        }
        for (const by of [0.22, 0.39, 0.56, 0.73]) {
          const bd = Math.hypot((u - 0.25) * 1.8, v - by);
          if (bd < 0.014) {
            if (bd < 0.008) { r = 0.88; g = 0.84; b = 0.72; }
            else { r = 0.55; g = 0.50; b = 0.44; }
            bh = 0.92;
          }
        }
        // Bolso costurado no peito esquerdo
        if (u >= 0.305 && u <= 0.390 && v >= 0.25 && v <= 0.42) {
          const px = (u - 0.305) / 0.085;
          const py = (v - 0.25) / 0.17;
          const onEdge = px < 0.11 || px > 0.89 || py > 0.88 || py < 0.12;
          const mult = (py > 0.88 || px < 0.07) ? 0.86 : 1.05;
          r = clamp01(r * mult); g = clamp01(g * mult); b = clamp01(b * mult);
          if (onEdge && ((x + y) % 4 < 2)) {
            r = 0.98; g = 0.96; b = 0.90;
          }
          bh = 0.78;
        }
        // Bainha inferior costurada
        if (v > 0.89 && v < 0.93 && (x % 5 < 3)) {
          r = clamp01(r * 1.12); g = clamp01(g * 1.12); b = clamp01(b * 1.12);
          bh = 0.66;
        }
      } else if (kind === "trousers") {
        const twill = 0.87 + 0.10 * Math.sin((x + y) * 1.35) + 0.03 * Math.cos((x * 2 - y) * 1.1);
        r = twill; g = twill; b = twill;
        bh = 0.44 + 0.14 * Math.sin((x + y) * 1.35);
        if (Math.abs(u - 0.25) < 0.012 && v >= 0.04 && v <= 0.28) {
          r *= 0.86; g *= 0.86; b *= 0.86;
          bh = 0.68;
        }
        const inFrontL = u >= 0.08 && u <= 0.18 && v >= 0.07 && v <= 0.23 && ((u - 0.08) + (v - 0.07) * 0.55) < 0.15;
        const inFrontR = u >= 0.32 && u <= 0.42 && v >= 0.07 && v <= 0.23 && ((0.42 - u) + (v - 0.07) * 0.55) < 0.15;
        if (inFrontL || inFrontR) {
          const seamF = v < 0.095 || Math.abs((u - 0.08) + (v - 0.07) * 0.55 - 0.14) < 0.016 || Math.abs((0.42 - u) + (v - 0.07) * 0.55 - 0.14) < 0.016;
          r *= 0.9; g *= 0.9; b *= 0.9;
          if (seamF && ((x + y) % 4 < 2)) {
            r = 0.96; g = 0.86; b = 0.64;
          }
          bh = 0.74;
        }
        for (const bu of [0.63, 0.87]) {
          if (Math.abs(u - bu) < 0.065 && v >= 0.11 && v <= 0.28) {
            const rimB = Math.abs(u - bu) > 0.052 || v < 0.128 || v > 0.262;
            r *= 0.92; g *= 0.92; b *= 0.92;
            if (rimB && ((x + y) % 4 < 2)) {
              r = 0.96; g = 0.86; b = 0.64;
            }
            bh = 0.76;
          }
        }
        if (v > 0.88 && v < 0.94) {
          r *= 0.9; g *= 0.9; b *= 0.9;
          bh = 0.62;
        }
      } else if (kind === "belt") {
        const grain = 0.90 + 0.10 * Math.sin(x * 0.9 + Math.cos(y * 1.4) * 2.0);
        r = 0.294 * grain; g = 0.176 * grain; b = 0.094 * grain;
        bh = 0.42 + 0.12 * grain;
        if ((Math.abs(v - 0.18) < 0.055 || Math.abs(v - 0.82) < 0.055) && (x % 5 < 3)) {
          r = 0.788; g = 0.635; b = 0.42;
          bh = 0.68;
        }
        if (u >= 0.455 && u <= 0.545 && v >= 0.10 && v <= 0.90) {
          const frame = u < 0.470 || u > 0.530 || v < 0.26 || v > 0.74;
          const pin = Math.abs(u - 0.50) < 0.007 && v >= 0.25 && v <= 0.75;
          if (frame || pin) {
            r = 0.922; g = 0.725; b = 0.322;
            bh = 0.95;
          } else {
            r = 0.227; g = 0.129; b = 0.063;
            bh = 0.30;
          }
        }
      } else if (kind === "hat") {
        const d = Math.hypot(u - 0.5, v - 0.5);
        const ang = Math.atan2(v - 0.5, u - 0.5);
        const braid = 0.88 + 0.12 * Math.sin(d * 85.0 + Math.sin(ang * 18.0) * 1.2);
        r = clamp01(braid); g = clamp01(braid * 0.98); b = clamp01(braid * 0.93);
        bh = 0.45 + 0.25 * Math.sin(d * 85.0 + Math.sin(ang * 18.0) * 1.2);
      }

      const idx = (y * w + x) * 4;
      aImg.data[idx] = Math.round(clamp01(r) * 255);
      aImg.data[idx + 1] = Math.round(clamp01(g) * 255);
      aImg.data[idx + 2] = Math.round(clamp01(b) * 255);
      aImg.data[idx + 3] = 255;
      heights[y * w + x] = bh;
    }
  }
  aCtx.putImageData(aImg, 0, 0);

  const normalCanvas = document.createElement("canvas");
  normalCanvas.width = w;
  normalCanvas.height = h;
  const nCtx = normalCanvas.getContext("2d");
  const nImg = nCtx.createImageData(w, h);
  const strength = 2.6;

  for (let y = 0; y < h; y++) {
    const ym = (y - 1 + h) % h;
    const yp = (y + 1) % h;
    for (let x = 0; x < w; x++) {
      const xm = (x - 1 + w) % w;
      const xp = (x + 1) % w;
      const dx = (heights[y * w + xp] - heights[y * w + xm]) * strength;
      const dy = (heights[yp * w + x] - heights[ym * w + x]) * strength;
      const len = Math.hypot(-dx, -dy, 1.0);
      const nx = (-dx / len) * 0.5 + 0.5;
      const ny = (-dy / len) * 0.5 + 0.5;
      const nz = (1.0 / len) * 0.5 + 0.5;
      const idx = (y * w + x) * 4;
      nImg.data[idx] = Math.round(nx * 255);
      nImg.data[idx + 1] = Math.round(ny * 255);
      nImg.data[idx + 2] = Math.round(nz * 255);
      nImg.data[idx + 3] = 255;
    }
  }
  nCtx.putImageData(nImg, 0, 0);

  const map = new THREE.CanvasTexture(albedoCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.flipY = false;

  const normalMap = new THREE.CanvasTexture(normalCanvas);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.flipY = false;

  const pair = { map, normalMap };
  clothTexCache.set(kind, pair);
  return pair;
}

function clothUVForVertex(partName, vx, vy, vz) {
  if (partName === "shirt") {
    const u = vz >= 0
      ? 0.25 + Math.max(-0.34, Math.min(0.34, vx)) * 0.62
      : 0.75 - Math.max(-0.34, Math.min(0.34, vx)) * 0.62;
    const v = 1.0 - clamp01((vy - 0.58) / 0.705);
    return [Math.max(0.02, Math.min(0.98, u)), Math.max(0.02, Math.min(0.98, v))];
  }
  if (partName === "collar" || partName === "cuff") {
    return [0.08 + clamp01((vx + 0.35) / 0.70) * 0.12, 0.06];
  }
  if (partName === "trousers") {
    const u = vz >= 0
      ? 0.25 + Math.max(-0.36, Math.min(0.36, vx)) * 0.60
      : 0.75 - Math.max(-0.36, Math.min(0.36, vx)) * 0.60;
    const v = 1.0 - clamp01((vy - 0.09) / 0.56);
    return [Math.max(0.02, Math.min(0.98, u)), Math.max(0.02, Math.min(0.98, v))];
  }
  if (partName === "belt") {
    const ang = Math.atan2(vx, vz);
    const u = 0.5 + ang / (Math.PI * 2);
    const v = 1.0 - clamp01((vy - 0.56) / 0.10);
    return [Math.max(0.01, Math.min(0.99, u)), Math.max(0.05, Math.min(0.95, v))];
  }
  if (partName === "hat" || partName === "hatband") {
    return [Math.max(0.02, Math.min(0.98, (vx + 1.0) * 0.5)), Math.max(0.02, Math.min(0.98, (vz + 1.0) * 0.5))];
  }
  return [0, 0];
}

function fitPartGeometryBindSpace(sm, partId) {
  const name = (sm.name || "").toLowerCase();
  let kind = "";
  if (name.includes("shirt")) kind = "shirt";
  else if (name.includes("collar")) kind = "collar";
  else if (name.includes("cuff")) kind = "cuff";
  else if (name.includes("trouser")) kind = "trousers";
  else if (name.includes("belt")) kind = "belt";
  else if (name.includes("hatband")) kind = "hatband";
  else if (name.includes("hat")) kind = "hat";

  if (!kind || !sm.geometry || !sm.geometry.attributes.position) return;

  sm.geometry = sm.geometry.clone();
  const pos = sm.geometry.attributes.position;
  const count = pos.count;
  const uvs = new Float32Array(count * 2);

  let sx = 1, sy = 1, sz = 1;
  let px = 0, py = 0, pz = 0;

  if (partId === "hat_straw" && (kind === "hat" || kind === "hatband")) {
    sx = sy = sz = 0.68;
    py = 2.42;
  } else if (kind === "shirt") {
    sx = sz = 1.045;
  } else if (kind === "collar" || kind === "cuff") {
    sx = sz = 1.02;
  } else if (kind === "trousers") {
    sx = sz = 0.99;
  } else if (kind === "belt") {
    sx = 1.37; sy = 0.92; sz = 0.89;
    py = 0.61;
  }

  for (let i = 0; i < count; i++) {
    const ox = pos.getX(i);
    const oy = pos.getY(i);
    const oz = pos.getZ(i);
    const [u, v] = clothUVForVertex(kind, ox, oy, oz);
    uvs[i * 2] = u;
    uvs[i * 2 + 1] = v;
    pos.setXYZ(i, (ox - px) * sx + px, (oy - py) * sy + py, (oz - pz) * sz + pz);
  }

  pos.needsUpdate = true;
  sm.geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  sm.geometry.computeVertexNormals();
}

function cullCoveredBodyMeshes(root, parts) {
  const hasTrousers = parts.includes("bottom_trousers");
  const hasBoots = parts.includes("boots_low") || parts.includes("boots_tall");
  const hasLongTop = parts.includes("top_long");
  const hasTee = parts.includes("top_tee") || parts.includes("top_tunic");

  root.traverse(node => {
    if (!node.isMesh) return;
    const nm = node.name || "";
    let hide = false;
    if (hasTrousers && ["skin_legUpperL", "skin_legUpperR", "skin_legLowerL", "skin_legLowerR"].includes(nm)) {
      hide = true;
    }
    if (hasBoots && ["skin_footL", "skin_footR"].includes(nm)) {
      hide = true;
    }
    if (hasLongTop && ["skin_armUpperL", "skin_armUpperR", "skin_armLowerL", "skin_armLowerR"].includes(nm)) {
      hide = true;
    } else if (hasTee && ["skin_armUpperL", "skin_armUpperR"].includes(nm)) {
      hide = true;
    }
    if (hide) node.visible = false;
  });
}

function applyPalette(object3d, palette, partId) {
  const shirtTex = getClothTextures("shirt");
  const trouserTex = getClothTextures("trousers");
  const beltTex = getClothTextures("belt");
  const hatTex = getClothTextures("hat");

  object3d.traverse(node => {
    if (!node.isMesh) return;
    node.castShadow = true;
    node.receiveShadow = true;
    const mats = Array.isArray(node.material) ? node.material : [node.material];
    const cloned = mats.map(m => {
      const mat = m.clone();
      const matName = (mat.name || "").toLowerCase();
      for (const [key, hex] of Object.entries(palette)) {
        if (matName.includes(key)) {
          mat.color = new THREE.Color(hex);
          break;
        }
      }
      if (matName.includes("shirt") || matName.includes("linen")) {
        mat.map = shirtTex.map;
        mat.normalMap = shirtTex.normalMap;
        mat.normalScale = new THREE.Vector2(0.55, 0.55);
        mat.roughness = 0.86;
        mat.side = THREE.DoubleSide;
      } else if (matName.includes("trouser")) {
        mat.map = trouserTex.map;
        mat.normalMap = trouserTex.normalMap;
        mat.normalScale = new THREE.Vector2(0.62, 0.62);
        mat.roughness = 0.88;
      } else if (matName.includes("belt")) {
        mat.color = new THREE.Color("#ffffff");
        mat.map = beltTex.map;
        mat.normalMap = beltTex.normalMap;
        mat.normalScale = new THREE.Vector2(0.75, 0.75);
        mat.roughness = 0.44;
        mat.metalness = 0.22;
        mat.side = THREE.DoubleSide;
      } else if (matName.includes("hatband")) {
        mat.roughness = 0.82;
        mat.side = THREE.DoubleSide;
      } else if (matName.includes("hat")) {
        mat.map = hatTex.map;
        mat.normalMap = hatTex.normalMap;
        mat.normalScale = new THREE.Vector2(0.50, 0.50);
        mat.roughness = 0.86;
        mat.side = THREE.DoubleSide;
      } else if (matName.includes("skin")) {
        mat.roughness = 0.66;
      } else if (matName.includes("hair") || matName.includes("beard")) {
        mat.roughness = 0.78;
        mat.side = THREE.DoubleSide;
      } else if (matName.includes("boot")) {
        mat.roughness = 0.58;
      } else {
        mat.roughness = Math.max(0.45, mat.roughness ?? 0.7);
      }
      mat.needsUpdate = true;
      return mat;
    });
    node.material = Array.isArray(node.material) ? cloned : cloned[0];
  });
}

// Árvore de Natal 3D estilizada para o palco da Praça / Sítio
function buildNatalDecor3D() {
  const natalGroup = new THREE.Group();
  natalGroup.position.set(1.36, 0, -0.52);

  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.14, 0.24, 16),
    new THREE.MeshStandardMaterial({ color: "#783f22", roughness: 0.82 })
  );
  pot.position.y = 0.12;
  natalGroup.add(pot);

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 0.26, 12),
    new THREE.MeshStandardMaterial({ color: "#4e2d18", roughness: 0.9 })
  );
  trunk.position.y = 0.34;
  natalGroup.add(trunk);

  const pineMat = new THREE.MeshStandardMaterial({ color: "#1d633d", roughness: 0.78 });
  [
    { r: 0.56, h: 0.68, y: 0.72 },
    { r: 0.43, h: 0.58, y: 1.12 },
    { r: 0.29, h: 0.48, y: 1.48 }
  ].forEach(tier => {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(tier.r, tier.h, 16), pineMat);
    cone.position.y = tier.y;
    natalGroup.add(cone);
  });

  const star = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.12, 0),
    new THREE.MeshBasicMaterial({ color: "#ffe188" })
  );
  star.position.y = 1.82;
  natalGroup.add(star);

  const ornamentColors = ["#ff5b6e", "#ffd07b", "#5ec7e6", "#5ee080"];
  const bulbs = [];
  for (let i = 0; i < 12; i++) {
    const angle = i * 1.15;
    const t = i / 11;
    const y = 0.52 + t * 1.05;
    const r = 0.50 * (1 - t * 0.62);
    const col = ornamentColors[i % ornamentColors.length];
    const bulbMat = new THREE.MeshBasicMaterial({ color: col });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.044, 10, 10), bulbMat);
    bulb.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
    bulb.userData = { phase: i * 0.7, baseColor: new THREE.Color(col) };
    natalGroup.add(bulb);
    bulbs.push(bulb);
  }

  // Caixas de presente natalinas ao pé da árvore
  const gift1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.18, 0.22),
    new THREE.MeshStandardMaterial({ color: "#d64550", roughness: 0.55 })
  );
  gift1.position.set(-0.28, 0.09, 0.22);
  gift1.rotation.y = 0.4;
  natalGroup.add(gift1);

  const gift2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.14, 0.18),
    new THREE.MeshStandardMaterial({ color: "#38bdf8", roughness: 0.5 })
  );
  gift2.position.set(0.26, 0.07, 0.24);
  gift2.rotation.y = -0.35;
  natalGroup.add(gift2);

  const treeLight = new THREE.PointLight("#ffd07b", 1.9, 5.5);
  treeLight.position.set(1.25, 1.45, -0.2);

  return { natalGroup, star, bulbs, treeLight };
}

async function initCharacterStage() {
  const canvas = document.getElementById("char3d-canvas");
  if (!canvas) return null;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (err) {
    console.warn("WebGL unavailable for char3d-canvas:", err);
    return null;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
  camera.position.set(0.42, 1.56, 4.3);

  const controls = new OrbitControls(camera, canvas);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.target.set(0.12, 1.02, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minPolarAngle = Math.PI * 0.25;
  controls.maxPolarAngle = Math.PI * 0.56;
  controls.update();

  // Iluminação quente do Vale do Juruá + halo de piso sobre a cidade real
  scene.add(new THREE.HemisphereLight("#ffeacc", "#1a3c3f", 1.3));
  const keyLight = new THREE.DirectionalLight("#ffd99a", 2.25);
  keyLight.position.set(2.8, 4.5, 3.6);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight("#5ec7e6", 1.25);
  rimLight.position.set(-3.2, 2.2, -2.5);
  scene.add(rimLight);

  // Pedestal sutil de madeira & aro luminoso integrado sobre o fundo real da cidade
  const pedestalGroup = new THREE.Group();
  const baseDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(1.12, 1.24, 0.11, 40),
    new THREE.MeshStandardMaterial({ color: "#332016", roughness: 0.85, metalness: 0.12, transparent: true, opacity: 0.9 })
  );
  baseDisc.position.y = -0.055;
  pedestalGroup.add(baseDisc);

  const goldRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.15, 0.028, 14, 64),
    new THREE.MeshBasicMaterial({ color: "#ffd07b" })
  );
  goldRing.rotation.x = Math.PI / 2;
  goldRing.position.y = 0.005;
  pedestalGroup.add(goldRing);
  scene.add(pedestalGroup);

  const natalPack = buildNatalDecor3D();
  scene.add(natalPack.natalGroup);
  scene.add(natalPack.treeLight);

  const [animGen, animMove, animTools] = await Promise.all([
    loadGLTF("./assets/models/char3d/Rig_Medium_General.glb"),
    loadGLTF("./assets/models/char3d/Rig_Medium_MovementBasic.glb"),
    loadGLTF("./assets/models/char3d/Rig_Medium_Tools.glb")
  ]);

  const clipMap = new Map();
  for (const g of [animGen, animMove, animTools]) {
    for (const clip of g.animations) {
      clipMap.set(clip.name, clip);
    }
  }

  const rigHolder = new THREE.Group();
  scene.add(rigHolder);

  let currentMixer = null;
  let currentAction = null;
  let currentCharId = "chico";
  let isSpeaking = false;
  let isFestive = document.documentElement.getAttribute("data-festive") === "natal";
  let speakingClock = 0;

  natalPack.natalGroup.visible = isFestive;
  natalPack.treeLight.visible = isFestive;

  async function buildAndShow(charId, clipName) {
    currentCharId = charId;
    const preset = CHARACTER_PRESETS[charId] || CHARACTER_PRESETS.chico;

    while (rigHolder.children.length > 0) {
      rigHolder.remove(rigHolder.children[0]);
    }
    if (currentMixer) {
      currentMixer.stopAllAction();
      currentMixer = null;
      currentAction = null;
    }

    const bodyGltf = await loader.loadAsync("./assets/models/char3d/Body.glb");
    const root = bodyGltf.scene;
    applyPalette(root, preset.colors, "body");
    cullCoveredBodyMeshes(root, preset.parts);

    const bodyBoneMap = new Map();
    root.traverse(obj => {
      if (obj.isBone && obj.name) {
        bodyBoneMap.set(obj.name, obj);
      }
    });

    for (const partId of preset.parts) {
      try {
        const partGltf = await loader.loadAsync(`./assets/models/char3d/${partId}.glb`);
        applyPalette(partGltf.scene, preset.colors, partId);

        const skinnedMeshes = [];
        partGltf.scene.traverse(obj => {
          if (obj.isSkinnedMesh) skinnedMeshes.push(obj);
        });

        for (const sm of skinnedMeshes) {
          const remappedBones = sm.skeleton.bones.map(b => bodyBoneMap.get(b.name) || b);
          const sharedSkel = new THREE.Skeleton(remappedBones, sm.skeleton.boneInverses);

          sm.removeFromParent();
          fitPartGeometryBindSpace(sm, partId);
          root.add(sm);
          sm.bind(sharedSkel, new THREE.Matrix4());
        }
      } catch (err) {
        console.warn("Falha ao acoplar peça 3D:", partId, err);
      }
    }

    const box = new THREE.Box3().setFromObject(root);
    const height = Math.max(0.1, box.max.y - box.min.y);
    const targetH = 1.92 * (preset.scale || 1);
    const normScale = targetH / height;
    root.scale.setScalar(normScale);

    const boxAfter = new THREE.Box3().setFromObject(root);
    root.position.y -= boxAfter.min.y;
    rigHolder.add(root);

    currentMixer = new THREE.AnimationMixer(root);
    playClip(clipName || preset.defaultAnim);
  }

  function playClip(clipName) {
    if (!currentMixer) return;
    const clip = clipMap.get(clipName) || clipMap.get("Idle_A");
    if (!clip) return;
    const nextAction = currentMixer.clipAction(clip);
    nextAction.reset();
    nextAction.setLoop(THREE.LoopRepeat, Infinity);
    nextAction.play();
    if (currentAction && currentAction !== nextAction) {
      currentAction.crossFadeTo(nextAction, 0.32, true);
    }
    currentAction = nextAction;
  }

  function resizeCharStage() {
    const w = canvas.clientWidth || 520;
    const h = canvas.clientHeight || 430;
    if (canvas.width !== w || canvas.height !== h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }

  const clock = new THREE.Clock();
  let stageVisible = true;
  const io = new IntersectionObserver(entries => {
    stageVisible = entries[0]?.isIntersecting ?? true;
  }, { threshold: 0.05 });
  io.observe(canvas);

  function animateChar() {
    requestAnimationFrame(animateChar);
    if (!stageVisible) return;
    resizeCharStage();
    const dt = Math.min(clock.getDelta(), 0.08);
    const elapsed = clock.elapsedTime;
    if (currentMixer) currentMixer.update(dt);

    if (isSpeaking) {
      speakingClock += dt * 7;
      rigHolder.position.y = Math.abs(Math.sin(speakingClock)) * 0.045;
      rigHolder.rotation.y = Math.sin(speakingClock * 0.4) * 0.14;
    } else {
      rigHolder.position.y *= 0.9;
      rigHolder.rotation.y = THREE.MathUtils.lerp(rigHolder.rotation.y, 0.18 + Math.sin(elapsed * 0.8) * 0.08, 0.05);
    }

    if (isFestive) {
      natalPack.star.rotation.y = elapsed * 1.4;
      natalPack.treeLight.intensity = 1.65 + Math.sin(elapsed * 3.1) * 0.45;
      for (const b of natalPack.bulbs) {
        const pulse = 0.65 + 0.35 * Math.sin(elapsed * 4.2 + b.userData.phase);
        b.material.color.copy(b.userData.baseColor).multiplyScalar(pulse * 1.35);
      }
    }

    controls.update();
    renderer.render(scene, camera);
  }

  await buildAndShow("chico", "Idle_A");
  animateChar();

  return {
    selectCharacter: (id, anim) => buildAndShow(id, anim),
    playAnimation: (anim) => playClip(anim),
    setSpeaking: (val) => { isSpeaking = Boolean(val); },
    setFestive: (val) => {
      isFestive = Boolean(val);
      natalPack.natalGroup.visible = isFestive;
      natalPack.treeLight.visible = isFestive;
    },
    getCurrentId: () => currentCharId,
    resetRotation: () => {
      controls.reset();
      rigHolder.rotation.y = 0;
    }
  };
}

// Configuração clean de luz, cor e pedestal concêntrico por raridade em Three.js
const RARITY_FX = {
  comum:    { hex: "#7a9a86", secHex: "#9cb8a6", basePower: 1.4, rings: 1, orbs: 0, speed: 0.6 },
  incomum:  { hex: "#4e8fa8", secHex: "#7db3c8", basePower: 2.1, rings: 1, orbs: 2, speed: 0.8 },
  raro:     { hex: "#8c73b8", secHex: "#b19cd9", basePower: 2.8, rings: 2, orbs: 3, speed: 1.0 },
  epico:    { hex: "#c97a3e", secHex: "#e39d64", basePower: 3.6, rings: 2, orbs: 4, speed: 1.2 },
  lendario: { hex: "#d4a13e", secHex: "#f0c975", basePower: 4.5, rings: 2, orbs: 6, speed: 1.4 }
};

function createRarityFXGroup(rarityKey) {
  const cfg = RARITY_FX[rarityKey] || RARITY_FX.comum;
  const fxGroup = new THREE.Group();
  const rings = [];
  const orbs = [];

  // Disco de base sutil no chão
  const floorMat = new THREE.MeshBasicMaterial({
    color: cfg.hex,
    transparent: true,
    opacity: 0.12,
    depthWrite: false
  });
  const floorDisc = new THREE.Mesh(new THREE.CircleGeometry(1.12, 40), floorMat);
  floorDisc.rotation.x = -Math.PI / 2;
  floorDisc.position.y = -0.82;
  fxGroup.add(floorDisc);

  // Anéis concêntricos horizontais na base (sem feixes inclinados cortando a ferramenta)
  for (let r = 0; r < cfg.rings; r++) {
    const ringMat = new THREE.MeshBasicMaterial({
      color: r % 2 === 0 ? cfg.hex : cfg.secHex,
      transparent: true,
      opacity: r === 0 ? 0.55 : 0.35,
      depthWrite: false
    });
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.06 - r * 0.28, 0.015, 10, 56),
      ringMat
    );
    ring.position.y = -0.80 + r * 0.02;
    ring.rotation.x = Math.PI / 2;
    fxGroup.add(ring);
    rings.push({ mesh: ring, mat: ringMat, idx: r, baseOpacity: ringMat.opacity });
  }

  // Pontos de luz discretos orbitando próximo à base
  for (let i = 0; i < cfg.orbs; i++) {
    const orbMat = new THREE.MeshBasicMaterial({
      color: i % 2 === 0 ? cfg.secHex : cfg.hex,
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    });
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), orbMat);
    fxGroup.add(orb);
    orbs.push({
      mesh: orb,
      mat: orbMat,
      angle: (i / Math.max(1, cfg.orbs)) * Math.PI * 2,
      radius: 0.86 + (i % 2) * 0.14,
      heightOffset: (i / Math.max(1, cfg.orbs)) * 0.8 - 0.5
    });
  }

  return { fxGroup, floorMat, rings, orbs, cfg };
}

// GALERIA DE OBJETOS 3D COM LUZ, COR E INTENSIDADE DE RARIDADE
async function initPropsShowcase() {
  const cards = Array.from(document.querySelectorAll(".prop-viewport[data-model]"));
  if (cards.length === 0) return { setIntensity: () => {} };

  const offscreenCanvas = document.createElement("canvas");
  offscreenCanvas.width = 480;
  offscreenCanvas.height = 360;

  let sharedRenderer;
  try {
    sharedRenderer = new THREE.WebGLRenderer({ canvas: offscreenCanvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  } catch (err) {
    console.warn("WebGL unavailable for props showcase:", err);
    return { setIntensity: () => {} };
  }

  sharedRenderer.setSize(480, 360, false);
  sharedRenderer.outputColorSpace = THREE.SRGBColorSpace;
  sharedRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  sharedRenderer.toneMappingExposure = 1.18;

  const propCamera = new THREE.PerspectiveCamera(36, 480 / 360, 0.1, 100);
  propCamera.position.set(0, 0.88, 3.35);
  propCamera.lookAt(0, -0.05, 0);

  let globalLightMultiplier = 1.0;

  const items = await Promise.all(cards.map(async (wrap, index) => {
    const modelPath = wrap.dataset.model;
    const rarityKey = wrap.dataset.rarity || "comum";
    const baseWeight = Number(wrap.dataset.intensity || "0.5");
    const cfg = RARITY_FX[rarityKey] || RARITY_FX.comum;

    const itemCanvas = wrap.querySelector("canvas.prop-item-canvas");
    const ctx2d = itemCanvas.getContext("2d");

    const itemScene = new THREE.Scene();
    itemScene.add(new THREE.HemisphereLight("#fff1d6", "#102830", 1.1));

    const keyDir = new THREE.DirectionalLight("#ffe6be", 1.4);
    keyDir.position.set(3, 4.5, 4);
    itemScene.add(keyDir);

    // Luzes diretas coloridas pela raridade do objeto
    const rarityRim = new THREE.DirectionalLight(cfg.secHex, cfg.basePower * 0.45);
    rarityRim.position.set(-3.2, 2.2, -3.2);
    itemScene.add(rarityRim);

    const raritySpot = new THREE.PointLight(cfg.hex, cfg.basePower * (0.7 + baseWeight * 0.7), 9);
    raritySpot.position.set(0, -0.45, 1.45);
    itemScene.add(raritySpot);

    const fxPack = createRarityFXGroup(rarityKey);
    itemScene.add(fxPack.fxGroup);

    const holder = new THREE.Group();
    itemScene.add(holder);

    const state = {
      wrap,
      cardEl: wrap.closest(".prop-card"),
      itemCanvas,
      ctx2d,
      scene: itemScene,
      holder,
      raritySpot,
      rarityRim,
      fxPack,
      cfg,
      baseWeight,
      currentIntensity: cfg.basePower,
      hovered: false,
      visible: true,
      yaw: index * 0.65,
      pitch: 0.22,
      dragging: false,
      lastX: 0,
      lastY: 0,
      phase: index * 0.9
    };

    try {
      const gltf = await loadGLTF(modelPath);
      const model = gltf.scene.clone(true);
      const isLowpolyCrop = /\/(hoe|crop_pumpkin_ripe|shipping_bin)\.glb$/.test(modelPath);

      if (isLowpolyCrop) {
        const atlasTex = await getLowpolyAtlas();
        model.traverse(n => {
          if (n.isMesh && n.material) {
            const mats = Array.isArray(n.material) ? n.material : [n.material];
            mats.forEach(m => {
              m.map = atlasTex;
              m.needsUpdate = true;
            });
          }
        });
      }

      if (modelPath.includes("boto_rio_jurua")) {
        const botoGroup = new THREE.Group();
        model.traverse(n => {
          if (n.isMesh && n.geometry) {
            const mats = (Array.isArray(n.material) ? n.material : [n.material]).map(m => {
              const nm = (m.name || "").toLowerCase();
              return new THREE.MeshStandardMaterial({
                color: nm.includes("bottom") ? "#ffe5ef" : "#ff86b2",
                roughness: 0.34,
                metalness: 0.14
              });
            });
            const staticBoto = new THREE.Mesh(
              n.geometry,
              Array.isArray(n.material) ? mats : mats[0]
            );
            staticBoto.rotation.x = -Math.PI / 2;
            botoGroup.add(staticBoto);
          }
        });
        botoGroup.updateMatrixWorld(true);
        const bBox = new THREE.Box3().setFromObject(botoGroup);
        const bSize = new THREE.Vector3();
        const bCenter = new THREE.Vector3();
        bBox.getSize(bSize);
        bBox.getCenter(bCenter);
        const maxD = Math.max(bSize.x, bSize.y, bSize.z, 0.001);
        const sc = 1.64 / maxD;
        botoGroup.scale.setScalar(sc);
        botoGroup.position.sub(bCenter.multiplyScalar(sc));
        botoGroup.rotation.y = Math.PI * 0.32;
        holder.add(botoGroup);
      } else {
        model.updateMatrixWorld(true);
        const box = new THREE.Box3();
        model.traverse(n => {
          if (n.isMesh && n.geometry) {
            n.geometry.computeBoundingBox();
            const b = n.geometry.boundingBox.clone().applyMatrix4(n.matrixWorld);
            box.union(b);
          }
        });
        if (box.isEmpty()) box.setFromObject(model);

        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        const maxDim = Math.max(size.x, size.y, size.z, 0.01);
        const targetScale = 1.60 / maxDim;
        model.scale.multiplyScalar(targetScale);
        model.updateMatrixWorld(true);

        const boxScaled = new THREE.Box3();
        model.traverse(n => {
          if (n.isMesh && n.geometry) {
            const b = n.geometry.boundingBox.clone().applyMatrix4(n.matrixWorld);
            boxScaled.union(b);
          }
        });
        if (!boxScaled.isEmpty()) {
          boxScaled.getCenter(center);
          model.position.sub(center);
        }
        holder.add(model);
      }
    } catch (err) {
      console.warn("Erro ao carregar prop GLB:", modelPath, err);
    }

    if (state.cardEl) {
      state.cardEl.addEventListener("pointerenter", () => { state.hovered = true; });
      state.cardEl.addEventListener("pointerleave", () => { state.hovered = false; });
    }

    wrap.addEventListener("pointerdown", e => {
      state.dragging = true;
      wrap.dataset.dragging = "1";
      state.lastX = e.clientX;
      state.lastY = e.clientY;
      wrap.setPointerCapture(e.pointerId);
    });
    wrap.addEventListener("pointermove", e => {
      if (!state.dragging) return;
      const dx = e.clientX - state.lastX;
      const dy = e.clientY - state.lastY;
      state.lastX = e.clientX;
      state.lastY = e.clientY;
      state.yaw += dx * 0.015;
      state.pitch = Math.max(-0.55, Math.min(0.85, state.pitch + dy * 0.01));
    });
    const stopDrag = () => {
      state.dragging = false;
      delete wrap.dataset.dragging;
    };
    wrap.addEventListener("pointerup", stopDrag);
    wrap.addEventListener("pointercancel", stopDrag);

    return state;
  }));

  const io = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const found = items.find(it => it.wrap === entry.target);
      if (found) found.visible = entry.isIntersecting;
    }
  }, { rootMargin: "140px" });
  items.forEach(it => io.observe(it.wrap));

  let t = 0;
  function renderPropsLoop() {
    requestAnimationFrame(renderPropsLoop);
    t += 0.016;

    for (const it of items) {
      if (!it.visible || it.cardEl?.hasAttribute("hidden")) continue;
      if (!it.dragging) {
        it.yaw += 0.007 + it.cfg.speed * 0.0022;
      }

      const hoverBoost = it.hovered || it.dragging ? 1.48 : 1.0;
      const pulse = 0.88 + 0.18 * Math.sin(t * 2.4 + it.phase);
      const targetSpot = it.cfg.basePower * (0.72 + it.baseWeight * 0.72) * globalLightMultiplier * hoverBoost * pulse;

      it.currentIntensity = THREE.MathUtils.lerp(it.currentIntensity, targetSpot, 0.12);
      it.raritySpot.intensity = it.currentIntensity;
      it.raritySpot.position.x = Math.cos(t * it.cfg.speed + it.phase) * 1.35;
      it.raritySpot.position.z = Math.sin(t * it.cfg.speed + it.phase) * 1.35;
      it.rarityRim.intensity = (0.65 + it.baseWeight * 0.85) * globalLightMultiplier * hoverBoost;

      // Anéis e esferas 3D em órbita contínua
      it.fxPack.floorMat.opacity = Math.min(0.55, (0.12 + it.baseWeight * 0.18) * globalLightMultiplier * hoverBoost);
      for (const ringObj of it.fxPack.rings) {
        ringObj.mesh.rotation.z = t * 0.45 * it.cfg.speed * (ringObj.idx === 0 ? 1 : -1);
        ringObj.mat.opacity = Math.min(0.85, ringObj.baseOpacity * globalLightMultiplier * hoverBoost);
      }

      for (const orbObj of it.fxPack.orbs) {
        const a = orbObj.angle + t * (0.85 + it.cfg.speed * 0.35);
        orbObj.mesh.position.x = Math.cos(a) * orbObj.radius;
        orbObj.mesh.position.z = Math.sin(a) * orbObj.radius;
        orbObj.mesh.position.y = ((orbObj.heightOffset + t * 0.32 * it.cfg.speed + 0.85) % 1.65) - 0.82;
        orbObj.mat.opacity = Math.min(1, 0.75 * globalLightMultiplier * hoverBoost);
      }

      it.holder.rotation.y = it.yaw;
      it.holder.rotation.x = it.pitch;
      it.holder.position.y = 0.08 + Math.sin(t * 2 + it.phase) * 0.055;

      sharedRenderer.render(it.scene, propCamera);

      const cw = it.wrap.clientWidth || 320;
      const ch = it.wrap.clientHeight || 240;
      if (it.itemCanvas.width !== cw || it.itemCanvas.height !== ch) {
        it.itemCanvas.width = cw;
        it.itemCanvas.height = ch;
      }
      it.ctx2d.clearRect(0, 0, cw, ch);
      it.ctx2d.drawImage(offscreenCanvas, 0, 0, cw, ch);
    }
  }
  renderPropsLoop();

  return {
    setIntensity: (mult) => {
      globalLightMultiplier = Math.max(0.35, Math.min(1.8, Number(mult) || 1));
    }
  };
}

(async () => {
  const charApi = await initCharacterStage();
  const propsApi = await initPropsShowcase();

  window.JuruStage3D = {
    selectCharacter: (id, anim) => charApi ? charApi.selectCharacter(id, anim) : Promise.resolve(),
    playAnimation: (anim) => charApi?.playAnimation(anim),
    setSpeaking: (val) => charApi?.setSpeaking(val),
    setFestive: (val) => charApi?.setFestive(val),
    resetRotation: () => charApi?.resetRotation(),
    setRarityIntensity: (mult) => propsApi?.setIntensity(mult)
  };
})();
