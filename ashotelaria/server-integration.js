"use strict";

const path = require("node:path");

function createASHotelariaServerIntegration({ rootDir, apiHandler, sendFile } = {}) {
  if (!rootDir || typeof sendFile !== "function") throw new TypeError("rootDir and sendFile are required");
  const aliases = new Map([
    ["/ashotelaria/app", "index.html"],
    ["/ashotelaria/app/", "index.html"],
    ["/czs-labs/ashotelaria", "index.html"],
    ["/czs-labs/ashotelaria/", "index.html"],
    ["/hoteis", "booking.html"],
    ["/hoteis/", "booking.html"],
  ]);

  return {
    async handle(req, res, pathname) {
      if (pathname?.startsWith("/api/ashotelaria/v1") && typeof apiHandler === "function") {
        return Boolean(await apiHandler(req, res));
      }
      const filename = aliases.get(pathname);
      const bookingAlias = pathname?.match(/^\/reservar\/[^/]+\/?$/);
      if (!filename && !bookingAlias) return false;
      sendFile(req, res, path.join(rootDir, "ashotelaria-app", filename || "booking.html"), {
        cacheControl: "no-store",
      });
      return true;
    },
  };
}

module.exports = { createASHotelariaServerIntegration };
