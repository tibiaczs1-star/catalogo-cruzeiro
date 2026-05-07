from pathlib import Path
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets/pubpaid/sprites/protagonist"

FRAME_W = 64
FRAME_H = 128
FRAMES = 3
ROWS = 8

DIRECTIONS = [
    ("south", 90),
    ("south-east", 45),
    ("east", 0),
    ("north-east", -45),
    ("north", -90),
    ("north-west", -135),
    ("west", 180),
    ("south-west", 135),
]

SHEETS = {
    "walk": OUT_DIR / "protagonist-walk-8dir-3f.png",
    "idle_breathe": OUT_DIR / "protagonist-idle-breathe-8dir-3f.png",
    "idle_phone": OUT_DIR / "protagonist-idle-phone-8dir-3f.png",
}
PREVIEW = OUT_DIR / "protagonist-final-3sheet-preview.png"
README = OUT_DIR / "README.md"


PALETTE = {
    "outline": (8, 10, 15, 255),
    "outline_soft": (16, 20, 28, 230),
    "hair_dark": (38, 24, 18, 255),
    "hair_mid": (94, 58, 37, 255),
    "skin": (214, 145, 103, 255),
    "skin_shadow": (143, 84, 63, 255),
    "shirt_dark": (17, 39, 66, 255),
    "shirt": (23, 63, 102, 255),
    "shirt_light": (61, 103, 139, 255),
    "pants_dark": (20, 25, 36, 255),
    "pants": (38, 45, 58, 255),
    "shoe": (35, 24, 22, 255),
    "shoe_light": (83, 52, 38, 255),
    "phone": (16, 23, 32, 255),
    "phone_glow": (92, 224, 255, 210),
}


def clamp(v, lo, hi):
    return max(lo, min(hi, v))


def lerp(a, b, t):
    return a + (b - a) * t


def side_amount(row):
    # 0 front, +1 facing right, -1 facing left. North rows still keep body readable.
    return [0.0, 0.55, 1.0, 0.55, 0.0, -0.55, -1.0, -0.55][row]


def back_amount(row):
    return [0.0, 0.0, 0.12, 0.58, 1.0, 0.58, 0.12, 0.0][row]


def draw_poly(draw, points, fill, outline=None):
    if outline:
        expanded = []
        for x, y in points:
            expanded.append((x, y))
        draw.polygon(expanded, fill=outline)
    draw.polygon(points, fill=fill)


def draw_line(draw, points, fill, width=1):
    draw.line([(round(x), round(y)) for x, y in points], fill=fill, width=width, joint="curve")


def draw_shadow(draw, cx, y, width, alpha):
    draw.ellipse((cx - width / 2, y - 5, cx + width / 2, y + 3), fill=(0, 0, 0, alpha))


def draw_head(draw, cx, cy, row, frame, mode):
    s = side_amount(row)
    b = back_amount(row)
    bob = 0 if mode == "walk" and frame == 1 else ([0, -1, 0][frame] if mode != "idle_phone" else [0, 0, -1][frame])
    x = cx + s * 2
    y = cy + bob

    # Neck and face/hair volume.
    draw.rectangle((x - 5, y + 13, x + 5, y + 23), fill=PALETTE["outline"])
    if b > 0.72:
        draw.rectangle((x - 12, y - 2, x + 12, y + 20), fill=PALETTE["outline"])
        draw.rectangle((x - 10, y, x + 10, y + 18), fill=PALETTE["hair_mid"])
        draw.rectangle((x - 12, y + 4, x + 12, y + 13), fill=PALETTE["hair_dark"])
        draw.rectangle((x - 7, y + 18, x + 7, y + 23), fill=PALETTE["skin_shadow"])
        return

    face_w = lerp(16, 11, abs(s))
    draw.rectangle((x - face_w / 2 - 2, y + 2, x + face_w / 2 + 2, y + 23), fill=PALETTE["outline"])
    draw.rectangle((x - face_w / 2, y + 4, x + face_w / 2, y + 22), fill=PALETTE["skin"])
    draw.rectangle((x - face_w / 2 - 2, y, x + face_w / 2 + 3, y + 9), fill=PALETTE["hair_dark"])
    draw.rectangle((x - face_w / 2 + 1, y - 2, x + face_w / 2 - 1, y + 5), fill=PALETTE["hair_mid"])
    if s <= 0.1:
        eye_left = x - 5
        eye_right = x + 5
    else:
        eye_left = x + s * 1
        eye_right = x + s * 5
    if frame == 2 and mode == "idle_breathe":
        draw.rectangle((eye_left - 1, y + 13, eye_left + 2, y + 14), fill=PALETTE["outline"])
        draw.rectangle((eye_right - 1, y + 13, eye_right + 2, y + 14), fill=PALETTE["outline"])
    else:
        draw.rectangle((eye_left - 1, y + 12, eye_left + 1, y + 15), fill=PALETTE["outline"])
        draw.rectangle((eye_right - 1, y + 12, eye_right + 1, y + 15), fill=PALETTE["outline"])
    mouth_x = x + s * 3
    draw.rectangle((mouth_x - 3, y + 19, mouth_x + 3, y + 20), fill=PALETTE["skin_shadow"])


