"""Re-encode the PC scroll sequence PNGs to WebP without touching the pixels.

No matting, no alpha, no resize, no crop. Same image, smaller container. Every
frame is re-opened after writing and checked against its source, and the run
fails if any frame drops below the PSNR floor.
"""

from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image


SETS = ("Vid_80_Final", "Vid_B")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=Path("public/pc-sequence"))
    parser.add_argument("--output", type=Path, default=Path("public/pc-sequence"))
    # 88 looked fine on a sample but the fan close-ups dropped under 44 dB, so
    # the default sits where every frame actually clears the floor
    parser.add_argument("--quality", type=int, default=93)
    parser.add_argument("--method", type=int, default=6)
    parser.add_argument("--min-psnr", type=float, default=44.0)
    return parser.parse_args()


def validate_tuning(quality: int, method: int, min_psnr: float) -> None:
    if not 0 <= quality <= 100:
        raise ValueError("quality must be between 0 and 100")
    if not 0 <= method <= 6:
        raise ValueError("method must be between 0 and 6")
    if not 0 < min_psnr <= 100:
        raise ValueError("min psnr must be between 0 and 100")


def psnr(source: np.ndarray, encoded: np.ndarray) -> float:
    # identical files would divide by zero, so call that a clean pass
    mse = float(np.mean((source - encoded) ** 2))
    if mse == 0:
        return math.inf
    return 20 * math.log10(255.0) - 10 * math.log10(mse)


def encode_frame(
    png_path: Path, webp_path: Path, quality: int, method: int
) -> tuple[int, int, float]:
    with Image.open(png_path) as source_image:
        source = source_image.convert("RGB")
        source_size = source.size
        source_image.load()
        source.save(webp_path, "WEBP", quality=quality, method=method, lossless=False)
        source_pixels = np.asarray(source, dtype=np.float32)

    # read it back rather than trusting the encoder — a bad frame has to fail here
    with Image.open(webp_path) as encoded_image:
        if encoded_image.size != source_size:
            raise ValueError(
                f"{webp_path.name}: {encoded_image.size} does not match "
                f"source {source_size}"
            )
        encoded_pixels = np.asarray(encoded_image.convert("RGB"), dtype=np.float32)

    return (
        png_path.stat().st_size,
        webp_path.stat().st_size,
        psnr(source_pixels, encoded_pixels),
    )


def convert_set(
    name: str, source_dir: Path, output_dir: Path, args: argparse.Namespace
) -> tuple[int, int, int, float, float]:
    frames = sorted(source_dir.glob("*.png"))
    if not frames:
        raise FileNotFoundError(f"no PNGs in {source_dir}")

    output_dir.mkdir(parents=True, exist_ok=True)
    source_bytes = 0
    output_bytes = 0
    scores: list[float] = []
    failures: list[str] = []

    for png_path in frames:
        webp_path = output_dir / f"{png_path.stem}.webp"
        png_bytes, webp_bytes, score = encode_frame(
            png_path, webp_path, args.quality, args.method
        )
        source_bytes += png_bytes
        output_bytes += webp_bytes
        scores.append(score)
        if score < args.min_psnr:
            failures.append(f"{name}/{png_path.name}: {score:.2f} dB")

    if failures:
        raise ValueError(
            "frames below the PSNR floor:\n  " + "\n  ".join(failures)
        )

    finite = [s for s in scores if math.isfinite(s)]
    return (
        len(frames),
        source_bytes,
        output_bytes,
        min(finite) if finite else math.inf,
        sum(finite) / len(finite) if finite else math.inf,
    )


def main() -> int:
    args = parse_args()
    validate_tuning(args.quality, args.method, args.min_psnr)

    total_source = 0
    total_output = 0
    total_frames = 0

    for name in SETS:
        frames, source_bytes, output_bytes, min_psnr, mean_psnr = convert_set(
            name, args.source / name, args.output / name, args
        )
        total_frames += frames
        total_source += source_bytes
        total_output += output_bytes
        print(
            f"{name}: {frames} frames, {source_bytes:,} -> {output_bytes:,} bytes "
            f"({output_bytes / source_bytes:.1%}), "
            f"psnr min {min_psnr:.2f} dB / mean {mean_psnr:.2f} dB"
        )

    print(
        f"total: {total_frames} frames, {total_source:,} -> {total_output:,} bytes "
        f"({total_output / total_source:.1%})"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
