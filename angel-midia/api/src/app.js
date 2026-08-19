import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import authRoutes from './routes/auth.js';
import deviceRoutes from './routes/devices.js';
import campaignRoutes from './routes/campaigns.js';
import scheduleRoutes from './routes/schedules.js';
import locationRoutes from './routes/locations.js';
import mediaRoutes from './routes/media.js';
import telemetryRoutes from './routes/telemetry.js';
import libraryRoutes from './routes/library.js';
import playlistRoutes from './routes/playlists.js';
import reportRoutes from './routes/reports.js';
import { createActivationRateLimiter } from './services/activation-rate-limit.js';

export function buildApp({
  db,
  logger = false,
  secureCookies = process.env.NODE_ENV === 'production',
  now = () => new Date(),
  passwordVerifier,
  linkCodeGenerator,
  activationRateLimiter,
  activationRateLimit,
  mediaDir = process.env.MEDIA_DIR ?? './var/media',
  geocoder,
  locationRateLimiter,
  locationCache,
  locationSearchTimeoutMs,
} = {}) {
  if (!db) {
    throw new Error('db is required to build the application');
  }

  const app = Fastify({ logger });
  app.decorate('db', db);
  app.register(cookie);
  app.register(authRoutes, { secureCookies, now, passwordVerifier });
  app.register(deviceRoutes, {
    now,
    linkCodeGenerator,
    activationRateLimiter: activationRateLimiter ?? createActivationRateLimiter({ ...activationRateLimit, now: () => now().getTime() }),
  });
  app.register(campaignRoutes, { mediaDir });
  app.register(scheduleRoutes);
  app.register(locationRoutes, { geocoder, locationRateLimiter, locationCache, locationSearchTimeoutMs });
  app.register(mediaRoutes, { mediaDir });
  app.register(telemetryRoutes);
  app.register(libraryRoutes, { mediaDir });
  app.register(playlistRoutes);
  app.register(reportRoutes);
  app.get('/api/health', async (_request, reply) => {
    try {
      await app.db.query('SELECT 1');
      return { ok: true, service: 'angel-appstation-api' };
    } catch {
      return reply.code(503).send({
        ok: false,
        service: 'angel-appstation-api',
        error: 'unavailable',
      });
    }
  });
  return app;
}
