// app.js patch to include new scene and meta
// We'll add import and register
import CardGameScene from './scenes/CardGameScene.js';

// register scene
this.scene.add('CardGameScene', CardGameScene, false);

// add to GAME_META for GameLobbyScene
import { GAME_META } from './scenes/GameLobbyScene.js';
GAME_META.scenes.push({
  key: 'CardGameScene',
  title: 'Buraco',
  description: 'Jogo de Buraco (52 cartas, 2 jogadores)',
  playable: true
});
