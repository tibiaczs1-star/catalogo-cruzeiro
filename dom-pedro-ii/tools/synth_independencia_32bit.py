"""Sintetizador 32-bit estéreo orquestral (estilo PS1/Saturn/GBA Golden Era)
para o refrão do Hino da Independência do Brasil (D. Pedro I / Evaristo da Veiga):
"Ou ficar a Pátria livre, ou morrer pelo Brasil!" (2x).
"""
import os
import numpy as np
import soundfile as sf

SR = 32000
BPM = 122.0
BEAT_SEC = 60.0 / BPM

NOTE_OFFSETS = {
    "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3,
    "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8,
    "A": 9, "A#": 10, "Bb": 10, "B": 11,
}


def note_freq(name: str) -> float:
    if name in ("R", "REST", None, ""):
        return 0.0
    octave = int(name[-1])
    pitch = name[:-1]
    midi = (octave + 1) * 12 + NOTE_OFFSETS[pitch]
    return 440.0 * (2.0 ** ((midi - 69) / 12.0))


# Refrão exato em Ré Maior (D Major) — 2 repetições de "Ou ficar a Pátria livre, ou morrer pelo Brasil!"
# Cada tupla: (nota, duracao_em_tempos, chord_name, is_second_pass)
MELODY_PHRASES = [
    # 1ª vez: "Ou ficar a Pátria livre" (4 tempos)
    ("F#4", 0.50, "F#7", False),
    ("F#4", 0.25, "F#7", False),
    ("F#4", 0.25, "F#7", False),
    ("F#4", 0.50, "F#7", False),
    ("F#4", 0.50, "Bm", False),
    ("G#4", 0.25, "Bm", False),
    ("A#4", 0.25, "Bm", False),
    ("B4",  0.25, "G#dim7", False),
    ("C#5", 0.25, "G#dim7", False),
    ("D5",  1.00, "G#dim7", False),

    # 1ª vez: "Ou morrer pelo Brasil" (4 tempos)
    ("C#5", 0.50, "D/A", False),
    ("B4",  0.50, "D/A", False),
    ("A4",  0.75, "A7", False),
    ("G4",  0.25, "A7", False),
    ("F#4", 0.50, "A7", False),
    ("E4",  0.50, "A7", False),
    ("D4",  1.00, "D", False),

    # 2ª vez (épica com dobra de oitava e cordas): "Ou ficar a Pátria livre" (4 tempos)
    ("D5",  0.50, "G", True),
    ("D5",  0.50, "G", True),
    ("E5",  0.50, "G#dim7", True),
    ("D5",  0.50, "G#dim7", True),
    ("C#5", 0.50, "D/A", True),
    ("B4",  0.50, "D/A", True),
    ("A4",  0.50, "D/A", True),
    ("D5",  0.50, "D/A", True),

    # 2ª vez: "Ou morrer pelo Brasil!" (4 tempos + acorde final sustentado)
    ("C#5", 0.50, "A7", True),
    ("B4",  0.50, "A7", True),
    ("A4",  0.75, "A7", True),
    ("G4",  0.25, "A7", True),
    ("F#4", 0.50, "A7", True),
    ("E4",  0.50, "A7", True),
    ("D4",  2.00, "D", True),
]

CHORDS = {
    "D":      ("D2",  "A2", ("D3", "F#3", "A3", "D4")),
    "D/A":    ("A2",  "D2", ("D3", "F#3", "A3", "D4")),
    "A7":     ("A2",  "E2", ("E3", "G3", "C#4", "E4")),
    "G":      ("G2",  "D3", ("G3", "B3", "D4", "G4")),
    "Bm":     ("B2",  "F#2", ("D3", "F#3", "B3", "D4")),
    "F#7":    ("F#2", "C#3", ("E3", "F#3", "A#3", "C#4")),
    "G#dim7": ("G#2", "D3", ("F3", "G#3", "B3", "D4")),
}


