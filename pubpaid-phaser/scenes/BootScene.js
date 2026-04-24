import { ensureCoreSprites } from "../core/spriteFactory.js";
import { updateGameState } from "../core/gameState.js";

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
    this.load.image("ppg-singer-lobby-sprite", "./assets/pubpaid/characters/singer-lobby-v1.png");
    this.load.image("ppg-singer-sprite", "./assets/pubpaid/sprites/singer-stage-tight-v1.png");
    this.load.image("ppg-guest-a-sprite", "./assets/pubpaid/sprites/adult-standing-tight-v1.png");
    this.load.image("ppg-guest-b-sprite", "./assets/pubpaid/sprites/guest-seated-tight-v1.png");
    this.load.image("ppg-guest-c-sprite", "./assets/pubpaid/sprites/adult-standing-burgundy-tight-v1.png");
    this.load.image("ppg-guest-d-sprite", "./assets/pubpaid/sprites/adult-standing-teal-tight-v1.png");
    this.load.image("ppg-guest-e-sprite", "./assets/pubpaid/sprites/adult-standing-gold-tight-v1.png");
    this.load.image("ppg-guest-seated-blue-sprite", "./assets/pubpaid/sprites/guest-seated-blue-tight-v1.png");
    this.load.image("ppg-bouncer-wide-sprite", "./assets/pubpaid/sprites/bouncer-wide-tight-v1.png");
    this.load.image("ppg-woman-red-sprite", "./assets/pubpaid/sprites/woman-red-stage-tight-v1.png");
    this.load.image("ppg-guest-jacket-short-sprite", "./assets/pubpaid/sprites/guest-jacket-short-tight-v1.png");
    this.load.image("ppg-street-taxi-neon", "./assets/pubpaid/street/pubpaid-taxi-neon-v1.png");
    this.load.image("ppg-street-moto-neon", "./assets/pubpaid/street/pubpaid-moto-neon-v1.png");
    this.load.image("ppg-street-food-cart", "./assets/pubpaid/street/pubpaid-food-cart-v1.png");
    this.load.image("ppg-street-sign", "./assets/pubpaid/street/pubpaid-street-sign-v1.png");
    this.load.image("ppg-street-homeless-sitting", "./assets/pubpaid/street/civilians/street-homeless-sitting-v1.png");
    this.load.image("ppg-street-drunk-floor", "./assets/pubpaid/street/civilians/street-drunk-floor-v1.png");
    this.load.image("ppg-street-bus-lady", "./assets/pubpaid/street/civilians/street-bus-lady-v1.png");
    this.load.image("ppg-street-hooded-boy", "./assets/pubpaid/street/civilians/street-hooded-boy-v1.png");
    this.load.image("ppg-street-old-cane", "./assets/pubpaid/street/civilians/street-old-cane-v1.png");
    this.load.image("ppg-street-bus-man-bag", "./assets/pubpaid/street/civilians/street-bus-man-bag-v1.png");
    this.load.image("ppg-street-umbrella-woman", "./assets/pubpaid/street/setpieces/street-bus-umbrella-woman-v1.png");
    this.load.image("ppg-street-car-compact", "./assets/pubpaid/street/setpieces/street-car-compact-v1.png");
    this.load.image("ppg-street-cat-groom", "./assets/pubpaid/street/setpieces/street-cat-groom-v1.png");
    this.load.image("ppg-street-dog-side", "./assets/pubpaid/street/setpieces/street-dog-side-v1.png");
    this.load.image("ppg-street-homeless-sleeping", "./assets/pubpaid/street/setpieces/street-homeless-sleeping-v1.png");
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
