import { syncPubpaidAccount } from "../services/accountService.js";
import { ensureCoreSprites } from "../core/spriteFactory.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot-scene");
  }

  preload() {
    this.load.image("street-bg", "./assets/pubpaid-v2-street-bg-v1.png");
    this.load.image("interior-bg", "./assets/pubpaid-interior-v5.png");
  }

  async create() {
    ensureCoreSprites(this);
    await syncPubpaidAccount();
    this.scene.start("street-scene");
    this.scene.launch("ui-scene");
  }
}
