"""Разлічвае эталонныя эмбеддынгі і захоўвае іх для сервера.

Вынік: lens_data/embeddings.npz (vectors, labels, paths, classes, backbone)
"""
import os
import sys

import numpy as np

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "server"))

from common import EMBEDDINGS, build_transform, collect_refs, embed_paths, load_backbone  # noqa: E402

BACKBONE = "mobilenet_v3_large"


def main():
    paths, labels, classes = collect_refs()
    print(f"эталонаў: {len(paths)}  класаў: {len(classes)} -> {classes}")
    model = load_backbone(BACKBONE)
    vectors = embed_paths(model, paths, build_transform())
    np.savez(EMBEDDINGS,
             vectors=vectors.astype(np.float32),
             labels=np.array(labels),
             paths=np.array(paths),
             classes=np.array(classes),
             backbone=BACKBONE)
    print(f"захавана: {EMBEDDINGS}  shape={vectors.shape}")

    sims = vectors @ vectors.T
    np.fill_diagonal(sims, -1.0)
    same = [(labels[i] == labels[int(np.argmax(sims[i]))]) for i in range(len(labels))]
    print(f"leave-one-out top-1: {np.mean(same):.3f}")


if __name__ == "__main__":
    main()
