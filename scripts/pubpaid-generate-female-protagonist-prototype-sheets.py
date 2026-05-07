from pathlib import Path
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets/pubpaid/sprites/protagonist"

FRAME_W = 64
FRAME_H = 128
FRAMES = 3
ROWS = 8

FILES = {
    "walk": OUT_DIR / "protagonist-female-walk-8dir-3f.png",
    "idle_breathe": OUT_DIR / "protagonist-female-idle-breathe-8dir-3f.png",
    "idle_phone": OUT_DIR / "protagonist-female-idle-phone-8dir-3f.png",
}
PREVIEW = OUT_DIR / "protagonist-female-prototype-preview.png"
SELECT_PREVIEW = OUT_DIR / "protagonist-female-selection-preview.png"
MALE_SELECT_PREVIEW = OUT_DIR / "protagonist-male-selection-preview.png"

P = {
    "outline": (8, 10, 15, 255),
    "outline_soft": (16, 20, 28, 230),
    "hair_dark": (22, 18, 15, 255),
    "hair": (61, 39, 27, 255),
    "hair_light": (114, 72, 43, 255),
    "skin_shadow": (116, 68, 48, 255),
    "skin": (181, 111, 76, 255),
    "skin_light": (218, 148, 98, 255),
    "jacket_dark": (17, 39, 66, 255),
    "jacket": (23, 63, 102, 255),
    "jacket_light": (61, 103, 139, 255),
    "shirt_shadow": (166, 160, 150, 255),
    "shirt": (238, 232, 216, 255),
    "skirt_dark": (17, 22, 33, 255),
    "skirt": (35, 45, 65, 255),
    "skirt_light": (66, 76, 96, 255),
    "sneaker_dark": (18, 22, 28, 255),
    "sneaker": (213, 215, 210, 255),
    "sneaker_accent": (68, 92, 120, 255),
    "phone": (16, 23, 32, 255),
    "phone_glow": (80, 184, 210, 190),
}


def side_amount(row):
    return [0.0, 0.55, 1.0, 0.55, 0.0, -0.55, -1.0, -0.55][row]


def back_amount(row):
    return [0.0, 0.0, 0.12, 0.58, 1.0, 0.58, 0.12, 0.0][row]


def line(draw, pts, fill, width):
    draw.line([(round(x), round(y)) for x, y in pts], fill=fill, width=width, joint="curve")


def rect(draw, box, fill):
    x0, y0, x1, y1 = (round(v) for v in box)
    draw.rectangle((min(x0, x1), min(y0, y1), max(x0, x1), max(y0, y1)), fill=fill)


def shadow(draw, cx, y, w):
    draw.ellipse((cx - w / 2, y - 4, cx + w / 2, y + 3), fill=(0, 0, 0, 62))


def curl(draw, x, y, fill):
    rect(draw, (x - 2, y - 2, x + 2, y + 2), P["outline"])
    rect(draw, (x - 1, y - 1, x + 1, y + 1), fill)


def draw_head(draw, cx, cy, row, frame, mode):
    s = side_amount(row)
    b = back_amount(row)
    bob = [0, -1, 0][frame] if mode == "idle_breathe" else 0
    x = cx + s * 2
    y = cy + bob
    curl_points = [
        (-12, 1), (-8, -4), (-3, -6), (3, -6), (8, -3), (12, 2),
        (-14, 8), (14, 8), (-13, 15), (13, 15), (-10, 23), (10, 23)
    ]
    if b > 0.72:
        rect(draw, (x - 10, y + 2, x + 10, y + 22), P["hair"])
        rect(draw, (x - 12, y + 12, x + 12, y + 35), P["hair_dark"])
        rect(draw, (x - 4, y + 27, x + 4, y + 36), P["skin_shadow"])
        for dx, dy in curl_points:
            curl(draw, x + dx, y + dy, P["hair_dark"] if dy > 10 else P["hair"])
        rect(draw, (x - 5, y + 0, x + 5, y + 2), P["hair_light"])
        return
    face_w = 13 - abs(s) * 4
    for dx, dy in curl_points:
        if abs(s) > 0.8 and dx * s < -2:
            continue
        curl(draw, x + dx, y + dy, P["hair_dark"] if dy > 10 else P["hair"])
    rect(draw, (x - face_w / 2 - 2, y + 4, x + face_w / 2 + 2, y + 24), P["outline"])
    rect(draw, (x - face_w / 2, y + 6, x + face_w / 2, y + 22), P["skin"])
    rect(draw, (x - face_w / 2 + 1, y + 7, x + face_w / 2 - 2, y + 11), P["skin_light"])
    rect(draw, (x - face_w / 2 - 2, y + 0, x + face_w / 2 + 3, y + 11), P["hair_dark"])
    rect(draw, (x - face_w / 2 + 1, y - 2, x + face_w / 2 - 1, y + 5), P["hair"])
    rect(draw, (x - face_w / 2 + 3, y - 1, x + face_w / 2 - 4, y + 2), P["hair_light"])
    if abs(s) < 0.8:
        rect(draw, (x - 5, y + 14, x - 3, y + 17), P["outline"])
        rect(draw, (x + 4, y + 14, x + 6, y + 17), P["outline"])
    else:
        rect(draw, (x + s * 2, y + 14, x + s * 5, y + 17), P["outline"])
    rect(draw, (x - 2 + s * 2, y + 20, x + 2 + s * 2, y + 21), P["skin_shadow"])
    rect(draw, (x - 4, y + 24, x + 4, y + 33), P["outline"])
    rect(draw, (x - 3, y + 24, x + 3, y + 32), P["skin"])
    rect(draw, (x - 2, y + 24, x + 2, y + 27), P["skin_light"])


