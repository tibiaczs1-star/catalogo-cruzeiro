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

const IDLE_FRAME_COUNT = 4;

export const PUBPAID_WORLD_SCALE = {
  doorHeightPx: 205,
  adultForegroundPx: 124,
  adultMidgroundPx: 96,
  adultBackgroundPx: 78,
  dogPx: 34
};

function frameKey(key, frame) {
  return `${key}-idle-${frame}`;
}

function drawPixel(ctx, x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), width, height);
}

function buildCanvas(width, height, painter) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  painter(ctx);
  return canvas;
}

function bodyOffset(frame) {
  return [0, -1, 0, 1][frame % IDLE_FRAME_COUNT];
}

function armOffset(frame) {
  return [0, 1, 0, -1][frame % IDLE_FRAME_COUNT];
}

function blinkFrame(frame) {
  return frame === 2;
}

function drawHead(ctx, x, y, hair, skin, frame) {
  drawPixel(ctx, x + 2, y, 10, 2, "#151515");
  drawPixel(ctx, x + 1, y + 2, 12, 2, "#151515");
  drawPixel(ctx, x, y + 4, 14, 10, "#151515");
  drawPixel(ctx, x + 2, y + 2, 10, 12, skin);
  drawPixel(ctx, x + 2, y + 2, 10, 5, hair);
  drawPixel(ctx, x + 1, y + 4, 2, 5, hair);
  drawPixel(ctx, x + 10, y + 4, 2, 7, hair);
  if (blinkFrame(frame)) {
    drawPixel(ctx, x + 4, y + 9, 2, 1, "#111111");
    drawPixel(ctx, x + 8, y + 9, 2, 1, "#111111");
  } else {
    drawPixel(ctx, x + 4, y + 8, 2, 3, "#111111");
    drawPixel(ctx, x + 8, y + 8, 2, 3, "#111111");
  }
  drawPixel(ctx, x + 5, y + 12, 4, 1, "#8c5a55");
}

function drawTorso(ctx, x, y, shirt, detail) {
  drawPixel(ctx, x + 1, y, 10, 2, "#151515");
  drawPixel(ctx, x, y + 2, 12, 9, "#151515");
  drawPixel(ctx, x + 1, y + 2, 10, 8, shirt);
  if (detail) {
    drawPixel(ctx, x + 3, y + 3, 6, 4, detail);
  }
}

function drawLegs(ctx, x, y, pants, shoes, frame) {
  const spread = frame === 1 || frame === 3 ? 1 : 0;
  drawPixel(ctx, x + 1, y, 4, 7, pants);
  drawPixel(ctx, x + 7, y, 4, 7, pants);
  drawPixel(ctx, x + 1 - spread, y + 7, 5, 2, shoes);
  drawPixel(ctx, x + 6 + spread, y + 7, 5, 2, shoes);
}

function drawArms(ctx, x, y, sleeve, skin, frame) {
  const lift = armOffset(frame);
  drawPixel(ctx, x - 2, y + 1 + lift, 2, 7, "#151515");
  drawPixel(ctx, x - 1, y + 2 + lift, 2, 5, sleeve);
  drawPixel(ctx, x - 1, y + 7 + lift, 2, 2, skin);
  drawPixel(ctx, x + 12, y + 1 - lift, 2, 7, "#151515");
  drawPixel(ctx, x + 11, y + 2 - lift, 2, 5, sleeve);
  drawPixel(ctx, x + 11, y + 7 - lift, 2, 2, skin);
}

function drawHeldItem(ctx, x, y, item, frame) {
  if (!item) return;
  const lift = frame === 1 ? -1 : frame === 2 ? -2 : 0;
  if (item === "glass") {
    drawPixel(ctx, x + 13, y + 4 + lift, 4, 6, "#d8a24f");
    drawPixel(ctx, x + 13, y + 4 + lift, 4, 2, "#fff1c0");
  }
  if (item === "mic") {
    drawPixel(ctx, x + 13, y - 2 + lift, 2, 10, "#f0c85d");
    drawPixel(ctx, x + 12, y - 3 + lift, 4, 2, "#fff0bf");
  }
  if (item === "beer") {
    drawPixel(ctx, x - 4, y + 4 + lift, 4, 6, "#d8a24f");
    drawPixel(ctx, x - 4, y + 4 + lift, 4, 2, "#fff1c0");
  }
}

