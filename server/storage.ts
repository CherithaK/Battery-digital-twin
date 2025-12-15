import { randomUUID } from "crypto";
import type {
  AnalysisResult,
  CycleData,
  ElectrochemicalMetrics,
  PeakData,
  TemporalFeatures,
  MLEstimates,
  BMSIntelligence,
  RawDataPoint,
} from "@shared/schema";
import {
  predictBatteryHealth,
  checkModelAvailable,
  type FeatureVector,
} from "./ml_inference";

export interface IStorage {
  storeAnalysis(result: AnalysisResult): Promise<void>;
  getAnalysis(sessionId: string): Promise<AnalysisResult | undefined>;
  getAllAnalyses(): Promise<AnalysisResult[]>;
}

export class MemStorage implements IStorage {
  private analyses: Map<string, AnalysisResult> = new Map();

  async storeAnalysis(result: AnalysisResult): Promise<void> {
    this.analyses.set(result.sessionId, result);
  }

  async getAnalysis(sessionId: string): Promise<AnalysisResult | undefined> {
    return this.analyses.get(sessionId);
  }

  async getAllAnalyses(): Promise<AnalysisResult[]> {
    return Array.from(this.analyses.values());
  }
}

export const storage = new MemStorage();

const MIN_POINTS_PER_CYCLE = 10;

export function parseCSV(content: string): { data: RawDataPoint[]; warnings: string[] } {
  const warnings: string[] = [];
  const data: RawDataPoint[] = [];
  
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) {
    warnings.push("CSV file appears empty or has no data rows");
    return { data, warnings };
  }

  const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const cycleIdx = header.findIndex((h) => h.includes("cycle"));
  const voltageIdx = header.findIndex((h) => h.includes("voltage") || h === "v");
  const currentIdx = header.findIndex((h) => h.includes("current") || h === "i" || h === "a");

  if (voltageIdx === -1 || currentIdx === -1) {
    warnings.push("Could not find voltage and current columns. Expected: cycle, voltage, current");
    return { data, warnings };
  }

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(",").map((v) => v.trim());
    if (row.length < 2) continue;

    const voltage = parseFloat(row[voltageIdx]);
    const current = parseFloat(row[currentIdx]);
    const cycle = cycleIdx >= 0 ? parseInt(row[cycleIdx]) : 1;

    if (isNaN(voltage) || isNaN(current)) {
      continue;
    }

    data.push({ cycle: isNaN(cycle) ? 1 : cycle, voltage, current });
  }

  if (cycleIdx === -1) {
    warnings.push("No cycle column found - treating all data as cycle 1");
  }

  return { data, warnings };
}

export function groupByCycle(data: RawDataPoint[]): Map<number, RawDataPoint[]> {
  const groups = new Map<number, RawDataPoint[]>();
  for (const point of data) {
    if (!groups.has(point.cycle)) {
      groups.set(point.cycle, []);
    }
    groups.get(point.cycle)!.push(point);
  }
  return groups;
}

export function normalizeCurrentSI(rawCurrent: number): { si: number; normalized: number } {
  let si = rawCurrent;
  
  if (Math.abs(rawCurrent) > 10) {
    si = rawCurrent * 1e-6;
  } else if (Math.abs(rawCurrent) < 1e-9 && rawCurrent !== 0) {
    si = rawCurrent * 1e-6;
  }
  
  const normalized = si * 1e6;
  
  return { si, normalized };
}

export function detectScanDirection(voltages: number[]): number[] {
  if (voltages.length < 2) return voltages.map(() => 1);
  
  const directions: number[] = [];
  for (let i = 0; i < voltages.length; i++) {
    if (i === 0) {
      directions.push(voltages[1] > voltages[0] ? 1 : -1);
    } else {
      directions.push(voltages[i] > voltages[i - 1] ? 1 : -1);
    }
  }
  return directions;
}

export function processCycle(cycleId: number, points: RawDataPoint[]): CycleData | null {
  if (points.length < MIN_POINTS_PER_CYCLE) {
    return null;
  }

  const voltage: number[] = [];
  const rawCurrentSI: number[] = [];
  const normalizedCurrent: number[] = [];

  for (const p of points) {
    voltage.push(p.voltage);
    const { si, normalized } = normalizeCurrentSI(p.current);
    rawCurrentSI.push(si);
    normalizedCurrent.push(normalized);
  }

  const scanDirection = detectScanDirection(voltage);

  return {
    cycleId,
    voltage,
    rawCurrentSI,
    normalizedCurrent,
    scanDirection,
    pointCount: points.length,
  };
}

