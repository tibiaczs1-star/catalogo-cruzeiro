export function createActivationRateLimiter({ max = 10, windowMs = 60_000, now = () => Date.now() } = {}) {
  // Este adapter e deliberadamente process-local. Producao com mais de uma
  // replica deve injetar um adapter compartilhado (por exemplo, Redis).
  const attemptsByIp = new Map();
  const attemptsByInstallation = new Map();
  const inspect = (attempts, key, timestamp) => {
    const current = attempts.get(key);
    return !current || timestamp >= current.resetAt ? null : current;
  };
  return {
    async consume({ ip, installationId }) {
      const timestamp = now();
      const ipAttempt = inspect(attemptsByIp, ip, timestamp);
      const installationAttempt = inspect(attemptsByInstallation, installationId, timestamp);
      if (ipAttempt?.count >= max || installationAttempt?.count >= max) return false;
      if (ipAttempt) ipAttempt.count += 1;
      else attemptsByIp.set(ip, { count: 1, resetAt: timestamp + windowMs });
      if (installationAttempt) installationAttempt.count += 1;
      else attemptsByInstallation.set(installationId, { count: 1, resetAt: timestamp + windowMs });
      return true;
    },
  };
}
