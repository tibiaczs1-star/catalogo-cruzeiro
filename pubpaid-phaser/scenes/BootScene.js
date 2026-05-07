import { ensureCoreSprites } from "../core/spriteFactory.js";
import { updateGameState } from "../core/gameState.js";

const STREET_NPC_SEED_CACHE = "20260505npcseed1";
const STREET_RUNTIME_NPCS_CACHE = "20260506npcwalk5f1";
const STREET_NPC_SHEETS = [
  { key: "ppg-street-npc-bus-lady", url: "./assets/pubpaid/sprites/street-civilians/bus-lady-idle-v1.png", frameWidth: 64, frameHeight: 128, cache: STREET_NPC_SEED_CACHE },
  { key: "ppg-street-npc-terminal-man", url: "./assets/pubpaid/sprites/street-civilians/terminal-man-idle-v1.png", frameWidth: 64, frameHeight: 128, cache: STREET_NPC_SEED_CACHE },
  { key: "ppg-street-npc-hooded-youth", url: "./assets/pubpaid/sprites/street-civilians/hooded-youth-idle-v1.png", frameWidth: 64, frameHeight: 128, cache: STREET_NPC_SEED_CACHE },
  { key: "ppg-street-npc-worker-backpack", url: "./assets/pubpaid/sprites/street-civilians/worker-backpack-idle-v1.png", frameWidth: 64, frameHeight: 128, cache: STREET_NPC_SEED_CACHE },
  { key: "ppg-street-npc-curb-sitter", url: "./assets/pubpaid/sprites/street-civilians/curb-sitter-idle-v1.png", frameWidth: 64, frameHeight: 128, cache: STREET_NPC_SEED_CACHE },
  { key: "ppg-street-npc-bouncer-wide", url: "./assets/pubpaid/sprites/street-civilians/bouncer-wide-idle-v1.png", frameWidth: 64, frameHeight: 128, cache: STREET_NPC_SEED_CACHE },
  { key: "ppg-street-npc-arcade-controller", url: "./assets/pubpaid/sprites/street-civilians/arcade-controller-wall-idle-v1.png", frameWidth: 96, frameHeight: 144, cache: STREET_RUNTIME_NPCS_CACHE },
  { key: "ppg-street-npc-arcade-token", url: "./assets/pubpaid/sprites/street-civilians/arcade-token-wall-idle-v1.png", frameWidth: 96, frameHeight: 144, cache: STREET_RUNTIME_NPCS_CACHE },
  { key: "ppg-street-npc-arcade-phone", url: "./assets/pubpaid/sprites/street-civilians/arcade-phone-wall-idle-v1.png", frameWidth: 96, frameHeight: 144, cache: STREET_RUNTIME_NPCS_CACHE },
  { key: "ppg-street-ped-commuter", url: "./assets/pubpaid/sprites/street-civilians/pedestrian-commuter-walk-v1.png", frameWidth: 96, frameHeight: 144, cache: STREET_RUNTIME_NPCS_CACHE },
  { key: "ppg-street-ped-delivery", url: "./assets/pubpaid/sprites/street-civilians/pedestrian-delivery-walk-v1.png", frameWidth: 96, frameHeight: 144, cache: STREET_RUNTIME_NPCS_CACHE },
  { key: "ppg-street-ped-hoodie-tote", url: "./assets/pubpaid/sprites/street-civilians/pedestrian-hoodie-tote-walk-v1.png", frameWidth: 96, frameHeight: 144, cache: STREET_RUNTIME_NPCS_CACHE },
  { key: "ppg-street-ped-woman-denim", url: "./assets/pubpaid/sprites/street-civilians/pedestrian-woman-denim-walk-v1.png", frameWidth: 96, frameHeight: 144, cache: STREET_RUNTIME_NPCS_CACHE },
  { key: "ppg-street-ped-woman-umbrella", url: "./assets/pubpaid/sprites/street-civilians/pedestrian-woman-umbrella-walk-v1.png", frameWidth: 96, frameHeight: 144, cache: STREET_RUNTIME_NPCS_CACHE },
  { key: "ppg-street-ped-woman-hoodie", url: "./assets/pubpaid/sprites/street-civilians/pedestrian-woman-hoodie-walk-v1.png", frameWidth: 96, frameHeight: 144, cache: STREET_RUNTIME_NPCS_CACHE },
  { key: "ppg-street-ped-elder-woman-coat", url: "./assets/pubpaid/sprites/street-civilians/pedestrian-elder-woman-coat-walk-v1.png", frameWidth: 96, frameHeight: 144, cache: STREET_RUNTIME_NPCS_CACHE },
  { key: "ppg-street-ped-elder-man-cane", url: "./assets/pubpaid/sprites/street-civilians/pedestrian-elder-man-cane-walk-v1.png", frameWidth: 96, frameHeight: 144, cache: STREET_RUNTIME_NPCS_CACHE },
  { key: "ppg-street-ped-elder-woman-tote", url: "./assets/pubpaid/sprites/street-civilians/pedestrian-elder-woman-tote-walk-v1.png", frameWidth: 96, frameHeight: 144, cache: STREET_RUNTIME_NPCS_CACHE },
  { key: "ppg-interior-npc-pub-bartender", url: "./assets/pubpaid/sprites/street-civilians/pub-bartender-idle-v1.png", frameWidth: 96, frameHeight: 144, cache: STREET_RUNTIME_NPCS_CACHE },
  { key: "ppg-interior-npc-pub-cue", url: "./assets/pubpaid/sprites/street-civilians/pub-cue-regular-idle-v1.png", frameWidth: 96, frameHeight: 144, cache: STREET_RUNTIME_NPCS_CACHE },
  { key: "ppg-interior-npc-pub-patron", url: "./assets/pubpaid/sprites/street-civilians/pub-patron-drink-idle-v1.png", frameWidth: 96, frameHeight: 144, cache: STREET_RUNTIME_NPCS_CACHE }
];

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot-scene");
  }

  preload() {
    for (let index = 1; index <= 16; index += 1) {
      const padded = String(index).padStart(2, "0");
      this.load.image(`intro-frame-${padded}`, `./assets/pubpaid/intro/pubpaid-intro-seq-${padded}.jpeg`);
    }
    this.load.image("street-bg", "./assets/pubpaid-v2-street-bg-v1.png");
    this.load.image("interior-bg", "./assets/pubpaid-interior-v5.png");
    this.load.image("game-lobby-bg", "./assets/pubpaid/lobby/pubpaid-lobby-bg-v2-crowd.png");
    this.load.image("game-darts-room", "./assets/pubpaid/lobby/pubpaid-darts-room-v1.png");
    this.load.image("game-checkers-room", "./assets/pubpaid/lobby/pubpaid-checkers-room-v1.png");
    this.load.image("game-menu-damas-card", "./assets/pubpaid/lobby/pubpaid-menu-damas-card-v1.png");
    this.load.image("game-menu-dardos-card", "./assets/pubpaid/lobby/pubpaid-menu-dardos-card-v1.png");
    this.load.image("ppg-wallet-phone-ui", "./assets/pubpaid/ui/pubpaid-wallet-phone-ui-v2.png?v=20260505walletopaque1");
    this.load.spritesheet("ppg-wallet-pixel-digits", "./assets/pubpaid/ui/pubpaid-wallet-pixel-digits-v1.png?v=20260505walletopaque1", {
      frameWidth: 20,
      frameHeight: 24
    });
    this.load.spritesheet("ppg-street-ambient-life-sheet", "./assets/pubpaid/background/pubpaid-street-ambient-life-4f-v6.png?v=20260505ambientlife6", {
      frameWidth: 1280,
      frameHeight: 720
    });
    STREET_NPC_SHEETS.forEach(({ key, url, frameWidth, frameHeight, cache }) => {
      this.load.spritesheet(key, `${url}?v=${cache}`, {
        frameWidth,
        frameHeight
      });
    });
    this.load.spritesheet("ppg-traffic-vehicles-sheet", "./assets/pubpaid/traffic/pubpaid-traffic-artistic-left-3f-v28.png?v=20260506motoopaquev28", {
      frameWidth: 384,
      frameHeight: 192
    });
    this.load.spritesheet("checkers-wood-tiles", "./assets/pubpaid/checkers/wood-tiles-oga.png", {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet("checkers-pieces", "./assets/pubpaid/checkers/checker-pieces-oga.png", {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.image("ppg-waiter-hero-sprite", "./assets/pubpaid/characters/waiter-salon-small-v1.png");
    this.load.image("ppg-waiter-lobby-sprite", "./assets/pubpaid/characters/waiter-lobby-large-v1.png");
    this.load.image("ppg-waiter-lobby-speaking-sprite", "./assets/pubpaid/characters/waiter-lobby-speaking-v1.png");
    this.load.image("ppg-player-sprite", "./assets/pubpaid/sprites/adult-standing-tight-v1.png");
    this.load.spritesheet("ppg-player-walk-sheet", "./assets/pubpaid/sprites/protagonist/protagonist-male-generated-walk-8dir-4f.png?v=20260427gensheet1", {
      frameWidth: 96,
      frameHeight: 144
    });
    this.load.spritesheet("ppg-player-idle-breathe-sheet", "./assets/pubpaid/sprites/protagonist/protagonist-male-generated-idle-breathe-8dir-4f.png?v=20260427gensheet1", {
      frameWidth: 96,
      frameHeight: 144
    });
    this.load.spritesheet("ppg-player-idle-phone-sheet", "./assets/pubpaid/sprites/protagonist/protagonist-male-generated-idle-phone-8dir-4f.png?v=20260427gensheet1", {
      frameWidth: 96,
      frameHeight: 144
    });
    this.load.spritesheet("ppg-player-female-walk-sheet", "./assets/pubpaid/sprites/protagonist/protagonist-female-generated-walk-8dir-4f.png?v=20260427gensheet1", {
      frameWidth: 96,
      frameHeight: 144
    });
    this.load.spritesheet("ppg-player-female-idle-breathe-sheet", "./assets/pubpaid/sprites/protagonist/protagonist-female-generated-idle-breathe-8dir-4f.png?v=20260427gensheet1", {
      frameWidth: 96,
      frameHeight: 144
    });
    this.load.spritesheet("ppg-player-female-idle-phone-sheet", "./assets/pubpaid/sprites/protagonist/protagonist-female-generated-idle-phone-8dir-4f.png?v=20260427gensheet1", {
      frameWidth: 96,
      frameHeight: 144
    });
    this.load.image("ppg-singer-lobby-sprite", "./assets/pubpaid/characters/singer-lobby-v1.png");
    this.load.image("ppg-singer-sprite", "./assets/pubpaid/sprites/singer-stage-tight-v1.png");
    this.load.image("ppg-guest-a-sprite", "./assets/pubpaid/sprites/adult-standing-tight-v1.png");
    this.load.image("ppg-guest-b-sprite", "./assets/pubpaid/sprites/guest-seated-tight-v1.png");
  }

  create() {
    ensureCoreSprites(this);
    updateGameState({
      currentScene: "intro",
      focus: "placa PUB PAID",
      objective: "Liberar som e tela cheia",
      prompt: "Toque em Ativar e começar para liberar áudio, tela cheia e iniciar a abertura."
    });
  }
}
