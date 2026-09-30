// Patch app.js to register CardGameScene
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'pubpaid-phaser', 'app.js');
const content = fs.readFileSync(file, 'utf8');
const insert = `\n// Register CardGameScene\nimport CardGameScene from './scenes/CardGameScene.js';\n\nthis.scene.add('CardGameScene', CardGameScene);`;
// Find marker after BootScene import
const updated = content.replace(/import.+BootScene.+;/, match => match + insert);
fs.writeFileSync(file, updated, 'utf8');
// Append progress
fs.appendFileSync('PROGRESSO_AZ_PUB.txt', `\n[2026-09-11 08:10] Passo 2: Registrado CardGameScene em app.js`);
