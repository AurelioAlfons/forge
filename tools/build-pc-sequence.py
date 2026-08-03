"""Build transparent desktop and mobile assets for the PC scroll sequence."""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


FRAME_COUNT = 51
DESKTOP_SIZE = (1440, 1440)
MOBILE_SIZE = (720, 720)
QA_FRAMES = (1, 13, 25, 38, 51)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=Path("Vid_Frame"))
    parser.add_argument(
        "--output", type=Path, default=Path("public/pc-sequence")
    )
    parser.add_argument("--black", type=int, default=6)
    parser.add_argument("--edge", type=int, default=24)
    parser.add_argument("--soft-radius", type=int, default=2)
    parser.add_argument("--quality", type=int, default=90)
    parser.add_argument("--contact-sheet", type=Path)
    return parser.parse_args()


def validate_tuning(black: int, edge: int, soft_radius: int, quality: int) -> None:
    if not 0 <= black < edge <= 255:
        raise ValueError("expected 0 <= black < edge <= 255")
    if not 0 <= quality <= 100:
        raise ValueError("quality must be between 0 and 100")
    if not 1 <= soft_radius <= 8:
        raise ValueError("soft radius must be between 1 and 8 pixels")


def border_connected_mask(luminance: Image.Image, black: int) -> np.ndarray:
    # turn the threshold into a clean map so floodfill only follows dark pixels
    candidate = luminance.point(lambda value: 0 if value <= black else 255)
    flood = candidate.copy()
    ImageDraw.floodfill(flood, (0, 0), 128, thresh=0)
    return np.asarray(flood) == 128


def matte_frame(
    source: Image.Image, black: int, edge: int, soft_radius: int
) -> Image.Image:
    rgba = source.convert("RGBA")
    luminance_image = rgba.convert("L")
    luminance = np.asarray(luminance_image, dtype=np.float32)
    flooded = border_connected_mask(luminance_image, black)

    # only soften right beside the real background so the mask can't eat the case
    core = Image.fromarray((flooded * 255).astype(np.uint8), "L")
    grown = core.filter(ImageFilter.MaxFilter(soft_radius * 2 + 1))
    fringe = (np.asarray(grown) > 0) & ~flooded & (luminance <= edge)

    # dark outside goes clear, then the last few values ease into the real edge
    alpha = np.full(luminance.shape, 255, dtype=np.uint8)
    transition = np.clip((luminance - black) / (edge - black), 0.0, 1.0)
    alpha[flooded] = 0
    alpha[fringe] = np.rint(transition[fringe] * 255).astype(np.uint8)

    pixels = np.asarray(rgba, dtype=np.uint8).copy()
    partial = fringe & (alpha > 0) & (alpha < 255)

    # pull black spill off only the soft fringe, leave the actual case alone
    if np.any(partial):
        alpha_scale = alpha[partial].astype(np.float32)[:, None] / 255.0
        cleaned = pixels[partial, :3].astype(np.float32) / alpha_scale
        pixels[partial, :3] = np.clip(cleaned, 0, 255).astype(np.uint8)

    pixels[..., 3] = alpha
    return Image.fromarray(pixels, "RGBA")


def numbered_frames(folder: Path) -> list[Path]:
    return sorted(folder.glob("[0-9][0-9][0-9].webp"))


def clear_generated(folder: Path) -> None:
    folder.mkdir(parents=True, exist_ok=True)
    for path in numbered_frames(folder):
        path.unlink()


def save_frame(image: Image.Image, path: Path, quality: int) -> None:
    image.save(path, "WEBP", quality=quality, method=4, exact=True)


