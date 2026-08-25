export function createShutdown({ app, db }) {
  let shutdownPromise;

  return function shutdown(signal) {
    if (!shutdownPromise) {
      shutdownPromise = (async () => {
        app.log.info({ signal }, 'shutting down');
        let closeError;
        try {
          await app.close();
        } catch (error) {
          closeError = error;
        }

        try {
          await db.end();
        } catch (error) {
          if (!closeError) throw error;
        }

        if (closeError) throw closeError;
      })();
    }
    return shutdownPromise;
  };
}
