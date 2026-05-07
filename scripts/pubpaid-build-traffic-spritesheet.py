from __future__ import annotations

import argparse
import json
import math
import shutil
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance


FRAME_W = 256
FRAME_H = 128
FRAMES = 4


VEHICLES = [
    {
        "id": "teal_hatch",
        "label": "Teal hatchback",
        "kind": "car",
        "crop": (82, 72, 500, 266),
        "fit": (216, 90),
        "accent": (80, 239, 255),
        "speed": 3.35,
        "lane": 575,
        "scale": 1.05,
        "hitbox": (174, 46),
    },
    {
        "id": "amber_sedan",
        "label": "Amber sedan",
        "kind": "car",
        "crop": (556, 88, 1062, 252),
        "fit": (226, 84),
        "accent": (255, 190, 84),
        "speed": 3.15,
        "lane": 528,
        "scale": 1.08,
        "hitbox": (186, 44),
    },
    {
        "id": "magenta_city",
        "label": "Magenta city car",
        "kind": "car",
        "crop": (1096, 78, 1386, 258),
        "fit": (170, 92),
        "accent": (255, 79, 184),
        "speed": 3.55,
        "lane": 612,
        "scale": 1.02,
        "hitbox": (138, 48),
    },
    {
        "id": "blue_coupe",
        "label": "Blue compact coupe",
        "kind": "car",
        "crop": (236, 326, 742, 492),
        "fit": (226, 84),
        "accent": (78, 170, 255),
        "speed": 3.25,
        "lane": 654,
        "scale": 1.06,
        "hitbox": (190, 44),
    },
    {
        "id": "navy_scooter",
        "label": "Navy scooter",
        "kind": "moto",
        "crop": (822, 286, 1106, 496),
        "fit": (146, 96),
        "accent": (105, 220, 255),
        "speed": 4.2,
        "lane": 548,
        "scale": 1.03,
        "hitbox": (112, 40),
    },
    {
        "id": "purple_sport",
        "label": "Purple sport motorcycle",
        "kind": "moto",
        "crop": (152, 526, 486, 725),
        "fit": (176, 94),
        "accent": (255, 74, 210),
        "speed": 4.65,
        "lane": 628,
        "scale": 1.06,
        "hitbox": (138, 40),
    },
    {
        "id": "black_cruiser",
        "label": "Black cruiser motorcycle",
        "kind": "moto",
        "crop": (584, 516, 980, 730),
        "fit": (184, 96),
        "accent": (210, 214, 220),
        "speed": 3.9,
        "lane": 594,
        "scale": 1.08,
        "hitbox": (148, 42),
    },
    {
        "id": "delivery_moto",
        "label": "Delivery motorcycle",
        "kind": "moto",
        "crop": (1074, 510, 1408, 728),
        "fit": (174, 98),
        "accent": (77, 226, 210),
        "speed": 3.7,
        "lane": 668,
        "scale": 1.06,
        "hitbox": (140, 44),
    },
    {
        "id": "pixel_taxi",
        "label": "Taxi-like car",
        "kind": "car",
        "crop": (156, 782, 656, 928),
        "fit": (224, 82),
        "accent": (255, 208, 109),
        "speed": 3.05,
        "lane": 566,
        "scale": 1.08,
        "hitbox": (188, 44),
    },
    {
        "id": "dark_premium",
        "label": "Dark premium car",
        "kind": "car",
        "crop": (736, 780, 1362, 940),
        "fit": (236, 82),
        "accent": (80, 239, 255),
        "speed": 3.8,
        "lane": 640,
        "scale": 1.1,
        "hitbox": (206, 44),
    },
]

WHEEL_LAYOUTS = {
    "teal_hatch": {"offsets": (0.22, 0.77), "y": 0.78, "r": 10},
    "amber_sedan": {"offsets": (0.23, 0.77), "y": 0.78, "r": 10},
    "magenta_city": {"offsets": (0.25, 0.75), "y": 0.8, "r": 9},
    "blue_coupe": {"offsets": (0.22, 0.77), "y": 0.8, "r": 10},
    "navy_scooter": {"offsets": (0.2, 0.78), "y": 0.79, "r": 10},
    "purple_sport": {"offsets": (0.19, 0.76), "y": 0.82, "r": 12},
    "black_cruiser": {"offsets": (0.19, 0.79), "y": 0.81, "r": 12},
    "delivery_moto": {"offsets": (0.18, 0.78), "y": 0.82, "r": 12},
    "pixel_taxi": {"offsets": (0.22, 0.77), "y": 0.8, "r": 10},
    "dark_premium": {"offsets": (0.21, 0.79), "y": 0.8, "r": 10},
}

