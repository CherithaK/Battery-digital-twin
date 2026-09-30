import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { analyzeCSV, parseCSV } from "./storage";

const header = "cycle,voltage_v,current_ua,cell_id,scan_rate_v_s,temperature_c,reference_electrode,timestamp";
function csv(forward: number[], backward: number[], current: (v: number, returning: boolean) => number) {
  const points = [...forward.map(v => [v, false] as const), ...backward.map(v => [v, true] as const)];
  return [header, ...points.map(([v, returning]) => `1,${v},${current(v, returning)},cell-a,0.05,25,Ag/AgCl,2026-01-01T00:00:00Z`)].join("\n");
}

test("explicit units and metadata are required or flagged", () => {
  assert.throws(() => parseCSV("cycle,voltage,current\n1,0,1"), /explicit current unit/);
  assert.throws(() => parseCSV("voltage_v,current_a,current_ua\n0,1,1"), /exactly one/);
  const parsed = parseCSV("voltage_v,current_ua\n0,3");
  assert.equal(parsed.data[0].current, 3e-6);
  assert.equal(parsed.metadata.scanRateVS, null);
  assert.ok(parsed.warnings.some(w => w.includes("scan_rate_v_s")));
  assert.equal(parseCSV("voltage_v,current_a\n0,\n0.1,1").data.length, 1);
  assert.throws(() => parseCSV("voltage_v,current_a,cell_id\n0,0,a\n0.1,0,b"), /one cell/);
});

test("complete controlled sweep reports interior peaks", async () => {
  const forward = [-0.3,-0.2,-0.1,0,0.1,0.2,0.3];
  const reverse = [0.2,0.1,0,-0.1,-0.2,-0.3];
  const result = await analyzeCSV(csv(forward, reverse, (v, returning) => returning ? -3 * Math.exp(-Math.pow((v + 0.1) / 0.12, 2)) : 3 * Math.exp(-Math.pow((v - 0.1) / 0.12, 2))), "controlled.csv");
  assert.equal(result.diagnostics[0].quality, "usable");
  assert.ok(Math.abs(result.diagnostics[0].peakSeparationMv! - 200) < 1e-9);
  assert.equal(result.warnings.length, 0);
  assert.ok(!("mlEstimates" in result));
  assert.ok(!("healthScore" in result));
});

test("truncated sweep is invalid", async () => {
  const result = await analyzeCSV("voltage_v,current_a\n-0.2,0\n-0.1,0\n0,0\n0.1,0\n0.2,0\n0.3,0\n", "partial.csv");
  assert.equal(result.diagnostics[0].quality, "invalid");
  assert.equal(result.diagnostics[0].peakSeparationMv, null);
});

test("supplied illustrative sweep withholds boundary peak", async () => {
  const original = readFileSync(new URL("../attached_assets/14,12csv_1765724360390.csv", import.meta.url), "utf8");
  const result = await analyzeCSV(original.replace("cycle,voltage,current", "cycle,voltage_v,current_a"), "illustrative.csv");
  assert.equal(result.cycles[0].pointCount, 21);
  assert.equal(result.diagnostics[0].quality, "limited");
  assert.equal(result.diagnostics[0].peakSeparationMv, null);
  assert.ok(result.diagnostics[0].loopIntegralAV !== null);
});
