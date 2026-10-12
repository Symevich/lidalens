"""FastAPI-сервер фічы «Ліда ў аб'ектыве».

Аддае статычны сайт LidaLens І API распазнавання:
  GET  /api/lens/health      — стан і спіс класаў
  POST /api/lens/recognize   — здымак -> топ-3 класаў з упэўненасцю

Запуск:  python -m uvicorn server.app:app --host 127.0.0.1 --port 8000
(або проста run.bat у корані праекта)
"""
import io
import os
import sys

from fastapi import FastAPI, File, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from model import Recognizer  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

app = FastAPI(title="LidaLens · Ліда ў аб'ектыве")
recognizer = Recognizer()


# ─── API ────────────────────────────────────────────────────────────────────
@app.get("/api/lens/health")
def health():
    return {
        "ok": True,
        "classes": recognizer.classes,
        "threshold": recognizer.threshold,
        "backbone": recognizer.backbone,
    }


@app.post("/api/lens/recognize")
async def recognize(file: UploadFile = File(...)):
    data = await file.read()
    try:
        image = Image.open(io.BytesIO(data))
        image.load()
    except Exception:  # noqa: BLE001
        return JSONResponse({"error": "bad_image"}, status_code=400)
    result = recognizer.recognize(image)
    result["image_size"] = list(image.size)
    return result


# ─── Статычны сайт LidaLens ─────────────────────────────────────────────────
# Манціруем толькі патрэбныя тэчкі, каб не аддаваць код і вагі мадэлі.
for _dir in ("assets", "css", "js", "data"):
    _path = os.path.join(ROOT, _dir)
    if os.path.isdir(_path):
        app.mount(f"/{_dir}", StaticFiles(directory=_path), name=_dir)

_ROOT_FILES = {
    "/": "index.html",
    "/index.html": "index.html",
    "/welcome.html": "welcome.html",
    "/manifest.json": "manifest.json",
    "/sw.js": "sw.js",
}


# ─── Загалоўкі кэша ─────────────────────────────────────────────────────────
# Cloudflare па змаўчанні кэшуе ўсё з пашырэннем .js на 4 гадзіны
# (cache-control: max-age=14400). Для сэрвіс-воркера гэта смяротна: браўзер
# не бачыць новы sw.js, а стары сэрвіс-воркер далей аддае старыя старонкі са
# свайго кэша — сайт «не абнаўляецца» нават пасля перазагрузкі.
# Таму sw.js аддаём з no-store, а HTML/CSS/JS/JSON — з no-cache
# (пераправерка па ETag; 304 каштуе танна і не псуе абнаўленні).
_NO_CACHE = "no-cache"
_NO_STORE = "no-store, no-cache, must-revalidate, max-age=0"
_REVALIDATE_SUFFIXES = (".html", ".css", ".js", ".json")


@app.middleware("http")
async def cache_headers(request, call_next):
    response = await call_next(request)
    path = request.url.path
    if path.endswith("/sw.js"):
        response.headers["Cache-Control"] = _NO_STORE
        response.headers["Pragma"] = "no-cache"
    elif path in ("", "/") or path.endswith(_REVALIDATE_SUFFIXES):
        response.headers["Cache-Control"] = _NO_CACHE
    return response


@app.get("/{_path:path}")
def static_root(_path: str):
    target = _ROOT_FILES.get("/" + _path.lstrip("/"))
    if target:
        return FileResponse(os.path.join(ROOT, target))
    return JSONResponse({"error": "not_found"}, status_code=404)
