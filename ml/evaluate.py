"""Параўнанне мадэляў метадам leave-one-out на эталонных здымках."""
import os
import sys

import numpy as np

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "server"))

from common import BACKBONES, build_transform, collect_refs, embed_paths, load_backbone  # noqa: E402


def leave_one_out(vecs, labels):
    sims = vecs @ vecs.T
    np.fill_diagonal(sims, -1.0)
    order = np.argsort(-sims, axis=1)
    n = len(labels)
    top1 = np.mean([labels[order[i, 0]] == labels[i] for i in range(n)])
    top3 = np.mean([labels[i] in [labels[order[i, k]] for k in range(3)] for i in range(n)])
    return top1, top3


def main():
    paths, labels, classes = collect_refs()
    labels = np.array(labels)
    print(f"здымкаў: {len(paths)}  класаў: {len(classes)}")
    transform = build_transform()
    results = {}
    for name in BACKBONES:
        try:
            vecs = embed_paths(load_backbone(name), paths, transform)
            top1, top3 = leave_one_out(vecs, labels)
            results[name] = (top1, top3)
            print(f"{name:20s} top-1={top1:.3f}  top-3={top3:.3f}")
        except Exception as e:  # noqa: BLE001
            print(f"{name:20s} FAILED: {e}")
    if results:
        best = max(results, key=lambda k: (results[k][0], results[k][1]))
        print("\nBEST:", best, results[best])


if __name__ == "__main__":
    main()
