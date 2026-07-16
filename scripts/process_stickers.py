#!/usr/bin/env python3
"""Remove backgrounds and extract individual sticker items from collage images."""

from __future__ import annotations

import json
import os
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ASSETS_IN = Path(
    "/Users/santiagobarrera/.cursor/projects/Users-santiagobarrera-Desktop-Personal-Kenzie-Birthday/assets"
)
OUT_DIR = Path(
    "/Users/santiagobarrera/Desktop/Personal/Kenzie Birthday/public/assets/accessories"
)
MANIFEST = OUT_DIR / "extracted-manifest.json"

# User-provided source images (new batch)
SOURCE_FILES = [
    "download__2_-6f4b263c-ded4-4af4-aa85-a9eb73c0bfe4.png",  # martini hand
    "28a505c86ad5c2f5332ae9f4d3b84565-8ab58b42-ac88-4ce9-9993-5de440b31249.png",  # disco + stars
    "1a20c8a1fe07003fe15a17dad6fd02bc-e800324c-13cf-4354-b11f-1a41ab106479.png",  # holo stars grid
    "download__3_-cf8586cf-8c4f-4e4c-ac2b-6add4d80f8f2.png",  # drink hands collage
    "download__1_-d32dfdf7-8475-47a8-b1f7-1f79f8f677cc.png",  # vintage hand disco
    "download__4_-20533098-1c05-4f1b-9b61-a3b40fcd4d8e.png",  # mixed stars
    "download-8c0accf7-130e-4e71-88cc-54dcef849cbb.png",  # scrapbook elements
]

SOURCE_PREFIX = {
    "download__2_-6f4b263c-ded4-4af4-aa85-a9eb73c0bfe4.png": "martini",
    "28a505c86ad5c2f5332ae9f4d3b84565-8ab58b42-ac88-4ce9-9993-5de440b31249.png": "disco-stars",
    "1a20c8a1fe07003fe15a17dad6fd02bc-e800324c-13cf-4354-b11f-1a41ab106479.png": "holo-star",
    "download__3_-cf8586cf-8c4f-4e4c-ac2b-6add4d80f8f2.png": "drink",
    "download__1_-d32dfdf7-8475-47a8-b1f7-1f79f8f677cc.png": "vintage-disco",
    "download__4_-20533098-1c05-4f1b-9b61-a3b40fcd4d8e.png": "star",
    "download-8c0accf7-130e-4e71-88cc-54dcef849cbb.png": "scrap",
}

# Per-source tuning
CONFIG = {
    "download__2_-6f4b263c-ded4-4af4-aa85-a9eb73c0bfe4.png": {
        "bg_threshold": 235,
        "min_area_ratio": 0.02,
        "padding": 12,
        "merge_distance": 0,
    },
    "28a505c86ad5c2f5332ae9f4d3b84565-8ab58b42-ac88-4ce9-9993-5de440b31249.png": {
        "bg_threshold": 230,
        "min_area_ratio": 0.008,
        "padding": 8,
        "merge_distance": 0,
        "split_large_ratio": 0.25,  # split big blobs via erosion
    },
    "1a20c8a1fe07003fe15a17dad6fd02bc-e800324c-13cf-4354-b11f-1a41ab106479.png": {
        "bg_threshold": 238,
        "min_area_ratio": 0.0015,
        "padding": 6,
        "merge_distance": 0,
    },
    "download__3_-cf8586cf-8c4f-4e4c-ac2b-6add4d80f8f2.png": {
        "bg_threshold": 232,
        "min_area_ratio": 0.012,
        "padding": 10,
        "merge_distance": 0,
    },
    "download__1_-d32dfdf7-8475-47a8-b1f7-1f79f8f677cc.png": {
        "bg_threshold": 200,
        "min_area_ratio": 0.015,
        "padding": 10,
        "merge_distance": 0,
        "gray_bg": True,
    },
    "download__4_-20533098-1c05-4f1b-9b61-a3b40fcd4d8e.png": {
        "bg_threshold": 235,
        "min_area_ratio": 0.004,
        "padding": 8,
        "merge_distance": 0,
    },
    "download-8c0accf7-130e-4e71-88cc-54dcef849cbb.png": {
        "bg_threshold": 232,
        "min_area_ratio": 0.005,
        "padding": 8,
        "merge_distance": 0,
    },
}


def rgba_from_rgb(img: Image.Image) -> Image.Image:
    return img.convert("RGBA")


def remove_background(img: Image.Image, threshold: int, gray_bg: bool = False) -> Image.Image:
    rgba = np.array(rgba_from_rgb(img), dtype=np.uint8)
    rgb = rgba[..., :3].astype(np.float32)

    if gray_bg:
        # Light gray studio background
        brightness = rgb.mean(axis=2)
        mask = brightness < threshold
        # Also catch near-white cutout borders
        whiteness = rgb.min(axis=2)
        mask |= whiteness < 210
    else:
        # White background: high brightness + low saturation spread
        brightness = rgb.mean(axis=2)
        spread = rgb.max(axis=2) - rgb.min(axis=2)
        mask = (brightness > threshold) & (spread < 35)
        mask = ~mask

    # Clean mask
    alpha = (mask.astype(np.uint8) * 255)
    alpha_img = Image.fromarray(alpha, mode="L")
    alpha_img = alpha_img.filter(ImageFilter.MinFilter(3))
    alpha_img = alpha_img.filter(ImageFilter.MaxFilter(3))

    rgba[..., 3] = np.array(alpha_img, dtype=np.uint8)
    return Image.fromarray(rgba, mode="RGBA")


