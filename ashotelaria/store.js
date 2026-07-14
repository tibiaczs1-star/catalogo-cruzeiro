"use strict";

const { createMemoryStore } = require("./memory-store");
const { createPostgresStore } = require("./postgres-store");

function createStore({ pool, connectionString = process.env.ASHOTELARIA_DATABASE_URL } = {}) {
  const production = process.env.NODE_ENV === "production";
  const memoryAllowed = process.env.NODE_ENV === "test"
    || (!production && process.env.ASHOTELARIA_DEMO_MODE === "true");

  if (!pool && memoryAllowed) return createMemoryStore();
  if (pool) return createPostgresStore({ pool });
  if (!connectionString) {
    throw new Error("ASHOTELARIA_DATABASE_URL is required for persistent hotel storage");
  }

  const { Pool } = require("pg");
  return createPostgresStore({ pool: new Pool({ connectionString }) });
}

module.exports = { createStore };
