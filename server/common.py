"""Супольныя прылады для фічы «Ліда ў аб'ектыве»: сеткі і эмбеддынгі.

Нейрасетка не вучыцца тут з нуля: бярэцца прадобучаны MobileNetV3 (ImageNet),
які ператварае любы здымак у вектар-«адбітак» з 960 лікаў. Распазнаванне —
пошук найбліжэйшага эталона (касінусная блізкасць).
"""
import os

import numpy as np
import torch
from PIL import Image
from torch import nn
from torchvision import models, transforms

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

# .../LidaLens
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LENS_DIR = os.path.join(ROOT, "lens_data")
REF_DIR = os.path.join(LENS_DIR, "ref")
EMBEDDINGS = os.path.join(LENS_DIR, "embeddings.npz")

# name -> (factory, weights, name of the classification head)
BACKBONES = {
    "mobilenet_v3_large": (models.mobilenet_v3_large,
                           models.MobileNet_V3_Large_Weights.IMAGENET1K_V2, "classifier"),
    "efficientnet_b0": (models.efficientnet_b0,
                        models.EfficientNet_B0_Weights.IMAGENET1K_V1, "classifier"),
    "resnet18": (models.resnet18, models.ResNet18_Weights.IMAGENET1K_V1, "fc"),
    "resnet50": (models.resnet50, models.ResNet50_Weights.IMAGENET1K_V2, "fc"),
}


def build_transform(size=224):
    return transforms.Compose([
        transforms.Resize(int(size * 1.14)),
        transforms.CenterCrop(size),
        transforms.ToTensor(),
        transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
    ])


def load_backbone(name):
    factory, weights, head = BACKBONES[name]
    model = factory(weights=weights)
    setattr(model, head, nn.Identity())
    model.eval()
    return model


def embed_paths(model, paths, transform, batch=8):
    """Вяртае (N, D) масіў L2-нармаваных эмбеддынгаў для шляхоў да файлаў."""
    device = next(model.parameters()).device
    rows, buf = [], []

    def flush():
        if not buf:
            return
        tensor = torch.stack(buf).to(device)
        with torch.no_grad():
            feat = model(tensor)
        feat = torch.nn.functional.normalize(feat, dim=1)
        rows.append(feat.cpu().numpy())
        buf.clear()

    for path in paths:
        buf.append(transform(Image.open(path).convert("RGB")))
        if len(buf) >= batch:
            flush()
    flush()
    return np.concatenate(rows, axis=0)


def embed_image(model, image, transform):
    """Эмбеддынг аднаго PIL-здымка (для сервера)."""
    device = next(model.parameters()).device
    tensor = transform(image.convert("RGB")).unsqueeze(0).to(device)
    with torch.no_grad():
        feat = model(tensor)
    feat = torch.nn.functional.normalize(feat, dim=1)
    return feat.cpu().numpy()[0]


def collect_refs():
    """Вяртае (paths, labels, classes) для ўсіх эталонных здымкаў."""
    paths, labels = [], []
    classes = sorted(c for c in os.listdir(REF_DIR)
                     if os.path.isdir(os.path.join(REF_DIR, c)) and not c.startswith("_"))
    for cls in classes:
        folder = os.path.join(REF_DIR, cls)
        for name in sorted(os.listdir(folder)):
            if name.lower().endswith((".jpg", ".jpeg", ".png")):
                paths.append(os.path.join(folder, name))
                labels.append(cls)
    return paths, labels, classes
