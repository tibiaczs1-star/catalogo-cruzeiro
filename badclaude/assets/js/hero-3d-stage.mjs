import * as THREE from 'three';
import { GLTFLoader } from '../vendor/three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from '../vendor/three/addons/environments/RoomEnvironment.js';

function clamp(v, mn, mx) {
  return Math.max(mn, Math.min(mx, v));
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function smoothstep(edge0, edge1, x) {
  const t = clamp01((x - edge0) / Math.max(1e-5, edge1 - edge0));
  return t * t * (3 - 2 * t);
}

const DEFAULT_URLS = {
  modelUrl: new URL('../3d/badclaude-cyber-hound.glb', import.meta.url).href,
  normalMapUrl: new URL('../3d/textures/obsidian_normal.jpg', import.meta.url).href,
  roughMapUrl: new URL('../3d/textures/obsidian_rough.jpg', import.meta.url).href,
  audioPortalUrl: new URL('../audio/hound-portal-run.mp3', import.meta.url).href,
  audioSmashUrl: new URL('../audio/hound-smash-roar.mp3', import.meta.url).href,
  audioBarkUrl: new URL('../audio/hound-bark-growl.mp3', import.meta.url).href,
  audioPawUrl: new URL('../audio/hound-paw-chuff.mp3', import.meta.url).href,
};

export class Hero3DStage {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.options = Object.assign({
      ...DEFAULT_URLS,
      centerFraming: false,
      autoSoundOnStart: false,
      onPhaseChange: null,
      onContextLost: null,
      onAudioState: null,
      onReady: null,
      onIntroComplete: null,
    }, options);

    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.pmrem = null;
    this.envRT = null;

    this.mixer = null;
    this.timer = new THREE.Timer();
    this.actions = {};
    this.activeAction = null;
    this.activeClipName = '';

    this.houndRoot = new THREE.Group();
    this.targetsRoot = new THREE.Group();
    this.macbookGroup = new THREE.Group();
    this.bones = {};
    this.fresnelUniforms = [];

    this.emblemClaude = null;
    this.emblemAstra = null;
    this.portalMesh = null;
    this.portalUniforms = null;
    this.shards = [];
    this.sparks = null;
    this.sparksUniforms = null;
    this.floorMat = null;
    this.impactLight = null;
    this.collarLight = null;
    this.portalLight = null;

    // Cronologia da Entrada Épica (MacBook -> Corrida -> Destrói Astra & Claude -> Senta e Interage)
    this.T_LEAP_START = 0.58;
    this.T_SMASH_CLIP = 1.92;
    this.IMPACT_T = 2.36; // f=14 do SmashRoar
    this.T_SIT_TRANS = 3.92;
    this.T_GUARDIAN_START = 4.92;

    this.simTime = 0.0;
    this.ready = false;
    this.warmupFrames = 0;
    this.entranceStarted = false;
    this.introCompletedFired = false;
    this.heardEntranceWithSound = false;

    // Máquina de estados do Guardião Sentado (intervalos calmos de 9.5s a 14.5s, NUNCA "locão"!)
    this.guardianMode = 'INTRO'; // 'INTRO' | 'SIT_WATCH' | 'TRICK_PAW' | 'TRICK_BARK' | 'TRICK_TAIL'
    this.trickTimer = 0.0;
    this.nextAutonomousDelay = 10.5;
    this.trickCounter = 0;

    // Gaze tracking suave sobre pose limpa do mixer (zero acúmulo de rotação!)
    this.gazeYaw = 0;
    this.gazePitch = 0;
    this._tmpQuatYaw = new THREE.Quaternion();
    this._tmpQuatPitch = new THREE.Quaternion();
    this._axisUp = new THREE.Vector3(0, 1, 0);
    this._axisRight = new THREE.Vector3(1, 0, 0);

    this.isVisible = true;
    this.isPaused = false;
    this.soundUnlocked = false;
    this.soundMuted = false;
    this.impacted = false;
    this.portalSoundPlayed = false;
    this.smashSoundPlayed = false;
    this.sparkAge = 99;
    this.lastPhaseId = '';

    // Web Audio API Multi-Cue pré-decodificado
    this.audioCtx = null;
    this.analyser = null;
    this.fftBins = null;
    this.audioRawMap = {};
    this.audioBuffers = {};
    this.activeSources = new Set();
    this.audioEnergy = 0;

    this.mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    this.rafId = 0;
    this.disposed = false;
    this.contextLost = false;
    this.mixerAdvanced = false;
    this.needsRender = true;
    this.sceneDrawCalls = 0;
    this.sceneTriangles = 0;

    this.init();
  }

  init() {
    this.setupRenderer();
    this.setupSceneAndLights();
    this.setupSeamlessAlphaFloor();
    this.setupMoltenSparksGPU();
    this.preloadAllAudioBytes();
    this.bindEvents();
    this.bindGlobalAudioUnlock();
    this.emitPhase('⚡ CARREGANDO PALCO 3D...', 0);
    this.loadAssetsAndWarmup();
    this.startLoop();
  }

  emitPhase(phaseId, t) {
    if (phaseId !== this.lastPhaseId) {
      this.lastPhaseId = phaseId;
      if (typeof this.options.onPhaseChange === 'function') {
        this.options.onPhaseChange(phaseId, t);
      }
    }
  }

  preloadAllAudioBytes() {
    const map = {
      portal: this.options.audioPortalUrl,
      smash: this.options.audioSmashUrl,
      bark: this.options.audioBarkUrl,
      paw: this.options.audioPawUrl,
    };
    for (const [key, url] of Object.entries(map)) {
      if (!url) continue;
      this.audioRawMap[key] = fetch(url)
        .then((r) => (r.ok ? r.arrayBuffer() : null))
        .catch(() => null);
    }
  }

  async ensureAudioUnlocked() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      if (!this.audioCtx) {
        this.audioCtx = new AC();
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 64;
        this.analyser.connect(this.audioCtx.destination);
        this.fftBins = new Uint8Array(this.analyser.frequencyBinCount);
      }
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }
      if (this.audioCtx.state !== 'running') {
        return false;
      }

      const decodeJobs = Object.entries(this.audioRawMap).map(async ([k, prom]) => {
        if (this.audioBuffers[k]) return;
        const raw = await prom;
        if (!raw) return;
        try {
          this.audioBuffers[k] = await this.audioCtx.decodeAudioData(raw.slice(0));
        } catch {}
      });
      await Promise.all(decodeJobs);

      if (!this.soundUnlocked) {
        this.soundUnlocked = true;
        if (typeof this.options.onAudioState === 'function') {
          this.options.onAudioState(true, this.soundMuted);
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  async playCue(cueName, offsetSec = 0, volume = 1.0) {
    if (this.soundMuted || this.disposed) return false;
    const ok = await this.ensureAudioUnlocked();
    if (!ok || !this.audioCtx || !this.audioBuffers[cueName]) return false;
    try {
      const buf = this.audioBuffers[cueName];
      const src = this.audioCtx.createBufferSource();
      src.buffer = buf;
      const gain = this.audioCtx.createGain();
      gain.gain.value = volume;
      src.connect(gain);
      gain.connect(this.analyser);
      const startOff = clamp(offsetSec, 0, Math.max(0, buf.duration - 0.05));
      src.onended = () => this.activeSources.delete(src);
      this.activeSources.add(src);
      src.start(0, startOff);
      return true;
    } catch {
      return false;
    }
  }

  stopAllCues() {
    for (const src of this.activeSources) {
      try { src.stop(); } catch {}
      try { src.disconnect(); } catch {}
    }
    this.activeSources.clear();
  }

  toggleMute() {
    this.soundMuted = !this.soundMuted;
    if (this.soundMuted) {
      this.stopAllCues();
    } else {
      this.ensureAudioUnlocked();
    }
    if (typeof this.options.onAudioState === 'function') {
      this.options.onAudioState(this.soundUnlocked, this.soundMuted);
    }
    return this.soundMuted;
  }

  bindGlobalAudioUnlock() {
    this._onFirstGesture = async () => {
      const wasUnlocked = this.soundUnlocked;
      const ok = await this.ensureAudioUnlocked();
      if (ok) {
        window.removeEventListener('pointerdown', this._onFirstGesture, true);
        window.removeEventListener('keydown', this._onFirstGesture, true);
        window.removeEventListener('touchstart', this._onFirstGesture, true);
        if (!wasUnlocked && this.ready && !this.heardEntranceWithSound && this.simTime > 0.7 && this.simTime < 9.0) {
          if (this.simTime < this.IMPACT_T) {
            this.playCue('portal', Math.max(0, this.simTime - this.T_LEAP_START), 0.92);
          } else if (this.simTime < this.T_SIT_TRANS) {
            this.playCue('smash', Math.max(0, this.simTime - this.T_SMASH_CLIP), 1.0);
            this.heardEntranceWithSound = true;
          }
        }
      }
    };
    window.addEventListener('pointerdown', this._onFirstGesture, { capture: true, passive: true });
    window.addEventListener('keydown', this._onFirstGesture, { capture: true, passive: true });
    window.addEventListener('touchstart', this._onFirstGesture, { capture: true, passive: true });
  }

  setupRenderer() {
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(320, Math.round(rect.width || this.canvas.parentElement?.clientWidth || window.innerWidth));
    const h = Math.max(320, Math.round(rect.height || this.canvas.parentElement?.clientHeight || 680));

    // ALPHA: TRUE REAL -> Zero retângulo preto opaco, zero linha divisória em monitores Ultrawide!
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true,
      premultipliedAlpha: true,
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(w, h, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  setupSceneAndLights() {
    this.scene = new THREE.Scene();
    this.scene.background = null;
    this.scene.fog = null;

    const w = Math.max(320, this.canvas.clientWidth || window.innerWidth);
    const h = Math.max(320, this.canvas.clientHeight || 680);
    this.camera = new THREE.PerspectiveCamera(41, w / h, 0.1, 60);

    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envRT = this.pmrem.fromScene(new RoomEnvironment(), 0.04);
    this.scene.environment = this.envRT.texture;
    this.scene.environmentIntensity = 0.62;

    const keyLight = new THREE.DirectionalLight(0xfff5ee, 2.35);
    keyLight.position.set(3.8, 6.4, 4.8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 1.0;
    keyLight.shadow.camera.far = 20.0;
    keyLight.shadow.camera.left = -4.8;
    keyLight.shadow.camera.right = 4.8;
    keyLight.shadow.camera.top = 4.8;
    keyLight.shadow.camera.bottom = -4.8;
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);

    const softFill = new THREE.HemisphereLight(0xdbeafe, 0x1e1014, 0.72);
    this.scene.add(softFill);

    const crimsonRim = new THREE.DirectionalLight(0xe11d2e, 2.15);
    crimsonRim.position.set(-4.6, 2.9, -2.4);
    this.scene.add(crimsonRim);

    const cyanRim = new THREE.DirectionalLight(0x22d3ee, 1.75);
    cyanRim.position.set(3.8, 3.2, -3.5);
    this.scene.add(cyanRim);

    const goldFill = new THREE.PointLight(0xf5c518, 1.05, 8.5);
    goldFill.position.set(-2.0, 1.35, 3.6);
    this.scene.add(goldFill);

    this.impactLight = new THREE.PointLight(0xe11d2e, 0.25, 7.0);
    this.impactLight.position.set(0, 0.55, 2.15);
    this.scene.add(this.impactLight);

    this.portalLight = new THREE.PointLight(0x22d3ee, 1.2, 5.5);
    this.portalLight.position.set(0.45, 1.15, -1.25);
    this.scene.add(this.portalLight);

    this.collarLight = new THREE.PointLight(0xe11d2e, 0.55, 2.5);
    this.collarLight.position.set(0, 1.55, 1.25);
    this.houndRoot.add(this.collarLight);

    this.scene.add(this.macbookGroup);
    this.scene.add(this.houndRoot);
    this.scene.add(this.targetsRoot);
  }

  /** Chão Transparente Per-Pixel: desenha APENAS sombra de contato, rachaduras de magma e onda de choque sobre a Fortaleza! */
  setupSeamlessAlphaFloor() {
    const texLoader = new THREE.TextureLoader();
    this._floorTexPromises = [];
    const loadTex = (url) =>
      new Promise((resolve) => {
        const tx = texLoader.load(
          url,
          () => resolve(tx),
          undefined,
          () => resolve(tx)
        );
        tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
        tx.repeat.set(5, 5);
      });

    const pNorm = loadTex(this.options.normalMapUrl);
    const pRough = loadTex(this.options.roughMapUrl);
    this._floorTexPromises.push(pNorm, pRough);

    const tNormalPlaceholder = new THREE.Texture();
    const tRoughPlaceholder = new THREE.Texture();
    pNorm.then((tx) => { if (this.floorMat) this.floorMat.uniforms.tNormal.value = tx; });
    pRough.then((tx) => { if (this.floorMat) this.floorMat.uniforms.tRough.value = tx; });

    this.floorMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        tNormal: { value: tNormalPlaceholder },
        tRough: { value: tRoughPlaceholder },
        uTime: { value: 0 },
        uShockRadius: { value: -1.0 },
        uShockFade: { value: 0.0 },
        uMagmaHeat: { value: 0.0 },
        uAudioEnergy: { value: 0.0 },
        uDogPos: { value: new THREE.Vector2(0.0, 0.3) },
        uClaudePos: { value: new THREE.Vector2(-0.70, 2.15) },
        uAstraPos: { value: new THREE.Vector2(0.70, 2.15) },
      },
      vertexShader: /* glsl */ `
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D tNormal;
        uniform sampler2D tRough;
        uniform float uTime;
        uniform float uShockRadius;
        uniform float uShockFade;
        uniform float uMagmaHeat;
        uniform float uAudioEnergy;
        uniform vec2 uDogPos;
        uniform vec2 uClaudePos;
        uniform vec2 uAstraPos;
        varying vec3 vWorldPos;

        void main() {
          vec2 p = vWorldPos.xz;
          vec3 rockN = texture2D(tNormal, p * 0.52).xyz * 2.0 - 1.0;

          // Máscara radial estrita p/ desaparecer 100% (alpha = 0) antes das bordas do canvas!
          float radialStage = smoothstep(4.35, 1.45, length(p - vec2(0.10, 0.55)));
          if (radialStage <= 0.001) discard;

          // Sombra de contato orgânica sob o Doberman e sob o MacBook (ancorando no chão da Fortaleza)
          float dogShadow = smoothstep(1.35, 0.15, length(p - uDogPos)) * 0.68;
          float macShadow = smoothstep(1.55, 0.25, length((p - vec2(0.42, -1.85)) * vec2(0.85, 1.15))) * 0.58;
          float contactAlpha = max(dogShadow, macShadow) * radialStage;

          // Rachaduras de magma nos emblemas estilhaçados
          float dClaude = length(p - uClaudePos);
          float dAstra = length(p - uAstraPos);
          float dImp = min(dClaude, dAstra);

          float angC = atan(p.y - uClaudePos.y, p.x - uClaudePos.x);
          float angA = atan(p.y - uAstraPos.y, p.x - uAstraPos.x);
          float cracksC = smoothstep(0.90, 0.99, abs(sin(angC * 6.0 + rockN.x * 2.1))) * smoothstep(1.20, 0.04, dClaude);
          float cracksA = smoothstep(0.90, 0.99, abs(sin(angA * 5.0 + rockN.y * 2.1))) * smoothstep(1.20, 0.04, dAstra);

          vec3 claudeGlow = vec3(0.98, 0.36, 0.14) * cracksC;
          vec3 astraGlow = vec3(0.14, 0.86, 1.0) * cracksA;
          vec3 coreHeat = mix(vec3(0.88, 0.11, 0.18), vec3(0.96, 0.75, 0.12), uAudioEnergy) * smoothstep(0.85, 0.0, dImp) * 0.35;
          vec3 magmaCol = (claudeGlow + astraGlow + coreHeat) * uMagmaHeat * (0.95 + uAudioEnergy * 0.35);

          // Anéis de onda de choque contidos na máscara radial (ZERO corte reto!)
          float dCenter = length(p - vec2(0.0, 2.15));
          float ring1 = smoothstep(0.18, 0.0, abs(dCenter - uShockRadius)) * uShockFade;
          float ring2 = smoothstep(0.12, 0.0, abs(dCenter - (uShockRadius * 0.70))) * uShockFade;
          vec3 shockCol = (vec3(0.95, 0.12, 0.22) * ring1 * 1.15 + vec3(0.96, 0.76, 0.14) * ring2 * 0.85) * radialStage;

          vec3 glowRgb = (magmaCol * radialStage) + shockCol;
          float glowLum = clamp(max(glowRgb.r, max(glowRgb.g, glowRgb.b)), 0.0, 1.0);

          float finalAlpha = clamp(max(contactAlpha, glowLum * 0.92), 0.0, 0.94);
          vec3 finalCol = mix(vec3(0.008, 0.010, 0.018), glowRgb, clamp(glowLum * 1.35, 0.0, 1.0));

          gl_FragColor = vec4(finalCol, finalAlpha);
        }
      `,
    });

    const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), this.floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(0, 0, 0.2);
    this.scene.add(floorMesh);
  }

  /** Portal Energético GLSL na frente da tela do MacBook Pro quando o Doberman salta para fora! */
  buildMacBookPortalEffect() {
    this.portalUniforms = {
      uTime: { value: 0.0 },
      uIntensity: { value: 0.0 },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.portalUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform float uIntensity;
        varying vec2 vUv;
        void main() {
          if (uIntensity <= 0.005) discard;
          vec2 p = (vUv - 0.5) * vec2(2.2, 1.6);
          float r = length(p);
          float wave1 = sin(r * 18.0 - uTime * 11.0) * 0.5 + 0.5;
          float ring = smoothstep(0.95, 0.25, r) * pow(wave1, 2.2);
          float rim = smoothstep(0.14, 0.0, abs(r - 0.68));
          vec3 col = mix(vec3(0.88, 0.11, 0.18), vec3(0.14, 0.86, 1.0), clamp(r, 0.0, 1.0));
          col += vec3(0.98, 0.78, 0.16) * rim * 1.25;
          float alpha = clamp((ring * 0.55 + rim * 0.85) * smoothstep(1.05, 0.55, r) * uIntensity, 0.0, 0.92);
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.78, 1.08), mat);
    mesh.position.set(0, 0.66, -0.74);
    mesh.rotation.x = -0.26;
    this.portalMesh = mesh;
    this.macbookGroup.add(mesh);
  }

  injectSubtleFurRim(mat, tintHex = 0xe11d2e, strengthBase = 0.06) {
    if (!mat || mat.userData.__fresnelInjected) return;
    mat.userData.__fresnelInjected = true;
    const uObj = {
      uFresnelColor: { value: new THREE.Color(tintHex) },
      uAudioEnergy: { value: 0.0 },
      uBaseStrength: { value: strengthBase },
    };
    this.fresnelUniforms.push(uObj);
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uFresnelColor = uObj.uFresnelColor;
      shader.uniforms.uAudioEnergy = uObj.uAudioEnergy;
      shader.uniforms.uBaseStrength = uObj.uBaseStrength;
      shader.fragmentShader =
        `
        uniform vec3 uFresnelColor;
        uniform float uAudioEnergy;
        uniform float uBaseStrength;
        \n` +
        shader.fragmentShader.replace(
          '#include <dithering_fragment>',
          `
          vec3 fViewDir = normalize(vViewPosition);
          vec3 fNormal = normalize(normal);
          float fRim = pow(1.0 - clamp(abs(dot(fNormal, fViewDir)), 0.0, 1.0), 3.6);
          gl_FragColor.rgb += uFresnelColor * fRim * (uBaseStrength + uAudioEnergy * 0.28);
          #include <dithering_fragment>
          `
        );
    };
    mat.needsUpdate = true;
  }

  setupMoltenSparksGPU() {
    const count = 380;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const seed = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const originX = i % 2 === 0 ? -0.70 : 0.70;
      pos[i * 3 + 0] = originX + (Math.random() - 0.5) * 0.28;
      pos[i * 3 + 1] = 0.24 + Math.random() * 0.24;
      pos[i * 3 + 2] = 2.15 + (Math.random() - 0.5) * 0.28;

      const ang = Math.random() * Math.PI * 2;
      const spd = 1.4 + Math.random() * 4.2;
      vel[i * 3 + 0] = Math.cos(ang) * spd;
      vel[i * 3 + 1] = 2.4 + Math.random() * 4.8;
      vel[i * 3 + 2] = Math.sin(ang) * spd;
      seed[i] = Math.random();
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aVel', new THREE.BufferAttribute(vel, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));

    this.sparksUniforms = {
      uSparkAge: { value: 99.0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 1.5) },
    };

    const mat = new THREE.ShaderMaterial({
      uniforms: this.sparksUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute vec3 aVel;
        attribute float aSeed;
        uniform float uSparkAge;
        uniform float uPixelRatio;
        varying float vLife;
        varying float vSeed;
        void main() {
          float t = max(0.0, uSparkAge);
          vSeed = aSeed;
          float maxLife = 1.25 + aSeed * 0.65;
          vLife = clamp(1.0 - (t / maxLife), 0.0, 1.0);

          vec3 displaced = position + aVel * t;
          displaced.y -= 0.5 * 9.2 * t * t;
          displaced.y = max(0.03, displaced.y);

          vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (22.0 + aSeed * 16.0) * vLife * uPixelRatio / max(0.8, -mv.z);
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vLife;
        varying float vSeed;
        void main() {
          vec2 cxy = gl_PointCoord * 2.0 - 1.0;
          float r2 = dot(cxy, cxy);
          float alpha = smoothstep(1.0, 0.15, r2) * vLife;
          vec3 cHot = vec3(1.0, 0.92, 0.65);
          vec3 cMid = mix(vec3(0.95, 0.24, 0.16), vec3(0.14, 0.86, 1.0), step(0.50, vSeed));
          vec3 col = mix(cMid, cHot, pow(vLife, 1.6));
          gl_FragColor = vec4(col * 1.35, alpha);
        }
      `,
    });

    this.sparks = new THREE.Points(geo, mat);
    this.sparks.frustumCulled = false;
    this.scene.add(this.sparks);
  }

  bone(name) {
    return this.bones[name] || this.bones[name.replace(/\./g, '')] || null;
  }

  async loadAssetsAndWarmup() {
    const loader = new GLTFLoader();
    const gltfPromise = new Promise((resolve, reject) => {
      loader.load(this.options.modelUrl, resolve, undefined, reject);
    });

    try {
      const [gltf] = await Promise.all([gltfPromise, ...this._floorTexPromises]);
      if (this.disposed) return;

      const root = gltf.scene;
      const moveToTargets = [];
      const moveToHound = [];
      const moveToMac = [];

      root.traverse((obj) => {
        if (obj.isBone) {
          this.bones[obj.name] = obj;
          this.bones[obj.name.replace(/\./g, '')] = obj;
        }
        if (obj.isMesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => {
            if (!m) return;
            // Garante pelagem 100% natural orgânica (ZERO plástico metálico no Wolf!)
            if (obj.name === 'Wolf') {
              const mName = String(m.name || '');
              if (!mName.includes('Eyes')) {
                m.metalness = 0.0;
                if (mName.includes('VelvetBlack') || mName.includes('RustMahogany')) {
                  m.roughness = Math.max(0.64, m.roughness || 0.68);
                }
              }
              this.injectSubtleFurRim(m, 0xe11d2e, 0.05);
            } else if (obj.name.startsWith('Armor_')) {
              this.injectSubtleFurRim(m, 0xf5c518, 0.10);
            } else if (obj.name === 'MacBook_Screen') {
              m.emissive = new THREE.Color(0xffffff);
              if (m.map && !m.emissiveMap) m.emissiveMap = m.map;
              m.emissiveIntensity = 0.92;
              m.roughness = 0.12;
              m.metalness = 0.0;
            } else if (obj.name === 'Emblem_Claude' || obj.name === 'Emblem_Astra') {
              m.emissiveIntensity = 0.55;
              m.metalness = 0.92;
              m.roughness = 0.20;
            }
          });
        }
      });

      [...root.children].forEach((child) => {
        if (child.name === 'Emblem_Claude') {
          this.emblemClaude = child;
          child.position.set(-0.70, 0.50, 2.15);
          child.scale.setScalar(1.36);
          child.userData.basePos = child.position.clone();
          child.userData.baseRot = child.rotation.clone();
          moveToTargets.push(child);
        } else if (child.name === 'Emblem_Astra') {
          this.emblemAstra = child;
          child.position.set(0.70, 0.50, 2.15);
          child.scale.setScalar(1.36);
          child.userData.basePos = child.position.clone();
          child.userData.baseRot = child.rotation.clone();
          moveToTargets.push(child);
        } else if (child.name === 'MacBook_Body' || child.name === 'MacBook_Screen') {
          child.position.set(0, 0, 0);
          moveToMac.push(child);
        } else if (child.name.startsWith('Shard_')) {
          const isClaude = parseInt(child.name.split('_')[1] || '0', 10) < 18;
          const cx = isClaude ? -0.70 : 0.70;
          child.position.x = cx + (Math.random() - 0.5) * 0.40;
          child.position.y = 0.34 + (Math.random() - 0.5) * 0.20;
          child.position.z = 2.15 + (Math.random() - 0.5) * 0.40;
          child.scale.setScalar(1.42);
          child.userData.initPos = child.position.clone();
          child.userData.initRot = child.rotation.clone();
          child.userData.vel = new THREE.Vector3();
          child.userData.angVel = new THREE.Vector3(
            (Math.random() - 0.5) * 11,
            (Math.random() - 0.5) * 11,
            (Math.random() - 0.5) * 11
          );
          child.userData.bounces = 0;
          child.visible = false;
          this.shards.push(child);
          moveToTargets.push(child);
        } else {
          moveToHound.push(child);
        }
      });

      moveToHound.forEach((c) => this.houndRoot.add(c));
      moveToTargets.forEach((c) => this.targetsRoot.add(c));
      moveToMac.forEach((c) => this.macbookGroup.add(c));

      const macX = this.options.centerFraming ? 0.38 : 0.62;
      this.macbookGroup.position.set(macX, 0.02, -1.45);
      this.macbookGroup.rotation.set(0, -0.24, 0);
      this.macbookGroup.scale.setScalar(1.38);
      this.buildMacBookPortalEffect();

      if (gltf.animations && gltf.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(this.houndRoot);
        gltf.animations.forEach((clip) => {
          this.actions[clip.name] = this.mixer.clipAction(clip);
        });
      }

      // Prepara estado inicial 0.0s (MacBook aceso + Astra & Claude intactos na frente!)
      this.resetChoreographyState();
      this.updateSceneAt(0.001, true);

      // Pré-compila todos os shaders ANTES de liberar o cronômetro para zero engasgo!
      try {
        if (typeof this.renderer.compileAsync === 'function') {
          await this.renderer.compileAsync(this.scene, this.camera);
        } else {
          this.renderer.compile(this.scene, this.camera);
        }
      } catch {
        this.renderer.compile(this.scene, this.camera);
      }

      this.ready = true;
      this.warmupFrames = 0;

      if (this.options.autoSoundOnStart) {
        this.ensureAudioUnlocked();
      }

      window.__badclaude3D = {
        stage: this,
        renderer: this.renderer,
        scene: this.scene,
        mixer: this.mixer,
        get mixerAdvanced() {
          return Boolean(window.__badclaude3D_self?.mixerAdvanced);
        },
        triggerSmash: (withSound = true) => this.restartChoreography(withSound),
        triggerTrick: (kind = 'paw') => this.triggerTrick(kind),
        toggleMute: () => this.toggleMute(),
        seekAct: (sec) => this.seekTo(sec),
        getBoneWorldPos: (name) => {
          const b = this.bone(name) || this.houndRoot.getObjectByName(name) || this.houndRoot.getObjectByName(name.replace(/\./g, ''));
          if (!b) return null;
          b.updateWorldMatrix(true, false);
          return b.getWorldPosition(new THREE.Vector3()).toArray();
        },
      };
      window.__badclaude3D_self = this;

      if (typeof this.options.onReady === 'function') {
        this.options.onReady(this);
      }
    } catch (err) {
      console.error('[Hero3DStage] Falha ao carregar cena 3D:', err);
      if (typeof this.options.onContextLost === 'function') {
        this.options.onContextLost(true);
      }
    }
  }

  playClip(name, fadeSec = 0.22, loopMode = THREE.LoopRepeat, timeScale = 1.0) {
    const next = this.actions[name];
    if (!next) return;
    if (this.activeAction === next && this.activeClipName === name && next.isRunning()) {
      next.timeScale = timeScale;
      return;
    }
    const prev = this.activeAction && this.activeAction !== next ? this.activeAction : null;
    for (const [k, act] of Object.entries(this.actions)) {
      if (act !== next && act !== prev) {
        act.stop();
        act.enabled = false;
      }
    }
    next.enabled = true;
    next.paused = false;
    next.setEffectiveTimeScale(timeScale);
    next.setEffectiveWeight(1.0);
    next.setLoop(loopMode, loopMode === THREE.LoopOnce ? 1 : Infinity);
    next.clampWhenFinished = loopMode === THREE.LoopOnce;
    next.reset();
    if (prev && fadeSec > 0.001) {
      prev.enabled = true;
      prev.setEffectiveWeight(1.0);
      next.crossFadeFrom(prev, fadeSec, false);
    } else if (prev) {
      prev.stop();
      prev.enabled = false;
    }
    next.play();
    this.activeAction = next;
    this.activeClipName = name;
  }

  resetChoreographyState() {
    this.simTime = 0.0;
    this.guardianMode = 'INTRO';
    this.trickTimer = 0.0;
    this.nextAutonomousDelay = 9.8 + Math.random() * 4.2;
    this.impacted = false;
    this.portalSoundPlayed = false;
    this.smashSoundPlayed = false;
    this.introCompletedFired = false;
    this.sparkAge = 99.0;
    this.lastPhaseId = '';
    if (this.mixer) {
      this.mixer.stopAllAction();
    }

    if (this.emblemClaude) {
      this.emblemClaude.visible = true;
      if (this.emblemClaude.userData.basePos) this.emblemClaude.position.copy(this.emblemClaude.userData.basePos);
      if (this.emblemClaude.userData.baseRot) this.emblemClaude.rotation.copy(this.emblemClaude.userData.baseRot);
    }
    if (this.emblemAstra) {
      this.emblemAstra.visible = true;
      if (this.emblemAstra.userData.basePos) this.emblemAstra.position.copy(this.emblemAstra.userData.basePos);
      if (this.emblemAstra.userData.baseRot) this.emblemAstra.rotation.copy(this.emblemAstra.userData.baseRot);
    }
    for (const sh of this.shards) {
      sh.visible = false;
      if (sh.userData.initPos) sh.position.copy(sh.userData.initPos);
      if (sh.userData.initRot) sh.rotation.copy(sh.userData.initRot);
      const isClaude = parseInt(sh.name.split('_')[1] || '0', 10) < 18;
      const cx = isClaude ? -0.70 : 0.70;
      const dx = sh.position.x - cx;
      const dz = sh.position.z - 2.15;
      const dir = new THREE.Vector3(dx, 0, dz);
      if (dir.lengthSq() < 1e-4) dir.set(Math.random() - 0.5, 0, Math.random() - 0.5);
      dir.normalize();
      const spd = 0.75 + Math.random() * 1.45;
      sh.userData.vel.set(
        dir.x * spd + (Math.random() - 0.5) * 0.65,
        2.5 + Math.random() * 2.8,
        dir.z * spd + (Math.random() - 0.5) * 0.65
      );
      sh.userData.bounces = 0;
    }
    if (this.floorMat) {
      this.floorMat.uniforms.uShockRadius.value = -1.0;
      this.floorMat.uniforms.uShockFade.value = 0.0;
      this.floorMat.uniforms.uMagmaHeat.value = 0.0;
    }
    this.houndRoot.visible = false;
    this.houndRoot.scale.setScalar(0.22);
    this.activeAction = null;
    this.activeClipName = '';
  }

  restartChoreography(withAudio = true) {
    this.isPaused = false;
    this.stopAllCues();
    if (withAudio) {
      this.soundMuted = false;
      this.ensureAudioUnlocked().catch(() => {});
    }
    this.resetChoreographyState();
    this.entranceStarted = true;
    this.warmupFrames = 4;
  }

  triggerTrick(kind = 'paw') {
    if (this.guardianMode === 'INTRO' && this.simTime < this.T_GUARDIAN_START) {
      return;
    }
    this.ensureAudioUnlocked().catch(() => {});
    this.isPaused = false;
    this.trickTimer = 0.0;
    this.nextAutonomousDelay = 10.5 + Math.random() * 4.5;

    if (kind === 'bark') {
      this.guardianMode = 'TRICK_BARK';
      this.emitPhase('🔊 LATINDO & GRUNHINDO', this.simTime);
      this.playClip('AnimalArmature|SitBarkGrowl', 0.16, THREE.LoopOnce, 1.0);
      this.playCue('bark', 0, 0.95).catch(() => {});
    } else if (kind === 'tail') {
      this.guardianMode = 'TRICK_TAIL';
      this.emitPhase('🌀 RODANDO ATRÁS DO RABO', this.simTime);
      this.playClip('AnimalArmature|StandTransition', 0.14, THREE.LoopOnce, 1.15);
      this.playCue('paw', 0.15, 0.85).catch(() => {});
    } else {
      this.guardianMode = 'TRICK_PAW';
      this.emitPhase('🐾 DANDO A PATA', this.simTime);
      this.playClip('AnimalArmature|SitGivePaw', 0.16, THREE.LoopOnce, 1.0);
      this.playCue('paw', 0, 0.90).catch(() => {});
    }
  }

  triggerImpact() {
    this.impacted = true;
    this.sparkAge = 0.0;
    if (this.emblemClaude) this.emblemClaude.visible = false;
    if (this.emblemAstra) this.emblemAstra.visible = false;
    for (const sh of this.shards) {
      sh.visible = true;
    }
    if (window.__badclaudeFortress && typeof window.__badclaudeFortress.triggerShockwave === 'function') {
      window.__badclaudeFortress.triggerShockwave(this.options.centerFraming ? 0.50 : 0.64, 0.38, 1.0);
    }
  }

  computeSyntheticEnergy(t) {
    if (this.guardianMode === 'TRICK_BARK') {
      const bt = this.trickTimer;
      const b1 = Math.exp(-Math.pow((bt - 0.40) / 0.10, 2)) * 0.88;
      const b2 = Math.exp(-Math.pow((bt - 0.93) / 0.11, 2)) * 0.94;
      const gr = bt > 1.25 && bt < 2.05 ? 0.55 : 0.0;
      return Math.max(b1, b2, gr);
    }
    const portal = Math.exp(-Math.pow((t - 0.72) / 0.26, 2)) * 0.65;
    const slam = Math.exp(-Math.pow((t - this.IMPACT_T) / 0.14, 2)) * 0.96;
    const roar = Math.exp(-Math.pow((t - (this.IMPACT_T + 0.52)) / 0.48, 2)) * 0.92;
    return Math.max(portal, slam, roar);
  }

  updateAudioEnergy() {
    let live = 0;
    if (this.soundUnlocked && !this.soundMuted && this.analyser && this.fftBins) {
      this.analyser.getByteFrequencyData(this.fftBins);
      let sum = 0;
      for (let i = 0; i < this.fftBins.length; i++) sum += this.fftBins[i];
      live = sum / (this.fftBins.length * 215);
    }
    const synth = this.computeSyntheticEnergy(this.simTime);
    const target = Math.max(live, synth * 0.82);
    this.audioEnergy += (target - this.audioEnergy) * 0.25;
    if (window.__badclaudeFortress && typeof window.__badclaudeFortress.setAudioEnergy === 'function') {
      window.__badclaudeFortress.setAudioEnergy(this.audioEnergy);
    }
  }

  applyNaturalMouseGaze(weight = 1.0) {
    if (weight <= 0.01) return;
    const bNeck = this.bone('Neck2');
    const bHead = this.bone('Head');
    if (!bNeck || !bHead) return;

    const targetYaw = clamp(this.mouse.tx * 0.32, -0.32, 0.32) * weight;
    const targetPitch = clamp(this.mouse.ty * 0.18, -0.18, 0.18) * weight;
    this.gazeYaw += (targetYaw - this.gazeYaw) * 0.09;
    this.gazePitch += (targetPitch - this.gazePitch) * 0.09;

    this._tmpQuatYaw.setFromAxisAngle(this._axisUp, this.gazeYaw * 0.35);
    this._tmpQuatPitch.setFromAxisAngle(this._axisRight, -this.gazePitch * 0.35);
    bNeck.quaternion.multiply(this._tmpQuatYaw).multiply(this._tmpQuatPitch);

    this._tmpQuatYaw.setFromAxisAngle(this._axisUp, this.gazeYaw * 0.65);
    this._tmpQuatPitch.setFromAxisAngle(this._axisRight, -this.gazePitch * 0.65);
    bHead.quaternion.multiply(this._tmpQuatYaw).multiply(this._tmpQuatPitch);
  }

  updateSceneAt(dt, instantFade = false) {
    const t = this.simTime;
    const fade = instantFade ? 0.0 : 0.22;
    const macX = this.macbookGroup.position.x;
    const macZ = this.macbookGroup.position.z;

    let portalInt = 0.0;
    if (t < 2.25) {
      portalInt = smoothstep(0.05, 0.55, t) * (1.0 - smoothstep(1.35, 2.20, t));
    }
    if (this.portalUniforms) {
      this.portalUniforms.uTime.value = t;
      this.portalUniforms.uIntensity.value = portalInt;
    }
    if (this.portalLight) {
      this.portalLight.intensity = 0.45 + portalInt * 2.6;
    }

    let hPosX = 0;
    let hPosY = 0;
    let hPosZ = 0.22;
    let hYaw = 0;
    let hRoll = 0;
    let hScale = 1.0;
    let gazeWeight = 0.0;

    if (this.guardianMode === 'INTRO') {
      if (t < this.T_LEAP_START) {
        this.emitPhase('01 · MACBOOK BADCLAUDE ATIVO', t);
        this.houndRoot.visible = false;
      } else if (t < this.T_SMASH_CLIP) {
        this.emitPhase('02 · SAINDO DA TELA DO MACBOOK!', t);
        this.houndRoot.visible = true;
        if (!this.portalSoundPlayed && !instantFade) {
          this.portalSoundPlayed = true;
          this.playCue('portal', 0, 0.92);
        }
        const runElapsed = t - this.T_LEAP_START;
        if (runElapsed < 0.52) {
          this.playClip('AnimalArmature|PortalLeap', instantFade ? 0 : 0.08, THREE.LoopOnce, 1.15);
        } else {
          this.playClip('AnimalArmature|Gallop', fade, THREE.LoopRepeat, 1.35);
        }
        const u = smoothstep(this.T_LEAP_START, this.T_SMASH_CLIP, t);
        const startX = macX - 0.12;
        const startZ = macZ + 0.48;
        hPosX = startX * (1.0 - u);
        hPosZ = startZ + (0.48 - startZ) * u;
        const screenLift = Math.max(0, 1.0 - u * 2.1) * 0.68;
        const leapArc = Math.sin(Math.min(1.0, u * 1.65) * Math.PI) * 0.34;
        hPosY = screenLift + leapArc;
        hScale = clamp(0.26 + smoothstep(0.0, 0.42, u) * 0.74, 0.26, 1.0);
        hYaw = -0.18 * (1.0 - u);
      } else if (t < this.T_SIT_TRANS) {
        this.emitPhase('03 · DESTRÓI ASTRA & CLAUDE + RUGIDO!', t);
        this.houndRoot.visible = true;
        if (!this.smashSoundPlayed && !instantFade) {
          this.smashSoundPlayed = true;
          this.playCue('smash', 0, 1.0).then((played) => {
            if (played) this.heardEntranceWithSound = true;
          });
        }
        this.playClip('AnimalArmature|SmashRoar', instantFade ? 0 : 0.14, THREE.LoopOnce, 1.0);
        const uSm = clamp01((t - this.T_SMASH_CLIP) / 0.55);
        const settle = smoothstep(this.IMPACT_T + 0.15, this.T_SIT_TRANS - 0.15, t);
        hPosZ = 0.48 + Math.sin(uSm * Math.PI) * 0.16 - settle * 0.26;
      } else if (t < this.T_GUARDIAN_START) {
        this.emitPhase('04 · SENTANDO NO PALCO', t);
        this.houndRoot.visible = true;
        this.playClip('AnimalArmature|SitTransition', fade, THREE.LoopOnce, 1.0);
        hPosZ = 0.22;
        gazeWeight = smoothstep(this.T_SIT_TRANS + 0.3, this.T_GUARDIAN_START, t);
      } else {
        this.guardianMode = 'SIT_WATCH';
        this.trickTimer = 0.0;
        this.houndRoot.visible = true;
        this.emitPhase('05 · SENTADO · INTERATIVO COM MOUSE', t);
        this.playClip('AnimalArmature|SitIdle', fade, THREE.LoopRepeat, 1.0);
        gazeWeight = 1.0;
        if (!this.introCompletedFired) {
          this.introCompletedFired = true;
          if (typeof this.options.onIntroComplete === 'function') {
            this.options.onIntroComplete(this);
          }
        }
      }
    } else {
      this.houndRoot.visible = true;
      this.trickTimer += dt;

      if (this.guardianMode === 'SIT_WATCH') {
        this.playClip('AnimalArmature|SitIdle', fade, THREE.LoopRepeat, 1.0);
        gazeWeight = 1.0;
        if (this.trickTimer >= this.nextAutonomousDelay) {
          this.trickCounter++;
          if (this.trickCounter % 3 === 0) {
            this.triggerTrick('tail');
          } else if (this.trickCounter % 2 === 1) {
            this.triggerTrick('paw');
          } else {
            this.triggerTrick('bark');
          }
        }
      } else if (this.guardianMode === 'TRICK_PAW') {
        gazeWeight = 0.65;
        if (this.trickTimer >= 2.52) {
          this.guardianMode = 'SIT_WATCH';
          this.trickTimer = 0.0;
          this.emitPhase('05 · SENTADO · INTERATIVO COM MOUSE', t);
          this.playClip('AnimalArmature|SitIdle', 0.24, THREE.LoopRepeat, 1.0);
        }
      } else if (this.guardianMode === 'TRICK_BARK') {
        gazeWeight = 0.55;
        if (this.trickTimer >= 2.42) {
          this.guardianMode = 'SIT_WATCH';
          this.trickTimer = 0.0;
          this.emitPhase('05 · SENTADO · INTERATIVO COM MOUSE', t);
          this.playClip('AnimalArmature|SitIdle', 0.24, THREE.LoopRepeat, 1.0);
        }
      } else if (this.guardianMode === 'TRICK_TAIL') {
        const tt = this.trickTimer;
        if (tt < 0.70) {
          this.playClip('AnimalArmature|StandTransition', 0.16, THREE.LoopOnce, 1.15);
        } else if (tt < 2.45) {
          this.playClip('AnimalArmature|ChaseTail', 0.18, THREE.LoopRepeat, 1.40);
          const spinU = smoothstep(0.70, 2.45, tt);
          const theta = spinU * Math.PI * 2.0;
          const radius = Math.sin(spinU * Math.PI) * 0.42;
          hYaw = -theta;
          hPosX = -Math.sin(theta) * radius;
          hPosZ = 0.22 + Math.cos(theta) * radius - radius;
          hRoll = Math.sin(spinU * Math.PI) * 0.09;
        } else if (tt < 3.40) {
          this.playClip('AnimalArmature|SitTransition', 0.20, THREE.LoopOnce, 1.05);
        } else {
          this.guardianMode = 'SIT_WATCH';
          this.trickTimer = 0.0;
          this.emitPhase('05 · SENTADO · INTERATIVO COM MOUSE', t);
          this.playClip('AnimalArmature|SitIdle', 0.22, THREE.LoopRepeat, 1.0);
        }
      }
    }

    if (t >= this.IMPACT_T && !this.impacted) {
      this.triggerImpact();
    }

    this.houndRoot.position.set(hPosX, hPosY, hPosZ);
    this.houndRoot.rotation.set(0, hYaw, hRoll);
    this.houndRoot.scale.setScalar(hScale);

    if (this.mixer) {
      this.mixer.update(dt);
      this.mixerAdvanced = true;
      if (gazeWeight > 0.01) {
        this.applyNaturalMouseGaze(gazeWeight);
      }
    }

    if (!this.impacted) {
      const floatBob = Math.sin(t * 4.0) * 0.045;
      if (this.emblemClaude && this.emblemClaude.userData.basePos) {
        this.emblemClaude.position.y = this.emblemClaude.userData.basePos.y + floatBob;
        this.emblemClaude.rotation.z = t * 1.35;
      }
      if (this.emblemAstra && this.emblemAstra.userData.basePos) {
        this.emblemAstra.position.y = this.emblemAstra.userData.basePos.y - floatBob;
        this.emblemAstra.rotation.z = -t * 1.20;
      }
    } else {
      for (const sh of this.shards) {
        if (!sh.visible) continue;
        sh.position.addScaledVector(sh.userData.vel, dt);
        sh.userData.vel.y -= 9.5 * dt;
        sh.rotation.x += sh.userData.angVel.x * dt;
        sh.rotation.y += sh.userData.angVel.y * dt;
        sh.rotation.z += sh.userData.angVel.z * dt;
        if (sh.position.y < 0.06) {
          sh.position.y = 0.06;
          if (sh.userData.bounces < 2) {
            sh.userData.vel.y = Math.abs(sh.userData.vel.y) * 0.36;
            sh.userData.vel.x *= 0.56;
            sh.userData.vel.z *= 0.56;
            sh.userData.bounces++;
          } else {
            sh.userData.vel.multiplyScalar(0.76);
            sh.userData.vel.y = 0;
            sh.userData.angVel.multiplyScalar(0.76);
          }
        }
      }
    }

    this.updateAudioEnergy();
    const afterImp = Math.max(0, t - this.IMPACT_T);
    const shockFade = this.impacted ? clamp01(1.0 - afterImp / 1.35) : 0.0;
    const shockRadius = this.impacted ? Math.min(3.85, afterImp * 3.2) : -1.0;
    const magmaHeat = this.impacted ? clamp01(1.0 - Math.max(0, afterImp - 1.5) / 5.5) : 0.0;

    if (this.floorMat) {
      this.floorMat.uniforms.uTime.value = t;
      this.floorMat.uniforms.uShockRadius.value = shockRadius;
      this.floorMat.uniforms.uShockFade.value = shockFade;
      this.floorMat.uniforms.uMagmaHeat.value = magmaHeat;
      this.floorMat.uniforms.uAudioEnergy.value = this.audioEnergy;
      this.floorMat.uniforms.uDogPos.value.set(hPosX, hPosZ);
    }

    if (this.sparksUniforms) {
      if (this.impacted) this.sparkAge += dt;
      this.sparksUniforms.uSparkAge.value = this.sparkAge;
    }

    for (const fu of this.fresnelUniforms) {
      fu.uAudioEnergy.value = this.audioEnergy;
    }

    if (this.impactLight) {
      this.impactLight.intensity = 0.25 + shockFade * 2.4 + this.audioEnergy * 0.95;
    }
    if (this.collarLight) {
      this.collarLight.intensity = 0.55 + this.audioEnergy * 1.55;
    }

    this.mouse.x += (this.mouse.tx - this.mouse.x) * 0.06;
    this.mouse.y += (this.mouse.ty - this.mouse.y) * 0.06;
    const shake = shockFade * 0.06 + (this.audioEnergy > 0.68 ? (this.audioEnergy - 0.68) * 0.025 : 0);
    const sx = shake > 0.002 ? (Math.random() - 0.5) * shake : 0;
    const sy = shake > 0.002 ? (Math.random() - 0.5) * shake : 0;

    const isMobile = this.camera.aspect < 1.15;
    const centered = isMobile || this.options.centerFraming;
    const lookX = centered ? 0.08 : -1.35;
    const lookY = isMobile ? 1.02 : 1.00;
    const camX = centered ? 0.55 : 1.52;
    const camZ = isMobile ? 7.55 * (1.10 / Math.max(0.75, this.camera.aspect)) : (centered ? 6.15 : 6.35);
    const camY = isMobile ? 2.18 : 2.32;

    this.camera.position.set(
      camX + this.mouse.x * 0.34 + sx,
      camY + this.mouse.y * 0.15 + sy,
      camZ
    );
    this.camera.lookAt(lookX, lookY, 0.55);
  }

  seekTo(tSec) {
    this.stopAllCues();
    this.resetChoreographyState();
    this.entranceStarted = true;
    const steps = Math.max(1, Math.min(80, Math.round(tSec / 0.05)));
    const stepDt = tSec / steps;
    for (let i = 0; i < steps; i++) {
      this.simTime += stepDt;
      this.updateSceneAt(stepDt, i === 0);
    }
    this.simTime = tSec;
    this.updateSceneAt(0.016, false);
    this.isPaused = true;
    this.needsRender = true;
    this.renderFrame();
  }

  renderFrame() {
    if (!this.renderer || this.contextLost || !this.ready) return;
    this.renderer.info.autoReset = false;
    this.renderer.info.reset();
    this.renderer.render(this.scene, this.camera);
    this.sceneDrawCalls = this.renderer.info.render.calls;
    this.sceneTriangles = this.renderer.info.render.triangles;
  }

  bindEvents() {
    this._onResize = () => {
      if (!this.renderer || this.contextLost) return;
      const rect = this.canvas.getBoundingClientRect();
      const w = Math.max(300, Math.round(rect.width || this.canvas.parentElement?.clientWidth || window.innerWidth));
      const h = Math.max(280, Math.round(rect.height || this.canvas.parentElement?.clientHeight || 680));
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h, false);
      this.needsRender = true;
      this.renderFrame();
    };
    window.addEventListener('resize', this._onResize, { passive: true });

    this._onMove = (e) => {
      this.mouse.tx = clamp01(e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      this.mouse.ty = -(clamp01(e.clientY / Math.max(1, window.innerHeight)) * 2 - 1);
    };
    window.addEventListener('pointermove', this._onMove, { passive: true });

    this._onContextLost = (ev) => {
      ev.preventDefault();
      this.contextLost = true;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = 0;
      }
      if (typeof this.options.onContextLost === 'function') {
        this.options.onContextLost(true);
      }
    };
    this._onContextRestored = () => {
      this.contextLost = false;
      if (typeof this.options.onContextLost === 'function') {
        this.options.onContextLost(false);
      }
      this.startLoop();
    };
    this.canvas.addEventListener('webglcontextlost', this._onContextLost, false);
    this.canvas.addEventListener('webglcontextrestored', this._onContextRestored, false);

    if ('IntersectionObserver' in window) {
      this._io = new IntersectionObserver(
        (entries) => {
          const vis = Boolean(entries[0]?.isIntersecting);
          this.isVisible = vis;
          if (vis && !this.isPaused && !this.contextLost) this.startLoop();
        },
        { threshold: 0.05 }
      );
      this._io.observe(this.canvas);
    }
  }

  startLoop() {
    if (this.rafId || this.disposed || this.contextLost) return;
    this.timer.reset();
    const tick = (ts) => {
      if (this.disposed || this.contextLost) {
        this.rafId = 0;
        return;
      }
      this.timer.update(ts);
      const dt = Math.min(0.05, this.timer.getDelta() || 0.016);

      if (this.isVisible && this.ready && document.visibilityState !== 'hidden') {
        if (!this.isPaused) {
          // Load-Sync Gate: pinta 3 frames visíveis reais antes de soltar o cronômetro!
          if (!this.entranceStarted) {
            this.warmupFrames++;
            this.updateSceneAt(0.001, true);
            this.renderFrame();
            if (this.warmupFrames >= 3) {
              this.entranceStarted = true;
            }
          } else {
            this.simTime += dt;
            this.updateSceneAt(dt, false);
            this.renderFrame();
          }
          this.needsRender = false;
        } else if (this.needsRender) {
          this.renderFrame();
          this.needsRender = false;
        }
      }
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  dispose() {
    this.disposed = true;
    this.stopAllCues();
    if (this.rafId) cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('pointermove', this._onMove);
    window.removeEventListener('pointerdown', this._onFirstGesture, true);
    window.removeEventListener('keydown', this._onFirstGesture, true);
    window.removeEventListener('touchstart', this._onFirstGesture, true);
    this.canvas.removeEventListener('webglcontextlost', this._onContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this._onContextRestored);
    this._io?.disconnect();
    this.envRT?.dispose();
    this.pmrem?.dispose();
    try { this.audioCtx?.close?.(); } catch {}
    this.renderer?.dispose();
  }
}
