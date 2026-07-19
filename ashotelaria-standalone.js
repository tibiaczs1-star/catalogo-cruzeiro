"use strict";

const http = require("node:http");
const { createProductionHandler } = require("./ashotelaria/standalone-server");

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "0.0.0.0";
const server = http.createServer(createProductionHandler());

server.listen(port, host, () => {
  console.log(`[ashotelaria] SaaS independente online em http://${host}:${port}`);
});
