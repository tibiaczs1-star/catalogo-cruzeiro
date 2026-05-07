from pathlib import Path
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets/pubpaid/sprites/protagonist"

FRAME_W = 96
FRAME_H = 144
FRAMES = 4
ROWS = 8

FILES = {
    "walk": OUT_DIR / "protagonist-female-32bit-walk-8dir-4f.png",
    "idle_breathe": OUT_DIR / "protagonist-female-32bit-idle-breathe-8dir-4f.png",
    "idle_phone": OUT_DIR / "protagonist-female-32bit-idle-phone-8dir-4f.png",
}
PREVIEW = OUT_DIR / "protagonist-female-32bit-approval-preview.png"
SELECT_PREVIEW = OUT_DIR / "protagonist-female-32bit-selection-preview.png"

P = {
    "outline": (8, 10, 14, 255),
    "outline_soft": (18, 22, 30, 255),
    "hair_deep": (19, 16, 14, 255),
    "hair_dark": (38, 28, 22, 255),
    "hair": (77, 50, 32, 255),
    "hair_light": (142, 89, 48, 255),
    "skin_dark": (94, 52, 37, 255),
    "skin_shadow": (130, 73, 49, 255),
    "skin": (181, 109, 72, 255),
    "skin_light": (222, 148, 91, 255),
    "denim_deep": (11, 25, 43, 255),
    "denim_dark": (20, 48, 78, 255),
    "denim": (35, 77, 116, 255),
    "denim_light": (79, 121, 158, 255),
    "shirt_shadow": (176, 174, 164, 255),
    "shirt": (239, 235, 221, 255),
    "skirt_deep": (14, 18, 26, 255),
    "skirt_dark": (25, 31, 44, 255),
    "skirt": (48, 58, 78, 255),
    "skirt_light": (83, 94, 118, 255),
    "shoe_deep": (15, 18, 21, 255),
    "shoe": (228, 226, 214, 255),
    "shoe_shadow": (148, 150, 146, 255),
    "shoe_blue": (58, 87, 120, 255),
    "phone": (16, 22, 30, 255),
    "phone_edge": (52, 66, 80, 255),
    "phone_glow": (81, 187, 217, 210),
}


def side_amount(row):
    return [0.0, 0.55, 1.0, 0.55, 0.0, -0.55, -1.0, -0.55][row]


def back_amount(row):
    return [0.0, 0.0, 0.12, 0.58, 1.0, 0.58, 0.12, 0.0][row]


def rect(draw, box, fill):
    x0, y0, x1, y1 = (round(v) for v in box)
    draw.rectangle((min(x0, x1), min(y0, y1), max(x0, x1), max(y0, y1)), fill=fill)


def line(draw, pts, fill, width):
    draw.line([(round(x), round(y)) for x, y in pts], fill=fill, width=width, joint="curve")


def polygon(draw, pts, fill):
    draw.polygon([(round(x), round(y)) for x, y in pts], fill=fill)


def ellipse(draw, box, fill):
    draw.ellipse(tuple(round(v) for v in box), fill=fill)


def draw_shadow(draw, cx, y, w):
    ellipse(draw, (cx - w / 2, y - 4, cx + w / 2, y + 4), (0, 0, 0, 58))


def draw_curl(draw, x, y, r, fill):
    ellipse(draw, (x - r, y - r, x + r, y + r), P["outline"])
    ellipse(draw, (x - r + 1, y - r + 1, x + r - 1, y + r - 1), fill)
    if r >= 3:
        rect(draw, (x - 1, y - 1, x + 1, y + 1), P["hair_light"])


