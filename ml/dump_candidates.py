"""Download every candidate of a class (no filtering) for manual review."""
import io
import json
import os
import sys
import urllib.request

from PIL import Image

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}


def main(cls):
    src = os.path.join(ROOT, "lens_data", "_candidates", cls + ".json")
    urls = json.load(open(src, encoding="utf-8"))
    out = os.path.join(ROOT, "lens_data", "_downloads", cls)
    os.makedirs(out, exist_ok=True)
    n = 0
    for u in urls:
        try:
            data = urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=15).read(6_000_000)
            img = Image.open(io.BytesIO(data)).convert("RGB")
            if min(img.size) < 80:
                continue
            n += 1
            img.save(os.path.join(out, f"c_{n:03d}.jpg"), "JPEG", quality=88)
        except Exception:  # noqa: BLE001
            pass
    print(cls, "->", n, "downloaded to", out)


if __name__ == "__main__":
    main(sys.argv[1])
