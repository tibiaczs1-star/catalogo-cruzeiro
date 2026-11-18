"""Clonagem zero-shot local em GPU/CPU com k2-fsa/OmniVoice (CLI e modo --worker quente)."""
import argparse
import hashlib
import json
import os
import re
import sys

import numpy as np
import soundfile as sf
import torch
import torchaudio


# Patch seguro antes de importar omnivoice (evita erro libtorchcodec no Windows)
def _sf_load(path, *args, **kwargs):
    data, sr = sf.read(str(path), dtype="float32", always_2d=True)
    return torch.from_numpy(data.T.copy()), int(sr)


def _sf_save(path, src, sample_rate, *args, **kwargs):
    arr = src.detach().cpu().numpy() if isinstance(src, torch.Tensor) else np.asarray(src)
    if arr.ndim == 2:
        arr = arr.T if arr.shape[0] <= 4 else arr
    sf.write(str(path), arr, int(sample_rate))


torchaudio.load = _sf_load
torchaudio.save = _sf_save

OMNIVOICE_REPO = os.environ.get("OMNIVOICE_REPO", r"C:\tools\VoiceStudio")
if os.path.isdir(OMNIVOICE_REPO) and OMNIVOICE_REPO not in sys.path:
    sys.path.insert(0, OMNIVOICE_REPO)

from omnivoice import OmniVoice, OmniVoiceGenerationConfig  # noqa: E402
from omnivoice.models.omnivoice import VoiceClonePrompt  # noqa: E402
from omnivoice.utils.dtype import tts_dtype_name  # noqa: E402

_PROMPT_MEM_CACHE: dict[str, VoiceClonePrompt] = {}


def split_chunks(text: str, target: int = 210) -> list[str]:
    clean = re.sub(r"\s+", " ", str(text or "")).strip()
    if not clean:
        return []
    if len(clean) <= target + 30:
        return [clean]
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", clean) if s.strip()]
    parts: list[str] = []
    for s in sentences:
        if len(s) > target + 30:
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
    chunks: list[str] = []
    cur = ""
    for p in parts:
        if cur and len(cur) + 1 + len(p) > target:
            chunks.append(cur)
            cur = p
        else:
            cur = f"{cur} {p}".strip() if cur else p
    if cur:
        chunks.append(cur)
    return chunks


def load_model(model_id: str, device: str):
    dtype_name = tts_dtype_name(device)
    dtype = getattr(torch, dtype_name, torch.float16 if device == "cuda" else torch.float32)
    try:
        return OmniVoice.from_pretrained(
            model_id,
            device_map=device,
            dtype=dtype,
            local_files_only=True,
        )
    except Exception:
        return OmniVoice.from_pretrained(model_id, device_map=device, dtype=dtype)


def get_or_create_prompt(model, ref_audio: str, ref_text: str, cache_dir: str | None) -> VoiceClonePrompt:
    abs_ref = os.path.abspath(ref_audio)
    mtime = os.path.getmtime(abs_ref)
    clean_ref_text = (ref_text or "").strip()
    sig_src = f"{abs_ref}|{mtime:.3f}|{clean_ref_text}"
    key = hashlib.sha256(sig_src.encode("utf-8")).hexdigest()

    if key in _PROMPT_MEM_CACHE:
        return _PROMPT_MEM_CACHE[key]

    pt_path = None
    if cache_dir:
        os.makedirs(cache_dir, exist_ok=True)
        pt_path = os.path.join(cache_dir, f"voice_prompt_{key[:16]}.pt")
        if os.path.isfile(pt_path):
            try:
                prompt = VoiceClonePrompt.load(pt_path, map_location="cpu")
                _PROMPT_MEM_CACHE[key] = prompt
                return prompt
            except Exception:
                pass

    prompt = model.create_voice_clone_prompt(
        ref_audio=abs_ref,
        ref_text=clean_ref_text or None,
        preprocess_prompt=not bool(clean_ref_text),
    )
    _PROMPT_MEM_CACHE[key] = prompt
    if pt_path:
        try:
            prompt.save(pt_path)
        except Exception:
            pass
    return prompt


