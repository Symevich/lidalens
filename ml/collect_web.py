"""Download web candidates and keep only those that show the SAME landmark.

For every sight the LidaGid hero photo (assets/images/<id>.jpg) is the anchor.
Every downloaded candidate (from search-engine JSON and from the Wikimedia
folder) is embedded with the same MobileNetV3 and kept when its cosine
similarity to the anchor clears the class threshold.

Output: lens_data/ref/<id>/web_NNN.jpg and lens_data/ref/<id>/wm_NNN.jpg
"""
import hashlib
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

from common import REF_DIR, build_transform, embed_image, load_backbone  # noqa: E402

CANDS = os.path.join(ROOT, "lens_data", "_candidates")
WIKI = os.path.join(ROOT, "lens_data", "_wikimedia")
MANUAL = os.path.join(ROOT, "lens_data", "_manual")
ASSETS = os.path.join(ROOT, "assets", "images")

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124 Safari/537.36")

CLASSES = [
    "lidski-zamak",
    "kasciol-uzvyszennia-sviatoha-kryzha",
    "sviata-michajlauski-kafedralny-sabor",
    "carkva-usich-sviatych",
    "kurhan-neumiruczasci",
    "pomnik-francysku-skarynu",
    "kamandzirovaczny",
    "kamien-u-honar-zasnavannia-lidy",
]

CAND_FILES = {"kasciol-uzvyszennia-sviatoha-kryzha": "_yandex_koscio.json"}

# Per-class similarity threshold (a lower bar for hard anchors: an aerial
# hero photo or a small object never matches a ground photo as tightly).
THRESHOLDS = {
    "carkva-usich-sviatych": 0.50,
    "kamien-u-honar-zasnavannia-lidy": 0.55,
    "kurhan-neumiruczasci": 0.52,
}
DEFAULT_THRESHOLD = 0.60


def md5(data):
    return hashlib.md5(data).hexdigest()


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "image/*,*/*"})
    with urllib.request.urlopen(req, timeout=15) as r:
        data = r.read(6_000_000)
    img = Image.open(io.BytesIO(data)).convert("RGB")
    if min(img.size) < 80:
        raise ValueError("too small")
    return img, data


def main():
    model = load_backbone("mobilenet_v3_large")
    transform = build_transform()
    seen = set()
    summary = []

    for cls in CLASSES:
        thr = THRESHOLDS.get(cls, DEFAULT_THRESHOLD)
        anchor = embed_image(
            model, Image.open(os.path.join(ASSETS, cls + ".jpg")).convert("RGB"), transform)

        ref_dir = os.path.join(REF_DIR, cls)
        os.makedirs(ref_dir, exist_ok=True)
        for old in os.listdir(ref_dir):
            if old.startswith(("web_", "wm_", "man_")):
                os.remove(os.path.join(ref_dir, old))
        base = [f for f in os.listdir(ref_dir) if not f.startswith(("web_", "wm_", "man_"))]

        kept = 0

        # ── search-engine candidates ──
        cand_file = os.path.join(CANDS, CAND_FILES.get(cls, cls + ".json"))
        urls = json.load(open(cand_file, encoding="utf-8")) if os.path.exists(cand_file) else []
        for url in urls:
            try:
                img, raw = fetch(url)
            except Exception:  # noqa: BLE001
                continue
            digest = md5(raw)
            if digest in seen:
                continue
            if float(anchor @ embed_image(model, img, transform)) < thr:
                continue
            seen.add(digest)
            kept += 1
            img.save(os.path.join(ref_dir, f"web_{kept:03d}.jpg"), "JPEG", quality=88)

        # ── wikimedia candidates ──
        wiki_dir = os.path.join(WIKI, cls)
        wm = 0
        if os.path.isdir(wiki_dir):
            for name in sorted(os.listdir(wiki_dir)):
                if not name.lower().endswith((".jpg", ".png")):
                    continue
                try:
                    raw = open(os.path.join(wiki_dir, name), "rb").read()
                    img = Image.open(io.BytesIO(raw)).convert("RGB")
                except Exception:  # noqa: BLE001
                    continue
                digest = md5(raw)
                if digest in seen:
                    continue
                if float(anchor @ embed_image(model, img, transform)) < thr:
                    continue
                seen.add(digest)
                wm += 1
                img.save(os.path.join(ref_dir, f"wm_{wm:03d}.jpg"), "JPEG", quality=88)

        total = len(base) + kept + wm
        summary.append((cls, total, thr))
        print(f"{cls:44s} base={len(base):2d} web={kept:3d} wm={wm:2d} = {total:3d} (thr {thr})")

        # ── manually curated images (no filtering, used where the automatic
        #    anchor match is unreliable, e.g. an aerial hero photo) ──
        man_dir = os.path.join(MANUAL, cls)
        mn = 0
        if os.path.isdir(man_dir):
            for name in sorted(os.listdir(man_dir)):
                if not name.lower().endswith((".jpg", ".png")):
                    continue
                try:
                    raw = open(os.path.join(man_dir, name), "rb").read()
                    img = Image.open(io.BytesIO(raw)).convert("RGB")
                except Exception:  # noqa: BLE001
                    continue
                digest = md5(raw)
                if digest in seen:
                    continue
                seen.add(digest)
                mn += 1
                img.save(os.path.join(ref_dir, f"man_{mn:03d}.jpg"), "JPEG", quality=88)
        if mn:
            summary[-1] = (cls, total + mn, thr)
            print(f"    + manual: {mn}  -> total {total + mn}")

    print("\n=== summary ===")
    bad = 0
    for cls, total, thr in summary:
        flag = "OK " if total >= 20 else "LOW"
        bad += 0 if total >= 20 else 1
        print(f"{flag} {cls:44s} {total}")
    print("classes below 20:", bad)


if __name__ == "__main__":
    main()
