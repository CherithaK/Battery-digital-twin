# SiNK research, from the beginning

## One-sentence description

We built and tested the **measurement and quality-check layer** that a future battery digital twin would need before it could make defensible battery-health predictions.

## Industrial problem statement

Battery developers and diagnostic teams need to compare electrochemical measurements across tests and eventually relate them to capacity loss. A model cannot give a trustworthy health estimate if the incoming measurement has an unknown current unit, missing acquisition settings, an incomplete sweep, or a peak cut off by the chosen voltage window. An apparently precise prediction would hide that problem. The immediate engineering need is a traceable way to ingest a CV measurement, reject unsupported features, and record what was actually observed. This prototype addresses that first step in a laboratory workflow. It has not been demonstrated as an in-vehicle or deployed battery-management system.

## Basic concepts

**Cyclic voltammetry (CV):** the instrument changes the potential in one direction and then reverses it while recording current. A plot of current against potential is a cyclic voltammogram. The order of points matters because the same potential may occur on the forward and return branches.

**Peak separation:** the difference between the potentials of a resolved forward and return current peak. If an extremum lies at the scan boundary, the true peak may be outside the scanned range. The number is then withheld.

**State of health (SoH):** a battery capacity measure relative to a defined reference capacity, usually expressed as a percentage. A CV curve alone is not a measured capacity label.

**Digital twin:** a virtual model linked to an identified physical battery, updated with measurements and tested against independent outcomes. The current repository implements a proposed **Phase 1 sensor layer**, not that complete model.

## Research question and hypothesis

**Question:** Can a transparent CV ingestion and quality-check workflow preserve the experimental trace, identify when extracted peak metrics are unsupported, and quantify the sensitivity of extraction to controlled noise before those metrics are used in a battery-health model?

**Hypothesis for this phase:** an explicit quality gate will prevent a boundary-limited sweep from being reported as a valid peak-pair measurement, and a controlled simulation will reveal how sampling and current noise affect the extractor. The work does **not** test whether CV predicts SoH in physical batteries.

## Existing approaches and our place among them

| Existing approach | What it already does | Where this Phase 1 prototype fits |
| --- | --- | --- |
| **Battery-management systems and model-based diagnostics** | Typically use voltage, current and temperature during operation to estimate battery state; research systems can update life-model parameters. | Our imported CV workflow is for laboratory evidence preparation. CV requires a controlled experiment and is not currently an onboard input to this app. |
| **Potentiostat analysis software** | Already plots CV data and provides peak finding, peak separation, baseline and integration tools. | Our contribution is a small, reproducible, vendor-independent workflow that records explicit units and sweep checks and withholds unsupported peak-pair output for this trace. We do not claim to have invented CV peak analysis or to exceed vendor software. |
| **Published ML methods for SoH** | Fit relationships between measured battery features and independently measured capacity on labeled cell datasets. Some use whole-cell testing and prediction uncertainty. | We have no matched capacity labels, so the historical Random Forest is only a synthetic-data audit. The proposed Phase 2 would require cell-level physical validation before health prediction. |
| **Battery digital-twin frameworks** | Link physical batteries, incoming data and updating models for monitoring or control. | We implement only a candidate measurement/quality layer. Cell identity, calibrated state updating and longitudinal verification remain future work. |

