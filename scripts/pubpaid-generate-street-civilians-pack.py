from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance, ImageOps


ROOT = Path(__file__).resolve().parents[1]
STANDING_SEED = ROOT / "assets/pubpaid/sprites/adult-standing-tight-v1.png"
SEATED_SEED = ROOT / "assets/pubpaid/sprites/guest-seated-tight-v1.png"
OUT_DIR = ROOT / "assets/pubpaid/sprites/street-civilians"
PREVIEW = OUT_DIR / "street-civilians-v1-preview.png"
NOTES = OUT_DIR / "README.md"

FRAME_W = 64
FRAME_H = 128
FRAMES = 4


CIVILIANS = [
    {
        "id": "bus-lady",
        "label": "senhora ponto",
        "seed": "standing",
        "height": 94,
        "max_w": 44,
        "x": -2,
        "palette": {"coat": (125, 51, 83, 206), "accent": (224, 179, 82, 235), "dark": (32, 35, 47, 215)},
        "accessory": "bag",
        "brightness": 0.94,
    },
    {
        "id": "terminal-man",
        "label": "homem terminal",
        "seed": "standing",
        "height": 103,
        "max_w": 47,
        "x": 1,
        "palette": {"coat": (41, 73, 93, 210), "accent": (88, 210, 205, 225), "dark": (18, 24, 34, 225)},
        "accessory": "lean",
        "brightness": 0.86,
    },
    {
        "id": "hooded-youth",
        "label": "jovem capuz",
        "seed": "standing",
        "height": 96,
        "max_w": 43,
        "x": 0,
        "palette": {"coat": (37, 83, 67, 220), "accent": (88, 226, 174, 230), "dark": (16, 25, 30, 235)},
        "accessory": "hood",
        "brightness": 0.82,
    },
    {
        "id": "worker-backpack",
        "label": "trabalhador",
        "seed": "standing",
        "height": 106,
        "max_w": 46,
        "x": 2,
        "palette": {"coat": (196, 113, 47, 210), "accent": (248, 213, 91, 240), "dark": (67, 43, 34, 224)},
        "accessory": "backpack",
        "brightness": 0.98,
    },
    {
        "id": "curb-sitter",
        "label": "sentado meio fio",
        "seed": "seated",
        "height": 68,
        "max_w": 58,
        "x": 0,
        "palette": {"coat": (76, 70, 112, 210), "accent": (142, 204, 255, 230), "dark": (30, 43, 56, 230)},
        "accessory": "seated",
        "brightness": 0.82,
    },
    {
        "id": "bouncer-wide",
        "label": "seguranca porta",
        "seed": "standing",
        "height": 112,
        "max_w": 55,
        "x": 0,
        "palette": {"coat": (32, 37, 49, 230), "accent": (214, 178, 89, 230), "dark": (12, 15, 22, 238)},
        "accessory": "arms-crossed",
        "brightness": 0.76,
        "wide": True,
    },
]


def trim_alpha(image):
    image = image.convert("RGBA")
    bbox = image.getchannel("A").getbbox()
    return image.crop(bbox) if bbox else image


def fit_seed(path, target_h, max_w, mirror=False, wide=False):
    image = trim_alpha(Image.open(path))
    ratio = target_h / image.height
    image = image.resize((max(1, int(image.width * ratio)), target_h), Image.Resampling.LANCZOS)
    if wide:
        image = image.resize((max(1, int(image.width * 1.22)), image.height), Image.Resampling.BICUBIC)
    if image.width > max_w:
        ratio = max_w / image.width
        image = image.resize((max_w, max(1, int(image.height * ratio))), Image.Resampling.LANCZOS)
    if mirror:
        image = ImageOps.mirror(image)
    return image


def tint_seed(image, brightness):
    image = ImageEnhance.Brightness(image).enhance(brightness)
    return ImageEnhance.Contrast(image).enhance(1.05)


