from pathlib import Path
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets/pubpaid/sprites/protagonist"

FRAME_W = 96
FRAME_H = 144
TURN_W = 172
TURN_H = 256
FRAMES = 4
ROWS = 8

DIRECTION_PLAN = [
    {"row": 0, "flip": False},  # south
    {"row": 1, "flip": False},  # south-east
    {"row": 2, "flip": False},  # east
    {"row": 4, "flip": True},   # north-east
    {"row": 3, "flip": False},  # north
    {"row": 4, "flip": False},  # north-west
    {"row": 5, "flip": False},  # west
    {"row": 1, "flip": True},   # south-west
]
TURN_PLAN = [
    {"row": 0, "col": 0, "flip": False},  # front
    {"row": 2, "col": 0, "flip": False},  # right
    {"row": 3, "col": 0, "flip": False},  # back
    {"row": 5, "col": 0, "flip": False},  # left
]

SOURCES = {
    "male": OUT_DIR / "protagonist-male-generated-sheet-source-v1.png",
    "female": OUT_DIR / "protagonist-female-generated-sheet-source-v1.png",
}


def foreground_pixel(pixel):
    r, g, b = pixel[:3]
    saturation = max(r, g, b) - min(r, g, b)
    return saturation > 10 or min(r, g, b) < 176


def opaque_sprite_pixel(pixel):
    r, g, b = pixel[:3]
    saturation = max(r, g, b) - min(r, g, b)
    return saturation > 12 or min(r, g, b) < 150


def foreground_mask(image):
    rgb = image.convert("RGB")
    pixels = rgb.load()
    width, height = rgb.size
    mask = set()
    for y in range(height):
        for x in range(width):
            if foreground_pixel(pixels[x, y]):
                mask.add((x, y))
    return mask


def connected_components(mask):
    seen = set()
    components = []
    for point in list(mask):
        if point in seen:
            continue
        stack = [point]
        seen.add(point)
        xs = []
        ys = []
        while stack:
            x, y = stack.pop()
            xs.append(x)
            ys.append(y)
            for nx in (x - 1, x, x + 1):
                for ny in (y - 1, y, y + 1):
                    neighbor = (nx, ny)
                    if neighbor == (x, y) or neighbor not in mask or neighbor in seen:
                        continue
                    seen.add(neighbor)
                    stack.append(neighbor)
        if len(xs) < 80:
            continue
        box = (min(xs), min(ys), max(xs) + 1, max(ys) + 1)
        if box[2] - box[0] > 15 and box[3] - box[1] > 35:
            components.append(box)
    return components


def group_rows(boxes):
    rows = []
    for box in sorted(boxes, key=lambda item: ((item[1] + item[3]) / 2, item[0])):
        center_y = (box[1] + box[3]) / 2
        for row in rows:
            if abs(row["center"] - center_y) < 42:
                row["boxes"].append(box)
                row["center"] = sum((b[1] + b[3]) / 2 for b in row["boxes"]) / len(row["boxes"])
                break
        else:
            rows.append({"center": center_y, "boxes": [box]})
    return [sorted(row["boxes"], key=lambda box: box[0]) for row in sorted(rows, key=lambda row: row["center"])]


def transparent_crop(source, box):
    crop = source.crop(box).convert("RGBA")
    pixels = crop.load()
    width, height = crop.size
    for y in range(height):
        for x in range(width):
            if not opaque_sprite_pixel(pixels[x, y]):
                pixels[x, y] = (0, 0, 0, 0)
    return crop


def fit_frame(frame, out_w, out_h, target_h, bottom_pad=5):
    bbox = frame.getbbox()
    if not bbox:
        return Image.new("RGBA", (out_w, out_h), (0, 0, 0, 0))
    subject = frame.crop(bbox)
    scale = min((out_w - 10) / subject.width, target_h / subject.height)
    scaled = subject.resize(
        (max(1, round(subject.width * scale)), max(1, round(subject.height * scale))),
        Image.Resampling.LANCZOS,
    )
    canvas = Image.new("RGBA", (out_w, out_h), (0, 0, 0, 0))
    x = (out_w - scaled.width) // 2
    y = out_h - scaled.height - bottom_pad
    canvas.alpha_composite(scaled, (x, y))
    return canvas


def get_source_frame(source, rows, row_index, col_index, flip=False):
    row = rows[min(row_index, len(rows) - 1)]
    box = row[min(col_index, len(row) - 1)]
    frame = transparent_crop(source, box)
    if flip:
        frame = frame.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    return frame


def build_sheet(source, rows, mode):
    sheet = Image.new("RGBA", (FRAME_W * FRAMES, FRAME_H * ROWS), (0, 0, 0, 0))
    for direction_index, plan in enumerate(DIRECTION_PLAN):
        row = rows[min(plan["row"], len(rows) - 1)]
        if mode == "phone":
            cols = list(range(max(0, len(row) - FRAMES), len(row)))
            if len(cols) < FRAMES:
                cols = list(range(min(FRAMES, len(row))))
        else:
            cols = list(range(min(FRAMES, len(row))))
        while len(cols) < FRAMES:
            cols.append(cols[-1] if cols else 0)
        for frame_index, col in enumerate(cols[:FRAMES]):
            frame = get_source_frame(source, rows, plan["row"], col, plan["flip"])
            fitted = fit_frame(frame, FRAME_W, FRAME_H, 136, 4)
            sheet.alpha_composite(fitted, (frame_index * FRAME_W, direction_index * FRAME_H))
    return sheet


def build_turnaround(source, rows):
    strip = Image.new("RGBA", (TURN_W * FRAMES, TURN_H), (0, 0, 0, 0))
    for index, plan in enumerate(TURN_PLAN):
        frame = get_source_frame(source, rows, plan["row"], plan["col"], plan["flip"])
        fitted = fit_frame(frame, TURN_W, TURN_H, 236, 8)
        strip.alpha_composite(fitted, (index * TURN_W, 0))
    return strip


def process_character(name, source_path):
    source = Image.open(source_path).convert("RGBA")
    rows = group_rows(connected_components(foreground_mask(source)))
    if len(rows) < 6:
        raise RuntimeError(f"{name}: expected at least 6 rows, found {len(rows)}")

    outputs = {
        "walk": OUT_DIR / f"protagonist-{name}-generated-walk-8dir-4f.png",
        "idle_breathe": OUT_DIR / f"protagonist-{name}-generated-idle-breathe-8dir-4f.png",
        "idle_phone": OUT_DIR / f"protagonist-{name}-generated-idle-phone-8dir-4f.png",
        "turnaround": OUT_DIR / f"protagonist-{name}-turnaround-4f.png",
    }
    build_sheet(source, rows, "walk").save(outputs["walk"])
    build_sheet(source, rows, "idle_breathe").save(outputs["idle_breathe"])
    build_sheet(source, rows, "phone").save(outputs["idle_phone"])
    build_turnaround(source, rows).save(outputs["turnaround"])
    for path in outputs.values():
        print(path)


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, source_path in SOURCES.items():
        if not source_path.exists():
            raise FileNotFoundError(source_path)
        process_character(name, source_path)


if __name__ == "__main__":
    main()