export function extractPeaks(cycle: CycleData): PeakData {
  const forwardIndices: number[] = [];
  const reverseIndices: number[] = [];

  for (let i = 0; i < cycle.scanDirection.length; i++) {
    if (cycle.scanDirection[i] === 1) {
      forwardIndices.push(i);
    } else {
      reverseIndices.push(i);
    }
  }

  let Ipa: number | null = null;
  let Epa: number | null = null;
  let Ipc: number | null = null;
  let Epc: number | null = null;

  if (forwardIndices.length > 0) {
    let maxCurrent = -Infinity;
    for (const idx of forwardIndices) {
      if (cycle.normalizedCurrent[idx] > maxCurrent) {
        maxCurrent = cycle.normalizedCurrent[idx];
        Ipa = cycle.normalizedCurrent[idx];
        Epa = cycle.voltage[idx];
      }
    }
  }

  if (reverseIndices.length > 0) {
    let minCurrent = Infinity;
    for (const idx of reverseIndices) {
      if (cycle.normalizedCurrent[idx] < minCurrent) {
        minCurrent = cycle.normalizedCurrent[idx];
        Ipc = cycle.normalizedCurrent[idx];
        Epc = cycle.voltage[idx];
      }
    }
  }

  let deltaEp: number | null = null;
  if (Epa != null && Epc != null) {
    deltaEp = Math.abs(Epa - Epc) * 1000;
    deltaEp = Math.min(deltaEp, 300);
  }

  let reversibility: number | null = null;
  if (Ipa != null && Ipc != null && Ipc !== 0) {
    reversibility = Math.abs(Math.log(Math.abs(Ipa / Ipc)));
  }

  return { Ipa, Epa, Ipc, Epc, deltaEp, reversibility };
}

export function computeElectrochemicalMetrics(cycle: CycleData): ElectrochemicalMetrics {
  const peaks = extractPeaks(cycle);

  const diffusionProxy = peaks.Ipa != null ? Math.abs(peaks.Ipa) : null;

  let chargeTransferProxy: number | null = null;
  if (peaks.Ipa != null && peaks.deltaEp != null && peaks.deltaEp > 0) {
    chargeTransferProxy = Math.abs(peaks.Ipa) / peaks.deltaEp;
  }

  const capacitiveFraction = 0.05 + Math.random() * 0.1;

  const currentValues = cycle.normalizedCurrent;
  const mean = currentValues.reduce((a, b) => a + b, 0) / currentValues.length;
  const variance = currentValues.reduce((a, b) => a + (b - mean) ** 2, 0) / currentValues.length;
  const rms = Math.sqrt(variance);
  const peakMagnitude = Math.max(...currentValues.map(Math.abs));
  const noiseIndex = peakMagnitude > 0 ? rms / peakMagnitude : null;

  let seiThickness: number | null = null;
  if (peaks.Ipa != null) {
    const decayFactor = 1 - Math.min(Math.abs(peaks.Ipa) / 100, 0.9);
    seiThickness = Math.min(100, Math.max(1, 10 + decayFactor * 50 + cycle.cycleId * 0.5));
  } else {
    seiThickness = Math.min(100, Math.max(1, 10 + cycle.cycleId * 0.5));
  }

  return {
    cycleId: cycle.cycleId,
    peaks,
    diffusionProxy,
    chargeTransferProxy,
    capacitiveFraction,
    noiseIndex,
    seiThickness,
  };
}

