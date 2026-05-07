from pathlib import Path
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets/pubpaid/sprites/protagonist"
OUT = OUT_DIR / "protagonist-beauty-prototype-32bit-v1.png"
PREVIEW = OUT_DIR / "protagonist-beauty-prototype-32bit-v1-preview.png"

SLOT_W = 128
SLOT_H = 192

P = {
    "outline": (6, 8, 13, 255),
    "outline2": (15, 18, 25, 255),
    "hair0": (30, 20, 16, 255),
    "hair1": (76, 44, 29, 255),
    "hair2": (117, 72, 45, 255),
    "skin0": (105, 61, 50, 255),
    "skin1": (177, 104, 78, 255),
    "skin2": (225, 151, 103, 255),
    "skin3": (247, 181, 132, 255),
    "shirt0": (10, 23, 40, 255),
    "shirt1": (13, 42, 72, 255),
    "shirt2": (24, 72, 116, 255),
    "shirt3": (67, 129, 170, 255),
    "inner0": (120, 132, 143, 255),
    "inner1": (184, 184, 172, 255),
    "pants0": (11, 15, 23, 255),
    "pants1": (24, 31, 44, 255),
    "pants2": (48, 57, 72, 255),
    "shoe0": (18, 14, 13, 255),
    "shoe1": (75, 46, 34, 255),
    "metal": (135, 156, 169, 255),
}


def px(draw, box, fill):
    draw.rectangle(tuple(round(v) for v in box), fill=fill)


def line(draw, points, fill, width=1):
    draw.line([(round(x), round(y)) for x, y in points], fill=fill, width=width, joint="curve")


def ellipse(draw, box, fill):
    draw.ellipse(tuple(round(v) for v in box), fill=fill)


def body_metrics(cx, base, view):
    side = {"front": 0, "three": 0.45, "side": 1, "back": 0}[view]
    return {
        "cx": cx,
        "base": base,
        "side": side,
        "head_y": base - 156,
        "torso_y": base - 110,
        "hip_y": base - 61,
        "knee_y": base - 32,
    }


def draw_shadow(draw, cx, base, view):
    w = 54 if view != "side" else 42
    ellipse(draw, (cx - w, base - 8, cx + w, base + 5), (0, 0, 0, 70))
    ellipse(draw, (cx - w * 0.72, base - 6, cx + w * 0.72, base + 3), (0, 0, 0, 95))


def draw_head(draw, m, view):
    cx = m["cx"]
    y = m["head_y"]
    side = m["side"]
    back = view == "back"
    if back:
        px(draw, (cx - 19, y + 3, cx + 19, y + 34), P["outline"])
        px(draw, (cx - 17, y + 5, cx + 17, y + 31), P["hair1"])
        px(draw, (cx - 20, y + 9, cx + 20, y + 20), P["hair0"])
        px(draw, (cx - 11, y + 29, cx + 11, y + 38), P["skin0"])
        px(draw, (cx - 7, y + 31, cx + 7, y + 42), P["skin1"])
        px(draw, (cx - 11, y + 5, cx + 9, y + 8), P["hair2"])
        return

    face_w = 28 - side * 9
    face_x = cx + side * 4
    px(draw, (face_x - face_w / 2 - 3, y + 5, face_x + face_w / 2 + 3, y + 40), P["outline"])
    px(draw, (face_x - face_w / 2, y + 8, face_x + face_w / 2, y + 38), P["skin2"])
    px(draw, (face_x - face_w / 2 + 2, y + 10, face_x + face_w / 2 - 3, y + 22), P["skin3"])
    px(draw, (face_x + face_w / 2 - 5, y + 23, face_x + face_w / 2, y + 36), P["skin1"])
    px(draw, (face_x - face_w / 2 - 3, y + 2, face_x + face_w / 2 + 5, y + 17), P["hair0"])
    px(draw, (face_x - face_w / 2, y - 2, face_x + face_w / 2 - 4, y + 9), P["hair1"])
    px(draw, (face_x - face_w / 2 + 5, y - 1, face_x + face_w / 2 - 9, y + 4), P["hair2"])
    if view == "side":
        px(draw, (face_x + 3, y + 19, face_x + 7, y + 23), P["outline"])
        px(draw, (face_x + 4, y + 20, face_x + 8, y + 22), P["skin1"])
        px(draw, (face_x + 1, y + 29, face_x + 7, y + 31), P["skin0"])
        px(draw, (face_x - 4, y + 20, face_x - 1, y + 24), P["outline"])
    else:
        px(draw, (face_x - 9, y + 21, face_x - 5, y + 26), P["outline"])
        px(draw, (face_x + 5, y + 21, face_x + 9, y + 26), P["outline"])
        px(draw, (face_x - 7, y + 32, face_x + 7, y + 34), P["skin0"])
        px(draw, (face_x - 10, y + 18, face_x - 4, y + 19), P["hair0"])
        px(draw, (face_x + 4, y + 18, face_x + 10, y + 19), P["hair0"])
    px(draw, (cx - 8, y + 39, cx + 8, y + 51), P["outline"])
    px(draw, (cx - 6, y + 39, cx + 6, y + 50), P["skin1"])


