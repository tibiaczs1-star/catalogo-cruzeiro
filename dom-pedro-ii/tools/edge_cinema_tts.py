"""Síntese neural estilo dublagem Pixar/Disney PT-BR com masterização de estúdio via FFmpeg."""
import argparse
import asyncio
import json
import os
import re
import subprocess
import tempfile

import edge_tts

CINEMA_EQ = {
    "youth_boy": "highpass=f=135,equalizer=f=200:t=q:w=1.0:g=-4.5,equalizer=f=3600:t=q:w=1.2:g=3.6,equalizer=f=8200:t=q:w=1.4:g=2.4,acompressor=threshold=-18dB:ratio=2.6:attack=7:release=95:makeup=2.2,alimiter=limit=0.92",
    "youth_girl": "highpass=f=125,equalizer=f=230:t=q:w=1.1:g=-1.2,equalizer=f=3900:t=q:w=1.3:g=3.5,equalizer=f=8600:t=q:w=1.5:g=2.6,acompressor=threshold=-18dB:ratio=2.5:attack=7:release=95:makeup=2.1,alimiter=limit=0.92",
    "youth_hero": "highpass=f=95,equalizer=f=200:t=q:w=1.2:g=-1.5,equalizer=f=3400:t=q:w=1.3:g=3.6,equalizer=f=8000:t=q:w=1.4:g=2.4,acompressor=threshold=-18dB:ratio=2.7:attack=7:release=95:makeup=2.3,alimiter=limit=0.92",
    "pixar_sparkle": "highpass=f=90,equalizer=f=220:t=q:w=1.2:g=1.4,equalizer=f=480:t=q:w=1.1:g=-1.8,equalizer=f=3600:t=q:w=1.3:g=3.4,equalizer=f=8800:t=q:w=1.5:g=2.6,acompressor=threshold=-18dB:ratio=2.6:attack=8:release=100:makeup=2.1,alimiter=limit=0.92",
    "warm_baritone": "highpass=f=65,equalizer=f=150:t=q:w=1.2:g=3.4,equalizer=f=420:t=q:w=1.1:g=-2.4,equalizer=f=2900:t=q:w=1.2:g=3.2,equalizer=f=7200:t=q:w=1.4:g=1.8,acompressor=threshold=-19dB:ratio=2.8:attack=9:release=120:makeup=2.4,alimiter=limit=0.92",
    "gentle_warm": "highpass=f=80,equalizer=f=240:t=q:w=1.2:g=2.4,equalizer=f=470:t=q:w=1.1:g=-1.6,equalizer=f=3100:t=q:w=1.3:g=2.6,equalizer=f=7600:t=q:w=1.5:g=1.6,acompressor=threshold=-20dB:ratio=2.3:attack=10:release=125:makeup=1.9,alimiter=limit=0.92",
}


async def _fetch_edge_mp3(text: str, voice: str, rate: str, pitch: str, mp3_path: str, boundary: bool):
    last_err = None
    for attempt in range(2):
        try:
            comm = edge_tts.Communicate(
                text,
                voice,
                rate=rate,
                pitch=pitch,
                boundary="WordBoundary" if boundary else "SentenceBoundary",
            )
            audio_chunks = bytearray()
            words = []
            async for chunk in comm.stream():
                if chunk["type"] == "audio":
                    audio_chunks.extend(chunk["data"])
                elif boundary and chunk["type"] == "WordBoundary":
                    start = chunk["offset"] / 10_000_000.0
                    dur = chunk["duration"] / 10_000_000.0
                    words.append({
                        "text": chunk["text"],
                        "start": round(start, 3),
                        "end": round(start + dur, 3),
                    })
            if not audio_chunks:
                raise RuntimeError("Nenhum áudio recebido da síntese neural.")
            with open(mp3_path, "wb") as f:
                f.write(audio_chunks)
            return words
        except Exception as err:
            last_err = err
            if attempt == 0:
                await asyncio.sleep(0.2)
    raise last_err


async def synth_edge(text: str, voice: str, rate: str, pitch: str, mp3_path: str, boundary: bool):
    return await _fetch_edge_mp3(text, voice, rate, pitch, mp3_path, boundary)


def _split_chunks(text: str, target: int = 210) -> list[str]:
    clean = text.strip()
    if len(clean) <= target + 40:
        return [clean] if clean else []
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", clean) if s.strip()]
    parts = []
    for s in sentences:
        if len(s) > target + 40:
            clauses = [c.strip() for c in re.split(r"(?<=[,;:])\s+", s) if c.strip()]
            buf = ""
            for c in clauses:
                if buf and len(buf) + 1 + len(c) > target and len(buf) >= 45:
                    parts.append(buf)
                    buf = c
                else:
                    buf = f"{buf} {c}".strip() if buf else c
            if buf:
                parts.append(buf)
        else:
            parts.append(s)
    chunks, cur = [], ""
    for p in parts:
        if cur and len(cur) + 1 + len(p) > target:
            chunks.append(cur)
            cur = p
        else:
            cur = f"{cur} {p}".strip() if cur else p
    if cur:
        chunks.append(cur)
    return chunks