export function computeTemporalFeatures(metrics: ElectrochemicalMetrics[]): TemporalFeatures | null {
  if (metrics.length < 2) return null;

  const cycles = metrics.map((m) => m.cycleId);
  const deltaEps = metrics.map((m) => m.peaks.deltaEp).filter((v) => v != null) as number[];
  const ipas = metrics.map((m) => m.peaks.Ipa).filter((v) => v != null) as number[];
  const ipcs = metrics.map((m) => m.peaks.Ipc).filter((v) => v != null) as number[];
  const reversibilities = metrics.map((m) => m.peaks.reversibility).filter((v) => v != null) as number[];
  const noises = metrics.map((m) => m.noiseIndex).filter((v) => v != null) as number[];

  const linearSlope = (vals: number[]) => {
    if (vals.length < 2) return null;
    const n = vals.length;
    const xMean = (n - 1) / 2;
    const yMean = vals.reduce((a, b) => a + b, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      num += (i - xMean) * (vals[i] - yMean);
      den += (i - xMean) ** 2;
    }
    return den !== 0 ? num / den : null;
  };

  const deltaEpSlope = linearSlope(deltaEps);
  
  let IpaDecayRate: number | null = null;
  if (ipas.length >= 2 && ipas[0] !== 0) {
    IpaDecayRate = ((ipas[0] - ipas[ipas.length - 1]) / ipas[0]) * 100 / (ipas.length - 1);
  }

  let IpcDecayRate: number | null = null;
  if (ipcs.length >= 2 && ipcs[0] !== 0) {
    IpcDecayRate = ((Math.abs(ipcs[0]) - Math.abs(ipcs[ipcs.length - 1])) / Math.abs(ipcs[0])) * 100 / (ipcs.length - 1);
  }

  const peakPotentialShift = deltaEpSlope;
  const reversibilityDrift = linearSlope(reversibilities);
  const noiseGrowth = linearSlope(noises);

  const variance = (vals: number[]) => {
    if (vals.length === 0) return 1;
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    return vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
  };

  const deltaEpVariance = variance(deltaEps);
  const normalizedVariance = deltaEps.length > 0 ? deltaEpVariance / (Math.pow(deltaEps.reduce((a, b) => a + b, 0) / deltaEps.length, 2) + 1) : 1;
  const stabilityIndex = Math.max(0, Math.min(1, 1 - normalizedVariance));

  const consistencyScore = Math.max(0, Math.min(1, stabilityIndex * (1 - Math.abs(reversibilityDrift || 0))));

  return {
    deltaEpSlope,
    IpaDecayRate,
    IpcDecayRate,
    peakPotentialShift,
    reversibilityDrift,
    noiseGrowth,
    stabilityIndex,
    consistencyScore,
  };
}

function computeWeightedFusionFallback(
  metrics: ElectrochemicalMetrics[],
  temporal: TemporalFeatures | null
): MLEstimates {
  if (metrics.length === 0) {
    return {
      stateOfHealth: 50,
      degradationRate: 0,
      remainingUsefulLife: null,
      confidence: 0.3,
      isOutOfDistribution: true,
    };
  }

  const latestMetrics = metrics[metrics.length - 1];
  const peaks = latestMetrics.peaks;

  let reversibilityScore = 1;
  if (peaks.reversibility != null) {
    reversibilityScore = Math.max(0, 1 - peaks.reversibility * 2);
  }

  let kineticsScore = 1;
  if (peaks.deltaEp != null) {
    kineticsScore = Math.max(0, 1 - (peaks.deltaEp - 59) / 241);
  }

  let seiScore = 1;
  if (latestMetrics.seiThickness != null) {
    seiScore = Math.max(0, 1 - (latestMetrics.seiThickness - 1) / 99);
  }

  let stabilityScore = temporal?.stabilityIndex ?? 0.8;

  const soh = 20 + 80 * (0.3 * reversibilityScore + 0.25 * kineticsScore + 0.25 * seiScore + 0.2 * stabilityScore);
  const clampedSoH = Math.max(20, Math.min(100, soh));

  const degradationRate = temporal?.IpaDecayRate != null ? Math.abs(temporal.IpaDecayRate) : 0.5;

  let rul: number | null = null;
  if (degradationRate > 0 && clampedSoH > 20) {
    rul = Math.round((clampedSoH - 20) / degradationRate);
  }

  let confidence = 0.7;
  if (metrics.length < 3) confidence -= 0.2;
  if (peaks.reversibility != null && peaks.reversibility > 0.5) confidence -= 0.1;
  if (latestMetrics.noiseIndex != null && latestMetrics.noiseIndex > 0.1) confidence -= 0.1;
  confidence = Math.max(0.3, Math.min(1, confidence));

  const isOutOfDistribution =
    (peaks.deltaEp != null && peaks.deltaEp > 250) ||
    (peaks.reversibility != null && peaks.reversibility > 1) ||
    (latestMetrics.noiseIndex != null && latestMetrics.noiseIndex > 0.3);

  if (isOutOfDistribution) confidence *= 0.7;

  return {
    stateOfHealth: clampedSoH,
    degradationRate,
    remainingUsefulLife: rul,
    confidence,
    isOutOfDistribution,
  };
}

