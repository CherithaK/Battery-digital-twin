# CV sensor evidence for SiNK 2026

This repository is **Phase 1 of a proposed battery digital twin: a CV sensor-analysis prototype**. The industrial need and research question are explained in [`RESEARCH_EXPLAINED.md`](RESEARCH_EXPLAINED.md). The project team reports that the supplied 21-point CV CSV contains values measured in a real experiment. The repository does not yet contain the instrument export, acquisition metadata, or independently measured capacity labels. The trace demonstrates an experimental input and analysis workflow; by itself it cannot validate battery state of health (SoH), remaining useful life (RUL), safety, or degradation mechanism identification.

## Reproduce the results

From the repository root:

```bash
python research/cv_sensor_study.py
python research/synthetic_data_audit.py
python research/generate_conference_figures.py
node --import tsx --test server/sensor_diagnostics.test.ts
npm run check
npm run build
```

`cv_sensor_study.py` uses only the standard library. It writes `research/results/sensor_report.json`, `illustrative_cv.svg`, and `controlled_cv.svg`. The figure generator uses the packages listed in [`figure_requirements.txt`](figure_requirements.txt) and writes 14 numbered PNG/PDF pairs plus `figure_metrics.json` to [`conference_figures`](conference_figures). The Node tests check CSV units and metadata, a complete controlled sweep, a truncated sweep, and the supplied example.

## What the software measures

The API accepts ordered CSV rows with `voltage_v` and exactly one of `current_a` or `current_ua`. It preserves row order and groups cycles without sorting the voltage axis. It checks for enough points, a forward and return branch, a return close to the starting potential, and interior peaks. It reports peak currents and potentials only when those checks pass. It also computes a signed path integral `∮ I dV` in A·V for a complete sweep; this is a geometric loop descriptor, **not** charge or energy. A single scan does not establish the physical origin of a peak.

The original `attached_assets/14,12csv_1765724360390.csv` uses unitless column names. The project team identifies its values as experimental, but the unit and acquisition details are not documented in the file. [`experimental_metadata.json`](experimental_metadata.json) records the team's account separately from confirmed fields. The team reported graphite, platinum and Ag/AgCl, but their roles are unverified. Temperature was approximately room temperature. Scan rate, instrument, material, and electrolyte are unknown. The research script interprets current as amperes **provisionally**. The upload API requires explicit units. `research/illustrative_21_point.csv` is a copy with that provisional unit in its header and no invented metadata; use it for a demo only after confirming the unit. The trace has an apparent peak at the sweep boundary, so the software withholds separation. The current report gives the path integral as approximately `-1.75e-7 A·V` under the ampere assumption; its sign depends on path orientation.

## Controlled sensitivity study

`cv_sensor_study.py` generates a synthetic complete trace with peaks centered at +0.10 and −0.10 V, 3 µA amplitude, 0.07 V width, and 10 mV voltage sampling. It adds independent Gaussian current noise at 0%, 5%, 10%, and 20% of the 3 µA amplitude, using seed 20260926 and 200 replicates per level. The JSON report records how often peaks are usable and the median and 95th-percentile absolute separation error. These numbers measure sensitivity under one assumed signal model, not instrument performance or battery accuracy. Re-run the script after modifying extraction logic.

The old `ml/` model remains for historical audit. Its 150 training rows are generated from a synthetic SoH label; several input features are functions of that label. The random split score cannot establish generalization to later cycles or new physical cells. The live API does not run this model or return SoH, RUL, SEI thickness, or BMS risk values.
`research/results/synthetic_data_audit.json` reports descriptive feature correlations from that table and records the generator provenance. High correlation here reflects construction from the label, not sensor discovery.

The figure generator independently fits the old Random Forest configuration on the synthetic table. A random 120/30 row split gives R² 0.9976, RMSE 1.01 SoH points and MAE 0.75 points. Training on the first 120 cycles and testing on the final 30 gives R² −3.7720, RMSE 14.72 points and MAE 13.11 points. These are **synthetic-table audit results**, not battery test results. For this regression model, R², RMSE and MAE are the appropriate metrics; a classification-style “accuracy” percentage would be misleading. The chronological test exposes poor extrapolation beyond the training range; it is not a held-out-cell validation.

## Figures and evidence labels

The numbered [`conference_figures`](conference_figures) directory has three diagrams, seven plots of the team-reported experimental values, one controlled simulation plot, and three synthetic-data audit plots. Every chart has a provenance caption and PDF version for export. The diagrams and model plots should not be described as additional experiments. Figures 01–07 use the single 21-point trace and inherit the provisional current-unit assumption. Figure 08 is simulation. Figures 09–11 use the generated training table. No plot is a measured SoH trajectory.

The conference deck is [`SINk2026_Phase1_CV_Digital_Twin.pptx`](../SINk2026_Phase1_CV_Digital_Twin.pptx). Build it with `python research/build_sink_presentation.py` after generating the figures; install [`presentation_requirements.txt`](presentation_requirements.txt) first if needed. The first 12 slides are the talk, and the remaining eight hold figures not repeated in the main talk. The original RVCE logo artwork is stored in `research/assets/rvce_logo.png`, sourced from [RVCE logo artwork](https://d2lk14jtvqry1q.cloudfront.net/media/large_89_9b01402b5b_926235f86d.png).

## Data needed for a physical validation claim

The proposed study design, outcomes, leakage controls, and reporting rules are specified in [`PHASE2_VALIDATION_PROTOCOL.md`](PHASE2_VALIDATION_PROTOCOL.md). It is a plan for new measurements, not a result from the current trace.

1. Collect repeated CV sweeps with cell ID, timestamp, chemistry, reference electrode, scan rate, temperature, instrument range, voltage and current units, and acquisition order.
2. Pair each sweep with independently measured discharge capacity under a documented protocol. Define SoH from that capacity, never from the CV feature generator.
3. Pre-register quality gates and evaluate repeatability, drift, boundary failures, and sensitivity to noise and baseline changes.
4. Hold out entire cells, report uncertainty and failure counts, and compare any SoH model against a simple baseline. Evaluate RUL only with a separately defined end-of-life target and sufficient life trajectories.

The accepted abstract's `R² = 0.9247` and `RMSE = 3.46%` cannot be reproduced from this repository. Do not present them as results of this code without the independent source data and evaluation procedure.
