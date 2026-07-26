#!/usr/bin/env python3
import argparse
import json
import math
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_LOGO = ROOT / "assets" / "logo-czs.png"


def run(command, *, capture=False):
    result = subprocess.run(
        command,
        check=False,
        text=True,
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.PIPE if capture else None,
    )
    if result.returncode != 0:
        details = ""
        if capture:
            details = f"\nSTDOUT:\n{result.stdout}\nSTDERR:\n{result.stderr}"
        raise SystemExit(f"Command failed ({result.returncode}): {' '.join(map(str, command))}{details}")
    return result.stdout if capture else ""


def require_tool(name):
    if not shutil.which(name):
        raise SystemExit(f"Missing required tool: {name}")


def ffprobe_json(path):
    require_tool("ffprobe")
    output = run(
        [
            "ffprobe",
            "-v",
            "error",
            "-print_format",
            "json",
            "-show_format",
            "-show_streams",
            str(path),
        ],
        capture=True,
    )
    return json.loads(output)


def duration_seconds(path):
    probe = ffprobe_json(path)
    try:
        return float(probe["format"]["duration"])
    except (KeyError, TypeError, ValueError):
        raise SystemExit(f"Could not read duration from {path}")


def video_resolution(path):
    for stream in ffprobe_json(path).get("streams", []):
        if stream.get("codec_type") == "video":
            return int(stream.get("width", 0)), int(stream.get("height", 0))
    raise SystemExit(f"No video stream found in {path}")


def inspect(args):
    require_tool("ffmpeg")
    input_path = Path(args.input)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    duration = duration_seconds(input_path)
    start = max(0.0, duration - args.seconds)
    pattern = output_dir / "frame_%04d.jpg"
    run(
        [
            "ffmpeg",
            "-y",
            "-ss",
            f"{start:.3f}",
            "-i",
            str(input_path),
            "-vf",
            f"fps=1/{args.step},scale=360:-1",
            "-q:v",
            "2",
            str(pattern),
        ]
    )
    frames = []
    frame_files = sorted(output_dir.glob("frame_*.jpg"))
    for index, frame_path in enumerate(frame_files):
        frames.append(
            {
                "file": frame_path.name,
                "timestamp": round(start + index * args.step, 3),
                "note": "Marque --outro-start um ou dois frames antes da primeira vinheta/logo de terceiro.",
            }
        )
    (output_dir / "frames.json").write_text(json.dumps(frames, ensure_ascii=False, indent=2), encoding="utf-8")
    if frame_files:
        run(
            [
                "ffmpeg",
                "-y",
                "-pattern_type",
                "glob",
                "-i",
                str(output_dir / "frame_*.jpg"),
                "-vf",
                "tile=4x4:margin=12:padding=8:color=white",
                "-frames:v",
                "1",
                str(output_dir / "contact-sheet.jpg"),
            ]
        )
    print(json.dumps({"ok": True, "duration": duration, "reviewDir": str(output_dir), "frames": len(frames)}, indent=2))


def has_audio(path):
    for stream in ffprobe_json(path).get("streams", []):
        if stream.get("codec_type") == "audio":
            return True
    return False


def make_end_card(path, duration, width, height, fps, logo_path):
    require_tool("ffmpeg")
    filters = [
        f"color=c=#f8fafc:s={width}x{height}:r={fps}:d={duration}[bg]",
        f"color=c=#082f57:s={width}x{max(120, height // 9)}:r={fps}:d={duration}[top]",
        f"color=c=#082f57:s={width}x{max(150, height // 8)}:r={fps}:d={duration}[bottom]",
        "[bg][top]overlay=0:0[tmp1]",
        f"[tmp1][bottom]overlay=0:H-h[tmp2]",
        f"[tmp2]drawbox=x=0:y={max(120, height // 9)}:w=iw:h=8:color=#facc15:t=fill[tmp3]",
        f"[tmp3]drawbox=x=0:y={height - max(150, height // 8) - 8}:w=iw:h=8:color=#facc15:t=fill[tmp4]",
    ]
    command = ["ffmpeg", "-y"]
    logo_exists = logo_path and Path(logo_path).exists()
    if logo_exists:
        command += ["-i", str(logo_path)]
        logo_width = min(width - 160, 760)
        filters.append(f"[0:v]scale={logo_width}:-1[logo]")
        filters.append("[tmp4][logo]overlay=(W-w)/2:(H-h)/2-70[tmp5]")
        text_input = "tmp5"
    else:
        text_input = "tmp4"
    filters.append(
        f"[{text_input}]drawtext=text='CATALOGO CZS':fontcolor=#082f57:fontsize={max(58, width // 12)}:"
        "x=(w-text_w)/2:y=(h-text_h)/2-80:shadowcolor=white:shadowx=3:shadowy=3[tmp6]"
    )
    filters.append(
        f"[tmp6]drawtext=text='Leia mais no portal regional':fontcolor=#0f172a:fontsize={max(34, width // 28)}:"
        "x=(w-text_w)/2:y=(h-text_h)/2+110[outv]"
    )
    command += [
        "-f",
        "lavfi",
        "-i",
        f"anullsrc=channel_layout=stereo:sample_rate=44100:d={duration}",
        "-filter_complex",
        ";".join(filters),
        "-map",
        "[outv]",
        "-map",
        "1:a" if logo_exists else "0:a",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-shortest",
        str(path),
    ]
    run(command)