def synthesize_one(
    model,
    sr: int,
    input_path: str,
    output_path: str,
    ref_audio: str,
    ref_text: str,
    cache_dir: str | None,
    language: str = "pt",
    num_step: int = 20,
    guidance: float = 2.0,
    speed: float = 1.0,
):
    with open(input_path, encoding="utf-8") as f:
        text = f.read().strip()
    chunks = split_chunks(text, target=210)
    if not chunks:
        raise ValueError("Texto vazio para clonagem.")

    prompt = get_or_create_prompt(model, ref_audio, ref_text, cache_dir)
    gen_cfg = OmniVoiceGenerationConfig(
        num_step=int(num_step),
        guidance_scale=float(guidance),
        denoise=True,
        preprocess_prompt=False,
        postprocess_output=False,
    )
    eff_speed = float(speed) if abs(float(speed) - 1.0) > 0.01 else None
    pause = np.zeros(int(0.16 * sr), dtype=np.float32)

    segments: list[np.ndarray] = []
    batch_size = 4
    for start in range(0, len(chunks), batch_size):
        batch_chunks = chunks[start : start + batch_size]
        audios = model.generate(
            text=batch_chunks,
            language=language or "pt",
            voice_clone_prompt=prompt,
            speed=eff_speed,
            generation_config=gen_cfg,
        )
        for j, audio_tensor in enumerate(audios):
            wav = audio_tensor.squeeze(0).detach().cpu().numpy().astype(np.float32)
            segments.append(wav)
            is_last = (start + j) == (len(chunks) - 1)
            if not is_last:
                segments.append(pause)

    full_wav = np.concatenate(segments) if len(segments) > 1 else segments[0]
    peak = float(np.max(np.abs(full_wav))) if full_wav.size else 0.0
    if peak > 0.01:
        full_wav = full_wav * (0.90 / peak)

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    sf.write(output_path, full_wav, sr, subtype="PCM_16")
    return len(full_wav) / sr, len(chunks)


def run_worker(args):
    protocol_out = sys.__stdout__
    sys.stdout = sys.stderr

    device = args.device or ("cuda" if torch.cuda.is_available() else "cpu")
    model = load_model(args.model, device)
    sr = int(getattr(model, "sampling_rate", 24000))

    # Pré-aquece a voz padrão em segundo plano se fornecida
    if args.ref_audio and os.path.isfile(args.ref_audio):
        try:
            get_or_create_prompt(model, args.ref_audio, args.ref_text, args.cache_dir)
        except Exception:
            pass

    protocol_out.write(json.dumps({"ready": True, "device": device}) + "\n")
    protocol_out.flush()

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        req_id = None
        try:
            req = json.loads(line)
            req_id = req.get("id")
            if req.get("cmd") == "shutdown":
                protocol_out.write(json.dumps({"id": req_id, "ok": True}) + "\n")
                protocol_out.flush()
                break
            dur, n_chunks = synthesize_one(
                model=model,
                sr=sr,
                input_path=req["input"],
                output_path=req["output"],
                ref_audio=req.get("ref_audio") or args.ref_audio,
                ref_text=req.get("ref_text") if req.get("ref_text") is not None else args.ref_text,
                cache_dir=args.cache_dir,
                language=req.get("language") or args.language or "pt",
                num_step=int(req.get("num_step") or args.num_step),
                guidance=float(req.get("guidance") or args.guidance),
                speed=float(req.get("speed") or args.speed),
            )
            protocol_out.write(json.dumps({"id": req_id, "ok": True, "dur": round(dur, 2), "chunks": n_chunks}) + "\n")
            protocol_out.flush()
        except Exception as exc:
            protocol_out.write(json.dumps({"id": req_id, "ok": False, "error": str(exc)}) + "\n")
            protocol_out.flush()


def main():
    parser = argparse.ArgumentParser(description="OmniVoice Zero-Shot Voice Cloning CLI")
    parser.add_argument("--input", help="Arquivo texto UTF-8 de entrada")
    parser.add_argument("--output", help="Arquivo WAV de saída")
    parser.add_argument("--ref-audio", default="", help="WAV de referência limpa da professora")
    parser.add_argument("--ref-text", default="", help="Transcrição exata da referência")
    parser.add_argument("--cache-dir", default=None, help="Diretório para cache de VoiceClonePrompt (.pt)")
    parser.add_argument("--model", default="k2-fsa/OmniVoice")
    parser.add_argument("--device", default=None)
    parser.add_argument("--language", default="pt")
    parser.add_argument("--num-step", type=int, default=20)
    parser.add_argument("--guidance", type=float, default=2.0)
    parser.add_argument("--speed", type=float, default=1.0)
    parser.add_argument("--worker", action="store_true", help="Executa em modo daemon stdin/stdout JSONL")
    args = parser.parse_args()

    if args.worker:
        run_worker(args)
        return

    if not args.input or not args.output or not args.ref_audio:
        parser.error("--input, --output e --ref-audio são obrigatórios fora do modo --worker.")

    device = args.device or ("cuda" if torch.cuda.is_available() else "cpu")
    model = load_model(args.model, device)
    sr = int(getattr(model, "sampling_rate", 24000))
    dur, n_chunks = synthesize_one(
        model=model,
        sr=sr,
        input_path=args.input,
        output_path=args.output,
        ref_audio=args.ref_audio,
        ref_text=args.ref_text,
        cache_dir=args.cache_dir,
        language=args.language,
        num_step=args.num_step,
        guidance=args.guidance,
        speed=args.speed,
    )
    print(f"OK {args.output} sr={sr} dur={dur:.2f}s chunks={n_chunks} device={device}")


if __name__ == "__main__":
    main()
