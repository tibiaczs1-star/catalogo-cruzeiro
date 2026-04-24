export const ASSET_MANIFEST = Object.freeze({
  backgrounds: {
    street: { key: "street-bg", path: "assets/pubpaid/street/pubpaid-street-official.png" },
    interior: { key: "interior-bg", path: "assets/pubpaid/interior/pubpaid-interior-official.png" }
  },
  characters: {
    playerPilot: {
      key: "player-pilot-8dir",
      status: "pending-approved-bitmap",
      frameWidth: 32,
      frameHeight: 48,
      directions: 8,
      framesPerDirection: 3,
      notes: "Piloto futuro. Nao usar canvas/procedural."
    }
  },
  ui: {
    hudTheme: { key: "pubpaid-ui-dark-glass-brass", status: "css-dom" },
    doorPrompt: { key: "pubpaid-ui-door-prompt", status: "css-dom" }
  },
  fx: {
    streetRain: { key: "street-fx-rain", status: "runtime-light-fx" },
    cityWindows: { key: "street-fx-city-windows", status: "runtime-light-fx" },
    roadReflections: { key: "street-fx-road-reflections", status: "runtime-light-fx" }
  }
});

export function getAsset(category, id) {
  return ASSET_MANIFEST[category]?.[id] || null;
}