def draw_hair(draw, cx, y, row, frame, mode):
    s = side_amount(row)
    b = back_amount(row)
    bob = -1 if mode == "idle_breathe" and frame in (1, 2) else 0
    x = cx + s * 2
    y += bob
    curls = [
        (-13, 2, 3), (-8, -4, 4), (-2, -7, 4), (5, -6, 4), (11, -2, 3),
        (-17, 8, 3), (16, 8, 3), (-17, 16, 3), (17, 16, 3),
        (-14, 25, 3), (13, 25, 3), (-8, 31, 3), (6, 31, 3),
    ]
    if b > 0.72:
        curls.extend([(-12, 35, 3), (0, 37, 3), (12, 35, 3)])
    for dx, dy, r in curls:
        if abs(s) > 0.8 and dx * s < -5:
            continue
        fill = P["hair_deep"] if dy > 20 or b > 0.72 else P["hair"]
        draw_curl(draw, x + dx, y + dy, r, fill)
    rect(draw, (x - 10, y - 2, x + 10, y + 10), P["hair_dark"])
    rect(draw, (x - 7, y - 4, x + 7, y + 4), P["hair"])
    rect(draw, (x - 5, y - 4, x + 3, y - 2), P["hair_light"])


def draw_head(draw, cx, top, row, frame, mode):
    s = side_amount(row)
    b = back_amount(row)
    bob = -1 if mode == "idle_breathe" and frame in (1, 2) else 0
    x = cx + s * 2
    y = top + bob
    draw_hair(draw, cx, y, row, frame, mode)
    if b > 0.72:
        rect(draw, (x - 8, y + 8, x + 8, y + 24), P["hair_deep"])
        rect(draw, (x - 4, y + 24, x + 4, y + 34), P["skin_shadow"])
        return
    face_w = 15 - abs(s) * 5
    rect(draw, (x - face_w / 2 - 2, y + 4, x + face_w / 2 + 2, y + 26), P["outline"])
    rect(draw, (x - face_w / 2, y + 6, x + face_w / 2, y + 24), P["skin"])
    rect(draw, (x - face_w / 2 + 1, y + 7, x + face_w / 2 - 2, y + 11), P["skin_light"])
    rect(draw, (x - face_w / 2 - 1, y + 3, x + face_w / 2 + 2, y + 11), P["hair_dark"])
    if abs(s) < 0.75:
        rect(draw, (x - 5, y + 15, x - 3, y + 18), P["outline"])
        rect(draw, (x + 4, y + 15, x + 6, y + 18), P["outline"])
        rect(draw, (x - 3, y + 22, x + 3, y + 23), P["skin_dark"])
    else:
        rect(draw, (x + s * 1, y + 15, x + s * 4, y + 18), P["outline"])
        rect(draw, (x + s * 1, y + 22, x + s * 4, y + 23), P["skin_dark"])
    rect(draw, (x - 4, y + 27, x + 4, y + 37), P["outline"])
    rect(draw, (x - 3, y + 27, x + 3, y + 36), P["skin"])
    rect(draw, (x - 2, y + 27, x + 2, y + 30), P["skin_light"])


def draw_torso_and_skirt(draw, cx, top, row, frame, mode):
    s = side_amount(row)
    b = back_amount(row)
    breathe = -1 if mode == "idle_breathe" and frame in (1, 2) else 0
    lean = s * 2 if mode == "walk" else s
    shoulder = 14 - abs(s) * 2.2
    waist = 9 - abs(s) * 1.2
    center = cx + s * 3 + lean * 0.25

    jacket = [
        (cx - shoulder + lean, top + breathe),
        (cx + shoulder + lean, top + breathe),
        (cx + waist + lean * 0.25, top + 39),
        (cx - waist + lean * 0.25, top + 39),
    ]
    polygon(draw, jacket, P["outline"])
    polygon(draw, [(x + (1 if x < cx else -1), y + 2) for x, y in jacket], P["denim"])
    if b < 0.7:
        polygon(draw, [(center - 7, top + 6), (center, top + 17), (center - 4, top + 38), (center - 11, top + 12)], P["denim_deep"])
        polygon(draw, [(center + 7, top + 6), (center, top + 17), (center + 4, top + 38), (center + 11, top + 12)], P["denim_light"])
        rect(draw, (center - 5, top + 9, center + 5, top + 42), P["shirt"])
        rect(draw, (center - 3, top + 31, center + 4, top + 42), P["shirt_shadow"])
        rect(draw, (center - 3, top + 8, center + 2, top + 12), P["skin_light"])
    else:
        rect(draw, (cx - 10, top + 6, cx + 10, top + 36), P["denim_deep"])
        rect(draw, (cx - 2, top + 8, cx + 2, top + 37), P["denim_light"])

    for x_offset in (-10, 9):
        rect(draw, (cx + x_offset + lean * 0.2, top + 12, cx + x_offset + 2 + lean * 0.2, top + 34), P["denim_dark"])

    skirt_top = top + 40
    skirt_bottom = top + 58
    skirt = [
        (cx - 11 + lean * 0.1, skirt_top),
        (cx + 11 + lean * 0.1, skirt_top),
        (cx + 15 + lean * 0.1 - abs(s) * 2, skirt_bottom),
        (cx - 15 + lean * 0.1 - abs(s) * 2, skirt_bottom),
    ]
    polygon(draw, skirt, P["outline"])
    polygon(draw, [(x, y + 1) for x, y in skirt], P["skirt"])
    rect(draw, (cx - 10 + s * 2, skirt_top + 3, cx + 8 + s * 2, skirt_top + 7), P["skirt_light"])
    rect(draw, (cx + 9 + s, skirt_top + 3, cx + 13 + s, skirt_bottom - 1), P["skirt_deep"])
    rect(draw, (cx - 13 + s, skirt_bottom - 2, cx + 13 + s, skirt_bottom + 1), P["skirt_dark"])


