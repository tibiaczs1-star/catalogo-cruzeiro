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
