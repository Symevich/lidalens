"""Extra Wikimedia Commons photos for the classes that are still short."""
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "lens_data", "_wikimedia")
UA = "LidaLens/0.1 (educational school project) Python-urllib"
API = "https://commons.wikimedia.org/w/api.php"

QUERIES = {
    "carkva-usich-sviatych": [
        "Church of All Saints Lida",
        "Собор всех святых Лида",
        "храм всех святых Лида",
        "царква Усіх Святых Ліда",
    ],
    "kamien-u-honar-zasnavannia-lidy": [
        "Lida founding stone",
        "Lida 1323 stone",
        "камень основания Лиды",
        "Ліда валун",
    ],
    "kurhan-neumiruczasci": [
        "Kurhan of Immortality Lida",
        "Курган Бессмертия Лида",
    ],
}


def api(params):
    params = dict(params, format="json")
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                time.sleep(0.8)
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < 3:
                time.sleep(3 * (attempt + 1))
                continue
            raise


def search(q, limit=20):
    d = api({"action": "query", "list": "search", "srsearch": q + " filetype:bitmap",
             "srnamespace": "6", "srlimit": limit})
    return [x["title"] for x in d.get("query", {}).get("search", [])]


def imageinfo(titles):
    out = []
    for i in range(0, len(titles), 10):
        d = api({"action": "query", "titles": "|".join(titles[i:i + 10]),
                 "prop": "imageinfo", "iiprop": "url|mime", "iiurlwidth": "800"})
        for p in d.get("query", {}).get("pages", {}).values():
            ii = p.get("imageinfo")
            if ii and ii[0].get("mime") in ("image/jpeg", "image/png"):
                out.append(ii[0].get("thumburl") or ii[0].get("url"))
    return out


def download(url, path):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read()
    with open(path, "wb") as f:
        f.write(data)


def main():
    for cls, queries in QUERIES.items():
        folder = os.path.join(OUT, cls)
        os.makedirs(folder, exist_ok=True)
        titles = []
        for q in queries:
            try:
                titles += search(q)
            except Exception as e:  # noqa: BLE001
                print("search fail", q, e)
        titles = list(dict.fromkeys(titles))[:24]
        urls = imageinfo(titles)
        for n, u in enumerate(urls, 1):
            try:
                download(u, os.path.join(folder, f"wm_{n:03d}.jpg"))
            except Exception:  # noqa: BLE001
                pass
        print(f"{cls}: {len(urls)} wikimedia images")


if __name__ == "__main__":
    main()
