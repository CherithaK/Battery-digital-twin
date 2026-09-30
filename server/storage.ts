import { randomUUID } from "crypto";
import type { AcquisitionMetadata, AnalysisResult, CycleData, RawDataPoint } from "@shared/schema";
import { diagnoseCycle } from "./sensor_diagnostics";

class MemStorage {
  private analyses = new Map<string, AnalysisResult>();
  async storeAnalysis(result: AnalysisResult) { this.analyses.set(result.sessionId, result); }
  async getAnalysis(id: string) { return this.analyses.get(id); }
  async getAllAnalyses() { return Array.from(this.analyses.values()); }
}
export const storage = new MemStorage();

export function parseCSV(content: string): { data: RawDataPoint[]; metadata: AcquisitionMetadata; warnings: string[] } {
  const warnings: string[] = [];
  const data: RawDataPoint[] = [];
  const lines = content.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error("CSV needs a header and at least one data row.");
  const header = lines[0].split(",").map(x => x.trim().toLowerCase());
  if (new Set(header).size !== header.length) throw new Error("CSV contains duplicate column names.");
  const v = header.indexOf("voltage_v");
  const a = header.indexOf("current_a");
  const ua = header.indexOf("current_ua");
  if (v < 0 || (a < 0) === (ua < 0)) {
    throw new Error("Use voltage_v and exactly one explicit current unit: current_a or current_ua.");
  }
  const cycleCol = header.indexOf("cycle");
  if (cycleCol < 0) warnings.push("No cycle column: all rows are treated as cycle 1.");
  const metadata: AcquisitionMetadata = { cellId: null, scanRateVS: null, temperatureC: null, referenceElectrode: null, timestamp: null };
  const metadataFields: [keyof AcquisitionMetadata, string][] = [
    ["cellId", "cell_id"], ["scanRateVS", "scan_rate_v_s"], ["temperatureC", "temperature_c"],
    ["referenceElectrode", "reference_electrode"], ["timestamp", "timestamp"],
  ];
  for (const [field, column] of metadataFields) {
    const idx = header.indexOf(column);
    if (idx < 0) { warnings.push(`Missing ${column}; cross-cell interpretation is limited.`); continue; }
    const values = lines.slice(1).map(line => line.split(",")[idx]?.trim()).filter(Boolean);
    if (!values.length) { warnings.push(`Empty ${column}; cross-cell interpretation is limited.`); continue; }
    if (new Set(values).size > 1) {
      if (field === "timestamp") {
        metadata.timestamp = values[0];
        warnings.push("timestamp varies across rows; the first timestamp is shown as acquisition context.");
        continue;
      }
      throw new Error(`${column} varies between rows. Analyze one cell and acquisition protocol per file.`);
    }
    const value = values[0];
    if (field === "scanRateVS" || field === "temperatureC") {
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || (field === "scanRateVS" && parsed <= 0)) {
        warnings.push(`Invalid ${column}; cross-cell interpretation is limited.`); continue;
      }
      if (field === "scanRateVS") metadata.scanRateVS = parsed;
      else metadata.temperatureC = parsed;
    } else if (field === "cellId") metadata.cellId = value;
    else if (field === "referenceElectrode") metadata.referenceElectrode = value;
    else metadata.timestamp = value;
  }
  for (let lineNumber = 2; lineNumber <= lines.length; lineNumber++) {
    const raw = lines[lineNumber - 1];
    if (!raw.trim()) continue;
    const row = raw.split(",").map(x => x.trim());
    if (row.length !== header.length) { warnings.push(`Row ${lineNumber} has the wrong number of columns and was skipped.`); continue; }
    const currentColumn = a >= 0 ? a : ua;
    const voltage = Number(row[v]);
    const current = Number(row[currentColumn]) * (a >= 0 ? 1 : 1e-6);
    const cycle = cycleCol >= 0 ? Number(row[cycleCol]) : 1;
    if (!row[v] || !row[currentColumn] || (cycleCol >= 0 && !row[cycleCol]) ||
        !Number.isFinite(voltage) || !Number.isFinite(current) || !Number.isInteger(cycle) || cycle < 1) {
      warnings.push(`Row ${lineNumber} has invalid numeric data and was skipped.`); continue;
    }
    data.push({ cycle, voltage, current });
  }
  if (!data.length) throw new Error("No valid CV data rows found.");
  return { data, metadata, warnings };
}

export async function analyzeCSV(content: string, fileName: string): Promise<AnalysisResult> {
  const { data, metadata, warnings } = parseCSV(content);
  const groups = new Map<number, RawDataPoint[]>();
  for (const point of data) {
    if (!groups.has(point.cycle)) groups.set(point.cycle, []);
    groups.get(point.cycle)!.push(point);
  }
  const cycles: CycleData[] = Array.from(groups.entries()).map(([cycleId, points]) => ({
    cycleId, voltage: points.map(p => p.voltage), rawCurrentSI: points.map(p => p.current),
    normalizedCurrent: points.map(p => p.current * 1e6),
    scanDirection: points.map((p, i) => i === 0 ? 0 : Math.sign(p.voltage - points[i - 1].voltage)),
    pointCount: points.length,
  }));
  const diagnostics = cycles.map(diagnoseCycle);
  return {
    sessionId: randomUUID(), fileName, uploadTimestamp: new Date().toISOString(),
    totalCycles: cycles.length, validCycles: diagnostics.filter(d => d.quality !== "invalid").length,
    warnings, cycles, diagnostics, metadata,
  };
}