def draw_arms(draw, cx, top, row, frame, mode):
    s = side_amount(row)
    phase = [-1, 0, 1, 0][frame] if mode == "walk" else 0
    if mode == "idle_phone":
        progress = frame / 3
        left = [(cx - 13, top + 13), (cx - 9, top + 30), (cx - 4 + progress * 2, top + 43 - progress * 8)]
        right = [(cx + 13, top + 13), (cx + 10, top + 30 - progress * 2), (cx + 5 + progress * 4, top + 43 - progress * 11)]
    else:
        left = [(cx - 14 + s, top + 11 + phase * 2), (cx - 18 + s, top + 29 + phase * 5), (cx - 12 + s, top + 48 + phase * 2)]
        right = [(cx + 14 + s, top + 11 - phase * 2), (cx + 18 + s, top + 29 - phase * 5), (cx + 12 + s, top + 48 - phase * 2)]
    for pts in (left, right):
        line(draw, pts, P["outline"], 7)
        line(draw, pts[:2], P["denim_deep"], 5)
        line(draw, pts[1:], P["skin"], 4)
        hand = pts[-1]
        rect(draw, (hand[0] - 2, hand[1] - 1, hand[0] + 2, hand[1] + 3), P["skin_light"])
    if mode == "idle_phone" and back_amount(row) < 0.9:
        progress = frame / 3
        phone_x = cx + s * 5 + 4 * progress
        phone_y = top + 42 - progress * 12
        rect(draw, (phone_x - 5, phone_y - 8, phone_x + 6, phone_y + 8), P["outline"])
        rect(draw, (phone_x - 3, phone_y - 6, phone_x + 4, phone_y + 6), P["phone"])
        rect(draw, (phone_x - 2, phone_y - 5, phone_x + 3, phone_y + 3), P["phone_glow"])
        rect(draw, (phone_x + 4, phone_y - 6, phone_x + 5, phone_y + 6), P["phone_edge"])


def leg_pose(row, frame, mode):
    s = side_amount(row)
    if mode != "walk":
        return [
            [(-6, 0), (-7 + s, 20), (-9 + s * 2, 43)],
            [(6, 0), (7 + s, 20), (9 + s * 2, 43)],
        ]
    phase = [-1, 0, 1, 0][frame]
    side_stride = 11 * abs(s)
    depth_stride = 7 * (1 - min(abs(s), 0.88))
    direction = 1 if s >= 0 else -1
    return [
        [(-6, 0), (-7 + s * 2 + phase * side_stride * direction * 0.45, 20 + phase * depth_stride * 0.3), (-10 + s * 3 + phase * side_stride * direction, 44 + phase * depth_stride)],
        [(6, 0), (7 + s * 2 - phase * side_stride * direction * 0.45, 20 - phase * depth_stride * 0.3), (10 + s * 3 - phase * side_stride * direction, 44 - phase * depth_stride)],
    ]


