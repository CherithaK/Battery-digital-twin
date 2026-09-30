# Validation record, 2026-09-26

The following checks were run on the current Windows checkout.

| Check | Result |
| --- | --- |
| `python research/cv_sensor_study.py` | Passed; regenerated JSON and SVG figures with seed 20260926. |
| `python research/synthetic_data_audit.py` | Passed; confirmed 150 synthetic rows and strong feature-label correlations from the generator. |
| `node --import tsx --test server/sensor_diagnostics.test.ts` | Passed 4 of 4 targeted tests. |
| `npm run check` | Passed TypeScript type check. |
| `npm run build` | Passed Vite client and esbuild server production build. |
| `python research/generate_conference_figures.py` | Passed; produced 14 PNG/PDF figure pairs and machine-readable model split metrics. |
| Figure artifact check | All 14 paired PNG/PDF names matched, every file was nonempty, and `figure_metrics.json` parsed with 21 experimental points. Reviewed the workflow diagram, phase roadmap, boundary-extrema plot, and model split plot visually. |
| `python -m compileall -q research` | Passed syntax compilation for the research scripts. |
| Built app, local browser | Loaded dashboard; uploaded `research/illustrative_21_point.csv`; displayed a limited sweep, withheld peak separation, `-1.750e-7 A·V` path integral, and five missing-metadata warnings. Corrected chart preserves acquisition order with no false join at the starting point. |
| Validated deck | Eight slides rendered and visually inspected; slide 5 uses the current JSON report; slide 7 overlap fixed. |

The controlled noise study is a sensitivity check under a chosen signal model. It is not validation against physical battery measurements. No independent capacity-labelled dataset is present. The accepted abstract's SoH metrics remain unverified in this repository. The model audit gives 1.01 SoH points RMSE / R² 0.9976 on a random row split of the synthetic table, and 14.72 points RMSE / R² −3.7720 on the later-cycle holdout. These are diagnostic results on generated data only.

The final SiNK deck was built after the repo research was finalized: `SINk2026_Phase1_CV_Digital_Twin.pptx`, 12 talk slides plus eight figure appendix slides. It was rendered to PNG for visual inspection. The contact sheet and full-size inspection of slides 2, 4, 6, 7, and 12 found the layout readable with no visible overlap. Every slide contains the RVCE logo. The earlier decks are drafts.

The revised deck makes synthetic Random Forest regression metrics prominent on slide 9: R² 0.9976, RMSE 1.01 points, and MAE 0.75 points for the generated-data random split. Slide 9 also shows poor later-cycle extrapolation. Slides 4, 6 and 13 were re-rendered and checked after the wording revision. The electrode diagram lists the team-reported materials without assigning undocumented working, counter or reference roles.

The final repository pass regenerated all 14 figure pairs, rebuilt the 20-slide deck after renaming the electrode figure, and reran the CV study, synthetic audit, four sensor tests, TypeScript check, and production build. The Node tests and build needed permission to spawn child processes in this sandbox; both passed when rerun with that permission. [`PHASE2_VALIDATION_PROTOCOL.md`](PHASE2_VALIDATION_PROTOCOL.md) defines the physical measurement, held-out-cell, and uncertainty checks required before making a battery-health accuracy claim.