def draw_torso(draw, m, view):
    cx = m["cx"]
    y = m["torso_y"]
    side = m["side"]
    back = view == "back"
    shoulder = 25 - side * 7
    waist = 18 - side * 5
    lean = side * 5
    body = [
        (cx - shoulder + lean, y),
        (cx + shoulder + lean, y),
        (cx + waist + lean - 3, y + 60),
        (cx - waist + lean - 3, y + 60),
    ]
    draw.polygon(body, fill=P["outline"])
    inner = [
        (cx - shoulder + 3 + lean, y + 4),
        (cx + shoulder - 3 + lean, y + 4),
        (cx + waist - 3 + lean - 3, y + 56),
        (cx - waist + 3 + lean - 3, y + 56),
    ]
    draw.polygon(inner, fill=P["shirt1"])
    if back:
        px(draw, (cx - 18, y + 8, cx + 18, y + 55), P["shirt2"])
        px(draw, (cx - 4, y + 10, cx + 4, y + 56), P["shirt3"])
        px(draw, (cx - 21, y + 2, cx + 21, y + 9), P["shirt0"])
        return
    lapel_x = cx + lean - 1
    draw.polygon([(lapel_x - 17, y + 5), (lapel_x - 3, y + 26), (lapel_x - 7, y + 55), (lapel_x - 22, y + 12)], fill=P["shirt0"])
    draw.polygon([(lapel_x + 17, y + 5), (lapel_x + 3, y + 26), (lapel_x + 5, y + 55), (lapel_x + 22, y + 12)], fill=P["shirt2"])
    draw.polygon([(lapel_x - 5, y + 9), (lapel_x + 5, y + 9), (lapel_x + 9, y + 58), (lapel_x - 9, y + 58)], fill=P["inner0"])
    px(draw, (lapel_x - 3, y + 12, lapel_x + 3, y + 35), P["inner1"])
    px(draw, (lapel_x - 24, y + 17, lapel_x - 21, y + 52), P["shirt3"])
    px(draw, (lapel_x + 17, y + 20, lapel_x + 20, y + 50), P["shirt0"])
    px(draw, (lapel_x - 1, y + 38, lapel_x + 2, y + 42), P["metal"])
    px(draw, (lapel_x - 1, y + 49, lapel_x + 2, y + 53), P["metal"])