def draw_legs(draw, cx, hip_y, row, frame, mode):
    pose = leg_pose(row, frame, mode)
    if side_amount(row) < 0:
        pose = list(reversed(pose))
    for pts in pose:
        abs_pts = [(cx + x, hip_y + y) for x, y in pts]
        line(draw, abs_pts, P["outline"], 7)
        line(draw, abs_pts, P["skin"], 5)
        knee = abs_pts[1]
        rect(draw, (knee[0] - 2, knee[1] + 1, knee[0] + 2, knee[1] + 2), P["skin_shadow"])
        foot = abs_pts[-1]
        rect(draw, (foot[0] - 8, foot[1] - 3, foot[0] + 8, foot[1] + 5), P["outline"])
        rect(draw, (foot[0] - 7, foot[1] - 2, foot[0] + 7, foot[1] + 3), P["shoe"])
        rect(draw, (foot[0] - 7, foot[1] + 3, foot[0] + 7, foot[1] + 5), P["shoe_deep"])
        rect(draw, (foot[0] + 1, foot[1] - 2, foot[0] + 5, foot[1]), P["shoe_blue"])
        rect(draw, (foot[0] - 5, foot[1] - 1, foot[0] - 1, foot[1]), P["shoe_shadow"])


def draw_frame(row, frame, mode):
    image = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    cx = 48
    base_y = 137
    walk_bob = [-1, -2, -1, 0][frame] if mode == "walk" else 0
    breathe_bob = -1 if mode == "idle_breathe" and frame in (1, 2) else 0
    phone_bob = -1 if mode == "idle_phone" and frame == 3 else 0
    root_y = base_y + walk_bob + breathe_bob + phone_bob
    top = root_y - 104
    hip_y = top + 62
    draw_shadow(draw, cx, 138, 44 if mode == "walk" else 38)
    draw_legs(draw, cx, hip_y, row, frame, mode)
    draw_torso_and_skirt(draw, cx, top + 13, row, frame, mode)
    draw_arms(draw, cx, top + 15, row, frame, mode)
    draw_head(draw, cx, top - 2, row, frame, mode)
    return image


def build_sheet(mode):
    sheet = Image.new("RGBA", (FRAME_W * FRAMES, FRAME_H * ROWS), (0, 0, 0, 0))
    for row in range(ROWS):
        for frame in range(FRAMES):
            sheet.alpha_composite(draw_frame(row, frame, mode), (frame * FRAME_W, row * FRAME_H))
    return sheet


def write_preview(sheets):
    label_h = 24
    block_w = FRAME_W * FRAMES
    block_h = FRAME_H * ROWS + label_h
    preview = Image.new("RGB", (block_w * 3, block_h), (18, 22, 29))
    draw = ImageDraw.Draw(preview)
    labels = [
        ("walk", "andar 32-bit: 4 frames"),
        ("idle_breathe", "parada: respiracao"),
        ("idle_phone", "celular: puxa do bolso"),
    ]
    for block, (key, label) in enumerate(labels):
        x0 = block * block_w
        draw.text((x0 + 8, 6), label, fill=(235, 240, 246))
        sheet = sheets[key]
        for row in range(ROWS):
            for frame in range(FRAMES):
                tile = sheet.crop((frame * FRAME_W, row * FRAME_H, (frame + 1) * FRAME_W, (row + 1) * FRAME_H))
                preview.paste(tile, (x0 + frame * FRAME_W, label_h + row * FRAME_H), tile)
    preview.save(PREVIEW)
    selection = sheets["idle_breathe"].crop((0, 0, FRAME_W, FRAME_H)).resize((192, 288), Image.Resampling.NEAREST)
    selection.save(SELECT_PREVIEW)


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    sheets = {key: build_sheet(key) for key in FILES}
    for key, path in FILES.items():
        sheets[key].save(path)
        print(path)
    write_preview(sheets)
    print(PREVIEW)
    print(SELECT_PREVIEW)


if __name__ == "__main__":
    main()
