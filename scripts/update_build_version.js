// Build version info
const BUILD_ID = 'arizona-pub-20260905-01';

// Update version in app.js (line ~19)
require('fs').appendFileSync('pubpaid-phaser/app.js', `\n// BUILD ID injected: ${BUILD_ID}\n`);

// Update server.js server side variable (line ~84)
require('fs').appendFileSync('server.js', `\n// BUILD ID injected: ${BUILD_ID}\n`);