def draw_torso(draw, cx, top, row, frame, mode):
    s = side_amount(row)
    b = back_amount(row)
    breathe = [0, -1, 0][frame] if mode == "idle_breathe" else 0
    lean = s * 2 if mode == "walk" else s
    shoulder = 10 - abs(s) * 1.4
    waist = 7 - abs(s) * 0.7
    center = cx + s * 3 + lean * 0.15
    jacket = [
        (cx - shoulder + lean, top + breathe),
        (cx + shoulder + lean, top + breathe),
        (cx + waist + lean * 0.2, top + 34),
        (cx - waist + lean * 0.2, top + 34),
    ]
    draw.polygon(jacket, fill=P["outline"])
    draw.polygon([(x + (1 if x < cx else -1), y + 2) for x, y in jacket], fill=P["jacket"])
    if b < 0.65:
        draw.polygon([(center - 5, top + 4), (center, top + 15), (center - 3, top + 32), (center - 8, top + 9)], fill=P["jacket_dark"])
        draw.polygon([(center + 5, top + 4), (center, top + 15), (center + 3, top + 32), (center + 8, top + 9)], fill=P["jacket_light"])
        rect(draw, (center - 4, top + 7, center + 4, top + 35), P["shirt"])
        rect(draw, (center - 2, top + 26, center + 3, top + 35), P["shirt_shadow"])
    else:
        rect(draw, (cx - 8, top + 5, cx + 8, top + 32), P["jacket_dark"])
        rect(draw, (cx - 2, top + 7, cx + 2, top + 33), P["jacket_light"])
    skirt_top = top + 34
    skirt_bottom = top + 48
    skirt = [
        (cx - 8 - abs(s) + lean * 0.15, skirt_top),
        (cx + 8 - abs(s) + lean * 0.15, skirt_top),
        (cx + 11 - abs(s) * 2 + lean * 0.1, skirt_bottom),
        (cx - 11 - abs(s) * 2 + lean * 0.1, skirt_bottom),
    ]
    draw.polygon(skirt, fill=P["outline"])
    draw.polygon([(x, y + 1) for x, y in skirt], fill=P["skirt"])
    rect(draw, (cx - 8 + s * 2, skirt_top + 3, cx + 8 + s * 2, skirt_top + 6), P["skirt_light"])
    rect(draw, (cx + 7 + s, skirt_top + 3, cx + 10 + s, skirt_bottom - 1), P["skirt_dark"])


def draw_arms(draw, cx, top, row, frame, mode):
    s = side_amount(row)
    walk = [-1, 0, 1][frame] if mode == "walk" else 0
    if mode == "idle_phone":
        arms = [
            [(cx - 10, top + 11), (cx - 7, top + 28), (cx - 3, top + 36)],
            [(cx + 10, top + 11), (cx + 7, top + 28), (cx + 4, top + 36)],
        ]
    else:
        arms = [
            [(cx - 11 + s, top + 9 + walk * 2), (cx - 14 + s, top + 25 + walk * 4), (cx - 9 + s, top + 42 + walk * 2)],
            [(cx + 11 + s, top + 9 - walk * 2), (cx + 14 + s, top + 25 - walk * 4), (cx + 9 + s, top + 42 - walk * 2)],
        ]
    for pts in arms:
        line(draw, pts, P["outline"], 6)
        line(draw, pts[:2], P["jacket_dark"], 4)
        line(draw, pts[1:], P["skin"], 4)
    if mode == "idle_phone" and back_amount(row) < 0.9:
        x = cx + s * 4
        y = top + 31 + [0, -1, 0][frame]
        rect(draw, (x - 5, y - 8, x + 6, y + 7), P["outline"])
        rect(draw, (x - 3, y - 6, x + 4, y + 5), P["phone"])
        rect(draw, (x - 2, y - 5, x + 3, y + 2), P["phone_glow"])