function drawCharacterSheetSprite(ctx, spec, frame = 0) {
  const yOffset = bodyOffset(frame);
  const step = frame === 1 ? 1 : frame === 3 ? -1 : 0;
  const x = 22 + step;
  const y = 10 + yOffset;
  const outline = "#11131a";

  drawPixel(ctx, 17, 108, 30, 4, "rgba(0,0,0,.3)");

  drawPixel(ctx, x + 5, y, 13, 3, outline);
  drawPixel(ctx, x + 3, y + 3, 18, 3, outline);
  drawPixel(ctx, x + 2, y + 6, 20, 18, outline);
  drawPixel(ctx, x + 4, y + 4, 16, 20, spec.skin);
  drawPixel(ctx, x + 4, y + 4, 16, 7, spec.hair);
  drawPixel(ctx, x + 2, y + 8, 5, 10, spec.hair);
  drawPixel(ctx, x + 17, y + 8, 4, 12, spec.hair);
  if (blinkFrame(frame)) {
    drawPixel(ctx, x + 7, y + 15, 3, 1, outline);
    drawPixel(ctx, x + 14, y + 15, 3, 1, outline);
  } else {
    drawPixel(ctx, x + 7, y + 14, 3, 3, outline);
    drawPixel(ctx, x + 14, y + 14, 3, 3, outline);
  }
  drawPixel(ctx, x + 10, y + 21, 7, 1, "#8c5a55");

  drawPixel(ctx, x + 3, y + 25, 18, 5, outline);
  drawPixel(ctx, x + 1, y + 30, 22, 31, outline);
  drawPixel(ctx, x + 4, y + 30, 16, 29, spec.shirt);
  drawPixel(ctx, x + 7, y + 32, 10, 14, spec.detail || spec.shirt);
  drawPixel(ctx, x + 10, y + 30, 3, 31, "rgba(255,255,255,.13)");

  const armLift = armOffset(frame);
  drawPixel(ctx, x - 5, y + 31 + armLift, 6, 30, outline);
  drawPixel(ctx, x - 4, y + 33 + armLift, 4, 24, spec.sleeve || spec.shirt);
  drawPixel(ctx, x - 4, y + 57 + armLift, 4, 6, spec.skin);
  drawPixel(ctx, x + 23, y + 31 - armLift, 6, 30, outline);
  drawPixel(ctx, x + 24, y + 33 - armLift, 4, 24, spec.sleeve || spec.shirt);
  drawPixel(ctx, x + 24, y + 57 - armLift, 4, 6, spec.skin);

  const legSpread = frame === 1 || frame === 3 ? 2 : 0;
  drawPixel(ctx, x + 3, y + 61, 8, 39, outline);
  drawPixel(ctx, x + 14, y + 61, 8, 39, outline);
  drawPixel(ctx, x + 4, y + 62, 6, 36, spec.pants);
  drawPixel(ctx, x + 15, y + 62, 6, 36, spec.pants);
  drawPixel(ctx, x + 1 - legSpread, y + 98, 12, 5, spec.shoes);
  drawPixel(ctx, x + 13 + legSpread, y + 98, 12, 5, spec.shoes);

  drawHeldItem(ctx, x + 4, y + 30, spec.item, frame);
}

function createBaseCharacter(spec, frame = 0) {
  return buildCanvas(64, 116, (ctx) => {
    drawCharacterSheetSprite(ctx, spec, frame);
  });
}

function createPlayerCanvas(frame = 0) {
  return createBaseCharacter({
    hair: "#2d2f38",
    skin: "#efc1a3",
    shirt: "#50efff",
    sleeve: "#2d3f56",
    detail: "#87fbff",
    pants: "#253148",
    shoes: "#111827"
  }, frame);
}

function createBartenderCanvas(frame = 0) {
  return createBaseCharacter({
    hair: "#6f4a35",
    skin: "#efc1a3",
    shirt: "#f1efe8",
    sleeve: "#d5dde8",
    detail: "#1f2f47",
    pants: "#253148",
    shoes: "#111827",
    item: "glass"
  }, frame);
}

