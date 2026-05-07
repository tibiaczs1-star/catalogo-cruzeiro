from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/pubpaid/traffic/pubpaid-traffic-artistic-left-3f-source-v1.png"
OUT = ROOT / "assets/pubpaid/traffic/pubpaid-traffic-artistic-left-3f-v1.png"
PREVIEW = ROOT / "assets/pubpaid/traffic/pubpaid-traffic-artistic-left-3f-v1-preview.png"
MANIFEST = ROOT / "assets/pubpaid/traffic/pubpaid-traffic-artistic-left-3f-v1.json"

SRC_COLS = 3
SRC_ROWS = 10
FRAME_W = 384
FRAME_H = 192
BOTTOM_PAD = 16


VEHICLES = [
    ("taxi_art_left_v1", "taxi amarelo 32-bit", "car"),
    ("black_sedan_art_left_v1", "sedan preto 32-bit", "car"),
    ("red_sport_art_left_v1", "esportivo vermelho 32-bit", "car"),
    ("teal_hatch_art_left_v1", "hatch teal 32-bit", "car"),
    ("olive_pickup_art_left_v1", "pickup verde 32-bit", "car"),
    ("white_van_art_left_v1", "van branca 32-bit", "car"),
    ("blue_truck_art_left_v1", "caminhao leve azul 32-bit", "car"),
    ("retro_brazil_art_left_v1", "classico brasileiro 32-bit", "car"),
    ("red_moto_rider_art_left_v1", "moto vermelha com piloto 32-bit", "moto"),
    ("teal_delivery_moto_art_left_v1", "moto delivery teal com piloto 32-bit", "moto"),
]


def is_checker_background(pixel):
    r, g, b, a = pixel
    if a == 0:
        return True
    # The generated file contains a painted light checkerboard around the art.
    # This broad test is used only for border-connected background removal.
    if max(r, g, b) - min(r, g, b) > 18:
        return False
    luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
    return luma >= 205


def is_strict_checker_background(pixel):
    r, g, b, a = pixel
    if a == 0:
        return True
    if max(r, g, b) - min(r, g, b) > 8:
        return False
    luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
    return luma >= 235


def hard_alpha(image):
    image = image.convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if a:
                pixels[x, y] = (r, g, b, 255)
    return image


def keep_primary_alpha_component(image):
    image = hard_alpha(image)
    pixels = image.load()
    width, height = image.size
    seen = set()
    components = []

    for y in range(height):
        for x in range(width):
            if pixels[x, y][3] == 0 or (x, y) in seen:
                continue
            queue = deque([(x, y)])
            seen.add((x, y))
            points = []
            while queue:
                cx, cy = queue.popleft()
                points.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if nx < 0 or ny < 0 or nx >= width or ny >= height:
                        continue
                    if pixels[nx, ny][3] == 0 or (nx, ny) in seen:
                        continue
                    seen.add((nx, ny))
                    queue.append((nx, ny))
            components.append(points)

    if not components:
        return image

    primary = max(components, key=len)
    primary_pixels = set(primary)
    clean = Image.new("RGBA", image.size, (0, 0, 0, 0))
    clean_pixels = clean.load()
    for x, y in primary_pixels:
        clean_pixels[x, y] = pixels[x, y]
    return clean


def restore_interior_art_pixels(image, reference):
    image = hard_alpha(image)
    reference = reference.convert("RGBA")
    pixels = image.load()
    source_pixels = reference.load()
    bbox = image.getchannel("A").getbbox()
    if not bbox:
        return image

    left, top, right, bottom = bbox

    def has_opaque_left(x, y):
        return any(pixels[scan_x, y][3] for scan_x in range(left, x))

    def has_opaque_right(x, y):
        return any(pixels[scan_x, y][3] for scan_x in range(x + 1, right))

    def has_opaque_above(x, y):
        return any(pixels[x, scan_y][3] for scan_y in range(top, y))

    def has_opaque_below(x, y):
        return any(pixels[x, scan_y][3] for scan_y in range(y + 1, bottom))

    for y in range(top, bottom):
        for x in range(left, right):
            if pixels[x, y][3]:
                continue
            source_pixel = source_pixels[x, y]
            if is_strict_checker_background(source_pixel):
                continue
            if has_opaque_left(x, y) and has_opaque_right(x, y) and has_opaque_above(x, y) and has_opaque_below(x, y):
                r, g, b, _ = source_pixel
                pixels[x, y] = (r, g, b, 255)

    return hard_alpha(image)


