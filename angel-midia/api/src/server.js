import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { createDatabase } from './db.js';
import { createShutdown } from './shutdown.js';

const config = loadConfig();
const db = createDatabase(config);
const app = buildApp({ db, logger: true });

const shutdown = createShutdown({ app, db });

function handleSignal(signal) {
  void shutdown(signal).catch((error) => {
    app.log.error(error);
    process.exitCode = 1;
  });
}

process.once('SIGINT', () => handleSignal('SIGINT'));
process.once('SIGTERM', () => handleSignal('SIGTERM'));

try {
  await app.listen({ host: config.host, port: config.port });
} catch (error) {
  app.log.error(error);
  await db.end();
  process.exitCode = 1;
}
