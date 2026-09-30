"""Generate reproducible SiNK figures from the supplied trace and synthetic audit.

Run with Python 3.11, matplotlib, numpy and scikit-learn. Every output caption
identifies whether it uses the team-reported experimental values or simulation.
"""
from __future__ import annotations

import csv
import json
import textwrap
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
import sklearn

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "research" / "conference_figures"
SOURCE = ROOT / "attached_assets" / "14,12csv_1765724360390.csv"
TRAINING = ROOT / "ml" / "training_data.csv"
REPORT = ROOT / "research" / "results" / "sensor_report.json"

NAVY = "#153149"
BLUE = "#1877aa"
CORAL = "#d6604d"
TEAL = "#138b83"
GRAY = "#596b7a"


def setup():
    plt.rcParams.update({
        "font.family": "DejaVu Sans", "font.size": 12, "axes.titlesize": 18,
        "axes.labelsize": 13, "axes.spines.top": False, "axes.spines.right": False,
        "figure.facecolor": "white", "axes.facecolor": "white", "savefig.facecolor": "white",
    })
    OUT.mkdir(parents=True, exist_ok=True)


def save(fig, name, caption):
    fig.subplots_adjust(left=0.18, right=0.95, top=0.82, bottom=0.23)
    fig.text(0.05, 0.025, textwrap.fill(caption, 125), fontsize=9, color=GRAY, va="bottom")
    fig.savefig(OUT / f"{name}.png", dpi=220, bbox_inches="tight")
    fig.savefig(OUT / f"{name}.pdf", bbox_inches="tight")
    plt.close(fig)


