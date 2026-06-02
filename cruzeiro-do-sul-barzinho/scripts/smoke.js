const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const required = ['index.html','src/app.js','src/styles.css','docs/GAME_BIBLE.md','docs/CHATGPT_IMAGE_PROMPTS.md'];
for (const file of required) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) throw new Error(`missing ${file}`);
}
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
for (const needle of ['Lobby 10', 'Sinuca', 'Damas', 'Xadrez', 'Relatório']) {
  if (!html.includes(needle)) throw new Error(`html missing ${needle}`);
}
for (const needle of ['renderGameToText', 'slots=10', 'poolMode', 'checkersPieces', 'chessPieces']) {
  if (!js.includes(needle)) throw new Error(`js missing ${needle}`);
}
console.log('smoke ok: PubPaid 3.0 separated prototype files present');