function buildFeatureVector(
  metrics: ElectrochemicalMetrics[],
  temporal: TemporalFeatures | null
): FeatureVector {
  const latestMetrics = metrics[metrics.length - 1];
  const peaks = latestMetrics.peaks;

  return {
    deltaEp: peaks.deltaEp ?? 59,
    reversibilityIndex: peaks.reversibility ?? 0.1,
    noiseIndex: latestMetrics.noiseIndex ?? 0.05,
    seiThickness: latestMetrics.seiThickness ?? 10,
    ipaDecayRate: temporal?.IpaDecayRate != null ? Math.abs(temporal.IpaDecayRate) : 0.5,
    kineticsProxy: latestMetrics.chargeTransferProxy != null
      ? Math.max(0.2, Math.min(1, latestMetrics.chargeTransferProxy / 10))
      : 0.7,
    diffusionProxy: latestMetrics.diffusionProxy != null
      ? Math.max(0.2, Math.min(1, latestMetrics.diffusionProxy / 100))
      : 0.7,
    stabilityIndex: temporal?.stabilityIndex ?? 0.8,
    consistencyScore: temporal?.consistencyScore ?? 0.9,
  };
}

export async function computeMLEstimates(
  metrics: ElectrochemicalMetrics[],
  temporal: TemporalFeatures | null
): Promise<MLEstimates> {
  if (metrics.length === 0) {
    return {
      stateOfHealth: 50,
      degradationRate: 0,
      remainingUsefulLife: null,
      confidence: 0.3,
      isOutOfDistribution: true,
    };
  }

  if (checkModelAvailable()) {
    try {
      const features = buildFeatureVector(metrics, temporal);
      const prediction = await predictBatteryHealth(features);

      if (prediction) {
        return {
          stateOfHealth: prediction.stateOfHealth,
          degradationRate: prediction.degradationRate,
          remainingUsefulLife: prediction.remainingUsefulLife,
          confidence: prediction.confidence,
          isOutOfDistribution: prediction.isOutOfDistribution,
        };
      }
    } catch (err) {
      console.warn("[ML] Prediction failed, using fallback:", err);
    }
  }

  return computeWeightedFusionFallback(metrics, temporal);
}

export function computeBMSIntelligence(
  metrics: ElectrochemicalMetrics[],
  temporal: TemporalFeatures | null,
  mlEstimates: MLEstimates
): BMSIntelligence {
  const latestMetrics = metrics.length > 0 ? metrics[metrics.length - 1] : null;

  const voltageStressIndex = latestMetrics?.peaks.deltaEp != null
    ? Math.min(1, latestMetrics.peaks.deltaEp / 300)
    : 0.3;

  const currentStressIndex = latestMetrics?.peaks.Ipa != null
    ? Math.min(1, Math.abs(latestMetrics.peaks.Ipa) / 100)
    : 0.3;

  const polarizationRisk = (voltageStressIndex + currentStressIndex) / 2;

  let operationalRiskLevel: "low" | "moderate" | "high" | "critical" = "low";
  const avgRisk = (voltageStressIndex + currentStressIndex + polarizationRisk) / 3;
  if (avgRisk > 0.8) operationalRiskLevel = "critical";
  else if (avgRisk > 0.6) operationalRiskLevel = "high";
  else if (avgRisk > 0.4) operationalRiskLevel = "moderate";

  const acceleratedAging = mlEstimates.degradationRate > 2;
  const instabilityDetected = (temporal?.stabilityIndex ?? 1) < 0.5;
  const kineticLimitation = latestMetrics?.peaks.deltaEp != null && latestMetrics.peaks.deltaEp > 150;

  const reversibilityReserve = latestMetrics?.peaks.reversibility != null
    ? Math.max(0, 1 - latestMetrics.peaks.reversibility * 2)
    : 0.5;

  const stabilityReserve = temporal?.stabilityIndex ?? 0.7;
  const degradationBuffer = Math.max(0, (mlEstimates.stateOfHealth - 20) / 80);

  let optimalOperatingZone = "Standard cycling within voltage window";
  if (voltageStressIndex > 0.7) {
    optimalOperatingZone = "Reduce voltage sweep range";
  } else if (currentStressIndex > 0.7) {
    optimalOperatingZone = "Lower scan rate recommended";
  }

  let stressAvoidanceHint = "Maintain current operating parameters";
  if (acceleratedAging) {
    stressAvoidanceHint = "Reduce cycling frequency to slow degradation";
  } else if (instabilityDetected) {
    stressAvoidanceHint = "Allow rest periods between cycles";
  }

  let recoveryPotential: "none" | "low" | "moderate" | "high" = "low";
  if (reversibilityReserve > 0.7 && stabilityReserve > 0.7) {
    recoveryPotential = "high";
  } else if (reversibilityReserve > 0.4 || stabilityReserve > 0.5) {
    recoveryPotential = "moderate";
  } else if (reversibilityReserve < 0.2 && stabilityReserve < 0.3) {
    recoveryPotential = "none";
  }

  let reversibleLossFraction: number | null = null;
  let healingEfficiency: number | null = null;
  let recoveryTrend: "improving" | "stable" | "declining" | null = null;

  if (metrics.length >= 3 && temporal) {
    const firstIpa = metrics[0].peaks.Ipa;
    const lastIpa = metrics[metrics.length - 1].peaks.Ipa;
    if (firstIpa != null && lastIpa != null && firstIpa !== 0) {
      const totalLoss = (firstIpa - lastIpa) / firstIpa;
      reversibleLossFraction = Math.max(0, Math.min(1, totalLoss * reversibilityReserve));
      healingEfficiency = reversibilityReserve * stabilityReserve;

      if (temporal.IpaDecayRate != null) {
        if (temporal.IpaDecayRate < -0.5) recoveryTrend = "improving";
        else if (temporal.IpaDecayRate > 1) recoveryTrend = "declining";
        else recoveryTrend = "stable";
      }
    }
  }

  return {
    operatingEnvelope: {
      voltageStressIndex,
      currentStressIndex,
      polarizationRisk,
      operationalRiskLevel,
    },
    riskIndicators: {
      acceleratedAging,
      instabilityDetected,
      kineticLimitation,
      confidence: mlEstimates.confidence,
    },
    healthMargins: {
      reversibilityReserve,
      stabilityReserve,
      degradationBuffer,
    },
    adaptiveInsights: {
      optimalOperatingZone,
      stressAvoidanceHint,
      recoveryPotential,
    },
    healingMetrics: {
      reversibleLossFraction,
      healingEfficiency,
      recoveryTrend,
      confidence: mlEstimates.confidence * 0.8,
    },
  };
}

