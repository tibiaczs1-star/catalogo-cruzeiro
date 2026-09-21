import { GAME_META, registerScene } from './GameLobbyScene.js';

export default class CardGameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CardGameScene' });
    this.players = [];
  }

  preload() {
    // No assets, using Phaser text and shapes
  }

  create() {
    this.hands = [[], []]; // two players
    this.deck = this.createDeck();
    // Deal 11 cards to each player
    for (let i = 0; i < 22; i++) {
      this.drawCard(i % 2);
    }

    // Basic UI
    this.add.text(20, 20, 'Arizona Pub Games - Buraco', { fontSize: '20px', color: '#FFFFFF' });
    this.add.text(20, 60, `Player 1: 11 cartas`, { fontSize: '16px', color: '#FFFF66' });
    this.add.text(20, 80, `Player 2: 11 cartas`, { fontSize: '16px', color: '#FFFF66' });

    // Simple rectangle to represent deck
    this.add.rectangle(400, 300, 60, 90, 0x3c2b1d).setStrokeStyle(2, 0x000000);
  }

  createDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck = [];
    for (const s of suits) {
      for (const v of values) {
        deck.push(v + s);
      }
    }
    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  drawCard(playerIndex) {
    const card = this.deck.pop();
    this.hands[playerIndex].push(card);
    // Display card as text placeholder above deck area
    const x = 400; const y = 300 + 50 * (playerIndex === 0 ? -1 : 1);
    this.add.text(x, y, card, { fontSize: '20px', color: '#FFFFFF' }).setOrigin(0.5);
  }

  update() {}
}

registerScene('CardGameScene', CardGameScene);
