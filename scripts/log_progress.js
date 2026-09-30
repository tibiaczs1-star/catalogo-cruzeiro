// progress logger
function logProgress(step) {
  const fs = require('fs');
  const line = `${new Date().toISOString()} - ${step}\n`;
  fs.appendFileSync('PROGRESSO_AZ_PUB.txt', line);
}
module.exports = logProgress;
