const TEXTURE_KEYS = {
  player: "ppg-player-sprite",
  bartender: "ppg-bartender-sprite",
  singer: "ppg-singer-sprite",
  guestA: "ppg-guest-a-sprite",
  guestB: "ppg-guest-b-sprite"
};

function drawPixel(ctx, x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
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

function createPlayerCanvas() {
  return buildCanvas(48, 72, (ctx) => {
    drawPixel(ctx, 10, 62, 28, 6, "rgba(0,0,0,.45)");
    drawPixel(ctx, 16, 2, 18, 8, "#2b1a23");
    drawPixel(ctx, 14, 10, 22, 18, "#d89a6d");
    drawPixel(ctx, 17, 15, 4, 3, "#fff2d0");
    drawPixel(ctx, 29, 15, 4, 3, "#fff2d0");
    drawPixel(ctx, 16, 28, 20, 6, "#ffd06d");
    drawPixel(ctx, 11, 34, 30, 20, "#50efff");
    drawPixel(ctx, 8, 36, 6, 20, "#253149");
    drawPixel(ctx, 38, 36, 6, 20, "#253149");
    drawPixel(ctx, 17, 54, 7, 12, "#182030");
    drawPixel(ctx, 29, 54, 7, 12, "#182030");
  });
}

function createBartenderCanvas() {
  return buildCanvas(54, 74, (ctx) => {
    drawPixel(ctx, 14, 66, 26, 5, "rgba(0,0,0,.45)");
    drawPixel(ctx, 18, 4, 20, 9, "#2f1a1f");
    drawPixel(ctx, 16, 13, 24, 20, "#d89a6d");
    drawPixel(ctx, 20, 20, 4, 3, "#ffffff");
    drawPixel(ctx, 31, 20, 4, 3, "#ffffff");
    drawPixel(ctx, 18, 33, 24, 10, "#f4f0e1");
    drawPixel(ctx, 13, 43, 34, 16, "#111827");
    drawPixel(ctx, 23, 41, 10, 5, "#8ef0a3");
    drawPixel(ctx, 14, 58, 8, 10, "#20283b");
    drawPixel(ctx, 33, 58, 8, 10, "#20283b");
    drawPixel(ctx, 42, 34, 7, 18, "#ffd06d");
  });
}

function createSingerCanvas() {
  return buildCanvas(50, 78, (ctx) => {
    drawPixel(ctx, 12, 68, 26, 5, "rgba(0,0,0,.45)");
    drawPixel(ctx, 16, 4, 22, 14, "#5b2038");
    drawPixel(ctx, 15, 18, 24, 19, "#d89a6d");
    drawPixel(ctx, 20, 25, 4, 3, "#fff2d0");
    drawPixel(ctx, 31, 25, 4, 3, "#fff2d0");
    drawPixel(ctx, 11, 37, 30, 22, "#ff4fb8");
    drawPixel(ctx, 36, 28, 4, 28, "#ffd06d");
    drawPixel(ctx, 17, 59, 7, 12, "#20283b");
    drawPixel(ctx, 29, 59, 7, 12, "#20283b");
  });
}

function createGuestCanvas(shirt, accent) {
  return buildCanvas(44, 62, (ctx) => {
    drawPixel(ctx, 10, 54, 24, 5, "rgba(0,0,0,.45)");
    drawPixel(ctx, 15, 4, 16, 7, "#2f1c1c");
    drawPixel(ctx, 13, 11, 20, 16, "#d89a6d");
    drawPixel(ctx, 17, 17, 3, 3, accent);
    drawPixel(ctx, 27, 17, 3, 3, accent);
    drawPixel(ctx, 10, 27, 26, 18, shirt);
    drawPixel(ctx, 14, 45, 6, 12, "#20283b");
    drawPixel(ctx, 26, 45, 6, 12, "#20283b");
  });
}

export function ensureCoreSprites(scene) {
  const textures = scene.textures;
  const definitions = [
    [TEXTURE_KEYS.player, createPlayerCanvas],
    [TEXTURE_KEYS.bartender, createBartenderCanvas],
    [TEXTURE_KEYS.singer, createSingerCanvas],
    [TEXTURE_KEYS.guestA, () => createGuestCanvas("#8ef0a3", "#e9fff0")],
    [TEXTURE_KEYS.guestB, () => createGuestCanvas("#ffcf6d", "#fff2cb")]
  ];

  definitions.forEach(([key, factory]) => {
    if (!textures.exists(key)) {
      textures.addCanvas(key, factory(), true);
    }
  });
}

export function addSpriteActor(scene, key, x, y, scale = 1) {
  const sprite = scene.add.image(x, y, key);
  sprite.setOrigin(0.5, 1);
  sprite.setScale(scale);
  return sprite;
}

export { TEXTURE_KEYS };