def data():
    with SOURCE.open(newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    v = np.array([float(r["voltage"]) for r in rows])
    i = np.array([float(r["current"]) * 1e6 for r in rows])
    turn = int(np.argmax(v))
    return v, i, turn


def diagrams():
    fig, ax = plt.subplots(figsize=(12, 5.7))
    ax.set(xlim=(0,12), ylim=(0,5.7)); ax.axis("off")
    items = [
        (0.35,"Measured CV\n21 points", BLUE),
        (2.8,"Units +\nmetadata", TEAL),
        (5.25,"Sweep\nquality gate", TEAL),
        (7.7,"Observed\nfeatures", BLUE),
    ]
    for x,label,color in items:
        ax.add_patch(FancyBboxPatch((x,2.45),1.65,1.2,boxstyle="round,pad=.08",facecolor=color,edgecolor="none"))
        ax.text(x+.825,3.05,label,ha="center",va="center",color="white",fontsize=13,fontweight="bold")
    for x in [2.0,4.45,6.9]:
        ax.add_patch(FancyArrowPatch((x,3.05),(x+.75,3.05),arrowstyle="-|>",mutation_scale=20,color=NAVY,linewidth=2))
    ax.annotate("Failed gate:\nwithhold peak metrics",(6.05,2.45),(6.05,1.1),ha="center",arrowprops={"arrowstyle":"->","color":CORAL},color=CORAL,fontsize=12)
    ax.add_patch(FancyBboxPatch((9.95,2.45),1.8,1.2,boxstyle="round,pad=.08",facecolor=CORAL,edgecolor="none"))
    ax.text(10.85,3.05,"Synthetic RF\naudit only",ha="center",va="center",color="white",fontsize=12,fontweight="bold")
    ax.text(10.85,1.1,"Separate dataset:\nno measured capacity",ha="center",color=CORAL,fontsize=11)
    ax.set_title("Measurement-to-model research workflow",pad=20,color=NAVY)
    save(fig,"00_measurement_workflow","Measured trace and synthetic RF model are different evidence sources. The live app currently reports sensor diagnostics only.")

    fig, ax = plt.subplots(figsize=(10,5.7))
    ax.set(xlim=(0,10),ylim=(0,6)); ax.axis("off")
    roadmap = [
        (4.2,BLUE,"PHASE 1 · CURRENT","Measured CV → quality checks → observable features"),
        (2.5,TEAL,"PHASE 2 · VALIDATE","Repeated cells + measured capacity → tested SoH model"),
        (.8,CORAL,"PHASE 3 · FUTURE","State updates + calibrated simulation → operational twin"),
    ]
    for y,color,heading,body in roadmap:
        ax.add_patch(FancyBboxPatch((.65,y),8.7,1.1,boxstyle="round,pad=.08",facecolor=color,edgecolor="none"))
        ax.text(1.0,y+.72,heading,color="white",fontsize=15,fontweight="bold",va="center")
        ax.text(1.0,y+.28,body,color="white",fontsize=11.5,va="center")
    for y in [4.1,2.4]:
        ax.add_patch(FancyArrowPatch((5,y),(5,y-.35),arrowstyle="-|>",mutation_scale=20,color=NAVY,linewidth=2))
    ax.set_title("A phased route to a battery digital twin",pad=20,color=NAVY)
    save(fig,"00_digital_twin_roadmap","Only Phase 1 is implemented. Phase 2 needs independent battery labels; Phase 3 needs a calibrated, updating state model.")

    fig, ax = plt.subplots(figsize=(10,5.7))
    ax.set(xlim=(0,10),ylim=(0,6)); ax.axis("off")
    ax.add_patch(FancyBboxPatch((1.3,.8),7.4,2.8,boxstyle="round,pad=.12",facecolor="#eaf3f5",edgecolor=TEAL,linewidth=2))
    ax.text(5,1.1,"Electrolyte and sample details not recorded",ha="center",color=GRAY,fontsize=12)
    for x,label,color in [(2.3,"Graphite",BLUE),(5,"Platinum",CORAL),(7.7,"Ag/AgCl",TEAL)]:
        ax.plot([x,x],[2,4.2],color=color,linewidth=12,solid_capstyle="round")
        ax.text(x,4.65,label,ha="center",va="bottom",color=NAVY,fontsize=13)
    ax.text(5,.35,"Working, counter and reference roles require the experiment log.",ha="center",fontsize=11,color=GRAY)
    ax.set_title("Three electrode materials reported by the team",pad=20,color=NAVY)
    save(fig,"00_electrode_materials","Graphite, platinum and Ag/AgCl were reported by the team. Exact roles, material, electrolyte and instrument settings are not documented.")


def exp_figures(v, i, turn):
    cap = "Team-reported experimental values (21 points). Current unit A assumed from CSV values; setup metadata unverified."
    fig, ax = plt.subplots(figsize=(10, 5.7))
    ax.plot(v[:turn+1], i[:turn+1], "o-", color=BLUE, label="Forward sweep")
    ax.plot(v[turn:], i[turn:], "o-", color=CORAL, label="Return sweep")
    ax.set(xlabel="Applied potential (V; reference not recorded)", ylabel="Current (µA; provisional)", title="Recorded cyclic voltammogram")
    ax.legend(frameon=False)
    ax.grid(alpha=.2)
    save(fig, "01_recorded_cv", cap)

    fig, ax = plt.subplots(figsize=(10, 5.7))
    ax.plot(range(1, len(v)+1), v, "o-", color=BLUE)
    ax.axvline(turn+1, color=CORAL, linestyle="--", label="Reversal")
    ax.set(xlabel="Acquisition point", ylabel="Applied potential (V)", title="Potential swept forward, then reversed")
    ax.set_xticks(range(1, len(v)+1, 2)); ax.legend(frameon=False); ax.grid(alpha=.2)
    save(fig, "02_potential_sequence", cap + " Time and scan rate are not available.")

    fig, ax = plt.subplots(figsize=(10, 5.7))
    ax.plot(range(1, len(i)+1), i, "o-", color=TEAL)
    ax.axvline(turn+1, color=CORAL, linestyle="--", label="Reversal")
    ax.axhline(0, color=GRAY, linewidth=1)
    ax.set(xlabel="Acquisition point", ylabel="Current (µA; provisional)", title="Measured current in acquisition order")
    ax.set_xticks(range(1, len(v)+1, 2)); ax.legend(frameon=False); ax.grid(alpha=.2)
    save(fig, "03_current_sequence", cap)

    fig, ax = plt.subplots(figsize=(10, 5.7))
    ax.plot(v[:turn+1], i[:turn+1], "o-", color=BLUE, label="Forward")
    ax.plot(v[turn:], i[turn:], "o-", color=CORAL, label="Return")
    ax.scatter([v[turn], v[-1]], [i[turn], i[-1]], s=125, facecolors="none", edgecolors=NAVY, linewidth=2, zorder=5)
    ax.set(xlabel="Applied potential (V)", ylabel="Current (µA; provisional)", title="Why peak separation is withheld")
    ax.legend(frameon=False); ax.grid(alpha=.2)
    save(fig, "04_boundary_extrema", cap + " Boundary extrema are not resolved interior peaks.")

    reverse = {round(float(x), 5): float(y) for x, y in zip(v[turn:], i[turn:])}
    common = [(float(x), float(y), reverse[round(float(x), 5)]) for x, y in zip(v[:turn+1], i[:turn+1]) if round(float(x), 5) in reverse]
    xs = np.array([row[0] for row in common]); gap = np.array([row[1]-row[2] for row in common])
    fig, ax = plt.subplots(figsize=(10, 5.7))
    ax.axhline(0, color=GRAY, linewidth=1)
    ax.plot(xs, gap, "o-", color=TEAL)
    ax.fill_between(xs, 0, gap, color=TEAL, alpha=.16)
    ax.set(xlabel="Applied potential (V)", ylabel="Forward minus return current (µA)", title="Branch difference at matched potentials")
    ax.grid(alpha=.2)
    save(fig, "05_branch_difference", cap + " Descriptive curve only; no mechanism is inferred.")

    steps = np.diff(v)
    fig, ax = plt.subplots(figsize=(10, 5.7))
    ax.bar(np.arange(1,len(v)), steps * 1000, color=[BLUE if x>0 else CORAL for x in steps])
    ax.axhline(0, color=NAVY, linewidth=1)
    ax.set(xlabel="Step ending at acquisition point", ylabel="Potential step (mV)", title="Sampling and sweep reversal")
    ax.grid(axis="y", alpha=.2)
    save(fig, "06_voltage_steps", cap + " Step size is not scan rate without time stamps.")

    increments = (i[1:]+i[:-1]) / 2 * np.diff(v) * 1e-6
    cumulative = np.r_[0, np.cumsum(increments)]
    fig, ax = plt.subplots(figsize=(10, 5.7))
    ax.plot(np.arange(1,len(v)+1), cumulative*1e7, "o-", color=TEAL)
    ax.axvline(turn+1, color=CORAL, linestyle="--", label="Reversal")
    ax.set(xlabel="Acquisition point", ylabel="Cumulative ∫ I dV (×10⁻⁷ A·V)", title="Signed current–potential path integral")
    ax.legend(frameon=False); ax.grid(alpha=.2)
    save(fig, "07_cumulative_path_integral", cap + " Final value −1.75×10⁻⁷ A·V; this is not charge or energy.")


def simulation_figures():
    report = json.loads(REPORT.read_text(encoding="utf-8"))
    study = report["controlled_simulation"]["noise_study"]
    x = np.array([r["noise_fraction_of_3ua"] * 100 for r in study])
    med = [r["median_absolute_separation_error_mv"] for r in study]
    p95 = [r["p95_absolute_separation_error_mv"] for r in study]
    fig, ax = plt.subplots(figsize=(10, 5.7))
    ax.plot(x, med, "o-", color=BLUE, label="Median absolute error")
    ax.plot(x, p95, "s-", color=CORAL, label="95th percentile")
    ax.set(xlabel="Added Gaussian current noise (% of 3 µA peak)", ylabel="Separation error (mV)", title="Synthetic extractor sensitivity to current noise")
    ax.set_xticks(x); ax.legend(frameon=False); ax.grid(alpha=.2)
    save(fig, "08_simulated_noise", "Simulation only: 200 seeded replicates per level, 10 mV potential sampling. Not physical-cell validation.")


def model_figures(experimental_points: int):
    with TRAINING.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    names = [key for key in rows[0] if key not in {"soh", "cycle_count"}]
    X = np.array([[float(r[n]) for n in names] for r in rows])
    y = np.array([float(r["soh"]) for r in rows])
    cycles = np.array([int(r["cycle_count"]) for r in rows])
    fig, ax = plt.subplots(figsize=(10, 5.7))
    ax.plot(cycles, y, color=BLUE, linewidth=2)
    ax.axvline(120.5, color=CORAL, linestyle="--", label="Chronological test starts")
    ax.set(xlabel="Synthetic cycle index", ylabel="Synthetic SoH label (%)", title="One generated aging trajectory")
    ax.legend(frameon=False); ax.grid(alpha=.2)
    save(fig, "09_synthetic_soh_trajectory", "Generated by ml/training_data_generator.py. These are not measured capacity values.")

    correlation = np.array([np.corrcoef(X[:,j], y)[0,1] for j in range(X.shape[1])])
    order = np.argsort(correlation)
    fig, ax = plt.subplots(figsize=(10, 5.7))
    ax.barh(np.array(names)[order], correlation[order], color=[CORAL if q<0 else BLUE for q in correlation[order]])
    ax.set(xlim=(-1.08,1.08), xlabel="Pearson correlation with synthetic SoH label", title="Model features inherit the generated label")
    ax.axvline(0, color=NAVY, linewidth=1); ax.grid(axis="x", alpha=.2)
    save(fig, "10_synthetic_feature_correlations", "Synthetic table only. The generator derives several features directly from SoH; correlation is not discovery.")

    params = dict(n_estimators=100, max_depth=8, min_samples_split=5, min_samples_leaf=2, random_state=42, n_jobs=1)
    random_train, random_test = train_test_split(np.arange(len(y)), test_size=.2, random_state=42)
    chrono_train, chrono_test = np.arange(120), np.arange(120,150)
    results = {}
    fig, axs = plt.subplots(1,2,figsize=(11,5.7),sharex=True,sharey=True)
    for ax, label, train, test in zip(axs, ["Random row split", "Later cycles held out"], [random_train,chrono_train], [random_test,chrono_test]):
        model = RandomForestRegressor(**params).fit(X[train], y[train])
        predicted = model.predict(X[test])
        rmse = float(np.sqrt(mean_squared_error(y[test], predicted)))
        mae = float(mean_absolute_error(y[test], predicted))
        r2 = float(r2_score(y[test], predicted))
        results[label] = {"train_rows":len(train), "test_rows":len(test), "rmse_soh_points":rmse, "mae_soh_points":mae, "r2":r2}
        ax.scatter(y[test], predicted, color=BLUE if label.startswith("Random") else CORAL, alpha=.8)
        ax.plot([30,105],[30,105],color=GRAY,linestyle="--")
        ax.set(title=f"{label}\nRMSE {rmse:.2f} points; R² {r2:.4f}", xlabel="Generated SoH label (%)")
        ax.grid(alpha=.2)
    axs[0].set_ylabel("Random Forest prediction (%)")
    save(fig, "11_synthetic_split_comparison", "Same 150 generated rows and model settings; scikit-learn " + sklearn.__version__ + ". Neither split tests physical cells.")
    (OUT / "figure_metrics.json").write_text(json.dumps({"source":"team-reported experimental 21-point CV and synthetic training table", "model_split_audit":results,
        "experiment": {"points":experimental_points, "reported_temperature":"approximately room temperature", "scan_rate":"unknown", "electrodes_present":"team reports graphite, platinum and Ag/AgCl; exact roles undocumented"}},indent=2)+"\n",encoding="utf-8")


if __name__ == "__main__":
    setup()
    diagrams()
    v, i, turn = data()
    exp_figures(v,i,turn)
    simulation_figures()
    model_figures(len(v))
    print(f"Wrote 14 figure pairs to {OUT}")
