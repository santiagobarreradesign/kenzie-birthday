#!/usr/bin/env python3
"""Generate extracted-accessories.ts from manifest."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "public/assets/accessories/extracted-manifest.json"
OUT = ROOT / "lib/constants/extracted-accessories.ts"

CATEGORY = {
    "martini": "party",
    "drink": "party",
    "disco-stars": "party",
    "vintage-hand": "party",
    "vintage-disco-ball": "party",
    "holo-star": "misc",
    "star": "misc",
    "scrap": "misc",
}

LABELS = {
    "martini": "Martini",
    "drink": "Cocktail hand",
    "disco-stars": "Disco star",
    "vintage-hand": "Vintage hand",
    "vintage-disco-ball": "Vintage disco ball",
    "holo-star": "Holo star",
    "star": "Star sticker",
    "scrap": "Scrapbook sticker",
}

SCALE = {
    "martini": 0.55,
    "drink": 0.45,
    "disco-stars": 0.5,
    "vintage-hand": 0.5,
    "vintage-disco-ball": 0.55,
    "holo-star": 0.35,
    "star": 0.38,
    "scrap": 0.42,
}


def prefix(name: str) -> str:
    base = name.replace(".png", "")
    parts = base.rsplit("-", 1)
    if len(parts) == 2 and parts[1].isdigit():
        return parts[0]
    return base


def main():
    items = json.loads(MANIFEST.read_text())
    # Remove merged vintage-disco if split versions exist
    extra = []
    for extra_name in ["vintage-hand-01.png", "vintage-disco-ball-01.png"]:
        p = ROOT / "public/assets/accessories" / extra_name
        if p.exists():
            extra.append({"file": extra_name})

    all_files = {i["file"] for i in items}
    entries = [i for i in items if i["file"] != "vintage-disco-01.png"]
    for e in extra:
        if e["file"] not in all_files:
            entries.append(e)

    lines = [
        'import type { AccessoryDef } from "@/lib/types";',
        "",
        "/** Auto-generated from extracted sticker PNGs */",
        "export const EXTRACTED_ACCESSORIES: AccessoryDef[] = [",
    ]

    for item in sorted(entries, key=lambda x: x["file"]):
        fname = item["file"]
        pf = prefix(fname)
        cat = CATEGORY.get(pf, "misc")
        label_base = LABELS.get(pf, "Sticker")
        num = fname.replace(".png", "").split("-")[-1]
        label = label_base if num == "01" and pf in ("martini", "vintage-hand", "vintage-disco-ball") else f"{label_base} {num}"
        scale = SCALE.get(pf, 0.4)
        aid = fname.replace(".png", "")
        lines.append("  {")
        lines.append(f'    id: "{aid}",')
        lines.append(f'    label: "{label}",')
        lines.append(f'    src: "/assets/accessories/{fname}",')
        lines.append(f'    category: "{cat}",')
        lines.append(f"    defaultScale: {scale},")
        lines.append("  },")

    lines.append("];")
    lines.append("")
    OUT.write_text("\n".join(lines))
    print(f"Wrote {len(entries)} accessories to {OUT}")


if __name__ == "__main__":
    main()