RIDER_LAYOUTS = {
    "navy_scooter": {
        "seat": (0.49, 0.58),
        "shoulder": (0.42, 0.38),
        "head": (0.36, 0.24),
        "handle": (0.24, 0.48),
        "knee": (0.55, 0.71),
        "foot": (0.67, 0.79),
        "back_foot": (0.43, 0.79),
        "helmet": (14, 14),
    },
    "purple_sport": {
        "seat": (0.46, 0.58),
        "shoulder": (0.34, 0.39),
        "head": (0.28, 0.27),
        "handle": (0.18, 0.48),
        "knee": (0.52, 0.71),
        "foot": (0.68, 0.81),
        "back_foot": (0.42, 0.80),
        "helmet": (14, 13),
    },
    "black_cruiser": {
        "seat": (0.48, 0.57),
        "shoulder": (0.40, 0.36),
        "head": (0.34, 0.22),
        "handle": (0.19, 0.44),
        "knee": (0.55, 0.70),
        "foot": (0.70, 0.80),
        "back_foot": (0.42, 0.80),
        "helmet": (15, 15),
    },
    "delivery_moto": {
        "seat": (0.43, 0.58),
        "shoulder": (0.34, 0.38),
        "head": (0.29, 0.24),
        "handle": (0.18, 0.47),
        "knee": (0.50, 0.72),
        "foot": (0.64, 0.82),
        "back_foot": (0.38, 0.81),
        "helmet": (14, 14),
    },
}