The **specific difference demonstrated here** is the decision to show an evidence boundary: the app preserves the real reported CV values, explains why this particular sweep cannot support peak separation, and does not turn a synthetic Random Forest score into a physical-battery SoH claim. That is an engineering contribution at prototype scale, **not a claim of algorithmic novelty or superiority over existing tools**. The comparison is supported by [NREL's battery diagnostics work](https://www.nrel.gov/transportation/battery-lifespan.html), [Gamry's CV analysis documentation](https://www.gamry.com/assets/Uploads/EchemAnalystSoftwareManual.pdf), [published battery SoH ML work on labeled cells](https://arxiv.org/abs/2102.00837), and [the battery digital-twin perspective](https://doi.org/10.1016/j.egyai.2020.100016).

## What was done

1. The team supplied a CSV with **21 current–potential points** reported as taken from a real CV setup. The recorded file has no instrument header or current unit. The team reported approximately room-temperature measurement and graphite, platinum, and Ag/AgCl electrodes. Electrode assignments, material under test, instrument model, scan rate and unit remain unconfirmed; “200” from memory has no confirmed unit and is not used.
2. The code preserves acquisition order and separates forward and return branches. For the live API, the uploaded CSV must explicitly declare V and either A or µA, and it may include acquisition metadata.
3. It checks sweep shape, closure, and whether peaks are interior to the scan. It reports descriptive quantities only when justified. The supplied trace is **limited**: apparent extrema occur at scan boundaries, so peak separation is unavailable. Under a provisional ampere interpretation, its signed path integral is about **−1.75 × 10⁻⁷ A·V**. This integral is a curve descriptor, not charge, energy, or capacity.
4. A separate, clearly simulated CV trace with known interior peaks is perturbed with seeded Gaussian current noise. This tests extractor sensitivity under chosen assumptions, not physical-cell performance. At 10% noise relative to the simulated 3 µA peak, median absolute separation error is **10 mV** and the 95th percentile is **30.5 mV** across 200 replicates.
5. The older Random Forest model is audited separately. It was trained on 150 generated rows whose features are constructed from a generated SoH trajectory. On the same synthetic table, a random row split gives **1.01 SoH points RMSE; R² 0.9976**, while holding out the last 30 cycles gives **14.72 points RMSE; R² −3.7720**. Neither result tests a physical battery. The live API does not issue SoH or RUL predictions.

## Proposed solution and conclusion

The proposed solution is a **quality-gated CV evidence layer**: retain the original ordered measurement, require units and relevant metadata, make the sweep checks visible, and withhold metrics that the trace cannot support. The repository demonstrates that behavior on the supplied experimental values and on controlled simulated traces. It does **not** establish a CV-to-SoH relationship, a validated degradation mechanism, or an operational digital twin.

The path forward has three phases:

| Phase | Deliverable | Evidence required |
| --- | --- | --- |
| **1 — current prototype** | CV ingestion, quality checks, traceable descriptors, clear withholding | Software tests, reproducible analysis, preserved experimental provenance |
| **2 — physical validation** | A tested relationship between CV features and battery health, if one exists | Repeated sweeps on identified cells, complete acquisition metadata, independent discharge-capacity labels, entire held-out cells and uncertainty |
| **3 — operational twin** | A battery-specific model updated by incoming measurements | Calibrated state model, longitudinal verification, drift monitoring and operational acceptance criteria |

## Suggested 30-second explanation

“Industry wants battery-health predictions it can trust. Our first problem is that a model can only be as sound as the electrochemical measurement feeding it. We built Phase 1 of a proposed battery digital twin: a CV data layer that checks sweep quality and refuses to calculate a peak separation when the scan does not resolve the peaks. We tested it using a 21-point trace reported from our real setup and a separate controlled simulation. We also found that the old Random Forest score came from generated training data and does not validate battery health. The next experiment is repeated, fully documented CV on identified cells with independent capacity measurements.”

## Sources for context

- NREL, [Lithium-ion battery diagnostics](https://www.nrel.gov/docs/fy23osti/86394.pdf): battery monitoring and lifetime challenges.
- [A Practical Beginner’s Guide to Cyclic Voltammetry](https://pubs.acs.org/doi/10.1021/acs.jchemed.7b00361): CV measurement concepts and three-electrode configuration.
- [Battery digital twins: Perspectives on the fusion of models, data and artificial intelligence](https://doi.org/10.1016/j.egyai.2020.100016): the wider model-and-data framework. These references provide context; they do not validate our results.