def body_points(cx, top, row, frame, mode):
    s = side_amount(row)
    b = back_amount(row)
    breathe = [0, -1, 0][frame] if mode == "idle_breathe" else 0
    lean = s * 2 if mode == "walk" else s
    shoulder_y = top + breathe
    waist_y = top + 42
    shoulder_half = lerp(13, 10, abs(s))
    waist_half = lerp(9, 7, abs(s))
    if b > 0.55:
        shoulder_half += 1
    return [
        (cx - shoulder_half + lean, shoulder_y),
        (cx + shoulder_half + lean, shoulder_y),
        (cx + waist_half - s, waist_y),
        (cx - waist_half - s, waist_y),
    ]


def draw_torso(draw, cx, top, row, frame, mode):
    points = body_points(cx, top, row, frame, mode)
    outline = [(x + (0 if i % 2 else -1), y) for i, (x, y) in enumerate(points)]
    draw.polygon(outline, fill=PALETTE["outline"])
    draw.polygon(points, fill=PALETTE["shirt"])
    s = side_amount(row)
    b = back_amount(row)
    if b < 0.65:
        collar_x = cx + s * 4
        draw.polygon([(collar_x - 5, top + 4), (collar_x + 1, top + 17), (collar_x - 1, top + 30), (collar_x - 8, top + 9)], fill=PALETTE["shirt_dark"])
        draw.polygon([(collar_x + 5, top + 4), (collar_x + 1, top + 17), (collar_x + 1, top + 30), (collar_x + 8, top + 9)], fill=PALETTE["shirt_light"])
        draw.rectangle((collar_x - 2, top + 7, collar_x + 2, top + 14), fill=PALETTE["skin"])
    else:
        draw.rectangle((cx - 9, top + 5, cx + 9, top + 34), fill=PALETTE["shirt_dark"])
        draw.rectangle((cx - 2, top + 6, cx + 2, top + 39), fill=PALETTE["shirt"])


def arm_positions(cx, top, row, frame, mode):
    s = side_amount(row)
    walk = [-1, 0, 1][frame] if mode == "walk" else 0
    if mode == "idle_phone":
        return {
            "left": [(cx - 12, top + 12), (cx - 8, top + 30), (cx - 4, top + 39)],
            "right": [(cx + 12, top + 12), (cx + 7, top + 31), (cx + 3, top + 39)],
        }
    return {
        "left": [(cx - 13 + s, top + 10 + walk * 2), (cx - 16 + s, top + 29 + walk * 4), (cx - 11 + s, top + 47 + walk * 2)],
        "right": [(cx + 13 + s, top + 10 - walk * 2), (cx + 16 + s, top + 29 - walk * 4), (cx + 11 + s, top + 47 - walk * 2)],
    }