def leg_pose(row, frame, mode):
    s = side_amount(row)
    if mode != "walk":
        return [
            [(-5, 0), (-5 + s, 16), (-7 + s * 2, 34)],
            [(5, 0), (5 + s, 16), (7 + s * 2, 34)],
        ]
    phase = [-1, 0, 1][frame]
    side_stride = 8 * abs(s)
    depth_stride = 6 * (1 - min(abs(s), 0.88))
    direction = 1 if s >= 0 else -1
    return [
        [(-5, 0), (-5 + s * 2 + phase * side_stride * direction * 0.4, 16 + phase * depth_stride * 0.2), (-8 + s * 3 + phase * side_stride * direction, 35 + phase * depth_stride)],
        [(5, 0), (5 + s * 2 - phase * side_stride * direction * 0.4, 16 - phase * depth_stride * 0.2), (8 + s * 3 - phase * side_stride * direction, 35 - phase * depth_stride)],
    ]


def draw_legs(draw, cx, hip_y, row, frame, mode):
    order = leg_pose(row, frame, mode)
    if side_amount(row) < 0:
        order = list(reversed(order))
    for pts in order:
        abs_pts = [(cx + x, hip_y + y) for x, y in pts]
        line(draw, abs_pts, P["outline"], 6)
        line(draw, abs_pts, P["skin"], 4)
        knee = abs_pts[1]
        rect(draw, (knee[0] - 1, knee[1] + 1, knee[0] + 1, knee[1] + 2), P["skin_shadow"])
        foot = abs_pts[-1]
        rect(draw, (foot[0] - 6, foot[1] - 2, foot[0] + 6, foot[1] + 4), P["outline"])
        rect(draw, (foot[0] - 5, foot[1] - 1, foot[0] + 5, foot[1] + 3), P["sneaker"])
        rect(draw, (foot[0] - 5, foot[1] + 2, foot[0] + 5, foot[1] + 4), P["sneaker_dark"])
        rect(draw, (foot[0] + 1, foot[1] - 1, foot[0] + 4, foot[1] + 1), P["sneaker_accent"])


def draw_frame(row, frame, mode):
    image = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    cx = 32
    base_y = 122
    root_y = base_y + ([0, -2, 0][frame] if mode == "walk" else 0)
    top = root_y - 94
    hip_y = top + 56
    shadow(draw, cx, 123, 30)
    draw_legs(draw, cx, hip_y, row, frame, mode)
    draw_torso(draw, cx, top + 6, row, frame, mode)
    draw_arms(draw, cx, top + 7, row, frame, mode)
    draw_head(draw, cx, top - 12, row, frame, mode)
    if back_amount(row) < 0.7:
        s = side_amount(row)
        rect(draw, (cx - 7 + s * 2, top + 20, cx - 5 + s * 2, top + 36), (83, 125, 158, 92))
        rect(draw, (cx + 6 + s * 2, top + 21, cx + 8 + s * 2, top + 36), (4, 8, 14, 115))
    return image


def build_sheet(mode):
    sheet = Image.new("RGBA", (FRAME_W * FRAMES, FRAME_H * ROWS), (0, 0, 0, 0))
    for row in range(ROWS):
        for frame in range(FRAMES):
            sheet.alpha_composite(draw_frame(row, frame, mode), (frame * FRAME_W, row * FRAME_H))
    return sheet


def write_previews(sheets):
    scale = 2
    preview = Image.new("RGB", (FRAME_W * FRAMES * 3 * scale, FRAME_H * ROWS * scale + 24), (17, 21, 29))
    draw = ImageDraw.Draw(preview)
    for block_index, (key, label) in enumerate([("walk", "andar"), ("idle_breathe", "parada"), ("idle_phone", "celular")]):
        x0 = block_index * FRAME_W * FRAMES * scale
        draw.text((x0 + 8, 5), label, fill=(232, 237, 245))
        sheet = sheets[key]
        for row in range(ROWS):
            for frame in range(FRAMES):
                tile = sheet.crop((frame * FRAME_W, row * FRAME_H, (frame + 1) * FRAME_W, (row + 1) * FRAME_H))
                tile = tile.resize((FRAME_W * scale, FRAME_H * scale), Image.Resampling.NEAREST)
                preview.paste(tile, (x0 + frame * FRAME_W * scale, 24 + row * FRAME_H * scale), tile)
    preview.save(PREVIEW)

    female = sheets["idle_breathe"].crop((0, 0, FRAME_W, FRAME_H)).resize((128, 256), Image.Resampling.NEAREST)
    female.save(SELECT_PREVIEW)

    male_sheet = OUT_DIR / "protagonist-idle-breathe-8dir-3f.png"
    if male_sheet.exists():
        male = Image.open(male_sheet).convert("RGBA").crop((0, 0, FRAME_W, FRAME_H)).resize((128, 256), Image.Resampling.NEAREST)
        male.save(MALE_SELECT_PREVIEW)


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    sheets = {key: build_sheet(key) for key in FILES}
    for key, path in FILES.items():
        sheets[key].save(path)
        print(path)
    write_previews(sheets)
    print(PREVIEW)
    print(SELECT_PREVIEW)
    print(MALE_SELECT_PREVIEW)


if __name__ == "__main__":
    main()
