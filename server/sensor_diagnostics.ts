import type { CycleData, SensorDiagnostic } from "@shared/schema";

export function diagnoseCycle(cycle: CycleData): SensorDiagnostic {
  const { voltage, rawCurrentSI: current, cycleId, pointCount } = cycle;
  const reasons: string[] = [];
  const low = Math.min(...voltage);
  const high = Math.max(...voltage);
  const result: SensorDiagnostic = {
    cycleId, quality: "invalid", reasons,
    anodicPeakUa: null, anodicPeakV: null, cathodicPeakUa: null, cathodicPeakV: null,
    peakSeparationMv: null, peakCurrentRatio: null, loopIntegralAV: null,
    voltageMinV: low, voltageMaxV: high, pointCount,
  };
  if (pointCount < 10) reasons.push("At least 10 points are needed per sweep.");
  if (high - low < 1e-12) reasons.push("Voltage does not vary.");
  if (reasons.length) return result;

  let turn = -1;
  let direction = 0;
  for (let i = 1; i < voltage.length; i++) {
    const step = Math.sign(voltage[i] - voltage[i - 1]);
    if (!step) continue;
    if (!direction) direction = step;
    else if (step !== direction) { turn = i - 1; break; }
  }
  if (turn < 4 || voltage.length - turn - 1 < 4) {
    reasons.push("A complete forward and return branch with at least five points each is required.");
    return result;
  }
  for (let i = 1; i <= turn; i++) {
    if (Math.sign(voltage[i] - voltage[i - 1]) === -direction) {
      reasons.push("Forward branch changes direction unexpectedly."); return result;
    }
  }
  for (let i = turn + 1; i < voltage.length; i++) {
    if (Math.sign(voltage[i] - voltage[i - 1]) === direction) {
      reasons.push("Return branch changes direction unexpectedly."); return result;
    }
  }
  const range = high - low;
  if (Math.abs(voltage.at(-1)! - voltage[0]) > Math.max(range * 0.05, 1e-6)) {
    reasons.push("Return branch does not end near the starting voltage."); return result;
  }
  let integral = 0;
  for (let i = 1; i < voltage.length; i++) {
    integral += (current[i] + current[i - 1]) * (voltage[i] - voltage[i - 1]) / 2;
  }
  result.loopIntegralAV = integral;
  const first = Array.from({ length: turn + 1 }, (_, i) => i);
  const second = Array.from({ length: voltage.length - turn }, (_, i) => turn + i);
  const positive = direction > 0 ? first : second;
  const negative = direction > 0 ? second : first;
  const anodic = positive.reduce((best, i) => current[i] > current[best] ? i : best);
  const cathodic = negative.reduce((best, i) => current[i] < current[best] ? i : best);
  if ([positive[0], positive.at(-1)].includes(anodic) || [negative[0], negative.at(-1)].includes(cathodic)) {
    reasons.push("At least one apparent peak lies at a sweep boundary; peak metrics are withheld.");
    result.quality = "limited"; return result;
  }
  if (current[anodic] <= 0 || current[cathodic] >= 0) {
    reasons.push("Opposite-sign anodic and cathodic peaks are not resolved.");
    result.quality = "limited"; return result;
  }
  result.anodicPeakUa = current[anodic] * 1e6;
  result.anodicPeakV = voltage[anodic];
  result.cathodicPeakUa = current[cathodic] * 1e6;
  result.cathodicPeakV = voltage[cathodic];
  result.peakSeparationMv = Math.abs(voltage[anodic] - voltage[cathodic]) * 1e3;
  result.peakCurrentRatio = Math.abs(current[anodic] / current[cathodic]);
  result.quality = "usable";
  return result;
}
