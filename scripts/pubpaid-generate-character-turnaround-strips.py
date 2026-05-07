from pathlib import Path
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets/pubpaid/sprites/protagonist"

TURN_W = 172
TURN_H = 256
DIRECTION_ROWS = [0, 2, 4, 6]  # front, right, back, left

SOURCES = [
    {
        "name": "male",
        "path": OUT_DIR / "protagonist-idle-breathe-8dir-3f.png",
        "frame_w": 64,
        "frame_h": 128,
        "frame_index": 0,
        "out": OUT_DIR / "protagonist-male-turnaround-4f.png",
        "target_h": 232,
    },
    {
        "name": "female",
        "path": OUT_DIR / "protagonist-female-32bit-idle-breathe-8dir-4f.png",
        "frame_w": 96,
        "frame_h": 144,
        "frame_index": 0,
        "out": OUT_DIR / "protagonist-female-turnaround-4f.png",
        "target_h": 232,
    },
]


def crop_frame(sheet, frame_w, frame_h, row, frame_index):
    left = frame_index * frame_w
    top = row * frame_h
    return sheet.crop((left, top, left + frame_w, top + frame_h))


def fit_on_turntable(frame, target_h):
    bbox = frame.getbbox()
    if not bbox:
        return Image.new("RGBA", (TURN_W, TURN_H), (0, 0, 0, 0))

    subject = frame.crop(bbox)
    scale = min((TURN_W - 18) / subject.width, target_h / subject.height)
    scaled = subject.resize(
        (max(1, round(subject.width * scale)), max(1, round(subject.height * scale))),
        Image.Resampling.NEAREST,
    )
    canvas = Image.new("RGBA", (TURN_W, TURN_H), (0, 0, 0, 0))
    x = (TURN_W - scaled.width) // 2
    y = TURN_H - scaled.height - 8
    canvas.alpha_composite(scaled, (x, y))
    return canvas


def build_strip(config):
    source = Image.open(config["path"]).convert("RGBA")
    strip = Image.new("RGBA", (TURN_W * len(DIRECTION_ROWS), TURN_H), (0, 0, 0, 0))
    for index, row in enumerate(DIRECTION_ROWS):
        frame = crop_frame(source, config["frame_w"], config["frame_h"], row, config["frame_index"])
        turn_frame = fit_on_turntable(frame, config["target_h"])
        strip.alpha_composite(turn_frame, (index * TURN_W, 0))
    strip.save(config["out"])
    print(config["out"])


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for config in SOURCES:
        if not config["path"].exists():
            raise FileNotFoundError(config["path"])
        build_strip(config)


if __name__ == "__main__":
    main()