def draw_arms(draw, cx, top, row, frame, mode):
    arms = arm_positions(cx, top, row, frame, mode)
    for name, pts in arms.items():
        draw_line(draw, pts, PALETTE["outline"], width=7)
        draw_line(draw, pts[:2], PALETTE["shirt_dark"], width=5)
        draw_line(draw, pts[1:], PALETTE["skin"], width=4)

    if mode == "idle_phone":
        s = side_amount(row)
        phone_x = cx + s * 4
        phone_y = top + 33 + [0, -1, 0][frame]
        if back_amount(row) < 0.9:
            draw.rectangle((phone_x - 6, phone_y - 10, phone_x + 7, phone_y + 8), fill=PALETTE["outline"])
            draw.rectangle((phone_x - 4, phone_y - 8, phone_x + 5, phone_y + 6), fill=PALETTE["phone"])
            draw.rectangle((phone_x - 3, phone_y - 7, phone_x + 4, phone_y + 3), fill=PALETTE["phone_glow"])
            draw.rectangle((phone_x - 2, phone_y + 5, phone_x + 2, phone_y + 6), fill=(42, 54, 68, 255))


def leg_pose(row, frame, mode):
    s = side_amount(row)
    b = back_amount(row)
    if mode != "walk":
        return {
            "left": {"hip": (-6, 0), "knee": (-7 + s * 1, 23), "foot": (-9 + s * 2, 48)},
            "right": {"hip": (6, 0), "knee": (7 + s * 1, 23), "foot": (9 + s * 2, 48)},
        }
    # 3-frame RPG walk: contact A, passing, contact B. Front/back use y stride; side uses x stride.
    phase = [-1, 0, 1][frame]
    side_stride = 9 * abs(s)
    depth_stride = 8 * (1 - min(abs(s), 0.88))
    left_forward = phase
    right_forward = -phase
    return {
        "left": {
            "hip": (-6, 0),
            "knee": (-7 + s * 2 + left_forward * side_stride * (1 if s >= 0 else -1) * 0.45, 24 + left_forward * depth_stride * 0.2),
            "foot": (-9 + s * 3 + left_forward * side_stride * (1 if s >= 0 else -1), 49 + left_forward * depth_stride),
        },
        "right": {
            "hip": (6, 0),
            "knee": (7 + s * 2 + right_forward * side_stride * (1 if s >= 0 else -1) * 0.45, 24 + right_forward * depth_stride * 0.2),
            "foot": (9 + s * 3 + right_forward * side_stride * (1 if s >= 0 else -1), 49 + right_forward * depth_stride),
        },
    }


def draw_legs(draw, cx, hip_y, row, frame, mode):
    pose = leg_pose(row, frame, mode)
    # Draw far leg first based on facing side.
    order = ["left", "right"] if side_amount(row) >= 0 else ["right", "left"]
    for leg in order:
        data = pose[leg]
        hip = (cx + data["hip"][0], hip_y + data["hip"][1])
        knee = (cx + data["knee"][0], hip_y + data["knee"][1])
        foot = (cx + data["foot"][0], hip_y + data["foot"][1])
        draw_line(draw, [hip, knee, foot], PALETTE["outline"], width=8)
        draw_line(draw, [hip, knee, foot], PALETTE["pants"], width=5)
        shoe_w = 11 if mode == "walk" else 9
        draw.rectangle((foot[0] - shoe_w / 2, foot[1] - 2, foot[0] + shoe_w / 2, foot[1] + 4), fill=PALETTE["outline"])
        draw.rectangle((foot[0] - shoe_w / 2 + 1, foot[1] - 1, foot[0] + shoe_w / 2 - 1, foot[1] + 3), fill=PALETTE["shoe"])
        draw.rectangle((foot[0] - 2, foot[1] - 1, foot[0] + 3, foot[1]), fill=PALETTE["shoe_light"])


