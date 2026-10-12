"""Build a contact sheet for any folder of images (for visual checking)."""
import os
import sys

from PIL import Image, ImageDraw

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

CELL = 200
COLS = 6


def sheet(folder, out):
    files = sorted(f for f in os.listdir(folder)
                   if f.lower().endswith((".jpg", ".jpeg", ".png")))
    rows = (len(files) + COLS - 1) // COLS or 1
    canvas = Image.new("RGB", (COLS * CELL, rows * (CELL + 18)), (30, 34, 45))
    draw = ImageDraw.Draw(canvas)
    for i, name in enumerate(files):
        r, c = divmod(i, COLS)
        x, y = c * CELL, r * (CELL + 18)
        try:
            im = Image.open(os.path.join(folder, name)).convert("RGB")
            im.thumbnail((CELL - 6, CELL - 6))
            canvas.paste(im, (x + 3, y + 3))
        except Exception:  # noqa: BLE001
            draw.text((x + 6, y + 6), "ERR", fill=(255, 80, 80))
        draw.text((x + 3, y + CELL + 2), f"{i:02d} {name[:24]}", fill=(220, 220, 220))
    canvas.save(out)
    print("saved", out, len(files), "files")


if __name__ == "__main__":
    sheet(sys.argv[1], sys.argv[2])
