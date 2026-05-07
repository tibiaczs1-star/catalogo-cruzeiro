from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw


SRC_FRAME_W = 256
SRC_FRAME_H = 128
OUT_FRAME_W = 384
OUT_FRAME_H = 192
ROWS = 8
OUT_COLS = 3

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/pubpaid/traffic/artistic-vehicles-source-v1/pubpaid-artistic-vehicles-multi-transparent-v1.png"
OUT = ROOT / "assets/pubpaid/traffic/pubpaid-traffic-artistic-vehicles-playable-3f-v1.png"
PREVIEW = ROOT / "assets/pubpaid/traffic/pubpaid-traffic-artistic-vehicles-playable-3f-v1-preview.png"


def is_background(pixel, seed):
    r, g, b, a = pixel
    sr, sg, sb, _sa = seed
    if a <= 8:
        return True
    distance = abs(r - sr) + abs(g - sg) + abs(b - sb)
    luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
    return luminance < 34 and distance < 70


def hard_alpha(image):
    image = image.convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if a:
                pixels[x, y] = (r, g, b, 255)
    return image


def fill_internal_alpha_holes(image, fallback=(8, 12, 18, 255)):
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

    def transparent_local(x, y):
        return pixels[left + x, top + y][3] == 0

    for x in range(width):
        if transparent_local(x, 0):
            queue.append((x, 0))
        if transparent_local(x, height - 1):
            queue.append((x, height - 1))
    for y in range(height):
        if transparent_local(0, y):
            queue.append((0, y))
        if transparent_local(width - 1, y):
            queue.append((width - 1, y))

    while queue:
        x, y = queue.popleft()
        if (x, y) in exterior or x < 0 or y < 0 or x >= width or y >= height:
            continue
        if not transparent_local(x, y):
            continue
        exterior.add((x, y))
        queue.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

    seen = set(exterior)
    for start_y in range(height):
        for start_x in range(width):
            if (start_x, start_y) in seen or not transparent_local(start_x, start_y):
                continue

            component = []
            colors = []
            queue = deque([(start_x, start_y)])
            seen.add((start_x, start_y))

            while queue:
                x, y = queue.popleft()
                component.append((x, y))
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
                    if nx < 0 or ny < 0 or nx >= width or ny >= height:
                        continue
                    nr, ng, nb, na = pixels[left + nx, top + ny]
                    if na:
                        colors.append((nr, ng, nb))
                        continue
                    if (nx, ny) in seen or (nx, ny) in exterior:
                        continue
                    seen.add((nx, ny))
                    queue.append((nx, ny))

            if colors:
                fill = tuple(round(sum(channel) / len(colors)) for channel in zip(*colors)) + (255,)
            else:
                fill = fallback
            for x, y in component:
                pixels[left + x, top + y] = fill

    return hard_alpha(image)


def clean_frame(frame):
    frame = frame.convert("RGBA")
    pixels = frame.load()
    width, height = frame.size
    seed = pixels[0, 0]
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
        if not is_background(pixels[x, y], seed):
            continue
        pixels[x, y] = (0, 0, 0, 0)
        queue.append((x + 1, y))
        queue.append((x - 1, y))
        queue.append((x, y + 1))
        queue.append((x, y - 1))
    return frame


def split_components(sprite):
    sprite = sprite.convert("RGBA")
    pixels = sprite.load()
    width, height = sprite.size
    seen = set()
    components = []

    for start_y in range(height):
        for start_x in range(width):
            if (start_x, start_y) in seen or pixels[start_x, start_y][3] == 0:
                continue
            queue = deque([(start_x, start_y)])
            seen.add((start_x, start_y))
            points = []
            while queue:
                x, y = queue.popleft()
                points.append((x, y))
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if nx < 0 or ny < 0 or nx >= width or ny >= height or (nx, ny) in seen:
                        continue
                    if pixels[nx, ny][3] == 0:
                        continue
                    seen.add((nx, ny))
                    queue.append((nx, ny))
            components.append(points)
    return components


def component_box(points):
    xs = [point[0] for point in points]
    ys = [point[1] for point in points]
    return min(xs), min(ys), max(xs) + 1, max(ys) + 1


