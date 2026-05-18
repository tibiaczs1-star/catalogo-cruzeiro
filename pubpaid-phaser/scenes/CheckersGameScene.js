import { updateGameState } from "../core/gameState.js";

export class CheckersGameScene extends Phaser.Scene {
  constructor() {
    super("checkers-game-scene");
  }

  create() {
    updateGameState({
      currentScene: "game-lobby",
      activeGameId: "checkers",
      lobbyPhase: "matching",
      objective: "Aguardar jogador real",
      focus: "Damas em mesa real",
      prompt: "Damas em mesa real: a mesa so abre com dois jogadores, saldo aprovado, saldo travado e confirmacao dupla."
    });
    this.game.events.emit("pubpaid:start-real-checkers");
    this.scene.stop();
  }
}
