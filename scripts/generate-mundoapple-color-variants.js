"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { buildDemoDataset } = require("../mundoapple/server/demo");
const catalog = require("../mundoapple/data/apple-products.json");

const projectRoot = path.join(__dirname, "..");
const outputRoot = path.join(projectRoot, "mundoapple", "public", "assets", "product-colors");
const { inventory } = buildDemoDataset(catalog, { count: 50, ownerUsername: "matheus" });

function colorizeStrength(hex) {
  const channels = hex.match(/.{2}/g).map((channel) => Number.parseInt(channel, 16));
  const luminance = (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
  if (luminance >= 210) return "68%";
  if (luminance <= 45) return "48%";
  return "58%";
}

let generated = 0;
for (const item of inventory) {
  const itemOutput = path.join(outputRoot, item.catalogKey);
  fs.mkdirSync(itemOutput, { recursive: true });
  const sourcePath = path.join(projectRoot, "mundoapple", "public", "assets", "products-ai", `${item.catalogKey}.png`);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing product artwork: ${sourcePath}`);
  }
  for (const variant of item.colorVariants || []) {
    const colorHex = String(variant.hex || "").toLowerCase().replace("#", "");
    if (!/^[0-9a-f]{6}$/.test(colorHex)) continue;
    const outputPath = path.join(itemOutput, `${colorHex}.webp`);
    const result = spawnSync("magick", [
      sourcePath,
      "-resize", "1024x1024^",
      "-gravity", "center",
      "-extent", "1024x1024",
      "-colorspace", "gray",
      "-level", "8%,92%",
      "-fill", `#${colorHex}`,
      "-colorize", colorizeStrength(colorHex),
      "-quality", "90",
      outputPath,
    ], { encoding: "utf8" });
    if (result.status !== 0) {
      throw new Error(result.stderr || result.stdout || `ImageMagick failed for ${item.catalogKey}/${colorHex}`);
    }
    generated += 1;
  }
}

console.log(`Generated ${generated} product color images in ${outputRoot}`);