def is_background_like(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    if a < 10:
        return True
    return abs(r - g) < 16 and abs(g - b) < 16 and 115 <= r <= 235


def flood_clear_background(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    visited = set()
    queue: deque[tuple[int, int]] = deque()

    for x in range(width):
      queue.append((x, 0))
      queue.append((x, height - 1))
    for y in range(height):
      queue.append((0, y))
      queue.append((width - 1, y))

    while queue:
        x, y = queue.popleft()
        if (x, y) in visited or x < 0 or y < 0 or x >= width or y >= height:
            continue
        visited.add((x, y))
        if not is_background_like(pixels[x, y]):
            continue
        pixels[x, y] = (0, 0, 0, 0)
        queue.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

    return rgba


def trim_alpha(image: Image.Image) -> Image.Image:
    bbox = image.getbbox()
    if not bbox:
        return image
    return image.crop(bbox)


def remove_neutral_floor_artifacts(image: Image.Image, kind: str) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    for y in range(height):
        lower_half = y > height * 0.48
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a < 8:
                continue
            high = max(r, g, b)
            low = min(r, g, b)
            brightness = (r + g + b) / 3
            neutral = high - low < 24
            pale_floor = neutral and brightness > (132 if kind == "moto" else 148) and lower_half
            pale_edge = neutral and brightness > 216
            if pale_floor or pale_edge:
                pixels[x, y] = (0, 0, 0, 0)
    return trim_alpha(rgba)


def fit_vehicle(vehicle: Image.Image, fit: tuple[int, int]) -> Image.Image:
    max_w, max_h = fit
    scale = min(max_w / vehicle.width, max_h / vehicle.height)
    new_size = (max(1, round(vehicle.width * scale)), max(1, round(vehicle.height * scale)))
    return vehicle.resize(new_size, Image.Resampling.LANCZOS)


def draw_shadow(draw: ImageDraw.ImageDraw, y: int, width: int, frame_shift: int) -> None:
    left = FRAME_W // 2 - width // 2 + frame_shift
    right = FRAME_W // 2 + width // 2 + frame_shift
    draw.ellipse((left, y - 10, right, y + 8), fill=(0, 0, 0, 66))
    draw.rectangle((left + 12, y - 5, right - 12, y + 4), fill=(0, 0, 0, 48))


def draw_light_fx(draw: ImageDraw.ImageDraw, vehicle_def: dict, frame_index: int, bbox: tuple[int, int, int, int]) -> None:
    left, top, right, bottom = bbox
    accent = vehicle_def["accent"]
    pulse = [70, 105, 82, 118][frame_index]
    head_x = left + 8
    tail_x = right - 8
    head_y = top + (bottom - top) * 0.44
    tail_y = top + (bottom - top) * 0.48
    draw.rectangle((head_x - 5, head_y - 4, head_x + 14, head_y + 3), fill=(*accent, pulse))
    draw.polygon(
        [
            (head_x - 3, head_y - 3),
            (max(0, head_x - 58), head_y - 18),
            (max(0, head_x - 60), head_y + 13),
            (head_x - 3, head_y + 4),
        ],
        fill=(*accent, 30 + frame_index * 7),
    )
    draw.rectangle((tail_x - 6, tail_y - 4, tail_x + 7, tail_y + 4), fill=(255, 66, 82, 96 + frame_index * 8))


def draw_wheel_glints(draw: ImageDraw.ImageDraw, vehicle_def: dict, frame_index: int, bbox: tuple[int, int, int, int]) -> None:
    left, top, right, bottom = bbox
    width = right - left
    height = bottom - top
    layout = WHEEL_LAYOUTS.get(vehicle_def["id"], {})
    wheel_y = top + height * layout.get("y", 0.8)
    wheel_offsets = layout.get("offsets", (0.24, 0.76) if vehicle_def["kind"] == "car" else (0.2, 0.78))
    wheel_radius = layout.get("r", 10 if vehicle_def["kind"] == "car" else 11)
    spoke = (226, 236, 242, 112)
    dark = (4, 7, 14, 118)
    hub = (215, 224, 230, 126)
    for offset in wheel_offsets:
        cx = left + width * offset
        cy = wheel_y
        phase = math.radians((frame_index * 72 + (0 if offset < 0.5 else 36)) % 360)
        inner = wheel_radius * 0.58
        for spoke_index in range(3):
            angle = phase + spoke_index * (math.tau / 3)
            x1 = cx - math.cos(angle) * inner
            y1 = cy - math.sin(angle) * inner
            x2 = cx + math.cos(angle) * inner
            y2 = cy + math.sin(angle) * inner
            draw.line((x1, y1, x2, y2), fill=dark if spoke_index == 2 else spoke, width=2)
        draw.ellipse((cx - 3, cy - 3, cx + 3, cy + 3), fill=hub)
        draw.arc(
            (cx - wheel_radius, cy - wheel_radius, cx + wheel_radius, cy + wheel_radius),
            start=frame_index * 76,
            end=frame_index * 76 + 44,
            fill=(247, 251, 255, 88),
            width=2,
        )


def draw_motorcycle_rider(draw: ImageDraw.ImageDraw, vehicle_def: dict, frame_index: int, bbox: tuple[int, int, int, int]) -> None:
    if vehicle_def["kind"] != "moto":
        return

    left, top, right, bottom = bbox
    width = right - left
    height = bottom - top
    bob = [-1, 0, -1, 0][frame_index]
    leg_step = [-1, 1, 0, 1][frame_index]
    layout = RIDER_LAYOUTS.get(vehicle_def["id"], RIDER_LAYOUTS["black_cruiser"])

    def pt(name: str) -> tuple[int, int]:
        rel_x, rel_y = layout[name]
        return (round(left + width * rel_x), round(top + height * rel_y + bob))

    seat_x, seat_y = pt("seat")
    shoulder_x, shoulder_y = pt("shoulder")
    head_x, head_y = pt("head")
    handle_x, handle_y = pt("handle")
    knee_x, knee_y = pt("knee")
    foot_x, foot_y = pt("foot")
    back_foot_x, back_foot_y = pt("back_foot")
    helmet_w, helmet_h = layout["helmet"]

    outline = (4, 6, 12, 236)
    helmet_palettes = {
        "navy_scooter": (18, 25, 34, 248),
        "purple_sport": (28, 20, 38, 248),
        "black_cruiser": (17, 18, 21, 248),
        "delivery_moto": (18, 28, 30, 248),
    }
    jacket_palettes = {
        "navy_scooter": (19, 31, 44, 246),
        "purple_sport": (23, 21, 31, 246),
        "black_cruiser": (15, 18, 22, 246),
        "delivery_moto": (17, 29, 32, 246),
    }
    glove = (7, 9, 13, 246)
    helmet = helmet_palettes.get(vehicle_def["id"], (18, 20, 26, 248))
    visor = vehicle_def["accent"]
    jacket = jacket_palettes.get(vehicle_def["id"], (18, 22, 30, 246))
    pants = (12, 15, 21, 244)
    boot = (22, 13, 9, 245)

    if vehicle_def["id"] == "delivery_moto":
        pack_left = round(seat_x + width * 0.16)
        pack_top = round(seat_y - height * 0.31)
        draw.rectangle((pack_left - 3, pack_top - 3, pack_left + 24, pack_top + 23), fill=outline)
        draw.rectangle((pack_left, pack_top, pack_left + 21, pack_top + 20), fill=(42, 63, 68, 238))
        draw.rectangle((pack_left + 4, pack_top + 6, pack_left + 17, pack_top + 9), fill=(*vehicle_def["accent"], 174))

    hip_x = round((seat_x + knee_x) / 2)
    hip_y = round(seat_y + 4)
    torso = [
        (round(shoulder_x - 7), round(shoulder_y - 5)),
        (round(shoulder_x + 13), round(shoulder_y + 1)),
        (round(seat_x + 11), round(seat_y + 6)),
        (round(seat_x - 13), round(seat_y)),
    ]
    draw.polygon(torso, fill=outline)
    draw.polygon([(x + 1, y + 1) for x, y in torso], fill=jacket)
    hip_block = [
        (round(seat_x - 10), round(seat_y - 2)),
        (round(seat_x + 9), round(seat_y + 2)),
        (round(hip_x + 8), round(hip_y + 8)),
        (round(hip_x - 8), round(hip_y + 7)),
    ]
    draw.polygon(hip_block, fill=outline)
    draw.polygon([(x + 1, y) for x, y in hip_block], fill=pants)
    draw.rectangle((seat_x - 8, seat_y - 6, seat_x + 7, seat_y + 1), fill=(9, 11, 16, 238))
    draw.line((shoulder_x + 4, shoulder_y + 2, handle_x, handle_y), fill=outline, width=5)
    draw.line((shoulder_x + 4, shoulder_y + 2, handle_x, handle_y), fill=jacket, width=3)
    draw.line((shoulder_x + 2, shoulder_y + 6, handle_x + 4, handle_y + 3), fill=outline, width=4)
    draw.line((shoulder_x + 2, shoulder_y + 6, handle_x + 4, handle_y + 3), fill=jacket, width=2)
    draw.ellipse((handle_x - 3, handle_y - 3, handle_x + 3, handle_y + 3), fill=glove)
    thigh = [
        (round(seat_x - 2), round(seat_y + 1)),
        (round(seat_x + 9), round(seat_y + 5)),
        (round(knee_x + 7), round(knee_y + leg_step + 4)),
        (round(knee_x - 6), round(knee_y + leg_step - 3)),
    ]
    draw.polygon(thigh, fill=outline)
    draw.polygon([(x, y + 1) for x, y in thigh], fill=pants)
    draw.line((knee_x, knee_y + leg_step, foot_x, foot_y), fill=outline, width=8)
    draw.line((knee_x, knee_y + leg_step, foot_x, foot_y), fill=pants, width=5)
    draw.rectangle((foot_x - 7, foot_y - 2, foot_x + 8, foot_y + 3), fill=boot)
    draw.line((seat_x - 4, seat_y - 2, back_foot_x, back_foot_y - leg_step), fill=outline, width=6)
    draw.line((seat_x - 4, seat_y - 2, back_foot_x, back_foot_y - leg_step), fill=pants, width=3)
    draw.rectangle((back_foot_x - 6, back_foot_y - 2, back_foot_x + 7, back_foot_y + 2), fill=boot)

    helmet_outline = [
        (round(head_x - helmet_w * 0.65), round(head_y - helmet_h * 0.45)),
        (round(head_x + helmet_w * 0.28), round(head_y - helmet_h * 0.58)),
        (round(head_x + helmet_w * 0.58), round(head_y - helmet_h * 0.05)),
        (round(head_x + helmet_w * 0.34), round(head_y + helmet_h * 0.55)),
        (round(head_x - helmet_w * 0.5), round(head_y + helmet_h * 0.5)),
        (round(head_x - helmet_w * 0.75), round(head_y + helmet_h * 0.05)),
    ]
    helmet_inner = [(x + 1, y + 1) for x, y in helmet_outline]
    draw.polygon(helmet_outline, fill=outline)
    draw.polygon(helmet_inner, fill=helmet)
    draw.rectangle(
        (
            round(head_x - helmet_w * 0.62),
            round(head_y - 2),
            round(head_x - helmet_w * 0.04),
            round(head_y + 3),
        ),
        fill=(*visor, 218),
    )
    draw.rectangle(
        (
            round(head_x + helmet_w * 0.1),
            round(head_y - helmet_h * 0.46),
            round(head_x + helmet_w * 0.36),
            round(head_y - helmet_h * 0.28),
        ),
        fill=(255, 255, 255, 90),
    )
    draw.line((shoulder_x - 1, shoulder_y, seat_x - 7, seat_y - 1), fill=(74, 91, 105, 130), width=2)


def make_frame(base_vehicle: Image.Image, vehicle_def: dict, frame_index: int) -> Image.Image:
    frame = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(frame, "RGBA")
    bob = [0, -1, 0, 1][frame_index] if vehicle_def["kind"] == "moto" else [0, 0, -1, 0][frame_index]
    shift = [0, 1, 0, -1][frame_index]
    x = FRAME_W // 2 - base_vehicle.width // 2 + shift
    y = FRAME_H - 18 - base_vehicle.height + bob
    draw_shadow(draw, FRAME_H - 16, min(base_vehicle.width + 22, FRAME_W - 24), shift)
    frame.alpha_composite(base_vehicle, (x, y))
    bbox = (x, y, x + base_vehicle.width, y + base_vehicle.height)
    draw_motorcycle_rider(draw, vehicle_def, frame_index, bbox)
    draw_light_fx(draw, vehicle_def, frame_index, bbox)
    draw_wheel_glints(draw, vehicle_def, frame_index, bbox)
    if frame_index in (1, 3):
        enhancer = ImageEnhance.Brightness(frame)
        frame = enhancer.enhance(1.015)
    return frame


def build_sheet(source: Path, out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    approved = out_dir / "pubpaid-traffic-vehicles-approved-preview.png"
    if source.resolve() != approved.resolve():
        shutil.copyfile(source, approved)

    source_image = Image.open(source).convert("RGBA")
    sheet = Image.new("RGBA", (FRAME_W * FRAMES, FRAME_H * len(VEHICLES)), (0, 0, 0, 0))
    preview = Image.new("RGBA", (FRAME_W * FRAMES, FRAME_H * len(VEHICLES)), (220, 220, 220, 255))

    metadata = {
        "frameWidth": FRAME_W,
        "frameHeight": FRAME_H,
        "framesPerVehicle": FRAMES,
        "source": str(source),
        "vehicles": [],
    }

    for row, vehicle_def in enumerate(VEHICLES):
        crop = source_image.crop(vehicle_def["crop"])
        cutout = remove_neutral_floor_artifacts(
            trim_alpha(flood_clear_background(crop)),
            vehicle_def["kind"],
        )
        fitted = remove_neutral_floor_artifacts(
            fit_vehicle(cutout, vehicle_def["fit"]),
            vehicle_def["kind"],
        )
        for frame_index in range(FRAMES):
            frame = make_frame(fitted, vehicle_def, frame_index)
            x = frame_index * FRAME_W
            y = row * FRAME_H
            sheet.alpha_composite(frame, (x, y))
            preview.alpha_composite(frame, (x, y))
        metadata["vehicles"].append(
            {
                "id": vehicle_def["id"],
                "label": vehicle_def["label"],
                "kind": vehicle_def["kind"],
                "row": row,
                "speed": vehicle_def["speed"],
                "lane": vehicle_def["lane"],
                "scale": vehicle_def["scale"],
                "hitbox": {"width": vehicle_def["hitbox"][0], "height": vehicle_def["hitbox"][1]},
            }
        )

    sheet.save(out_dir / "pubpaid-traffic-vehicles-4f.png")
    preview.convert("RGB").save(out_dir / "pubpaid-traffic-vehicles-4f-preview.jpg", quality=94)
    (out_dir / "pubpaid-traffic-vehicles-4f.json").write_text(
        json.dumps(metadata, ensure_ascii=True, indent=2),
        encoding="utf-8",
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Build PubPaid traffic spritesheet from approved vehicle contact sheet.")
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--out-dir", default=Path("assets/pubpaid/traffic"), type=Path)
    args = parser.parse_args()
    build_sheet(args.source, args.out_dir)


if __name__ == "__main__":
    main()