def draw_frame(row, frame, mode):
    image = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    cx = 32
    base_y = 122
    walk_bob = [0, -2, 0][frame] if mode == "walk" else 0
    breathe_bob = [0, -1, 0][frame] if mode == "idle_breathe" else 0
    phone_bob = [0, 0, -1][frame] if mode == "idle_phone" else 0
    root_y = base_y + walk_bob + breathe_bob + phone_bob
    top = root_y - 95
    hip_y = top + 43

    draw_shadow(draw, cx, 123, 33 if mode == "walk" else 29, 58)
    draw_legs(draw, cx, hip_y, row, frame, mode)
    draw_torso(draw, cx, top + 6, row, frame, mode)
    draw_arms(draw, cx, top + 7, row, frame, mode)
    draw_head(draw, cx, top - 13, row, frame, mode)

    # Pixel-level highlights to bring it closer to the adult/fashion reference.
    s = side_amount(row)
    if back_amount(row) < 0.7:
        draw.rectangle((cx - 7 + s * 2, top + 14, cx - 4 + s * 2, top + 45), fill=(83, 125, 158, 92))
        draw.rectangle((cx + 6 + s * 2, top + 16, cx + 8 + s * 2, top + 42), fill=(4, 8, 14, 115))
    return image


def build_sheet(mode):
    sheet = Image.new("RGBA", (FRAME_W * FRAMES, FRAME_H * ROWS), (0, 0, 0, 0))
    for row in range(ROWS):
        for frame in range(FRAMES):
            sheet.alpha_composite(draw_frame(row, frame, mode), (frame * FRAME_W, row * FRAME_H))
    return sheet


def build_preview(sheets):
    scale = 2
    label_h = 24
    block_w = FRAME_W * FRAMES * scale
    block_h = (FRAME_H * ROWS * scale) + label_h
    preview = Image.new("RGB", (block_w * 3, block_h), (18, 22, 29))
    draw = ImageDraw.Draw(preview)
    labels = [
        ("walk", "andar: passo A / passagem / passo B"),
        ("idle_breathe", "idle: respirando"),
        ("idle_phone", "idle: celular"),
    ]
    for block_index, (key, label) in enumerate(labels):
        x0 = block_index * block_w
        draw.text((x0 + 8, 5), label, fill=(230, 235, 242))
        sheet = sheets[key]
        for row in range(ROWS):
            for frame in range(FRAMES):
                tile = sheet.crop((frame * FRAME_W, row * FRAME_H, (frame + 1) * FRAME_W, (row + 1) * FRAME_H))
                tile = tile.resize((FRAME_W * scale, FRAME_H * scale), Image.Resampling.NEAREST)
                x = x0 + frame * FRAME_W * scale
                y = label_h + row * FRAME_H * scale
                draw.rectangle((x + 3, y + 3, x + FRAME_W * scale - 3, y + FRAME_H * scale - 3), fill=(27, 33, 42), outline=(76, 87, 104))
                preview.paste(tile, (x, y), tile)
    preview.save(PREVIEW)


def write_readme():
    README.write_text(
        "# Protagonista PubPaid 2.0\n\n"
        "Pacote final local V1 baseado no personagem atual, com movimento real de pernas.\n\n"
        "- `protagonist-walk-8dir-3f.png`: 8 direcoes x 3 frames, frame 64x128.\n"
        "- `protagonist-idle-breathe-8dir-3f.png`: 8 direcoes x 3 frames de respiracao.\n"
        "- `protagonist-idle-phone-8dir-3f.png`: 8 direcoes x 3 frames mexendo no celular.\n"
        "- `protagonist-final-3sheet-preview.png`: preview de revisao.\n\n"
        "Layout de linhas: sul, sudeste, leste, nordeste, norte, noroeste, oeste, sudoeste.\n"
        "Layout de colunas: contato A, passagem/peso central, contato B.\n",
        encoding="utf-8",
    )


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    sheets = {
        "walk": build_sheet("walk"),
        "idle_breathe": build_sheet("idle_breathe"),
        "idle_phone": build_sheet("idle_phone"),
    }
    for key, sheet in sheets.items():
        sheet.save(SHEETS[key])
        print(SHEETS[key])
    build_preview(sheets)
    write_readme()
    print(PREVIEW)


if __name__ == "__main__":
    main()