def draw_arms(draw, m, view):
    cx = m["cx"]
    y = m["torso_y"]
    side = m["side"]
    back = view == "back"
    if view == "side":
        line(draw, [(cx + 20, y + 8), (cx + 24, y + 43), (cx + 18, y + 76)], P["outline"], 11)
        line(draw, [(cx + 20, y + 8), (cx + 23, y + 43)], P["shirt0"], 7)
        line(draw, [(cx + 23, y + 43), (cx + 18, y + 76)], P["skin2"], 6)
        px(draw, (cx + 14, y + 73, cx + 22, y + 82), P["skin1"])
        return
    left = [(cx - 24 + side * 4, y + 7), (cx - 32 + side * 4, y + 42), (cx - 24 + side * 4, y + 78)]
    right = [(cx + 24 + side * 4, y + 7), (cx + 31 + side * 4, y + 41), (cx + 22 + side * 4, y + 78)]
    for pts, cuff in [(left, -1), (right, 1)]:
        line(draw, pts, P["outline"], 11)
        line(draw, pts[:2], P["shirt0" if cuff < 0 else "shirt2"], 7)
        line(draw, pts[1:], P["skin2" if not back else "skin1"], 6)
        px(draw, (pts[-1][0] - 5, pts[-1][1] - 2, pts[-1][0] + 5, pts[-1][1] + 8), P["skin1"])


def draw_legs(draw, m, view):
    cx = m["cx"]
    hip_y = m["hip_y"]
    side = m["side"]
    back = view == "back"
    if view == "side":
        legs = [
            [(cx - 4, hip_y), (cx - 6, hip_y + 39), (cx - 11, hip_y + 89)],
            [(cx + 7, hip_y + 1), (cx + 10, hip_y + 38), (cx + 17, hip_y + 88)],
        ]
    else:
        legs = [
            [(cx - 13 + side * 3, hip_y), (cx - 16 + side * 2, hip_y + 42), (cx - 22 + side * 2, hip_y + 88)],
            [(cx + 12 + side * 3, hip_y), (cx + 15 + side * 2, hip_y + 42), (cx + 19 + side * 2, hip_y + 88)],
        ]
    for i, pts in enumerate(legs):
        line(draw, pts, P["outline"], 12)
        line(draw, pts, P["pants1"], 8)
        line(draw, [pts[0], pts[1]], P["pants2" if i == 1 and not back else "pants0"], 4)
        foot = pts[-1]
        shoe_w = 22 if view != "side" else 19
        px(draw, (foot[0] - shoe_w / 2, foot[1] - 2, foot[0] + shoe_w / 2, foot[1] + 7), P["outline"])
        px(draw, (foot[0] - shoe_w / 2 + 2, foot[1], foot[0] + shoe_w / 2 - 2, foot[1] + 5), P["shoe0"])
        px(draw, (foot[0] - 3, foot[1], foot[0] + 7, foot[1] + 2), P["shoe1"])


def draw_model(view):
    image = Image.new("RGBA", (SLOT_W, SLOT_H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    m = body_metrics(SLOT_W // 2, 180, view)
    draw_shadow(draw, m["cx"], m["base"], view)
    draw_legs(draw, m, view)
    draw_torso(draw, m, view)
    draw_arms(draw, m, view)
    draw_head(draw, m, view)
    return image


def build_assets():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    views = [("front", "frente"), ("three", "3/4"), ("side", "lado"), ("back", "costas")]
    sheet = Image.new("RGBA", (SLOT_W * len(views), SLOT_H), (0, 0, 0, 0))
    for i, (view, _label) in enumerate(views):
        model = draw_model(view)
        sheet.alpha_composite(model, (i * SLOT_W, 0))
    sheet.save(OUT)

    preview = Image.new("RGB", (sheet.width, sheet.height + 28), (17, 20, 28))
    preview_draw = ImageDraw.Draw(preview)
    for i, (_view, label) in enumerate(views):
        x = i * SLOT_W
        preview_draw.rectangle((x, 28, x + SLOT_W - 1, sheet.height + 27), fill=(24, 30, 40), outline=(63, 76, 96))
        preview_draw.text((x + 8, 8), label, fill=(234, 238, 244))
    preview.paste(sheet, (0, 28), sheet)
    preview.save(PREVIEW)
    print(OUT)
    print(PREVIEW)


if __name__ == "__main__":
    build_assets()
