# ЛідаГід (LidaLens)

🔗 **Жывы сайт (статычная дэма):** https://symevich.github.io/lidalens/

Інтэрактыўны аўдыёгід па славутасцях горада Ліда і функцыя **«Ліда ў аб'ектыве»** —
распазнаванне славутасцяў па камеры.

- **Фронтэнд:** чысты HTML/CSS/JavaScript (SPA/PWA), тры мовы (беларуская, руская, англійская).
- **Бэкенд:** Python, FastAPI, PyTorch (**толькі CPU**).
- Нейрасетка **MobileNetV3** ператварае фота ў лікавы «адбітак», а распазнаванне —
  гэта пошук найбліжэйшага эталона па косінуснай блізкасці (парог упэўненасці 0,55).

## Структура

```
index.html · welcome.html · manifest.json · sw.js   каркас PWA
css/ · js/                                            фронтэнд
data/sights*.json                                     дадзеныя аб славутасцях
assets/                                               фота, іконкі, аўдыягіды (mp3)
server/                                               FastAPI: app.py · model.py · common.py
ml/                                                   скрыпты збору і навучання
tools/                                                дапаможныя скрыпты (Node)
Dockerfile · docker-compose.yml                       запуск у кантэйнеры
```

## Запуск

### Docker (рэкамендуецца)

```bash
docker compose up -d --build
curl -s http://127.0.0.1:8095/api/lens/health
```

### Лакальна (Windows)

```bat
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
run.bat
```

Камера ў браўзеры працуе толькі па HTTPS ці на `localhost`.

## API

- `GET  /api/lens/health` → `{ok, classes, threshold, backbone}`
- `POST /api/lens/recognize` (multipart, поле `file`) → `{recognized, best, score, top}`

## Заўвага

У гэтым рэпазіторыі — **толькі праграмная частка**. Навучаныя даныя
(`lens_data/`, «адбіткі» і эталонныя фота) і даследчая работа (`docs/`) не ўключаны.
Каб перанавучыць мадэль, трэба пакласці фота ў `lens_data/ref/<id>/` і запусціць
`ml/build_embeddings.py`.
