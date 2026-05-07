from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SEED = ROOT / "assets/pubpaid/sprites/adult-standing-tight-v1.png"
OUT_DIR = ROOT / "assets/pubpaid/sprites/protagonist"
SHEET = OUT_DIR / "protagonist-8dir-walk-v1.png"
PREVIEW = OUT_DIR / "protagonist-8dir-walk-v1-preview.png"
NOTES = OUT_DIR / "README.md"

FRAME_W = 64
FRAME_H = 128
FRAMES_PER_DIRECTION = 4
DIRECTIONS = [
    ("south", 0),
    ("south-east", -5),
    ("east", -10),
    ("north-east", -6),
    ("north", 0),
    ("north-west", 6),
    ("west", 10),
    ("south-west", 5),
]


def trim_alpha(image):
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    return image.crop(bbox) if bbox else image


def fit_seed(image):
    image = trim_alpha(image.convert("RGBA"))
    target_h = 118
    ratio = target_h / image.height
    resized = image.resize((max(1, int(image.width * ratio)), target_h), Image.Resampling.LANCZOS)
    if resized.width > 54:
        ratio = 54 / resized.width
        resized = resized.resize((54, max(1, int(resized.height * ratio))), Image.Resampling.LANCZOS)
    return resized


def shadow(frame):
    layer = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    width = 34 + (2 if frame in (1, 3) else 0)
    draw.ellipse(
        ((FRAME_W - width) // 2, FRAME_H - 10, (FRAME_W + width) // 2, FRAME_H - 3),
        fill=(0, 0, 0, 58),
    )
    return layer


def direction_tint(base, direction_index):
    # Subtle lighting shifts simulate camera orientation while preserving the approved seed.
    brightness = [1.02, 1.0, 0.96, 0.92, 0.9, 0.92, 0.96, 1.0][direction_index]
    contrast = [1.04, 1.03, 1.02, 0.98, 0.96, 0.98, 1.02, 1.03][direction_index]
    image = ImageEnhance.Brightness(base).enhance(brightness)
    image = ImageEnhance.Contrast(image).enhance(contrast)
    return image


def make_frame(seed, direction_index, angle, frame):
    canvas = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    canvas.alpha_composite(shadow(frame))

    pose = direction_tint(seed, direction_index)
    if direction_index in (5, 6, 7):
        pose = ImageOps.mirror(pose)

    walk_x = [0, 2, 0, -2][frame]
    walk_y = [0, 1, -1, 1][frame]
    scale_y = [1.0, 0.985, 1.012, 0.985][frame]
    scaled = pose.resize((pose.width, max(1, int(pose.height * scale_y))), Image.Resampling.LANCZOS)
    rotated = scaled.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)

    x = (FRAME_W - rotated.width) // 2 + walk_x
    y = FRAME_H - rotated.height - 6 + walk_y
    canvas.alpha_composite(rotated, (x, y))

    if frame in (1, 3):
        # A tiny shoe/step accent makes the walking cycle readable at game scale.
        draw = ImageDraw.Draw(canvas)
        step_x = FRAME_W // 2 + (7 if frame == 1 else -11)
        draw.rectangle((step_x, FRAME_H - 11, step_x + 8, FRAME_H - 8), fill=(18, 18, 22, 180))
    return canvas


def build_sheet():
    if not SEED.exists():
        raise FileNotFoundError(f"Missing seed: {SEED}")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    seed = fit_seed(Image.open(SEED))
    sheet = Image.new("RGBA", (FRAME_W * FRAMES_PER_DIRECTION, FRAME_H * len(DIRECTIONS)), (0, 0, 0, 0))
    for direction_index, (_name, angle) in enumerate(DIRECTIONS):
        for frame in range(FRAMES_PER_DIRECTION):
            tile = make_frame(seed, direction_index, angle, frame)
            sheet.alpha_composite(tile, (frame * FRAME_W, direction_index * FRAME_H))
    sheet.save(SHEET)
    return sheet


def build_preview(sheet):
    cell_w = FRAME_W * 2
    cell_h = FRAME_H * 2
    label_h = 26
    preview = Image.new("RGB", (cell_w * FRAMES_PER_DIRECTION, (cell_h + label_h) * len(DIRECTIONS)), (20, 24, 31))
    draw = ImageDraw.Draw(preview)
    for direction_index, (name, _angle) in enumerate(DIRECTIONS):
        y = direction_index * (cell_h + label_h)
        draw.text((8, y + 5), name, fill=(230, 235, 242))
        for frame in range(FRAMES_PER_DIRECTION):
            tile = sheet.crop((frame * FRAME_W, direction_index * FRAME_H, (frame + 1) * FRAME_W, (direction_index + 1) * FRAME_H))
            tile = tile.resize((cell_w, cell_h), Image.Resampling.NEAREST)
            bg_x = frame * cell_w
            bg_y = y + label_h
            draw.rectangle((bg_x + 4, bg_y + 4, bg_x + cell_w - 4, bg_y + cell_h - 4), fill=(31, 37, 46), outline=(83, 94, 109))
            preview.paste(tile, (bg_x, bg_y), tile)
    preview.save(PREVIEW)


def write_notes():
    NOTES.write_text(
        "# Protagonista PubPaid 2.0\n\n"
        "Pacote local de desenvolvimento para recolocar o personagem principal em formato de jogo.\n\n"
        "- `protagonist-8dir-walk-v1.png`: spritesheet 8 direcoes x 4 frames, 64x128 por frame.\n"
        "- `protagonist-8dir-walk-v1-preview.png`: prancha de revisao visual.\n"
        "- Seed: `../adult-standing-tight-v1.png`, sprite aprovado provisoriamente em escala.\n\n"
        "Status: animatic jogavel local, nao arte final. A proxima passada deve redesenhar frames reais por direcao,\n"
        "mantendo a mesma grade e ancora inferior central.\n",
        encoding="utf-8",
    )


def main():
    sheet = build_sheet()
    build_preview(sheet)
    write_notes()
    print(SHEET)
    print(PREVIEW)


if __name__ == "__main__":
    main()