def replace(args):
    require_tool("ffmpeg")
    input_path = Path(args.input)
    output_path = Path(args.output)
    outro_start = float(args.outro_start)
    duration = duration_seconds(input_path)
    if outro_start <= 0 or outro_start >= duration:
        raise SystemExit(f"--outro-start must be between 0 and video duration ({duration:.3f}s)")

    width, height = video_resolution(input_path)
    end_duration = max(2.25, min(4.0, duration - outro_start))
    logo_path = Path(args.end_card) if args.end_card else DEFAULT_LOGO

    with tempfile.TemporaryDirectory(prefix="czs-outro-") as tmp:
        tmp_dir = Path(tmp)
        main = tmp_dir / "main.mp4"
        card = tmp_dir / "card.mp4"
        concat_file = tmp_dir / "concat.txt"
        merged = tmp_dir / "merged.mp4"

        run(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(input_path),
                "-t",
                f"{outro_start:.3f}",
                "-c:v",
                "libx264",
                "-pix_fmt",
                "yuv420p",
                "-c:a",
                "aac",
                "-movflags",
                "+faststart",
                str(main),
            ]
        )
        make_end_card(card, end_duration, width, height, args.fps, logo_path)
        concat_file.write_text(f"file '{main.as_posix()}'\nfile '{card.as_posix()}'\n", encoding="utf-8")
        run(
            [
                "ffmpeg",
                "-y",
                "-f",
                "concat",
                "-safe",
                "0",
                "-i",
                str(concat_file),
                "-c",
                "copy",
                str(merged),
            ]
        )
        if args.narration:
            delay = max(0, int(args.narration_delay_ms))
            run(
                [
                    "ffmpeg",
                    "-y",
                    "-i",
                    str(merged),
                    "-i",
                    str(args.narration),
                    "-filter_complex",
                    f"[1:a]adelay={delay}|{delay},apad[aud]",
                    "-map",
                    "0:v",
                    "-map",
                    "[aud]",
                    "-c:v",
                    "copy",
                    "-c:a",
                    "aac",
                    "-shortest",
                    str(output_path),
                ]
            )
        else:
            shutil.copyfile(merged, output_path)
    print(json.dumps({"ok": True, "output": str(output_path), "outroStart": outro_start, "replacedSeconds": round(duration - outro_start, 3)}, indent=2))


def validate(args):
    path = Path(args.input)
    probe = ffprobe_json(path)
    videos = [s for s in probe.get("streams", []) if s.get("codec_type") == "video"]
    audios = [s for s in probe.get("streams", []) if s.get("codec_type") == "audio"]
    errors = []
    if len(videos) != 1:
        errors.append(f"expected exactly one video stream, found {len(videos)}")
    if len(audios) != 1:
        errors.append(f"expected exactly one audio stream, found {len(audios)}")
    if videos:
        video = videos[0]
        if video.get("codec_name") != "h264":
            errors.append(f"expected h264 video, found {video.get('codec_name')}")
        if (int(video.get("width", 0)), int(video.get("height", 0))) != (1080, 1920):
            errors.append(f"expected 1080x1920, found {video.get('width')}x{video.get('height')}")
    if audios and audios[0].get("codec_name") != "aac":
        errors.append(f"expected aac audio, found {audios[0].get('codec_name')}")

    mean_volume = None
    if args.require_audible:
        require_tool("ffmpeg")
        output = run(
            ["ffmpeg", "-i", str(path), "-af", "volumedetect", "-f", "null", "-"],
            capture=True,
        )
        for line in output.splitlines():
            if "mean_volume:" in line:
                mean_volume = line.split("mean_volume:", 1)[1].strip()
        if mean_volume is None or mean_volume.startswith("-inf"):
            errors.append("audio is silent or mean_volume could not be measured")

    result = {"ok": not errors, "errors": errors, "meanVolume": mean_volume}
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if errors:
        raise SystemExit(1)


def main():
    parser = argparse.ArgumentParser(description="Inspect, replace and validate CZS video outros.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    inspect_parser = subparsers.add_parser("inspect")
    inspect_parser.add_argument("input")
    inspect_parser.add_argument("--output-dir", required=True)
    inspect_parser.add_argument("--seconds", type=float, default=6.0)
    inspect_parser.add_argument("--step", type=float, default=0.25)
    inspect_parser.set_defaults(func=inspect)

    replace_parser = subparsers.add_parser("replace")
    replace_parser.add_argument("input")
    replace_parser.add_argument("output")
    replace_parser.add_argument("--outro-start", required=True, type=float)
    replace_parser.add_argument("--narration")
    replace_parser.add_argument("--narration-delay-ms", type=int, default=400)
    replace_parser.add_argument("--end-card")
    replace_parser.add_argument("--fps", type=int, default=30)
    replace_parser.set_defaults(func=replace)

    validate_parser = subparsers.add_parser("validate")
    validate_parser.add_argument("input")
    validate_parser.add_argument("--require-audible", action="store_true")
    validate_parser.set_defaults(func=validate)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
