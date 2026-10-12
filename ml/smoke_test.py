"""Праверка распазнавання на адкладзеных здымках (lens_data/test/<class>/)."""
import os
import sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "server"))

from PIL import Image  # noqa: E402

from common import LENS_DIR  # noqa: E402
from model import Recognizer  # noqa: E402

TEST = os.path.join(LENS_DIR, "test")


def main():
    if not os.path.isdir(TEST):
        print("няма тэчкі", TEST, "— дадайце адкладзеныя здымкі")
        return
    r = Recognizer()
    ok = total = 0
    for cls in sorted(os.listdir(TEST)):
        folder = os.path.join(TEST, cls)
        if not os.path.isdir(folder):
            continue
        for name in sorted(os.listdir(folder)):
            if not name.lower().endswith((".jpg", ".jpeg", ".png")):
                continue
            res = r.recognize(Image.open(os.path.join(folder, name)))
            total += 1
            good = res["best"] == cls
            ok += good
            mark = "OK " if good else "MISS"
            print(f"{mark} {cls}/{name[:38]:38s} -> {res['best']:34s} {res['score']:.3f} "
                  f"{'recognized' if res['recognized'] else 'unknown'}")
    print(f"\n{ok}/{total} верна")


if __name__ == "__main__":
    main()
