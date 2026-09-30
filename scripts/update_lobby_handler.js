// Update GameLobbyScene to add navigation handler
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'pubpaid-phaser', 'scenes', 'GameLobbyScene.js');
const content = fs.readFileSync(file, 'utf8');
const insert = `\n\n// Handle Buraco button\nthis.buracoBtn = this.add.text(0,0,'Buraco', {fontSize:'24px',color:'#fff'}).setInteractive();\nthis.buracoBtn.on('pointerdown',()=>{ this.scene.start('CardGameScene'); });`;
const updated = content.replace(/this.tips.*?$/, match=> match + insert); // naive insert after tips
fs.writeFileSync(file, updated, 'utf8');
// Append progress
fs.appendFileSync('PROGRESSO_AZ_PUB.txt', `\n[2026-09-11 08:20] Passo 3: Handler na GameLobbyScene`);
