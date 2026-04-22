from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter


INTRO_DIR = Path("assets/pubpaid/intro")
SOURCE_PATTERN = "pubpaid-intro-{index:02d}.jpeg"
OUTPUT_PATTERN = "pubpaid-intro-seq-{index:02d}.jpeg"
TARGET_SIZE = (512, 300)
BETWEEN_STEPS = (1 / 3, 2 / 3)


def fit_cover(image, size):
    image = image.convert("RGB")
    target_w, target_h = size
    source_w, source_h = image.size
    scale = max(target_w / source_w, target_h / source_h)
    resized = image.resize((round(source_w * scale), round(source_h * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - target_w) // 2
    top = (resized.height - target_h) // 2
    return resized.crop((left, top, left + target_w, top + target_h))


def polish(image):
    image = ImageEnhance.Contrast(image).enhance(1.04)
    image = ImageEnhance.Color(image).enhance(1.02)
    return image.filter(ImageFilter.UnsharpMask(radius=1.2, percent=70, threshold=3))


def make_between(first, second, amount):
    blended = Image.blend(first, second, amount)
    return polish(blended)


def main():
    sources = [fit_cover(Image.open(INTRO_DIR / SOURCE_PATTERN.format(index=index)), TARGET_SIZE) for index in range(1, 7)]
    frames = []

    for index, current in enumerate(sources):
      frames.append(polish(current))
      if index >= len(sources) - 1:
          continue
      next_frame = sources[index + 1]
      for amount in BETWEEN_STEPS:
          frames.append(make_between(current, next_frame, amount))

    for output_index, frame in enumerate(frames, start=1):
        output_path = INTRO_DIR / OUTPUT_PATTERN.format(index=output_index)
        frame.save(output_path, "JPEG", quality=92, optimize=True)
        print(output_path.as_posix())


if __name__ == "__main__":
    main()
