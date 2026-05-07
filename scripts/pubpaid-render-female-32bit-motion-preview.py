from pathlib import Path
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SPRITE_DIR = ROOT / "assets/pubpaid/sprites/protagonist"

FRAME_W = 96
FRAME_H = 144
FRAMES = 4
ROWS = 8
SCALE = 3

WALK_SHEET = SPRITE_DIR / "protagonist-female-32bit-walk-8dir-4f.png"
PHONE_SHEET = SPRITE_DIR / "protagonist-female-32bit-idle-phone-8dir-4f.png"

OUT_ALL = SPRITE_DIR / "protagonist-female-32bit-walk-all-directions.gif"
OUT_RIGHT = SPRITE_DIR / "protagonist-female-32bit-walk-right-loop.gif"
OUT_PHONE = SPRITE_DIR / "protagonist-female-32bit-phone-front-loop.gif"

DIRECTION_LABELS = [
    "sul",
    "sudeste",
    "leste",
    "nordeste",
    "norte",
    "noroeste",
    "oeste",
    "sudoeste",
]


def crop_frame(sheet, row, frame):
    return sheet.crop((frame * FRAME_W, row * FRAME_H, (frame + 1) * FRAME_W, (row + 1) * FRAME_H))


def paste_scaled(canvas, frame, x, y, scale=SCALE):
    tile = frame.resize((FRAME_W * scale, FRAME_H * scale), Image.Resampling.NEAREST)
    canvas.paste(tile, (x, y), tile)


def make_all_directions(sheet):
    tile_w = FRAME_W * SCALE
    tile_h = FRAME_H * SCALE
    label_h = 24
    margin = 18
    gap_x = 24
    gap_y = 36
    canvas_w = margin * 2 + 4 * tile_w + 3 * gap_x
    canvas_h = margin * 2 + 2 * (tile_h + label_h) + gap_y
    frames = []
    for frame_index in range(FRAMES):
        canvas = Image.new("RGBA", (canvas_w, canvas_h), (18, 22, 29, 255))
        draw = ImageDraw.Draw(canvas)
        for row in range(ROWS):
            col = row % 4
            line = row // 4
            x = margin + col * (tile_w + gap_x)
            y = margin + line * (tile_h + label_h + gap_y)
            draw.text((x + 8, y), DIRECTION_LABELS[row], fill=(232, 238, 245, 255))
            paste_scaled(canvas, crop_frame(sheet, row, frame_index), x, y + label_h)
        frames.append(canvas.convert("P", palette=Image.Palette.ADAPTIVE))
    frames[0].save(OUT_ALL, save_all=True, append_images=frames[1:], duration=140, loop=0, optimize=False)


def make_single_loop(sheet, row, out_path, scale=4):
    frames = []
    canvas_w = FRAME_W * scale
    canvas_h = FRAME_H * scale
    for frame_index in range(FRAMES):
        canvas = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
        tile = crop_frame(sheet, row, frame_index).resize((canvas_w, canvas_h), Image.Resampling.NEAREST)
        canvas.paste(tile, (0, 0), tile)
        frames.append(canvas.convert("P", palette=Image.Palette.ADAPTIVE))
    frames[0].save(out_path, save_all=True, append_images=frames[1:], duration=140, loop=0, transparency=0, optimize=False)


def main():
    walk = Image.open(WALK_SHEET).convert("RGBA")
    phone = Image.open(PHONE_SHEET).convert("RGBA")
    make_all_directions(walk)
    make_single_loop(walk, 2, OUT_RIGHT)
    make_single_loop(phone, 0, OUT_PHONE)
    print(OUT_ALL)
    print(OUT_RIGHT)
    print(OUT_PHONE)


if __name__ == "__main__":
    main()
