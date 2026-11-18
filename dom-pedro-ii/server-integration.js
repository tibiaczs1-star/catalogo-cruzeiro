const path = require("node:path");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");

/**
 * Integração do Dom Pedro II Voice como subpágina (/dom-pedro-ii/) dentro do Catálogo CZS,
 * aproveitando o disco persistente pago do Render (DATA_DIR/dom-pedro-ii).
 */
function createDomPedroServerIntegration({ dataDir }) {
  const domPedroDataDir = path.join(dataDir, "dom-pedro-ii");
  fs.mkdirSync(domPedroDataDir, { recursive: true });

  let appPromise = null;
  function getApp() {
    if (!appPromise) {
      process.env.DPII_EMBEDDED = "1";
      process.env.ESCOLA_DATA_DIR = domPedroDataDir;
      if (process.env.DOM_PEDRO_DEMO_MODE !== "0" && !process.env.DEMO_MODE) {
        process.env.DEMO_MODE = "1";
      }
      const entryUrl = pathToFileURL(path.join(__dirname, "server", "server.mjs")).href;
      appPromise = import(entryUrl).then(mod => mod.app);
    }
    return appPromise;
  }

  async function handleRequest(req, res, pathname) {
    if (pathname === "/dom-pedro-ii") {
      res.writeHead(302, { Location: "/dom-pedro-ii/", "Cache-Control": "no-store" });
      res.end();
      return true;
    }
    if (!pathname.startsWith("/dom-pedro-ii/")) {
      return false;
    }
    const app = await getApp();
    const origUrl = req.url;
    req.url = origUrl.slice("/dom-pedro-ii".length) || "/";
    if (!req.url.startsWith("/")) req.url = "/" + req.url;
    app(req, res);
    return true;
  }

  return { handleRequest };
}

module.exports = { createDomPedroServerIntegration };