def keep_vehicle_components(sprite):
    sprite = hard_alpha(sprite)
    pixels = sprite.load()
    components = split_components(sprite)
    if not components:
        return sprite

    largest = max(components, key=len)
    main_left, main_top, main_right, main_bottom = component_box(largest)
    keep = set()
    for component in components:
        if len(component) < 8:
            continue
        left, top, right, bottom = component_box(component)
        vertical_overlap = max(0, min(bottom, main_bottom + 10) - max(top, main_top - 10))
        horizontal_overlap = max(0, min(right, main_right + 8) - max(left, main_left - 8))
        close_to_body = top <= main_bottom + 8 and bottom >= main_top - 8
        if component is largest or (horizontal_overlap > 0 and (vertical_overlap > 0 or (close_to_body and len(component) >= 24))):
            keep.update(component)

    cleaned = Image.new("RGBA", sprite.size, (0, 0, 0, 0))
    cleaned_pixels = cleaned.load()
    for x, y in keep:
        r, g, b, a = pixels[x, y]
        if a:
            cleaned_pixels[x, y] = (r, g, b, 255)
    bbox = cleaned.getchannel("A").getbbox()
    return cleaned.crop(bbox) if bbox else cleaned


def source_side_frame(source, row):
    # The first cell of each row is the only consistently complete side-view
    # source. Later cells in the generated sheet drift into cut angles.
    box = (0, row * SRC_FRAME_H, SRC_FRAME_W, (row + 1) * SRC_FRAME_H)
    frame = keep_vehicle_components(clean_frame(source.crop(box)))
    bbox = frame.getchannel("A").getbbox()
    if not bbox:
        raise SystemExit(f"empty row {row}")
    return frame.crop(bbox)


def wheel_specs(row, bbox):
    left, top, right, bottom = bbox
    width = right - left
    if row <= 5:
        radius = 16
        y = bottom - 19
        return [
            (left + width * 0.22, y, radius),
            (left + width * 0.74, y, radius),
        ]
    radius = 18
    y = bottom - 19
    return [
        (left + width * 0.24, y, radius),
        (left + width * 0.82, y, radius),
    ]


def draw_wheel_rotation(frame, cx, cy, radius, degrees):
    import math

    cx, cy, radius = round(cx), round(cy), round(radius)
    draw = ImageDraw.Draw(frame)
    draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), outline=(6, 9, 12, 255), width=2)
    draw.ellipse((cx - radius + 4, cy - radius + 4, cx + radius - 4, cy + radius - 4), outline=(118, 132, 136, 255), width=1)
    for offset in (0, 90):
        angle = math.radians(degrees + offset)
        dx = math.cos(angle) * (radius - 4)
        dy = math.sin(angle) * (radius - 4)
        draw.line((cx - dx, cy - dy, cx + dx, cy + dy), fill=(172, 184, 182, 255), width=2)
    draw.ellipse((cx - 3, cy - 3, cx + 3, cy + 3), fill=(18, 22, 24, 255))


def boost_motorcycle_rider_visibility(frame, row):
    if row < 6:
        return frame

    frame = frame.convert("RGBA")
    bbox = frame.getchannel("A").getbbox()
    if not bbox:
        return frame

    left, top, right, bottom = bbox
    width = right - left
    height = bottom - top
    draw = ImageDraw.Draw(frame, "RGBA")

    def pt(rx, ry):
        return round(left + width * rx), round(top + height * ry)

    accent = (88, 238, 255, 255) if row == 6 else (255, 208, 109, 255)
    helmet = (226, 234, 236, 255) if row == 6 else (60, 162, 190, 255)
    helmet_shadow = (17, 22, 29, 255)
    jacket = (43, 58, 74, 255) if row == 6 else (35, 70, 82, 255)
    jacket_light = (112, 132, 148, 255) if row == 6 else (90, 154, 164, 255)
    pants = (18, 24, 34, 255)
    boot = (10, 12, 16, 255)
    skin = (190, 132, 91, 255)
    outline = (3, 5, 10, 255)

    seat = pt(0.46, 0.58)
    shoulder = pt(0.36, 0.39)
    head = pt(0.31, 0.22)
    handle = pt(0.19, 0.49)
    knee = pt(0.58, 0.72)
    foot = pt(0.74, 0.82)
    back_foot = pt(0.42, 0.81)

    torso = [
        (shoulder[0] - 7, shoulder[1] - 4),
        (shoulder[0] + 13, shoulder[1] + 2),
        (seat[0] + 12, seat[1] + 6),
        (seat[0] - 12, seat[1] + 1),
    ]
    draw.polygon(torso, fill=outline)
    draw.polygon([(x + 1, y + 1) for x, y in torso], fill=jacket)
    draw.line((shoulder[0] + 5, shoulder[1] + 2, handle[0], handle[1]), fill=outline, width=6)
    draw.line((shoulder[0] + 5, shoulder[1] + 2, handle[0], handle[1]), fill=jacket_light, width=3)
    draw.ellipse((handle[0] - 4, handle[1] - 4, handle[0] + 4, handle[1] + 4), fill=boot)
    draw.line((seat[0] + 2, seat[1] + 2, knee[0], knee[1]), fill=outline, width=8)
    draw.line((seat[0] + 2, seat[1] + 2, knee[0], knee[1]), fill=pants, width=5)
    draw.line((knee[0], knee[1], foot[0], foot[1]), fill=outline, width=7)
    draw.line((knee[0], knee[1], foot[0], foot[1]), fill=pants, width=4)
    draw.rectangle((foot[0] - 8, foot[1] - 3, foot[0] + 9, foot[1] + 3), fill=boot)
    draw.line((seat[0] - 5, seat[1], back_foot[0], back_foot[1]), fill=outline, width=6)
    draw.line((seat[0] - 5, seat[1], back_foot[0], back_foot[1]), fill=pants, width=3)
    draw.rectangle((back_foot[0] - 7, back_foot[1] - 2, back_foot[0] + 8, back_foot[1] + 2), fill=boot)

    draw.ellipse((head[0] - 10, head[1] - 10, head[0] + 10, head[1] + 10), fill=outline)
    draw.ellipse((head[0] - 8, head[1] - 8, head[0] + 8, head[1] + 8), fill=helmet)
    draw.rectangle((head[0] - 9, head[1] - 1, head[0] - 1, head[1] + 3), fill=accent)
    draw.rectangle((head[0] + 1, head[1] + 2, head[0] + 6, head[1] + 6), fill=skin)
    draw.arc((head[0] - 9, head[1] - 9, head[0] + 9, head[1] + 9), 205, 345, fill=helmet_shadow, width=2)
    draw.line((shoulder[0] - 1, shoulder[1], seat[0] - 8, seat[1]), fill=(190, 214, 224, 150), width=2)
    return hard_alpha(frame)


