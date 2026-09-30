# Phase 2 validation protocol

This is a proposed study design, not a report of completed experiments. Phase 1 has one team-reported experimental CV trace with 21 points and no independent capacity label. Its instrument accuracy, repeatability, and battery SoH prediction error cannot be estimated from that trace.

## Industrial decision and target

The eventual decision is whether a battery cell needs maintenance, retirement, or further testing. Define state of health before fitting a model as `100 × measured discharge capacity / rated or beginning-of-life capacity`, specifying which denominator is used. Measure capacity with a documented discharge protocol. Record the elapsed time between CV and capacity measurements. A usable decision tool must report a prediction with uncertainty and abstain when the CV measurement fails quality checks or lies outside the validated operating range.

## Data collection

Collect multiple independent cells across the intended chemistry, age, and operating range. Give each cell a stable ID. For every CV sweep, preserve the original instrument export and record timestamp, operator, instrument model and calibration, graphite/platinum/Ag/AgCl electrode roles as verified from the lab log, reference scale, electrolyte, material, cell configuration, potential limits, scan rate with units, current range, temperature, sampling interval, and full acquisition order. Run repeat sweeps on the same cell after a defined stabilization procedure. Pair them with independently measured discharge capacity and its test conditions. Do not infer missing settings from the 21-point example.

## Primary validation outcomes

1. **Measurement completeness:** fraction of attempted sweeps with all required metadata and a parseable full cycle. Report the count and reasons for exclusion.
2. **Feature availability:** fraction of sweeps passing the prespecified quality gate and yielding an interior peak pair. Report failures separately from numerical errors.
3. **Repeatability:** within-cell standard deviation and 95% repeatability limit for peak potential, peak current, and separation across repeated sweeps at fixed conditions. Estimate these only from physical repeats.
4. **Reference agreement:** when a reference electrochemical standard or independently validated peak location is available, report signed bias, MAE, and a 95% interval for errors. Potential sampling step is a resolution descriptor, not an accuracy estimate.
5. **SoH generalization:** on untouched cells, report MAE and RMSE in SoH percentage points, R² where the test range makes it meaningful, calibration or coverage of prediction intervals, and performance by chemistry, temperature, and age band. Include a simple baseline such as predicting training-cell median SoH.

## Split and leakage rules

Assign entire cells to train, validation, or test partitions before model fitting. Keep all sweeps and capacity measurements from each cell in one partition. Fit scaling, feature selection, imputation, quality thresholds, and hyperparameters using training cells only. Freeze the analysis before opening the test cells. If forecasting later life on a previously seen cell is the industrial target, report that as a separate chronological evaluation and do not call it unseen-cell generalization. Publish cell counts, sweep counts, excluded counts, split IDs, code version, and the exact target formula with each result.

## Sensitivity and uncertainty

Vary scan rate, temperature, baseline offset, reference drift, current noise, and voltage sampling one factor at a time where possible. Compare repeated physical sweeps with the software noise simulation rather than transferring its 10 mV median and 30.5 mV 95th-percentile error at 10% simulated noise to the instrument. Estimate uncertainty from independent cells for model generalization and from repeat physical measurements for sensor repeatability. Bootstrap at the **cell** level, not the row level, when sweeps from a cell are correlated. Report abstention frequency alongside accuracy; excluding difficult sweeps without counting them would overstate field performance.

## Decision gate

No SoH or RUL performance claim is ready until the above data exist and the held-out-cell results, failure counts, and uncertainty are reported. The current Random Forest scores are an audit of generated training rows. They should not be used as thresholds for physical-cell acceptance.