def draw_shadow(draw, cx, base_y, width, alpha=58):
    draw.ellipse((cx - width // 2, base_y - 7, cx + width // 2, base_y), fill=(0, 0, 0, alpha))


def overlay_box(layer, box, fill, outline=(7, 8, 13, 160)):
    draw = ImageDraw.Draw(layer)
    x1, y1, x2, y2 = [round(v) for v in box]
    draw.rectangle((x1, y1, x2, y2), fill=outline)
    draw.rectangle((x1 + 2, y1 + 2, x2 - 2, y2 - 2), fill=fill)


def paint_standing(canvas, spec, bbox, frame):
    x, y, w, h = bbox
    layer = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    p = spec["palette"]
    bob = [0, 1, 0, -1][frame]
    step = [0, 1, 0, -1][frame]

    torso_top = y + h * 0.34 + bob
    torso_bottom = y + h * 0.66 + bob
    hip = y + h * 0.66
    shoulder = max(20, w * (1.05 if not spec.get("wide") else 1.25))

    overlay_box(layer, (x + w / 2 - shoulder / 2, torso_top, x + w / 2 + shoulder / 2, torso_bottom), p["coat"])
    draw.rectangle((x + w / 2 - 2, torso_top + 4, x + w / 2 + 3, torso_bottom - 4), fill=(255, 255, 255, 32))
    overlay_box(layer, (x + w * 0.28, hip, x + w * 0.46, y + h - 9), p["dark"])
    overlay_box(layer, (x + w * 0.54, hip, x + w * 0.72, y + h - 9), p["dark"])
    draw.rectangle((x + w * 0.22 - step, y + h - 11, x + w * 0.48, y + h - 6), fill=(8, 8, 12, 230))
    draw.rectangle((x + w * 0.52 + step, y + h - 11, x + w * 0.78, y + h - 6), fill=(8, 8, 12, 230))

    accessory = spec["accessory"]
    if accessory == "bag":
        bag_x = x + w * 0.76
        bag_y = y + h * 0.58 + (frame % 2)
        overlay_box(layer, (bag_x, bag_y, bag_x + 12, bag_y + 20), p["accent"])
        draw.arc((bag_x - 2, bag_y - 9, bag_x + 10, bag_y + 7), 180, 360, fill=p["accent"], width=2)
    elif accessory == "lean":
        pole_x = x + w * 0.82
        draw.rectangle((pole_x, y + h * 0.32, pole_x + 4, y + h - 6), fill=(77, 87, 103, 178))
        draw.rectangle((x + w * 0.22, torso_top + 2, x + w * 0.8, torso_top + 11), fill=p["dark"])
    elif accessory == "hood":
        cx = x + w / 2
        hood_top = y + h * 0.1
        draw.polygon(
            [(cx - 15, hood_top + 22), (cx, hood_top + 5), (cx + 15, hood_top + 22), (cx + 11, hood_top + 35), (cx - 11, hood_top + 35)],
            fill=(6, 9, 14, 222),
        )
        draw.polygon(
            [(cx - 10, hood_top + 22), (cx, hood_top + 12), (cx + 10, hood_top + 22), (cx + 7, hood_top + 31), (cx - 7, hood_top + 31)],
            fill=p["coat"],
        )
    elif accessory == "backpack":
        overlay_box(layer, (x - 2, torso_top + 5, x + 9, torso_bottom + 2), p["dark"])
        draw.line((x + w * 0.35, torso_top + 4, x + w * 0.55, torso_bottom - 3), fill=p["accent"], width=3)
    elif accessory == "arms-crossed":
        arm_y = torso_top + (torso_bottom - torso_top) * 0.5
        overlay_box(layer, (x + w / 2 - 22, arm_y - 5, x + w / 2 + 22, arm_y + 6), p["dark"])
        draw.rectangle((x + w / 2 - 8, arm_y - 1, x + w / 2 + 8, arm_y + 3), fill=(160, 94, 68, 205))
        draw.rectangle((x + w / 2 - 2, torso_top + 6, x + w / 2 + 3, torso_bottom - 5), fill=(255, 255, 255, 24))

    canvas.alpha_composite(layer)


def paint_seated(canvas, spec, bbox, frame):
    x, y, w, h = bbox
    layer = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    p = spec["palette"]
    torso_top = y + h * 0.25 + [0, 1, 0, -1][frame]
    overlay_box(layer, (x + w * 0.2, torso_top, x + w * 0.72, y + h * 0.68), p["coat"])
    overlay_box(layer, (x + w * 0.08, y + h * 0.62, x + w * 0.62, y + h * 0.78), p["dark"])
    overlay_box(layer, (x + w * 0.55, y + h * 0.72, x + w * 0.95, y + h * 0.86), p["dark"])
    draw = ImageDraw.Draw(layer)
    draw.rectangle((x + w * 0.32, torso_top + 8, x + w * 0.5, torso_top + 12), fill=p["accent"])
    canvas.alpha_composite(layer)


def make_frame(spec, frame):
    canvas = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    seed_path = SEATED_SEED if spec["seed"] == "seated" else STANDING_SEED
    seed = fit_seed(seed_path, spec["height"], spec["max_w"], mirror=frame in (1, 3), wide=spec.get("wide", False))
    seed = tint_seed(seed, spec["brightness"])
    x = (FRAME_W - seed.width) // 2 + spec.get("x", 0) + [0, 1, 0, -1][frame]
    y = FRAME_H - seed.height - 6 + [0, 1, -1, 1][frame]
    draw = ImageDraw.Draw(canvas)
    draw_shadow(draw, FRAME_W // 2, FRAME_H - 4, max(34, seed.width + 12), 54 if spec["seed"] == "seated" else 60)
    canvas.alpha_composite(seed, (x, y))
    bbox = (x, y, seed.width, seed.height)
    if spec["seed"] == "seated":
        paint_seated(canvas, spec, bbox, frame)
    else:
        paint_standing(canvas, spec, bbox, frame)
    return canvas


def build_sheet(spec):
    sheet = Image.new("RGBA", (FRAME_W * FRAMES, FRAME_H), (0, 0, 0, 0))
    for frame in range(FRAMES):
        sheet.alpha_composite(make_frame(spec, frame), (frame * FRAME_W, 0))
    path = OUT_DIR / f"{spec['id']}-idle-v1.png"
    sheet.save(path)
    return path, sheet


def build_preview(sheets):
    scale = 2
    cell_w = FRAME_W * scale
    cell_h = FRAME_H * scale
    label_h = 24
    preview = Image.new("RGB", (cell_w * FRAMES, (cell_h + label_h) * len(sheets)), (18, 22, 29))
    draw = ImageDraw.Draw(preview)
    for row, (spec, sheet) in enumerate(sheets):
        y = row * (cell_h + label_h)
        draw.text((8, y + 5), f"{spec['id']} - {spec['label']}", fill=(230, 235, 242))
        for frame in range(FRAMES):
            tile = sheet.crop((frame * FRAME_W, 0, (frame + 1) * FRAME_W, FRAME_H))
            tile = tile.resize((cell_w, cell_h), Image.Resampling.NEAREST)
            x = frame * cell_w
            draw.rectangle((x + 4, y + label_h + 4, x + cell_w - 4, y + label_h + cell_h - 4), fill=(30, 36, 45), outline=(82, 94, 110))
            preview.paste(tile, (x, y + label_h), tile)
    preview.save(PREVIEW)


def write_notes(paths):
    lines = [
        "# Civis de rua PubPaid 2.0\n",
        "Pacote local V1 para substituir clones na rua durante o desenvolvimento.\n",
        "Cada arquivo e um spritesheet 4 frames de idle, frame 64x128, ancora inferior central.\n",
        "Os sprites sao paintovers locais em cima dos seeds aprovados para manter acabamento mais perto do jogo.\n",
        "Status: jogavel/local. Pode receber pintura final depois sem mudar a grade.\n",
        "Arquivos:\n",
    ]
    for path in paths:
        lines.append(f"- `{path.name}`\n")
    NOTES.write_text("".join(lines), encoding="utf-8")


def main():
    if not STANDING_SEED.exists() or not SEATED_SEED.exists():
        raise FileNotFoundError("Missing PubPaid seed sprites.")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    built = []
    paths = []
    for spec in CIVILIANS:
        path, sheet = build_sheet(spec)
        paths.append(path)
        built.append((spec, sheet))
    build_preview(built)
    write_notes(paths)
    for path in paths:
        print(path)
    print(PREVIEW)


if __name__ == "__main__":
    main()
