"""Распазнаванне: эмбеддынг запыту і параўнанне з эталонамі.

Для кожнага класа бярэцца максімальная касінусная блізкасць да яго эталонаў.
Калі найлепшы вынік ніжэй за парог — сумленны адказ «не распазнана».
"""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from common import EMBEDDINGS, build_transform, embed_image, load_backbone  # noqa: E402


class Recognizer:
    def __init__(self, backbone="mobilenet_v3_large", threshold=0.55):
        npz = np.load(EMBEDDINGS, allow_pickle=True)
        self.vectors = npz["vectors"].astype(np.float32)
        self.labels = npz["labels"]
        self.classes = [str(c) for c in npz["classes"]]
        self.backbone = backbone
        self.threshold = threshold
        self.model = load_backbone(backbone)
        self.transform = build_transform()
        self._by_class = {c: np.where(self.labels == c)[0] for c in self.classes}

    def recognize(self, image, top_k=3):
        vector = embed_image(self.model, image, self.transform)
        sims = self.vectors @ vector
        scored = [(c, float(sims[self._by_class[c]].max())) for c in self.classes]
        scored.sort(key=lambda kv: kv[1], reverse=True)
        top = scored[:top_k]
        best_id, best_score = top[0]
        return {
            "recognized": best_score >= self.threshold,
            "best": best_id,
            "score": best_score,
            "threshold": self.threshold,
            "top": [{"id": c, "score": s} for c, s in top],
        }
