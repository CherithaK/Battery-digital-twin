# SiNK conference speaking notes

The presentation is [`SINk2026_Phase1_CV_Digital_Twin.pptx`](../SINk2026_Phase1_CV_Digital_Twin.pptx). Slides 1–12 form the talk; slides 13–20 are a figure appendix. The deck includes speaker notes with evidence sources. Use [`RESEARCH_EXPLAINED.md`](RESEARCH_EXPLAINED.md) for the complete argument and [`conference_figures`](conference_figures) for graph sources. Earlier decks are working drafts.

## Core narrative

1. **Industrial need:** electrochemical data can support battery diagnostics only if the incoming measurement and its metadata are trustworthy. A peak cut off by a voltage boundary cannot be used as though it were measured.
2. **Scope:** this is Phase 1 of a proposed digital twin, the CV measurement and quality layer. We have not yet built a validated battery-health predictor or a model that updates for an identified battery.
3. **Method:** preserve acquisition order, require units, check the forward and return sweep, extract only defensible descriptors, and explain withheld values.
4. **Evidence:** the team reports a 21-point real experimental CV trace. It triggers a boundary-peak warning. A separate controlled simulation quantifies extractor sensitivity to added noise.
5. **Model audit:** the Random Forest was trained on generated labels and features. Its random split result does not validate physical batteries; chronological extrapolation on the same generated table is poor.
6. **Next experiment:** repeat fully logged CV measurements on identified cells, pair them with independent capacity tests, and evaluate on entire cells not seen during training.

**Existing solutions and difference:** Operational BMS methods estimate battery state from available signals; potentiostat software already performs CV peak analysis; ML papers train on labeled battery datasets; digital-twin frameworks update a physical battery's virtual model. Our present result is narrower: an auditable CV input and quality gate that explains why a feature is withheld, while separating a real reported trace from a synthetic model demonstration. Do not claim this is the first CV analysis tool or a validated SoH predictor. See the comparison and sources in [`RESEARCH_EXPLAINED.md`](RESEARCH_EXPLAINED.md).

## Questions to prepare for

**Which electrodes did you use?** The team reported graphite, platinum and Ag/AgCl. A conventional arrangement would use graphite as working, platinum as counter and Ag/AgCl as reference, but the laboratory record is unavailable and the assignments must be checked. Do not state that arrangement as a verified experimental fact.

**What was the scan rate?** Unknown. The remembered number “200” lacks a reliable unit and is excluded. Potential step size in the CSV cannot determine scan rate without time stamps.

**Is the supplied curve real?** The team reports that these 21 values came from a real CV setup. The repository has a data table, not the original instrument export or complete metadata. The plotted values are not synthetic; the separate robustness trace and the RF training table are synthetic.

**Does this prove SoH prediction?** No. There are no independently measured capacity labels for the experimental trace. The old model was trained on generated SoH and is not run by the live API.

**What are the ML metrics?** On a random 120/30 split of generated rows, the Random Forest has R² 0.9976, RMSE 1.01 SoH points and MAE 0.75 points. On the last 30 generated cycles, it has R² −3.7720, RMSE 14.72 points and MAE 13.11 points. This is regression, so say “model metrics” rather than “accuracy percentage.” These values do not measure performance on physical cells.

**Is this already a digital twin?** It is an implemented first layer toward one. A complete twin requires a physical battery identity, a calibrated model that updates from new measurements, and independent longitudinal verification.

**What is the positive result?** The prototype retains the measured curve, detects an unsupported peak-pair estimate, and shows its reason instead of emitting a misleading number. Its extractor has a reproducible sensitivity study under controlled simulated noise. That is a defensible Phase 1 result.

**Can the accepted abstract's R² 0.9247 and RMSE 3.46% be quoted?** The repository has no reproducible dataset or evaluation that establishes those values. Do not present them as validated outcomes from this work.

**What is the error range of the sensing technique?** We cannot state an experimental sensor accuracy or uncertainty interval from one 21-point sweep. The instrument specifications, current unit, scan rate, reference standard and repeat scans are unavailable. The observed CSV has 50 mV potential increments, which describe sampling, not instrument accuracy. What we *can* report is a controlled software peak-extraction sensitivity study: with simulated 3 µA peaks and 10 mV potential sampling, the median absolute separation error is 10 mV and the 95th percentile is 30.5 mV at 10% added Gaussian current noise (200 seeded replicates). At 5% noise the corresponding errors are 10 and 20 mV; at 20% noise they are 20 and 50 mV. These cannot be transferred to the physical setup. The experimental scan fails the interior-peak gate, so its peak-separation error cannot be calculated against a reference value.

**How does this fit SINk 2026?** The organiser describes the [Sensor Intelligence Network Conference](https://www.linkedin.com/posts/dr-vishal-chaudhary_schedule-activity-7508161441263304704-ga_Y) as spanning electrochemistry, signal acquisition, AI and decisions, with themes including sensor intelligence and sustainable technologies. Our strongest contribution is the transition from a measured electrochemical signal to an auditable decision about which features it supports. The battery digital twin and energy application are future-facing context. Say: “Our Phase 1 work adds an evidence check between electrochemical sensing and model-based interpretation. It tells the analyst when the signal supports a peak measurement and when it does not.”
