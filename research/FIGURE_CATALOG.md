# Figure catalog

The [`conference_figures`](conference_figures) folder contains each figure as a PNG and PDF. Run `python research/generate_conference_figures.py` from the repository root to recreate them. Captions inside each figure mark its evidence source. The current unit in experimental plots is provisional; confirm it from the instrument export before publication.

| Figure | Use | Evidence source |
| --- | --- | --- |
| `00_measurement_workflow` | Measurement, quality gate and separate model audit | Concept diagram |
| `00_digital_twin_roadmap` | Current Phase 1 and proposed Phases 2–3 | Concept diagram |
| `00_electrode_materials` | Three-electrode arrangement to verify with lab log | Reconstructed schematic, roles unverified |
| `01_recorded_cv` | Forward and return current–potential curves | Team-reported experimental values, 21 points |
| `02_potential_sequence` | Scan direction and reversal in acquisition order | Same 21 points |
| `03_current_sequence` | Current by acquisition point | Same 21 points |
| `04_boundary_extrema` | Why a peak-pair estimate is withheld | Same 21 points |
| `05_branch_difference` | Difference between forward and return current at matched potentials | Same 21 points |
| `06_voltage_steps` | Potential sampling and reversal; not scan rate | Same 21 points |
| `07_cumulative_path_integral` | Signed current–potential path descriptor | Same 21 points; provisional A unit |
| `08_simulated_noise` | Error of extractor as controlled current noise rises | Seeded simulation, 200 replicates per level |
| `09_synthetic_soh_trajectory` | Shape of the generated SoH labels | Synthetic ML table |
| `10_synthetic_feature_correlations` | Why model features are coupled to generated labels | Synthetic ML table |
| `11_synthetic_split_comparison` | Random split and later-cycle test | Synthetic ML table |

For the eventual talk, lead with the industrial need, `00_digital_twin_roadmap`, `01_recorded_cv`, `04_boundary_extrema`, and `08_simulated_noise`. Use the model audit graphs if explaining why the old SoH claim is excluded. The remaining figures can support questions or an appendix.
