const TEXTURE_KEYS = {
  player: "ppg-player-sprite",
  bartender: "ppg-bartender-sprite",
  waiterHero: "ppg-waiter-hero-sprite",
  waiterLobby: "ppg-waiter-lobby-sprite",
  waiterLobbySpeaking: "ppg-waiter-lobby-speaking-sprite",
  singerLobby: "ppg-singer-lobby-sprite",
  singer: "ppg-singer-sprite",
  guestA: "ppg-guest-a-sprite",
  guestB: "ppg-guest-b-sprite"
};

export const PUBPAID_WORLD_SCALE = {
  doorHeightPx: 205,
  adultForegroundPx: 124,
  adultMidgroundPx: 96,
  adultBackgroundPx: 78,
  dogPx: 34
};

export function ensureCoreSprites() {
  // Core actor textures are loaded from PNG assets in BootScene.
}

export function getIdleFrameKeys(key) {
  return Array.from({ length: 4 }, (_item, index) => `${key}-idle-${index}`);
}

export function addSpriteActor(scene, key, x, y, scale = 1) {
  const sprite = scene.add.image(x, y, key);
  sprite.setOrigin(0.5, 1);
  sprite.setScale(scale);
  return sprite;
}

export function addIdleSpriteActor(scene, key, x, y, scale = 1, options = {}) {
  const frames = options.staticBitmap ? [] : getIdleFrameKeys(key).filter((textureKey) => scene.textures.exists(textureKey));
  const sprite = scene.add.image(x, y, frames[0] || key);
  sprite.setOrigin(0.5, 1);
  sprite.setScale(scale);
  if (frames.length > 1) {
    let frameIndex = 0;
    const frameDuration = options.frameDuration || 240;
    const delay = options.delay || 0;
    scene.time.delayedCall(delay, () => {
      scene.time.addEvent({
        delay: frameDuration,
        loop: true,
        callback: () => {
          frameIndex = (frameIndex + 1) % frames.length;
          sprite.setTexture(frames[frameIndex]);
        }
      });
    });
  }
  return sprite;
}

export { TEXTURE_KEYS };