function createWaiterHeroCanvas(frame = 0) {
  const yOffset = bodyOffset(frame);
  const trayLift = frame === 1 ? -1 : frame === 2 ? -2 : 0;
  const step = frame === 1 ? 1 : frame === 3 ? -1 : 0;
  return buildCanvas(64, 76, (ctx) => {
    drawPixel(ctx, 17, 66, 28, 4, "rgba(0,0,0,.3)");

    drawPixel(ctx, 24 + step, 4 + yOffset, 18, 3, "#151515");
    drawPixel(ctx, 21 + step, 7 + yOffset, 24, 3, "#151515");
    drawPixel(ctx, 19 + step, 10 + yOffset, 28, 20, "#151515");
    drawPixel(ctx, 22 + step, 8 + yOffset, 22, 21, "#f0c0a0");
    drawPixel(ctx, 22 + step, 8 + yOffset, 22, 7, "#6f4630");
    drawPixel(ctx, 20 + step, 12 + yOffset, 6, 9, "#6f4630");
    drawPixel(ctx, 38 + step, 12 + yOffset, 6, 11, "#6f4630");
    drawPixel(ctx, 24 + step, 16 + yOffset, 6, 2, "#b88065");
    drawPixel(ctx, 36 + step, 16 + yOffset, 6, 2, "#b88065");
    if (blinkFrame(frame)) {
      drawPixel(ctx, 26 + step, 21 + yOffset, 4, 1, "#151515");
      drawPixel(ctx, 36 + step, 21 + yOffset, 4, 1, "#151515");
    } else {
      drawPixel(ctx, 26 + step, 20 + yOffset, 4, 3, "#151515");
      drawPixel(ctx, 36 + step, 20 + yOffset, 4, 3, "#151515");
    }
    drawPixel(ctx, 31 + step, 26 + yOffset, 6, 1, "#8d554c");

    drawPixel(ctx, 25 + step, 30 + yOffset, 16, 5, "#ffffff");
    drawPixel(ctx, 29 + step, 31 + yOffset, 8, 4, "#111827");
    drawPixel(ctx, 31 + step, 35 + yOffset, 4, 4, "#c79a40");

    drawPixel(ctx, 19 + step, 36 + yOffset, 28, 3, "#151515");
    drawPixel(ctx, 17 + step, 39 + yOffset, 32, 17, "#151515");
    drawPixel(ctx, 20 + step, 39 + yOffset, 26, 16, "#f4f1e9");
    drawPixel(ctx, 25 + step, 40 + yOffset, 16, 14, "#151d2b");
    drawPixel(ctx, 28 + step, 42 + yOffset, 10, 10, "#23304a");
    drawPixel(ctx, 21 + step, 54 + yOffset, 7, 3, "#d7deeb");
    drawPixel(ctx, 39 + step, 54 + yOffset, 7, 3, "#d7deeb");

    drawPixel(ctx, 12 + step, 38 + yOffset, 7, 15, "#151515");
    drawPixel(ctx, 13 + step, 39 + yOffset, 5, 14, "#d7deeb");
    drawPixel(ctx, 12 + step, 52 + yOffset, 6, 3, "#f0c0a0");
    drawPixel(ctx, 48 + step, 37 + yOffset + trayLift, 8, 14, "#151515");
    drawPixel(ctx, 49 + step, 38 + yOffset + trayLift, 6, 13, "#d7deeb");
    drawPixel(ctx, 48 + step, 50 + yOffset + trayLift, 7, 3, "#f0c0a0");

    drawPixel(ctx, 44 + step, 34 + yOffset + trayLift, 17, 3, "#151515");
    drawPixel(ctx, 46 + step, 32 + yOffset + trayLift, 13, 2, "#d0a35a");
    drawPixel(ctx, 48 + step, 27 + yOffset + trayLift, 5, 5, "#e6b45e");
    drawPixel(ctx, 55 + step, 26 + yOffset + trayLift, 4, 6, "#8ef0a3");

    drawPixel(ctx, 24 + step, 56 + yOffset, 8, 9, "#253148");
    drawPixel(ctx, 36 + step, 56 + yOffset, 8, 9, "#253148");
    drawPixel(ctx, 22 + step, 65 + yOffset, 11, 3, "#111827");
    drawPixel(ctx, 35 + step, 65 + yOffset, 11, 3, "#111827");
  });
}

function createSingerCanvas(frame = 0) {
  return createBaseCharacter({
    hair: "#8d63c6",
    skin: "#efc1a3",
    shirt: "#ef6bc1",
    sleeve: "#ef6bc1",
    detail: "#ffb0dc",
    pants: "#253148",
    shoes: "#111827",
    item: "mic"
  }, frame);
}

function createGuestCanvas(shirt, detail, frame = 0) {
  return createBaseCharacter({
    hair: "#7a573e",
    skin: "#efc1a3",
    shirt,
    sleeve: shirt,
    detail,
    pants: "#253148",
    shoes: "#111827",
    item: frame === 2 ? "beer" : null
  }, frame);
}

export function ensureCoreSprites(scene) {
  const textures = scene.textures;
  const definitions = [
    [TEXTURE_KEYS.player, createPlayerCanvas],
    [TEXTURE_KEYS.bartender, createBartenderCanvas],
    [TEXTURE_KEYS.singer, createSingerCanvas],
    [TEXTURE_KEYS.guestA, (frame) => createGuestCanvas("#34c4a1", "#baf7ea", frame)],
    [TEXTURE_KEYS.guestB, (frame) => createGuestCanvas("#f0bf6a", "#fff0c5", frame)]
  ];

  definitions.forEach(([key, factory]) => {
    for (let frame = 0; frame < IDLE_FRAME_COUNT; frame += 1) {
      const nextFrameKey = frameKey(key, frame);
      if (textures.exists(nextFrameKey)) textures.remove(nextFrameKey);
      textures.addCanvas(nextFrameKey, factory(frame));
    }
    if (!textures.exists(key)) {
      textures.addCanvas(key, factory(0));
    }
  });
}

export function getIdleFrameKeys(key) {
  return Array.from({ length: IDLE_FRAME_COUNT }, (_item, index) => frameKey(key, index));
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