def synth_orchestral_brass(freq: float, dur_s: float, bright_boost: float = 1.0) -> np.ndarray:
    """Metais 32-bit estilo rompler orquestral (leve detune estéreo + ataque de sopro)."""
    n = max(1, int(dur_s * SR))
    t = np.arange(n, dtype=np.float64) / SR
    vib_depth = 0.0042 if dur_s >= 0.30 else 0.0
    vib = 1.0 + vib_depth * np.sin(2.0 * np.pi * 5.6 * t) * np.minimum(1.0, t / 0.14)
    phase1 = 2.0 * np.pi * np.cumsum(freq * vib) / SR
    phase2 = 2.0 * np.pi * np.cumsum(freq * 1.0022 * vib) / SR

    brass_env = (1.0 - np.exp(-t * 55.0)) * (0.48 + 0.52 * np.exp(-t * 3.1))
    harm_decay = np.exp(-t * 2.8) * bright_boost

    w1 = (
        0.54 * np.sin(phase1)
        + 0.31 * np.sin(2.0 * phase1) * (0.55 + 0.45 * harm_decay)
        + 0.19 * np.sin(3.0 * phase1) * (0.42 + 0.58 * harm_decay)
        + 0.11 * np.sin(4.0 * phase1) * harm_decay
        + 0.06 * np.sin(5.0 * phase1) * harm_decay
    )
    w2 = (
        0.52 * np.sin(phase2 + 0.3)
        + 0.28 * np.sin(2.0 * phase2 + 0.3) * (0.55 + 0.45 * harm_decay)
        + 0.15 * np.sin(3.0 * phase2 + 0.3) * harm_decay
    )
    wave = 0.62 * w1 + 0.38 * w2

    atk = min(n, int(0.014 * SR))
    rel = min(n, int(0.040 * SR))
    env = brass_env.copy()
    if atk > 1:
        env[:atk] *= np.linspace(0.0, 1.0, atk)
    if rel > 1:
        env[-rel:] *= np.linspace(1.0, 0.0, rel)
    return wave * env


def synth_strings_ensemble(freqs: list[float], dur_s: float) -> np.ndarray:
    """Cordas sinfônicas 32-bit em bloco harmônico suave."""
    n = max(1, int(dur_s * SR))
    t = np.arange(n, dtype=np.float64) / SR
    mix = np.zeros(n, dtype=np.float64)
    for idx, f in enumerate(freqs):
        det = 1.0 + (idx - 1.5) * 0.0018
        ph = 2.0 * np.pi * f * det * t
        mix += (
            0.60 * np.sin(ph)
            + 0.24 * np.sin(2.0 * ph + 0.4)
            + 0.11 * np.sin(3.0 * ph + 0.9)
            + 0.05 * np.sin(4.0 * ph)
        )
    mix /= max(1, len(freqs))
    atk = min(n, int(0.045 * SR))
    rel = min(n, int(0.090 * SR))
    env = 0.78 + 0.22 * np.exp(-t * 1.4)
    if atk > 1:
        env[:atk] *= np.linspace(0.0, 1.0, atk)
    if rel > 1:
        env[-rel:] *= np.linspace(1.0, 0.0, rel)
    return mix * env


def synth_tuba_bass(freq: float, dur_s: float) -> np.ndarray:
    n = max(1, int(dur_s * SR))
    t = np.arange(n, dtype=np.float64) / SR
    ph = 2.0 * np.pi * freq * t
    wave = 0.74 * np.sin(ph) + 0.22 * np.sin(2.0 * ph) + 0.08 * np.sin(3.0 * ph)
    atk = min(n, int(0.010 * SR))
    rel = min(n, int(0.045 * SR))
    env = 0.85 * np.exp(-t * 2.1) + 0.15
    if atk > 1:
        env[:atk] *= np.linspace(0.0, 1.0, atk)
    if rel > 1:
        env[-rel:] *= np.linspace(1.0, 0.0, rel)
    return wave * env


def synth_timpani(freq: float, dur_s: float = 0.48) -> np.ndarray:
    n = max(1, int(dur_s * SR))
    t = np.arange(n, dtype=np.float64) / SR
    f_curve = freq * (1.0 + 0.14 * np.exp(-t * 32.0))
    ph = 2.0 * np.pi * np.cumsum(f_curve) / SR
    body = 0.78 * np.sin(ph) + 0.24 * np.sin(1.5 * ph) + 0.12 * np.sin(2.0 * ph)
    atk = min(n, int(0.005 * SR))
    env = np.exp(-t * 5.8)
    if atk > 1:
        env[:atk] *= np.linspace(0.0, 1.0, atk)
    return body * env


