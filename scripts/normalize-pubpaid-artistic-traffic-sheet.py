from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw


FRAME_W = 256
FRAME_H = 128
COLS = 6
ROWS = 8

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/pubpaid/traffic/artistic-vehicles-source-v1/pubpaid-artistic-vehicles-multi-transparent-v1.png"
OUT = ROOT / "assets/pubpaid/traffic/pubpaid-traffic-artistic-vehicles-game-ready-6f-v1.png"
PREVIEW = ROOT / "assets/pubpaid/traffic/pubpaid-traffic-artistic-vehicles-game-ready-6f-v1-preview.png"


def is_background(pixel, seed):
    r, g, b, a = pixel
    sr, sg, sb, _sa = seed
    if a <= 8:
        return True
    # The generated source kept a dark stage/background inside each frame.
    # Remove only connected edge pixels that are near that dark background.
    distance = abs(r - sr) + abs(g - sg) + abs(b - sb)
    luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
    return luminance < 34 and distance < 70


def clean_frame(frame):
    frame = frame.convert("RGBA")
    pixels = frame.load()
    seed = pixels[0, 0]
    queue = deque()
    seen = set()

    for x in range(FRAME_W):
        queue.append((x, 0))
        queue.append((x, FRAME_H - 1))
    for y in range(FRAME_H):
        queue.append((0, y))
        queue.append((FRAME_W - 1, y))

    while queue:
        x, y = queue.popleft()
        if (x, y) in seen or x < 0 or y < 0 or x >= FRAME_W or y >= FRAME_H:
            continue
        seen.add((x, y))
        if not is_background(pixels[x, y], seed):
            continue
        pixels[x, y] = (0, 0, 0, 0)
        queue.append((x + 1, y))
        queue.append((x - 1, y))
        queue.append((x, y + 1))
        queue.append((x, y - 1))

    # Drop tiny isolated near-black crumbs that are not part of the sprite mass.
    for y in range(FRAME_H):
        for x in range(FRAME_W):
            r, g, b, a = pixels[x, y]
            if a > 0 and (0.2126 * r + 0.7152 * g + 0.0722 * b) < 12:
                opaque_neighbors = 0
                for nx in range(max(0, x - 1), min(FRAME_W, x + 2)):
                    for ny in range(max(0, y - 1), min(FRAME_H, y + 2)):
                        if pixels[nx, ny][3] > 0:
                            opaque_neighbors += 1
                if opaque_neighbors <= 2:
                    pixels[x, y] = (0, 0, 0, 0)
    return frame


def bounds_for(frame):
    alpha = frame.getchannel("A")
    return alpha.getbbox()


def build_preview(sheet):
    scale = 1
    checker = Image.new("RGBA", sheet.size, (10, 14, 23, 255))
    draw = ImageDraw.Draw(checker)
    tile = 16
    for y in range(0, sheet.height, tile):
        for x in range(0, sheet.width, tile):
            color = (20, 31, 46, 255) if (x // tile + y // tile) % 2 else (8, 12, 20, 255)
            draw.rectangle((x, y, x + tile - 1, y + tile - 1), fill=color)
    checker.alpha_composite(sheet)
    for col in range(COLS + 1):
      x = col * FRAME_W
      draw.line((x, 0, x, sheet.height), fill=(80, 232, 255, 90), width=1)
    for row in range(ROWS + 1):
      y = row * FRAME_H
      draw.line((0, y, sheet.width, y), fill=(255, 208, 109, 90), width=1)
    return checker.resize((sheet.width * scale, sheet.height * scale), Image.Resampling.NEAREST)


def main():
    source = Image.open(SOURCE).convert("RGBA")
    if source.size != (FRAME_W * COLS, FRAME_H * ROWS):
        raise SystemExit(f"unexpected source size {source.size}")

    out = Image.new("RGBA", source.size, (0, 0, 0, 0))
    report = []
    for row in range(ROWS):
        for col in range(COLS):
            box = (col * FRAME_W, row * FRAME_H, (col + 1) * FRAME_W, (row + 1) * FRAME_H)
            frame = clean_frame(source.crop(box))
            bbox = bounds_for(frame)
            if not bbox:
                raise SystemExit(f"empty frame row={row} col={col}")
            left, top, right, bottom = bbox
            margins = {
                "left": left,
                "top": top,
                "right": FRAME_W - right,
                "bottom": FRAME_H - bottom,
            }
            if min(margins.values()) < 0:
                raise SystemExit(f"invalid margins row={row} col={col}: {margins}")
            report.append((row, col, margins))
            out.alpha_composite(frame, (col * FRAME_W, row * FRAME_H))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    out.save(OUT)
    build_preview(out).save(PREVIEW)
    print(f"wrote {OUT.relative_to(ROOT)}")
    print(f"wrote {PREVIEW.relative_to(ROOT)}")
    tight = [item for item in report if min(item[2].values()) < 2]
    print(f"frames={len(report)} tightFrames={len(tight)}")


if __name__ == "__main__":
    main()
