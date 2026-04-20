module.exports = {
  apps: [
    {
      name: "catalogo-web",
      script: "backend/server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "400M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        GOOGLE_AUTH_CLIENT_ID: process.env.GOOGLE_AUTH_CLIENT_ID,
        SITE_AUTH_SESSION_SECRET: process.env.SITE_AUTH_SESSION_SECRET,
      },
    },
    {
      name: "catalogo-worker",
      script: "backend/workers/catalogo-autoupdate-worker.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