def synth_snare(rng: np.random.Generator, dur_s: float = 0.10, amp: float = 1.0) -> np.ndarray:
    n = max(1, int(dur_s * SR))
    t = np.arange(n, dtype=np.float64) / SR
    noise = rng.standard_normal(n)
    bp = np.convolve(noise, [0.22, -0.44, 0.22], mode="same")
    body = 0.36 * np.sin(2.0 * np.pi * 198.0 * t) * np.exp(-t * 45.0)
    env = np.exp(-t * 32.0)
    return (0.76 * bp * env + body) * amp


def synth_kick(dur_s: float = 0.15) -> np.ndarray:
    n = max(1, int(dur_s * SR))
    t = np.arange(n, dtype=np.float64) / SR
    f = 132.0 * np.exp(-t * 26.0) + 46.0
    ph = 2.0 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 17.0)


def synth_crash(rng: np.random.Generator, dur_s: float = 0.65) -> np.ndarray:
    n = max(1, int(dur_s * SR))
    t = np.arange(n, dtype=np.float64) / SR
    noise = rng.standard_normal(n)
    hp = np.diff(noise, prepend=0.0)
    shimmer = 0.16 * np.sin(2.0 * np.pi * 3100.0 * t) * np.exp(-t * 9.0)
    return (hp * 0.44 + shimmer) * np.exp(-t * 5.2)


