"""Diagnose the similarity scores of a class's web candidates."""
import io
import json
import os
import sys
import urllib.request

from PIL import Image

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "server"))
from common import build_transform, embed_image, load_backbone  # noqa: E402

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}


def main(cls, cand_file=None):
    cand_file = cand_file or os.path.join(ROOT, "lens_data", "_candidates", cls + ".json")
    urls = json.load(open(cand_file, encoding="utf-8"))
    model = load_backbone("mobilenet_v3_large")
    tr = build_transform()
    hero = Image.open(os.path.join(ROOT, "assets", "images", cls + ".jpg")).convert("RGB")
    anchor = embed_image(model, hero, tr)

    ok = fail = 0
    scores = []
    for u in urls:
        try:
            req = urllib.request.Request(u, headers=UA)
            data = urllib.request.urlopen(req, timeout=15).read(6_000_000)
            img = Image.open(io.BytesIO(data)).convert("RGB")
            ok += 1
        except Exception as e:  # noqa: BLE001
            fail += 1
            continue
        s = float(anchor @ embed_image(model, img, tr))
        scores.append(s)
    scores.sort(reverse=True)
    print(f"{cls}: urls={len(urls)} downloaded={ok} failed={fail}")
    print("top scores:", " ".join(f"{s:.2f}" for s in scores[:25]))
    print(">=0.62:", sum(s >= 0.62 for s in scores),
          " >=0.55:", sum(s >= 0.55 for s in scores),
          " >=0.50:", sum(s >= 0.50 for s in scores))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