def remove_external_checker(cell):
    cell = cell.convert("RGBA")
    pixels = cell.load()
    width, height = cell.size
    queue = deque()
    seen = set()

    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    while queue:
        x, y = queue.popleft()
        if (x, y) in seen or x < 0 or y < 0 or x >= width or y >= height:
            continue
        seen.add((x, y))
        if not is_checker_background(pixels[x, y]):
            continue
        pixels[x, y] = (0, 0, 0, 0)
        for nx, ny in (
            (x + 1, y),
            (x - 1, y),
            (x, y + 1),
            (x, y - 1),
            (x + 1, y + 1),
            (x - 1, y - 1),
            (x + 1, y - 1),
            (x - 1, y + 1),
        ):
            queue.append((nx, ny))

    return hard_alpha(cell)


def fill_internal_alpha_holes(image):
    image = hard_alpha(image)
    bbox = image.getchannel("A").getbbox()
    if not bbox:
        return image

    pixels = image.load()
    left, top, right, bottom = bbox
    width = right - left
    height = bottom - top
    exterior = set()
    queue = deque()

    def transparent(local_x, local_y):
        return pixels[left + local_x, top + local_y][3] == 0

    for x in range(width):
        if transparent(x, 0):
            queue.append((x, 0))
        if transparent(x, height - 1):
            queue.append((x, height - 1))
    for y in range(height):
        if transparent(0, y):
            queue.append((0, y))
        if transparent(width - 1, y):
            queue.append((width - 1, y))

    while queue:
        x, y = queue.popleft()
        if (x, y) in exterior or x < 0 or y < 0 or x >= width or y >= height:
            continue
        if not transparent(x, y):
            continue
        exterior.add((x, y))
        queue.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

    for y in range(height):
        for x in range(width):
            if not transparent(x, y) or (x, y) in exterior:
                continue
            colors = []
            for ny in range(max(0, y - 2), min(height, y + 3)):
                for nx in range(max(0, x - 2), min(width, x + 3)):
                    r, g, b, a = pixels[left + nx, top + ny]
                    if a:
                        colors.append((r, g, b))
            if colors:
                fill = tuple(round(sum(channel) / len(colors)) for channel in zip(*colors)) + (255,)
            else:
                fill = (8, 12, 18, 255)
            pixels[left + x, top + y] = fill

    return hard_alpha(image)


def crop_cell(source, col, row):
    left = round(col * source.width / SRC_COLS)
    right = round((col + 1) * source.width / SRC_COLS)
    top = round(row * source.height / SRC_ROWS)
    bottom = round((row + 1) * source.height / SRC_ROWS)
    cell = source.crop((left, top, right, bottom))
    reference = cell.copy()
    cell = remove_external_checker(cell)
    cell = keep_primary_alpha_component(cell)
    cell = restore_interior_art_pixels(cell, reference)
    cell = fill_internal_alpha_holes(cell)
    bbox = cell.getchannel("A").getbbox()
    return cell.crop(bbox) if bbox else cell


def normalize_frame(crop):
    frame = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    scale = min((FRAME_W - 40) / crop.width, (FRAME_H - 28) / crop.height, 1.18)
    if scale != 1:
        crop = crop.resize((round(crop.width * scale), round(crop.height * scale)), Image.Resampling.LANCZOS)
        crop = hard_alpha(crop)
    x = (FRAME_W - crop.width) // 2
    y = FRAME_H - crop.height - BOTTOM_PAD
    frame.alpha_composite(crop, (x, y))
    return fill_internal_alpha_holes(frame)