async def synth_edge_parallel(text: str, voice: str, rate: str, pitch: str, temp_dir: str) -> list[str]:
    chunks = _split_chunks(text, target=210)
    if len(chunks) <= 1:
        mp3_path = os.path.join(temp_dir, "raw_0.mp3")
        await _fetch_edge_mp3(text, voice, rate, pitch, mp3_path, False)
        return [mp3_path]
    sem = asyncio.Semaphore(5)

    async def _worker(idx: int, chunk: str) -> str:
        out_mp3 = os.path.join(temp_dir, f"raw_{idx}.mp3")
        async with sem:
            await _fetch_edge_mp3(chunk, voice, rate, pitch, out_mp3, False)
        return out_mp3

    return await asyncio.gather(*(_worker(i, c) for i, c in enumerate(chunks)))


def master_with_ffmpeg(mp3_source, wav_path: str, eq_name: str, pitch_factor: float, tempo_factor: float, sample_rate: int, channels: int):
    mp3_paths = [mp3_source] if isinstance(mp3_source, str) else list(mp3_source)
    chain_parts = []
    pf = max(0.75, min(1.45, pitch_factor))
    tf = max(0.7, min(1.4, tempo_factor))
    eq_filter = CINEMA_EQ.get(eq_name, CINEMA_EQ["youth_hero"])
    if abs(pf - 1.0) > 0.005:
        chain_parts.append("aresample=24000")
        chain_parts.append(f"asetrate={24000.0 * pf:.1f}")
        chain_parts.append(f"aresample={sample_rate}")
        # Compensate asetrate speedup while folding in optional tempo_factor
        atempo_val = tf / pf
        while atempo_val < 0.5:
            chain_parts.append("atempo=0.5")
            atempo_val /= 0.5
        while atempo_val > 2.0:
            chain_parts.append("atempo=2.0")
            atempo_val /= 2.0
        chain_parts.append(f"atempo={atempo_val:.4f}")
    elif abs(tf - 1.0) > 0.005:
        chain_parts.append(f"atempo={tf:.4f}")
    chain_parts.append(eq_filter)
    chain_parts.append(f"aresample={sample_rate}")
    af = ",".join(chain_parts)
    cmd = ["ffmpeg", "-y"]
    for p in mp3_paths:
        cmd.extend(["-i", p])
    if len(mp3_paths) == 1:
        cmd.extend(["-af", af])
    else:
        cin = "".join(f"[{i}:a]" for i in range(len(mp3_paths)))
        cmd.extend(["-filter_complex", f"{cin}concat=n={len(mp3_paths)}:v=0:a=1,{af}[out]", "-map", "[out]"])
    cmd.extend(["-ac", str(channels), "-c:a", "pcm_s16le", wav_path])
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--voice", default="pt-BR-AntonioNeural")
    parser.add_argument("--rate", default="+6%")
    parser.add_argument("--pitch", default="+8Hz")
    parser.add_argument("--eq", default="youth_hero")
    parser.add_argument("--pitch-factor", type=float, default=1.0)
    parser.add_argument("--tempo-factor", type=float, default=1.0)
    parser.add_argument("--sample-rate", type=int, default=24000)
    parser.add_argument("--channels", type=int, default=1)
    parser.add_argument("--words-json", default="")
    args = parser.parse_args()

    with open(args.input, encoding="utf-8") as f:
        text = f.read().strip()
    if not text:
        raise ValueError("Texto vazio")

    with tempfile.TemporaryDirectory(prefix="dpii-edge-") as td:
        if args.words_json:
            mp3_source = os.path.join(td, "raw.mp3")
            words = asyncio.run(
                synth_edge(text, args.voice, args.rate, args.pitch, mp3_source, True)
            )
        else:
            words = []
            mp3_source = asyncio.run(
                synth_edge_parallel(text, args.voice, args.rate, args.pitch, td)
            )
        master_with_ffmpeg(
            mp3_source,
            args.output,
            args.eq,
            args.pitch_factor,
            args.tempo_factor,
            args.sample_rate,
            args.channels,
        )
        if args.words_json:
            scale = 1.0 / max(0.5, args.tempo_factor)
            if abs(scale - 1.0) > 0.005:
                for w in words:
                    w["start"] = round(w["start"] * scale, 3)
                    w["end"] = round(w["end"] * scale, 3)
            with open(args.words_json, "w", encoding="utf-8") as wf:
                json.dump(words, wf, ensure_ascii=False)


if __name__ == "__main__":
    main()