def connected_components(mask: np.ndarray) -> list[tuple[int, int, int, int, int]]:
    """Return list of (label, x0, y0, x1, y1, area) using simple flood labeling."""
    h, w = mask.shape
    visited = np.zeros_like(mask, dtype=bool)
    components: list[tuple[int, int, int, int, int]] = []

    for y in range(h):
        for x in range(w):
            if not mask[y, x] or visited[y, x]:
                continue
            stack = [(x, y)]
            visited[y, x] = True
            min_x = max_x = x
            min_y = max_y = y
            area = 0
            while stack:
                cx, cy = stack.pop()
                area += 1
                min_x = min(min_x, cx)
                max_x = max(max_x, cx)
                min_y = min(min_y, cy)
                max_y = max(max_y, cy)
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h and mask[ny, nx] and not visited[ny, nx]:
                        visited[ny, nx] = True
                        stack.append((nx, ny))
            components.append((min_x, min_y, max_x + 1, max_y + 1, area))
    return components


def split_large_blob(
    rgba: Image.Image, bbox: tuple[int, int, int, int], area: int, img_area: int
) -> list[tuple[int, int, int, int, int]]:
    """Try to split overlapping items in large blobs via alpha erosion."""
    if area / img_area < 0.25:
        return [(*bbox, area)]

    x0, y0, x1, y1 = bbox
    crop = rgba.crop((x0, y0, x1, y1))
    alpha = np.array(crop.split()[-1]) > 40

    eroded = alpha.copy()
    for _ in range(10):
        eroded[1:-1, 1:-1] &= (
            eroded[:-2, 1:-1]
            & eroded[2:, 1:-1]
            & eroded[1:-1, :-2]
            & eroded[1:-1, 2:]
        )

    comps = connected_components(eroded)
    results = []
    for cx0, cy0, cx1, cy1, a in comps:
        if a < 200:
            continue
        results.append((x0 + cx0, y0 + cy0, x0 + cx1, y0 + cy1, a))
    return results if len(results) > 1 else [(*bbox, area)]


def extract_items(path: Path, cfg: dict, prefix: str) -> list[dict]:
    img = Image.open(path)
    rgba = remove_background(img, cfg["bg_threshold"], cfg.get("gray_bg", False))
    alpha = np.array(rgba.split()[-1]) > 40
    img_area = alpha.size
    min_area = int(img_area * cfg["min_area_ratio"])

    raw_comps = connected_components(alpha)
    bboxes: list[tuple[int, int, int, int, int]] = []

    for x0, y0, x1, y1, area in raw_comps:
        if area < min_area:
            continue
        if cfg.get("split_large_ratio") and area / img_area > cfg["split_large_ratio"]:
            try:
                bboxes.extend(
                    split_large_blob(rgba, (x0, y0, x1, y1), area, img_area)
                )
                continue
            except ImportError:
                pass
        bboxes.append((x0, y0, x1, y1, area))

    bboxes.sort(key=lambda b: (-b[4], b[1], b[0]))
    items: list[dict] = []
    pad = cfg["padding"]
    w, h = rgba.size

    for i, (x0, y0, x1, y1, area) in enumerate(bboxes):
        x0 = max(0, x0 - pad)
        y0 = max(0, y0 - pad)
        x1 = min(w, x1 + pad)
        y1 = min(h, y1 + pad)
        crop = rgba.crop((x0, y0, x1, y1))
        # Trim transparent margins
        bbox = crop.getbbox()
        if not bbox:
            continue
        crop = crop.crop(bbox)

        name = f"{prefix}-{i + 1:02d}.png"
        out_path = OUT_DIR / name
        crop.save(out_path, optimize=True)
        items.append(
            {
                "file": name,
                "source": path.name,
                "bbox": [x0, y0, x1, y1],
                "area": area,
                "size": list(crop.size),
            }
        )
    return items


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest: list[dict] = []

    for fname in SOURCE_FILES:
        path = ASSETS_IN / fname
        if not path.exists():
            print(f"SKIP missing: {fname}")
            continue
        prefix = SOURCE_PREFIX[fname]
        cfg = CONFIG[fname]
        items = extract_items(path, cfg, prefix)
        print(f"{fname}: extracted {len(items)} items")
        manifest.extend(items)

    MANIFEST.write_text(json.dumps(manifest, indent=2))
    print(f"Total: {len(manifest)} stickers -> {OUT_DIR}")
    print(f"Manifest: {MANIFEST}")


if __name__ == "__main__":
    main()
