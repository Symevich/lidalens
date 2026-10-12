# syntax=docker/dockerfile:1
# ============================================================
#  LidaLens + фіча «Ліда ў аб'ектыве»
#  Абраз для разгортвання: статычны сайт (SPA) + FastAPI-сервер
#  распазнавання славутасцяў (PyTorch, толькі CPU).
#
#  Зборка:   docker build -t lidalens .
#  Запуск:   docker run -d --name lidalens -p 8000:8000 --restart unless-stopped lidalens
# ============================================================
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# libgomp1 неабходны PyTorch (OpenMP)
RUN apt-get update \
 && apt-get install -y --no-install-recommends libgomp1 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1) PyTorch — CPU-колёсы (без CUDA), каб вобраз не раздуваўся да некалькіх ГБ
RUN pip install --upgrade pip \
 && pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

# 2) Астатнія залежнасці сервера (адпавядае requirements.txt)
RUN pip install fastapi "uvicorn[standard]" pillow numpy python-multipart

# 3) Запечваем вагі MobileNetV3 у вобраз, каб кантэйнер працаваў без сеткі
RUN python -c "from torchvision import models; models.mobilenet_v3_large(weights=models.MobileNet_V3_Large_Weights.IMAGENET1K_V2)"

# 4) Код і дадзеныя (што не трапляе — гл. .dockerignore)
COPY . .

EXPOSE 8000

# Слухаем 0.0.0.0, каб контэйнер быў дасягальны звонку
CMD ["python", "-m", "uvicorn", "server.app:app", "--host", "0.0.0.0", "--port", "8000"]