def place_on_canvas(sprite, row):
    canvas = Image.new("RGBA", (OUT_FRAME_W, OUT_FRAME_H), (0, 0, 0, 0))
    target_h = 128 if row <= 5 else 148
    if sprite.height > target_h:
        ratio = target_h / sprite.height
        sprite = sprite.resize((round(sprite.width * ratio), round(sprite.height * ratio)), Image.Resampling.LANCZOS)
        sprite = hard_alpha(sprite)
    x = (OUT_FRAME_W - sprite.width) // 2
    y = OUT_FRAME_H - sprite.height - (18 if row <= 5 else 10)
    canvas.alpha_composite(sprite, (x, y))
    canvas = hard_alpha(canvas)
    canvas = boost_motorcycle_rider_visibility(canvas, row)
    return fill_internal_alpha_holes(canvas)


def animated_frame(base, row, frame_index):
    frame = base.copy()
    bbox = frame.getchannel("A").getbbox()
    if not bbox:
        return frame
    # Keep the approved wheel art clean. The previous generated rotation marks
    # were estimated from the whole vehicle box and drifted away from the tires.
    return hard_alpha(frame)


def build_preview(sheet):
    checker = Image.new("RGBA", sheet.size, (10, 14, 23, 255))
    draw = ImageDraw.Draw(checker)
    tile = 16
    for y in range(0, sheet.height, tile):
        for x in range(0, sheet.width, tile):
            color = (20, 31, 46, 255) if (x // tile + y // tile) % 2 else (8, 12, 20, 255)
            draw.rectangle((x, y, x + tile - 1, y + tile - 1), fill=color)
    checker.alpha_composite(sheet)
    for col in range(OUT_COLS + 1):
        x = col * OUT_FRAME_W
        draw.line((x, 0, x, sheet.height), fill=(80, 232, 255, 100), width=1)
    for row in range(ROWS + 1):
        y = row * OUT_FRAME_H
        draw.line((0, y, sheet.width, y), fill=(255, 208, 109, 100), width=1)
    return checker


def main():
    source = Image.open(SOURCE).convert("RGBA")
    out = Image.new("RGBA", (OUT_FRAME_W * OUT_COLS, OUT_FRAME_H * ROWS), (0, 0, 0, 0))
    for row in range(ROWS):
        base = place_on_canvas(source_side_frame(source, row), row)
        for col in range(OUT_COLS):
            frame = animated_frame(base, row, col)
            out.alpha_composite(frame, (col * OUT_FRAME_W, row * OUT_FRAME_H))

    out = hard_alpha(out)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    out.save(OUT)
    build_preview(out).save(PREVIEW)
    print(f"wrote {OUT.relative_to(ROOT)}")
    print(f"wrote {PREVIEW.relative_to(ROOT)}")
    print(f"frame={OUT_FRAME_W}x{OUT_FRAME_H} rows={ROWS} cols={OUT_COLS}")


if __name__ == "__main__":
    main()