def verify_image(path: Path, expected_size: tuple[int, int]) -> None:
    with Image.open(path) as image:
        rgba = image.convert("RGBA")
        if rgba.size != expected_size:
            raise RuntimeError(f"{path}: expected {expected_size}, got {rgba.size}")

        alpha = np.asarray(rgba.getchannel("A"))
        if int(alpha.min()) != 0 or int(alpha.max()) != 255:
            raise RuntimeError(f"{path}: alpha must span 0 through 255")
        width, height = expected_size
        corners = ((0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1))
        if any(alpha[y, x] != 0 for x, y in corners):
            raise RuntimeError(f"{path}: every corner must be transparent")
        if alpha[expected_size[1] // 2, expected_size[0] // 2] == 0:
            raise RuntimeError(f"{path}: centre subject sample is transparent")


def verify_set(folder: Path, expected_size: tuple[int, int]) -> tuple[int, int]:
    files = numbered_frames(folder)
    expected_names = [f"{frame:03}.webp" for frame in range(1, FRAME_COUNT + 1)]
    if [path.name for path in files] != expected_names:
        raise RuntimeError(f"{folder}: expected exactly 001.webp through 051.webp")

    for path in files:
        verify_image(path, expected_size)

    return len(files), sum(path.stat().st_size for path in files)


def checker(size: tuple[int, int], colors: tuple[str, str], cell: int = 48) -> Image.Image:
    background = Image.new("RGB", size, colors[0])
    draw = ImageDraw.Draw(background)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) % 2:
                draw.rectangle((x, y, x + cell - 1, y + cell - 1), fill=colors[1])
    return background


def build_contact_sheet(desktop: Path, destination: Path) -> None:
    preview_size = (360, 360)
    palettes = (("#ffffff", "#e5e5e5"), ("#777777", "#555555"), ("#050505", "#c58a16"))
    sheet = Image.new("RGB", (preview_size[0] * len(QA_FRAMES), preview_size[1] * len(palettes)))

    for column, frame in enumerate(QA_FRAMES):
        with Image.open(desktop / f"{frame:03}.webp") as source:
            cutout = source.convert("RGBA").resize(preview_size, Image.Resampling.LANCZOS)
        for row, palette in enumerate(palettes):
            tile = checker(preview_size, palette).convert("RGBA")
            tile.alpha_composite(cutout)
            sheet.paste(tile.convert("RGB"), (column * preview_size[0], row * preview_size[1]))

    destination.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(destination)


def main() -> None:
    args = parse_args()
    validate_tuning(args.black, args.edge, args.soft_radius, args.quality)

    sources = [args.source / f"{frame:03}.png" for frame in range(1, FRAME_COUNT + 1)]
    missing = [path for path in sources if not path.is_file()]
    if missing:
        raise FileNotFoundError(f"missing source frames: {', '.join(map(str, missing))}")
    if len(sources) != FRAME_COUNT:
        raise RuntimeError(f"expected exactly {FRAME_COUNT} source frames")

    desktop = args.output / "desktop"
    mobile = args.output / "mobile"
    clear_generated(desktop)
    clear_generated(mobile)

    for index, source_path in enumerate(sources, start=1):
        with Image.open(source_path) as source:
            if source.size != DESKTOP_SIZE:
                raise RuntimeError(f"{source_path}: expected {DESKTOP_SIZE}, got {source.size}")
            cutout = matte_frame(source, args.black, args.edge, args.soft_radius)

        desktop_path = desktop / f"{index:03}.webp"
        mobile_path = mobile / f"{index:03}.webp"
        save_frame(cutout, desktop_path, args.quality)
        save_frame(cutout.resize(MOBILE_SIZE, Image.Resampling.LANCZOS), mobile_path, args.quality)
        print(f"built {index:03}/{FRAME_COUNT}", flush=True)

    desktop_count, desktop_bytes = verify_set(desktop, DESKTOP_SIZE)
    mobile_count, mobile_bytes = verify_set(mobile, MOBILE_SIZE)

    if args.contact_sheet:
        build_contact_sheet(desktop, args.contact_sheet)
        print(f"contact sheet: {args.contact_sheet}")

    print(f"desktop: {desktop_count} files, {desktop_bytes / 1_000_000:.2f} MB")
    print(f"mobile: {mobile_count} files, {mobile_bytes / 1_000_000:.2f} MB")


if __name__ == "__main__":
    main()
