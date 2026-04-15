const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");

const DEFAULT_FILE_MAP = {
  subscriptions: "subscriptions.json",
  comments: "comments.json",
  visits: "visits.json",
  heartbeats: "heartbeats.json",
  votes: "votes.json",
  ninjasRequests: "ninjas-requests.json",
  ninjasProfiles: "ninjas-profiles.json",
  salesListings: "sales-listings.json",
  vrRentalLeads: "vr-rental-leads.json",
  news: "news-cache.json",
  businesses: "businesses-cruzeiro.json",
  collectorReport: "collector-report.json",
};

function readEnv(value, fallback = "") {
  const candidate = String(value || fallback || "").trim();
  return candidate;
}

function shouldUseSupabase(config) {
  return Boolean(config.supabaseUrl && config.supabaseKey);
}

function createSharedDataStore(options = {}) {
  const baseDir = options.baseDir ? path.resolve(options.baseDir) : __dirname;
  const dataDirEnv = readEnv(process.env.DATA_DIR, options.dataDir);
  const supabaseUrl = readEnv(process.env.SUPABASE_URL, options.supabaseUrl).replace(/\/+$/, "");
  const supabaseKey = readEnv(
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY,
    options.supabaseKey
  );
  const schema = readEnv(process.env.SUPABASE_SCHEMA, options.schema || "public");
  const table = readEnv(process.env.SUPABASE_STORE_TABLE, options.table || "app_kv_store");
  const dataDir = dataDirEnv ? path.resolve(dataDirEnv) : path.join(baseDir, "data");
  const fileMap = { ...DEFAULT_FILE_MAP, ...(options.fileMap || {}) };
  const useSupabase = shouldUseSupabase({ supabaseUrl, supabaseKey });

  function resolveFile(key) {
    return path.join(dataDir, fileMap[key] || `${key}.json`);
  }

  function buildHeaders(method, extraHeaders = {}) {
    const headers = {
      Accept: "application/json",
      "Cache-Control": "no-cache",
    };

    if (useSupabase) {
      headers.apikey = supabaseKey;
      headers.Authorization = `Bearer ${supabaseKey}`;
      if (method !== "GET" && method !== "HEAD") {
        headers["Content-Type"] = "application/json";
      }
      if (schema && schema !== "public") {
        if (method === "GET" || method === "HEAD") {
          headers["Accept-Profile"] = schema;
        } else {
          headers["Content-Profile"] = schema;
        }
      }
    }

    return { ...headers, ...extraHeaders };
  }

  function buildSupabaseUrl(query = {}) {
    const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        return;
      }
      url.searchParams.set(key, String(value));
    });
    return url;
  }

  async function parseResponse(response, method) {
    if (response.status === 204) {
      return null;
    }

    const text = await response.text();
    if (!response.ok) {
      throw new Error(
        `[shared-data-store] ${method} ${table} falhou (${response.status}): ${text || response.statusText}`
      );
    }

    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  async function request(method, query = {}, body, extraHeaders) {
    const response = await fetch(buildSupabaseUrl(query), {
      method,
      headers: buildHeaders(method, extraHeaders),
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    return parseResponse(response, method);
  }

  async function ensure(defaults = {}, options = {}) {
    if (!useSupabase) {
      await fsp.mkdir(dataDir, { recursive: true });
      await Promise.all(
        Object.entries(defaults).map(async ([key, value]) => {
          const file = resolveFile(key);
          if (fs.existsSync(file)) {
            return;
          }
          await fsp.writeFile(file, JSON.stringify(value, null, 2), "utf-8");
        })
      );
      return;
    }

    if (options.verifyRemote === false) {
      return;
    }

    await request("GET", { select: "store_key", limit: 1 });
  }

  async function read(key, fallback = null) {
    if (!useSupabase) {
      try {
        const raw = await fsp.readFile(resolveFile(key), "utf-8");
        return JSON.parse(raw);
      } catch {
        return fallback;
      }
    }

    const rows = await request("GET", {
      select: "payload",
      store_key: `eq.${key}`,
      limit: 1,
    });

    if (Array.isArray(rows) && rows[0] && Object.prototype.hasOwnProperty.call(rows[0], "payload")) {
      return rows[0].payload;
    }

    return fallback;
  }

  async function write(key, payload) {
    if (!useSupabase) {
      const file = resolveFile(key);
      await fsp.mkdir(path.dirname(file), { recursive: true });
      await fsp.writeFile(file, JSON.stringify(payload, null, 2), "utf-8");
      return payload;
    }

    await request(
      "POST",
      { on_conflict: "store_key" },
      [
        {
          store_key: key,
          payload,
          updated_at: new Date().toISOString(),
        },
      ],
      {
        Prefer: "resolution=merge-duplicates, return=minimal",
      }
    );

    return payload;
  }

  function describe() {
    return {
      mode: useSupabase ? "supabase" : "file",
      dataDir,
      table,
      schema,
    };
  }

  return {
    ensure,
    read,
    write,
    describe,
  };
}

module.exports = {
  createSharedDataStore,
  DEFAULT_FILE_MAP,
};