def render_independencia_32bit() -> np.ndarray:
    rng = np.random.default_rng(1822)
    pickup_beats = 0.50
    melody_beats = sum(d for _, d, _, _ in MELODY_PHRASES)
    total_beats = pickup_beats + melody_beats
    total_sec = total_beats * BEAT_SEC + 0.68
    total_n = int(total_sec * SR)

    left = np.zeros(total_n, dtype=np.float64)
    right = np.zeros(total_n, dtype=np.float64)

    def add_mono(start_n: int, sig: np.ndarray, gain: float, pan: float = 0.5):
        end_n = min(total_n, start_n + len(sig))
        if start_n >= total_n or end_n <= start_n:
            return
        seg = sig[: end_n - start_n] * gain
        left[start_n:end_n] += seg * np.cos(pan * np.pi * 0.5)
        right[start_n:end_n] += seg * np.sin(pan * np.pi * 0.5)

    # 1. Breve rufo de caixa marcial na entrada (0.5 tempo)
    for sub, amp in ((0.00, 0.55), (0.12, 0.65), (0.24, 0.78), (0.36, 0.92)):
        add_mono(int(sub * BEAT_SEC * SR), synth_snare(rng, 0.08, amp), 0.22, pan=0.40)

    # 2. Melodia principal (Trompete + dobra orquestral na 2ª repetição)
    beat_cursor = pickup_beats
    chord_timeline = []
    second_pass_start = None
    final_beat = None

    for idx, (note, beats, chord_name, is_second) in enumerate(MELODY_PHRASES):
        if is_second and second_pass_start is None:
            second_pass_start = beat_cursor
        if idx == len(MELODY_PHRASES) - 1:
            final_beat = beat_cursor
        freq = note_freq(note)
        dur_s = max(0.08, beats * BEAT_SEC * (0.96 if beats >= 0.7 else 0.92))
        s_idx = int(beat_cursor * BEAT_SEC * SR)
        if freq > 0:
            lead = synth_orchestral_brass(freq, dur_s, bright_boost=1.15 if is_second else 1.0)
            add_mono(s_idx, lead, 0.44 if is_second else 0.48, pan=0.46)
            if is_second:
                # Dobra épica uma oitava acima ou terça harmônica na 2ª repetição
                octave_freq = freq * 2.0 if freq < 520.0 else freq * 0.5
                dbl = synth_orchestral_brass(octave_freq, dur_s, bright_boost=1.1)
                add_mono(s_idx, dbl, 0.20, pan=0.58)
        chord_timeline.append((beat_cursor, chord_name, is_second))
        beat_cursor += beats

    # Fanfarra final em acorde D Maior no último tempo sustentado
    if final_beat is not None:
        end_idx = int(final_beat * BEAT_SEC * SR)
        chord_dur = 2.0 * BEAT_SEC + 0.35
        for f_note, pan in (("D4", 0.35), ("F#4", 0.50), ("A4", 0.65), ("D5", 0.52)):
            add_mono(end_idx, synth_orchestral_brass(note_freq(f_note), chord_dur, 1.2), 0.16, pan=pan)
        add_mono(end_idx, synth_timpani(note_freq("D2"), 0.70), 0.42, pan=0.45)
        add_mono(end_idx, synth_crash(rng, 0.85), 0.28, pan=0.62)

    # 3. Cordas sinfônicas por bloco harmônico
    for i, (b_start, chord_name, is_second) in enumerate(chord_timeline):
        b_next = chord_timeline[i + 1][0] if i + 1 < len(chord_timeline) else total_beats
        if i > 0 and chord_timeline[i - 1][1] == chord_name and chord_timeline[i - 1][2] == is_second:
            continue
        # Junta tempos contíguos do mesmo acorde
        j = i + 1
        while j < len(chord_timeline) and chord_timeline[j][1] == chord_name and chord_timeline[j][2] == is_second:
            j += 1
        b_end = chord_timeline[j][0] if j < len(chord_timeline) else total_beats
        dur_s = max(0.18, (b_end - b_start) * BEAT_SEC)
        freqs = [note_freq(x) for x in CHORDS[chord_name][2]]
        str_sig = synth_strings_ensemble(freqs, dur_s)
        s_idx = int(b_start * BEAT_SEC * SR)
        add_mono(s_idx, str_sig, 0.26 if is_second else 0.21, pan=0.35)
        add_mono(s_idx, str_sig, 0.26 if is_second else 0.21, pan=0.65)

    # 4. Baixo/Tuba, Tímpano e Percussão de Marcha em 4/4
    def chord_at(b: float) -> tuple[str, bool]:
        chosen = ("F#7", False)
        for bc, ch, sec in chord_timeline:
            if bc <= b + 0.02:
                chosen = (ch, sec)
            else:
                break
        return chosen

    n_beats = int(np.floor(melody_beats))
    for step_b in range(n_beats):
        b_pos = pickup_beats + float(step_b)
        s_idx = int(b_pos * BEAT_SEC * SR)
        chord_name, is_second = chord_at(b_pos)
        chord = CHORDS[chord_name]
        beat_in_bar = step_b % 4
        is_strong = beat_in_bar in (0, 2)

        bass_note = chord[0] if is_strong else chord[1]
        add_mono(s_idx, synth_tuba_bass(note_freq(bass_note), BEAT_SEC * 0.85), 0.36 if is_strong else 0.28, pan=0.50)

        if is_strong:
            add_mono(s_idx, synth_kick(), 0.34, pan=0.50)
            if beat_in_bar == 0 or (second_pass_start is not None and abs(b_pos - second_pass_start) < 0.2):
                add_mono(s_idx, synth_timpani(note_freq(bass_note), 0.42), 0.26, pan=0.46)

        if second_pass_start is not None and abs(b_pos - second_pass_start) < 0.2:
            add_mono(s_idx, synth_crash(rng, 0.65), 0.24, pan=0.64)

        add_mono(s_idx, synth_snare(rng, 0.085, 0.80 if is_strong else 0.95), 0.18, pan=0.38)
        off_idx = s_idx + int(0.5 * BEAT_SEC * SR)
        add_mono(off_idx, synth_snare(rng, 0.065, 0.65), 0.13, pan=0.42)

    # 5. Reverb estéreo estilo SPU 32-bit + masterização sem clipping
    stereo = np.stack([left, right], axis=1)
    wet = np.zeros_like(stereo)
    for delay_s, gain in ((0.023, 0.20), (0.041, 0.14), (0.067, 0.08)):
        d = int(delay_s * SR)
        if d < total_n:
            wet[d:, 0] += stereo[:-d, 1] * gain
            wet[d:, 1] += stereo[:-d, 0] * gain
    out = stereo + wet

    peak = float(np.max(np.abs(out)))
    if peak > 0:
        out = out / peak * 1.12
    out = np.tanh(out * 0.88) / np.tanh(0.88)
    out *= 0.90 / max(1e-6, float(np.max(np.abs(out))))

    fade_n = min(total_n // 10, int(0.18 * SR))
    if fade_n > 1:
        out[-fade_n:] *= np.linspace(1.0, 0.0, fade_n)[:, None]
    return out.astype(np.float32)


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out_wav = os.path.join(root, "assets", "abertura.wav")
    audio = render_independencia_32bit()
    sf.write(out_wav, audio, SR, subtype="PCM_16")
    dur = len(audio) / SR
    rms = float(np.sqrt(np.mean(audio ** 2)))
    peak = float(np.max(np.abs(audio)))
    print(f"Gerado {out_wav}: {dur:.2f}s @ {SR}Hz ch={audio.shape[1]} peak={peak:.3f} rms={rms:.3f}")


if __name__ == "__main__":
    main()