def build_preview(sheet):
    preview = Image.new("RGBA", sheet.size, (7, 10, 17, 255))
    preview.alpha_composite(sheet)
    return preview


def alpha_report(sheet):
    alpha = list(sheet.getchannel("A").getdata())
    semi = sum(1 for value in alpha if 0 < value < 255)
    holes = 0
    for row in range(SRC_ROWS):
        for col in range(SRC_COLS):
            frame = sheet.crop((col * FRAME_W, row * FRAME_H, (col + 1) * FRAME_W, (row + 1) * FRAME_H))
            bbox = frame.getchannel("A").getbbox()
            if not bbox:
                continue
            crop = frame.getchannel("A").crop(bbox)
            width, height = crop.size
            pixels = crop.load()
            exterior = set()
            queue = deque()
            for x in range(width):
                if pixels[x, 0] == 0:
                    queue.append((x, 0))
                if pixels[x, height - 1] == 0:
                    queue.append((x, height - 1))
            for y in range(height):
                if pixels[0, y] == 0:
                    queue.append((0, y))
                if pixels[width - 1, y] == 0:
                    queue.append((width - 1, y))
            while queue:
                x, y = queue.popleft()
                if (x, y) in exterior or x < 0 or y < 0 or x >= width or y >= height:
                    continue
                if pixels[x, y] != 0:
                    continue
                exterior.add((x, y))
                queue.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
            for y in range(height):
                for x in range(width):
                    if pixels[x, y] == 0 and (x, y) not in exterior:
                        holes += 1
    return semi, holes


def main():
    source = Image.open(SOURCE).convert("RGBA")
    sheet = Image.new("RGBA", (FRAME_W * SRC_COLS, FRAME_H * SRC_ROWS), (0, 0, 0, 0))

    for row in range(SRC_ROWS):
        for col in range(SRC_COLS):
            crop = crop_cell(source, col, row)
            frame = normalize_frame(crop)
            sheet.alpha_composite(frame, (col * FRAME_W, row * FRAME_H))

    semi, holes = alpha_report(sheet)
    if semi or holes:
        raise SystemExit(f"alpha contract failed: semi={semi} holes={holes}")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(OUT)
    build_preview(sheet).save(PREVIEW)
    MANIFEST.write_text(
        "{\n"
        '  "version": "pubpaid-traffic-artistic-left-3f-v1",\n'
        '  "sourceKind": "imagegen-bitmap-32bit-pixel-art-normalized",\n'
        '  "source": "assets/pubpaid/traffic/pubpaid-traffic-artistic-left-3f-source-v1.png",\n'
        '  "direction": "left",\n'
        f'  "frameWidth": {FRAME_W},\n'
        f'  "frameHeight": {FRAME_H},\n'
        '  "framesPerVehicle": 3,\n'
        '  "alphaContract": "external alpha only; semi=0; internal holes=0",\n'
        '  "note": "Normalization only: no vehicle art is drawn procedurally by this script.",\n'
        '  "vehicles": [\n'
        + ",\n".join(
            f'    {{ "id": "{vehicle_id}", "label": "{label}", "kind": "{kind}", "row": {row} }}'
            for row, (vehicle_id, label, kind) in enumerate(VEHICLES)
        )
        + "\n  ]\n}\n",
        encoding="utf-8",
    )
    print(f"wrote {OUT.relative_to(ROOT)}")
    print(f"wrote {PREVIEW.relative_to(ROOT)}")
    print(f"semi={semi} holes={holes} frame={FRAME_W}x{FRAME_H} rows={SRC_ROWS} cols={SRC_COLS}")


if __name__ == "__main__":
    main()
