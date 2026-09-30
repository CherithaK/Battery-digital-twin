"""Describe the legacy synthetic SoH table without treating it as cell validation."""
from __future__ import annotations

import csv
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "ml/training_data.csv"
OUTPUT = ROOT / "research/results/synthetic_data_audit.json"


def pearson(x: list[float], y: list[float]) -> float:
    mx, my = sum(x) / len(x), sum(y) / len(y)
    cross = sum((a - mx) * (b - my) for a, b in zip(x, y))
    xx = sum((a - mx) ** 2 for a in x)
    yy = sum((b - my) ** 2 for b in y)
    return cross / math.sqrt(xx * yy)


def main() -> None:
    with SOURCE.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    soh = [float(row["soh"]) for row in rows]
    features = [name for name in rows[0] if name not in {"soh", "cycle_count"}]
    correlations = {name: round(pearson([float(row[name]) for row in rows], soh), 4) for name in features}
    report = {
        "source": str(SOURCE.relative_to(ROOT)).replace("\\", "/"),
        "rows": len(rows),
        "distinct_cycle_counts": len({row["cycle_count"] for row in rows}),
        "soh_range_percent": [min(soh), max(soh)],
        "feature_pearson_correlation_with_synthetic_soh": correlations,
        "generator_provenance": "ml/training_data_generator.py computes degradation_factor directly from each synthetic SoH label and uses it to construct most feature columns; this audit is descriptive, not independent validation.",
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
