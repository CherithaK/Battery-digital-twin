"""Reproducible extractor sensitivity study. All generated traces are simulated."""
from __future__ import annotations

import csv
import json
import math
import random
import statistics
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "research" / "results"
SEED = 20260926
REPEATS = 200


def extract(voltage: list[float], current: list[float]) -> dict:
    turn = next((i - 1 for i in range(2, len(voltage)) if voltage[i] < voltage[i - 1]), -1)
    if turn < 4 or len(voltage) - turn - 1 < 4 or abs(voltage[-1] - voltage[0]) > 0.05 * (max(voltage) - min(voltage)):
        return {"quality": "invalid", "separation_mv": None, "loop_integral_av": None}
    loop = sum((current[i] + current[i - 1]) * (voltage[i] - voltage[i - 1]) / 2 for i in range(1, len(voltage)))
    anodic = max(range(turn + 1), key=lambda i: current[i])
    cathodic = min(range(turn, len(voltage)), key=lambda i: current[i])
    if anodic in (0, turn) or cathodic in (turn, len(voltage) - 1) or current[anodic] <= 0 or current[cathodic] >= 0:
        return {"quality": "limited", "separation_mv": None, "loop_integral_av": loop}
    return {"quality": "usable", "separation_mv": abs(voltage[anodic] - voltage[cathodic]) * 1000, "loop_integral_av": loop}


def load_supplied() -> tuple[list[float], list[float]]:
    path = ROOT / "attached_assets" / "14,12csv_1765724360390.csv"
    with path.open(newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    return [float(r["voltage"]) for r in rows], [float(r["current"]) for r in rows]


def controlled_sweep() -> tuple[list[float], list[float]]:
    forward = [-0.30 + i * 0.01 for i in range(61)]
    backward = [0.29 - i * 0.01 for i in range(60)]
    voltage = forward + backward
    current = [3e-6 * math.exp(-((v - 0.10) / 0.07) ** 2) - 0.2e-6 for v in forward]
    current += [-3e-6 * math.exp(-((v + 0.10) / 0.07) ** 2) + 0.2e-6 for v in backward]
    return voltage, current


def percentile(values: list[float], p: float) -> float:
    values = sorted(values)
    position = (len(values) - 1) * p
    low = int(position)
    return values[low] + (values[min(low + 1, len(values) - 1)] - values[low]) * (position - low)


def figure(path: Path, voltage: list[float], current: list[float], title: str, subtitle: str) -> None:
    width, height = 900, 500
    def x(v: float) -> float: return 80 + (v + 0.3) / 0.6 * 760
    def y(i: float) -> float: return 420 - (i * 1e6 + 4) / 8 * 320
    turn = max(range(len(voltage)), key=lambda k: voltage[k])
    paths = []
    for indices, color in [(range(turn + 1), "#2563eb"), (range(turn, len(voltage)), "#d94670")]:
        points = " ".join(f"{x(voltage[i]):.1f},{y(current[i]):.1f}" for i in indices)
        paths.append(f'<polyline points="{points}" fill="none" stroke="{color}" stroke-width="3"/>')
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
<rect width="100%" height="100%" fill="white"/><text x="80" y="42" font-family="Arial" font-size="25" font-weight="bold">{title}</text>
<text x="80" y="70" font-family="Arial" font-size="15" fill="#475569">{subtitle}</text>
<path d="M80 100 V420 H840" fill="none" stroke="#334155" stroke-width="2"/>
<text x="400" y="475" font-family="Arial" font-size="16">Potential (V)</text>
<text x="8" y="250" font-family="Arial" font-size="16" transform="rotate(-90 18 250)">Current (µA)</text>
<text x="80" y="445" font-family="Arial" font-size="13">−0.30</text><text x="810" y="445" font-family="Arial" font-size="13">0.30</text>
<text x="48" y="110" font-family="Arial" font-size="13">4</text><text x="48" y="425" font-family="Arial" font-size="13">−4</text>
{''.join(paths)}<text x="590" y="112" font-family="Arial" font-size="14" fill="#2563eb">Forward</text>
<text x="700" y="112" font-family="Arial" font-size="14" fill="#d94670">Return</text></svg>'''
    path.write_text(svg, encoding="utf-8")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    supplied_v, supplied_i = load_supplied()
    supplied = extract(supplied_v, supplied_i)
    controlled_v, controlled_i = controlled_sweep()
    baseline = extract(controlled_v, controlled_i)
    rng = random.Random(SEED)
    levels = [0.0, 0.05, 0.10, 0.20]
    simulation = []
    for level in levels:
        errors = []
        usable = 0
        for _ in range(REPEATS):
            noisy = [i + rng.gauss(0, level * 3e-6) for i in controlled_i]
            reading = extract(controlled_v, noisy)
            if reading["separation_mv"] is not None:
                usable += 1
                errors.append(abs(reading["separation_mv"] - baseline["separation_mv"]))
        simulation.append({"noise_fraction_of_3ua": level, "replicates": REPEATS, "usable": usable,
                           "median_absolute_separation_error_mv": statistics.median(errors) if errors else None,
                           "p95_absolute_separation_error_mv": percentile(errors, 0.95) if errors else None})
    report = {"provenance": "Project team reports these 21 values came from a real CV experiment. The repository lacks instrument/cell metadata; current is provisionally interpreted as A.",
              "supplied": {"points": len(supplied_v), "voltage_min_v": min(supplied_v), "voltage_max_v": max(supplied_v), **supplied},
              "controlled_simulation": {"seed": SEED, "replicates_per_level": REPEATS,
                 "model": "Gaussian peaks at +0.10 and -0.10 V, 3 µA amplitude, 0.07 V width, 10 mV sampling; independent Gaussian current noise.",
                 "baseline": baseline, "noise_study": simulation}}
    (OUT / "sensor_report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    figure(OUT / "illustrative_cv.svg", supplied_v, supplied_i, "Supplied 21-point CV values", "Team-reported experimental input; boundary peak prevents separation estimate")
    figure(OUT / "controlled_cv.svg", controlled_v, controlled_i, "Controlled simulated CV sweep", "Known interior peaks; this trace is not a physical cell measurement")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
