function requireEnvironmentVariable(environment, name) {
  const value = environment[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function loadConfig(environment = process.env) {
  const rawPort = environment.PORT ?? '3000';
  if (!/^[1-9]\d*$/.test(rawPort)) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }
  const port = Number(rawPort);
  if (port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  return {
    databaseUrl: requireEnvironmentVariable(environment, 'DATABASE_URL'),
    host: environment.HOST?.trim() || '0.0.0.0',
    port,
  };
}
