import { GAME_HEIGHT, GAME_WIDTH } from "./config/gameConfig.js";
import { gameState } from "./core/gameState.js";
import { bindOverlay } from "./ui/overlay.js";
import { BootScene } from "./scenes/BootScene.js";
import { StreetScene } from "./scenes/StreetScene.js";
import { InteriorScene } from "./scenes/InteriorScene.js";
import { UIScene } from "./scenes/UIScene.js";

bindOverlay();

const config = {
  type: Phaser.AUTO,
  parent: "pubpaid-phaser-root",
  transparent: true,
  backgroundColor: "#02050d",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT
  },
  scene: [BootScene, StreetScene, InteriorScene, UIScene]
};

const game = new Phaser.Game(config);

window.pubpaidPhaserGame = game;
window.render_game_to_text = () => {
  const scene = game.scene.getScenes(true).map((activeScene) => activeScene.scene.key).join(", ");
  return [
    `scene=${gameState.currentScene}`,
    `activeScenes=${scene || "none"}`,
    `focus=${gameState.focus}`,
    `objective=${gameState.objective}`,
    `prompt=${gameState.prompt}`,
    `testBalance=${gameState.testBalance}`,
    `realBalance=${gameState.realBalance}`,
    `panelOpen=${gameState.panel.open}`,
    `panelTitle=${gameState.panel.title}`
  ].join("\n");
};

window.advanceTime = (ms = 250) => {
  const activeScenes = game.scene.getScenes(true);
  activeScenes.forEach((activeScene) => {
    activeScene.time?.delayedCall?.(0, () => {});
    activeScene.events.emit("codex-advance-time", ms);
  });
  return window.render_game_to_text();
};
