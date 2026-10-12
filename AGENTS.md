# AGENTS.md — ЛідаГід / LidaLens

Кароткі брыф для агента, які працуе з гэтым праектам. Чытай разам з тэчкай `docs/`.

## Што гэта

Інтэрактыўны **аўдыёгід па славутасцях горада Ліда** (SPA/PWA на чыстым HTML/CSS/JS)
і фіча **«Ліда ў аб'ектыве»** — распазнаванне славутасцяў па камеры
(Python + FastAPI + PyTorch, **толькі CPU**). Адзін Docker-кантэйнер аддае і сайт,
і API. Праект рыхтуецца на раённы конкурс «ПАТРИОТ.by».

## Дзе што

- `index.html`, `welcome.html`, `manifest.json`, `sw.js` — каркас PWA.
- `css/` (`normalize.css`, `style.css`), `js/` (`app.js`, `i18n.js`, `vendor/`) — фронтэнд.
- `data/sights.json` (+ `sights.ru.json`, `sights.en.json`) — дадзеныя аб'ектаў.
- `assets/` — фота (`images/`), іконкі (`icons/`), аўдыягіды (`audio/be|ru/*.mp3`).
- `server/` — FastAPI: `app.py` (маршруты + статыка + кэш-загалоўкі), `model.py`
  (нейрасетка), `common.py`.
- `lens_data/` — `embeddings.npz` (патрэбны серверу), `ref/<id>/` (эталонныя фота),
  `_candidates/`, `_manual/`, `test/`.
- `ml/` — скрыпты збору і навучання (у рантайме не патрэбныя).
- `docs/` — даследчая работа, тэзісы, доклад, партфоліо, брыфы, скрыншоты.
- `tools/` — тэсты і пераверачнікі (Node).

## Запуск і разгортванне

- Сервер (Docker): `docker compose up -d --build` → кантэйнер `lidalens`,
  слухае `127.0.0.1:8095`. Вонкава дасяжны праз Cloudflare-тунэль:
  `https://lidalens.parkavajaserver.xyz`.
- Праверка: `curl -s http://127.0.0.1:8095/api/lens/health`.
- Лагі: `docker logs -f lidalens`.
- Лакальная распрацоўка (Windows): `run.bat` (uvicorn на `http://127.0.0.1:8000`).
- Пасля любой змены статыкі абавязкова паднімі `VERSION` у `sw.js` — інакш
  браўзеры пакажуць старую версію з кэша service worker.

## Кантракт API (не змяняць)

- `GET  /api/lens/health` → `{ok, classes, threshold, backbone}`.
- `POST /api/lens/recognize` (multipart, поле `file`) →
  `{recognized, best, score, top: [{id, score}]}`.

## Мадэль

- **MobileNetV3** ператварае фота ў вектар-«адбітак»; распазнаванне — пошук
  найбліжэйшага эталона па касінуснай блізкасці. Парог упэўненасці `0.55`
  (`server/model.py`, `Recognizer(threshold=0.55)`).
- 8 класаў (id — як у `data/sights.json`): `lidski-zamak`,
  `kasciol-uzvyszennia-sviatoha-kryzha`, `sviata-michajlauski-kafedralny-sabor`,
  `carkva-usich-sviatych`, `kamandzirovaczny`, `kamien-u-honar-zasnavannia-lidy`,
  `pomnik-francysku-skarynu`, `kurhan-neumiruczasci`.

## Правілы працы

- **Усе тэксты, паведамленні карыстальніку і адказы — па-беларуску.**
- **Толькі славутасці**: людзей і прадпрыемстваў у праекце няма і быць не павінна.
- Чысты HTML/CSS/JS. Фрэймворкі забароненыя; дазволеныя Leaflet і
  `js/vendor/qrcode.js`.
- Новыя элементы — у стылі праекта (токены CSS `:root`, кнопкі-пілюлі, радкі
  тэксту праз `js/i18n.js`).
- Не каміць і не публікуй без просьбы карыстальніка.
- Камера ў браўзеры працуе толькі па HTTPS (Cloudflare яго дае).

## Карысна ведаць (граблі)

- Google Images і DuckDuckGo блакуюць робатаў; для збору фота славутасцяў
  надзейныя **Яндэкс Карцінкі** і Wikimedia Commons.
- Перад праверкай змен у `app.js`/`sw.js` у браўзеры — здымі рэгістрацыю
  service worker і сцерці caches, інакш аддаецца стары кэш.
