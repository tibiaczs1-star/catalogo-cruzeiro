(function attachMundoAppleMedia(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MundoAppleMedia = api;
}(typeof window !== "undefined" ? window : globalThis, function createMundoAppleMedia() {
  function cleanCatalogKey(item) {
    return String(item?.catalogKey || "")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "");
  }

  function cleanHex(value) {
    const normalized = String(value || "").trim().toLowerCase();
    return /^#[0-9a-f]{6}$/.test(normalized) ? normalized.slice(1) : "";
  }

  function productArtPath(item) {
    const catalogKey = cleanCatalogKey(item);
    return String(item?.artPath || "") || (catalogKey ? `assets/products/${catalogKey}.svg` : "");
  }

  function variantArtPath(item, variant) {
    if (variant?.artPath && /\.webp(?:\?|$)/i.test(String(variant.artPath))) return String(variant.artPath);
    const catalogKey = cleanCatalogKey(item);
    const colorHex = cleanHex(variant?.hex);
    return catalogKey && colorHex
      ? `assets/product-colors/${catalogKey}/${colorHex}.webp?v=20260726-3`
      : productArtPath(item);
  }

  return { productArtPath, variantArtPath };
}));
