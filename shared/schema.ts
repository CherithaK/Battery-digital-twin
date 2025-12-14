import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table (existing)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ============================================================
// Battery Digital Twin Type Definitions (Frontend/Backend Shared)
// ============================================================

// Raw CSV data point
export interface RawDataPoint {
  cycle: number;
  voltage: number;
  current: number;  // SI units (Amperes)
}

// Per-cycle extracted data
export interface CycleData {
  cycleId: number;
  voltage: number[];
  rawCurrentSI: number[];        // Assumed Amps
  normalizedCurrent: number[];   // µA-scaled for computation
  scanDirection: number[];       // +1 forward, −1 reverse
  pointCount: number;
}

// Peak extraction results
export interface PeakData {
  Ipa: number | null;   // Anodic peak current (µA)
  Epa: number | null;   // Anodic peak potential (V)
  Ipc: number | null;   // Cathodic peak current (µA)
  Epc: number | null;   // Cathodic peak potential (V)
  deltaEp: number | null;  // Peak separation (mV)
  reversibility: number | null;  // |log(Ipa/Ipc)|
}

// Electrochemical analysis per cycle
export interface ElectrochemicalMetrics {
  cycleId: number;
  peaks: PeakData;
  diffusionProxy: number | null;      // Randles-Ševčík relative
  chargeTransferProxy: number | null; // Butler-Volmer slope proxy
  capacitiveFraction: number | null;  // Double-layer estimate
  noiseIndex: number | null;          // RMS noise / peak current
  seiThickness: number | null;        // nm, [1-100] clamped
}

// Temporal trend features (multi-cycle)
export interface TemporalFeatures {
  deltaEpSlope: number | null;        // mV/cycle
  IpaDecayRate: number | null;        // %/cycle
  IpcDecayRate: number | null;        // %/cycle
  peakPotentialShift: number | null;  // mV/cycle
  reversibilityDrift: number | null;
  noiseGrowth: number | null;
  stabilityIndex: number | null;      // 0-1
  consistencyScore: number | null;    // 0-1
}

// ML-derived estimates
export interface MLEstimates {
  stateOfHealth: number;         // 20-100%
  degradationRate: number;       // %/cycle
  remainingUsefulLife: number | null;  // Cycles estimate
  confidence: number;            // 0-1
  isOutOfDistribution: boolean;
}

// BMS Operating Envelope
export interface OperatingEnvelope {
  voltageStressIndex: number;    // 0-1
  currentStressIndex: number;    // 0-1
  polarizationRisk: number;      // 0-1
  operationalRiskLevel: "low" | "moderate" | "high" | "critical";
}

// BMS Risk Indicators
export interface RiskIndicators {
  acceleratedAging: boolean;
  instabilityDetected: boolean;
  kineticLimitation: boolean;
  confidence: number;
}

// BMS Health Margins
export interface HealthMargins {
  reversibilityReserve: number;  // 0-1
  stabilityReserve: number;      // 0-1
  degradationBuffer: number;     // 0-1
}

// BMS Adaptive Advisory
export interface AdaptiveInsights {
  optimalOperatingZone: string;
  stressAvoidanceHint: string;
  recoveryPotential: "none" | "low" | "moderate" | "high";
}

// Healing/Recovery Metrics
export interface HealingMetrics {
  reversibleLossFraction: number | null;
  healingEfficiency: number | null;
  recoveryTrend: "improving" | "stable" | "declining" | null;
  confidence: number;
}

// Complete BMS Intelligence Package
export interface BMSIntelligence {
  operatingEnvelope: OperatingEnvelope;
  riskIndicators: RiskIndicators;
  healthMargins: HealthMargins;
  adaptiveInsights: AdaptiveInsights;
  healingMetrics: HealingMetrics;
}

// Full Analysis Result
export interface AnalysisResult {
  sessionId: string;
  fileName: string;
  uploadTimestamp: string;
  totalCycles: number;
  validCycles: number;
  warnings: string[];
  
  // Per-cycle data
  cycles: CycleData[];
  electrochemicalMetrics: ElectrochemicalMetrics[];
  
  // Multi-cycle aggregates
  temporalFeatures: TemporalFeatures | null;
  
  // ML estimates
  mlEstimates: MLEstimates;
  
  // BMS intelligence
  bmsIntelligence: BMSIntelligence;
  
  // Overall health score
  healthScore: number;  // 20-100%
}

// API Request/Response Types
export interface UploadCSVRequest {
  fileContent: string;
  fileName: string;
}

export interface AnalysisResponse {
  success: boolean;
  data?: AnalysisResult;
  error?: string;
}

// Chart data types
export interface VoltammogramPoint {
  voltage: number;
  current: number;
  scanDirection: "forward" | "reverse";
}

export interface TrendDataPoint {
  cycle: number;
  value: number;
}

// Dashboard state
export interface DashboardState {
  isLoading: boolean;
  hasData: boolean;
  analysisResult: AnalysisResult | null;
  selectedCycle: number;
  error: string | null;
}
