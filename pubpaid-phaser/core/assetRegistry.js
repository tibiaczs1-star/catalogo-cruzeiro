export const PUBPAID_TEXTURE_KEYS = {
  player: "ppg-player-sprite",
  playerFemale: "ppg-singer-sprite",
  playerMaleWalk: "ppg-player-male-walk-sheet",
  playerMaleIdleBreathe: "ppg-player-male-idle-breathe-sheet",
  playerMaleIdlePhone: "ppg-player-male-idle-phone-sheet",
  playerFemaleWalk: "ppg-player-female-walk-sheet",
  playerFemaleIdleBreathe: "ppg-player-female-idle-breathe-sheet",
  playerFemaleIdlePhone: "ppg-player-female-idle-phone-sheet",
  waiterHero: "ppg-waiter-hero-sprite",
  waiterLobby: "ppg-waiter-lobby-sprite",
  waiterLobbySpeaking: "ppg-waiter-lobby-speaking-sprite",
  singer: "ppg-singer-sprite",
  singerLobby: "ppg-singer-lobby-sprite",
  guestA: "ppg-guest-a-sprite",
  guestB: "ppg-guest-b-sprite",
  carSide: "ppg-car-side-sprite",
  trafficVehicles: "ppg-traffic-vehicles-4f"
};

export const PUBPAID_WORLD_SCALE = {
  adultForegroundPx: 124,
  doorHeightPx: 205
};

export function fitImageToHeight(image, displayHeight) {
  if (!image || !displayHeight) return image;
  const sourceWidth = image.width || displayHeight;
  const sourceHeight = image.height || displayHeight;
  const ratio = sourceHeight > 0 ? displayHeight / sourceHeight : 1;
  image.setDisplaySize(Math.max(1, sourceWidth * ratio), displayHeight);
  return image;
}

export function applyPixelTextureFilters(scene, keys = Object.values(PUBPAID_TEXTURE_KEYS)) {
  keys.forEach((textureKey) => {
    scene.textures.get(textureKey)?.setFilter?.(Phaser.Textures.FilterMode.NEAREST);
  });
}