export async function analyzeCSV(content: string, fileName: string): Promise<AnalysisResult> {
  const sessionId = randomUUID();
  const uploadTimestamp = new Date().toISOString();

  const { data, warnings } = parseCSV(content);

  if (data.length === 0) {
    return {
      sessionId,
      fileName,
      uploadTimestamp,
      totalCycles: 0,
      validCycles: 0,
      warnings: [...warnings, "No valid data points found"],
      cycles: [],
      electrochemicalMetrics: [],
      temporalFeatures: null,
      mlEstimates: {
        stateOfHealth: 50,
        degradationRate: 0,
        remainingUsefulLife: null,
        confidence: 0,
        isOutOfDistribution: true,
      },
      bmsIntelligence: {
        operatingEnvelope: { voltageStressIndex: 0, currentStressIndex: 0, polarizationRisk: 0, operationalRiskLevel: "low" },
        riskIndicators: { acceleratedAging: false, instabilityDetected: false, kineticLimitation: false, confidence: 0 },
        healthMargins: { reversibilityReserve: 0, stabilityReserve: 0, degradationBuffer: 0 },
        adaptiveInsights: { optimalOperatingZone: "N/A", stressAvoidanceHint: "N/A", recoveryPotential: "none" },
        healingMetrics: { reversibleLossFraction: null, healingEfficiency: null, recoveryTrend: null, confidence: 0 },
      },
      healthScore: 50,
    };
  }

  const grouped = groupByCycle(data);
  const totalCycles = grouped.size;
  const allWarnings = [...warnings];

  const cycles: CycleData[] = [];
  for (const entry of Array.from(grouped.entries())) {
    const [cycleId, points] = entry;
    const processed = processCycle(cycleId, points);
    if (processed) {
      cycles.push(processed);
    } else {
      allWarnings.push(`Cycle ${cycleId} skipped: insufficient points (< ${MIN_POINTS_PER_CYCLE})`);
    }
  }

  cycles.sort((a, b) => a.cycleId - b.cycleId);

  const electrochemicalMetrics = cycles.map((c) => computeElectrochemicalMetrics(c));
  const temporalFeatures = computeTemporalFeatures(electrochemicalMetrics);
  const mlEstimates = await computeMLEstimates(electrochemicalMetrics, temporalFeatures);
  const bmsIntelligence = computeBMSIntelligence(electrochemicalMetrics, temporalFeatures, mlEstimates);

  return {
    sessionId,
    fileName,
    uploadTimestamp,
    totalCycles,
    validCycles: cycles.length,
    warnings: allWarnings,
    cycles,
    electrochemicalMetrics,
    temporalFeatures,
    mlEstimates,
    bmsIntelligence,
    healthScore: mlEstimates.stateOfHealth,
  };
}
