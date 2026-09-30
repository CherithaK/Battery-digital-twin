import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CVPlot } from "@/components/cv-plot";
import { CSVUpload } from "@/components/csv-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AnalysisResult, AnalysisResponse } from "@shared/schema";

function number(value: number | null, digits = 2) {
  return value == null ? "Withheld" : value.toFixed(digits);
}

export default function Dashboard() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [selectedCycle, setSelectedCycle] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: async ({ content, fileName }: { content: string; fileName: string }) => {
      const response = await apiRequest("POST", "/api/analyze", { fileContent: content, fileName });
      return await response.json() as AnalysisResponse;
    },
    onSuccess: response => {
      if (!response.success || !response.data) { setError(response.error ?? "Analysis failed."); return; }
      setResult(response.data);
      setSelectedCycle(response.data.cycles[0]?.cycleId ?? 1);
      setError(null);
    },
    onError: err => setError(err instanceof Error ? err.message : "Analysis failed."),
  });
  const diagnostic = result?.diagnostics.find(d => d.cycleId === selectedCycle);
  return <div className="h-full overflow-y-auto"><div className="mx-auto max-w-6xl p-6 lg:p-8 space-y-7">
    <section id="dashboard" className="space-y-2">
      <Badge variant="outline">Research prototype</Badge>
      <h1 className="text-3xl font-semibold">CV sensor evidence</h1>
      <p className="max-w-3xl text-muted-foreground">Inspect measured current and voltage, check sweep quality, and extract observable features. This software has no validated battery SoH or RUL estimate.</p>
    </section>
    <section id="electrochemical-analysis" className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-3">
        <h2 className="text-lg font-medium">Upload a CV sweep</h2>
        <CSVUpload onUpload={(content, fileName) => { setError(null); mutation.mutate({ content, fileName }); }} isLoading={mutation.isPending} error={error} success={!!result && !error} />
        <p className="text-sm text-muted-foreground">Required: <code>voltage_v</code> and <code>current_a</code> or <code>current_ua</code>. Preserve acquisition order. Add <code>cycle</code>, <code>cell_id</code>, <code>scan_rate_v_s</code>, <code>temperature_c</code>, <code>reference_electrode</code>, and <code>timestamp</code> when available.</p>
      </div>
      <Card><CardHeader><CardTitle className="text-lg">Evidence boundary</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>The repository’s 150-row training table is synthetic and generated from its SoH label. It cannot validate prediction on physical cells.</p>
        <p>The supplied 21-point curve has an apparent peak at the sweep boundary. Peak separation is withheld for that example.</p>
      </CardContent></Card>
    </section>
    {result && <>
      <section id="system-diagnostics" className="space-y-4">
        <div className="flex flex-wrap items-center gap-3"><h2 className="text-xl font-semibold">Sweep diagnostics</h2><Badge variant="outline">{result.fileName}</Badge><Badge variant="outline">{result.validCycles}/{result.totalCycles} complete sweeps</Badge></div>
        <CVPlot cycles={result.cycles} selectedCycle={selectedCycle} onCycleChange={setSelectedCycle} peaks={result.diagnostics.map(d => ({
          Ipa: d.anodicPeakUa, Epa: d.anodicPeakV,
          Ipc: d.cathodicPeakUa, Epc: d.cathodicPeakV,
          deltaEp: d.peakSeparationMv, reversibility: null,
        }))} />
        {diagnostic && <Card><CardHeader><CardTitle className="flex items-center gap-3 text-lg">Cycle {selectedCycle}<Badge variant={diagnostic.quality === "usable" ? "default" : "secondary"}>{diagnostic.quality}</Badge></CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div><p className="text-muted-foreground">Points</p><p className="font-mono text-lg">{diagnostic.pointCount}</p></div>
            <div><p className="text-muted-foreground">Voltage window</p><p className="font-mono text-lg">{diagnostic.voltageMinV.toFixed(2)} to {diagnostic.voltageMaxV.toFixed(2)} V</p></div>
            <div><p className="text-muted-foreground">Peak separation</p><p className="font-mono text-lg">{number(diagnostic.peakSeparationMv, 1)}{diagnostic.peakSeparationMv == null ? "" : " mV"}</p></div>
            <div><p className="text-muted-foreground">Path integral</p><p className="font-mono text-lg">{diagnostic.loopIntegralAV == null ? "Withheld" : diagnostic.loopIntegralAV.toExponential(3) + " A·V"}</p></div>
          </div>
          <p className="text-xs text-muted-foreground">The path integral is a signed current-voltage loop descriptor. It is not charge or energy.</p>
          {diagnostic.reasons.map(reason => <p key={reason} className="text-sm text-amber-600 dark:text-amber-400">{reason}</p>)}
        </CardContent></Card>}
        {result.warnings.length > 0 && <Card><CardHeader><CardTitle className="text-lg">Acquisition limitations</CardTitle></CardHeader><CardContent><ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">{result.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul></CardContent></Card>}
      </section>
      <section id="multi-cycle-trends"><Card><CardHeader><CardTitle className="text-lg">Acquisition context</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
        <p>Cell: {result.metadata.cellId ?? "Unreported"}</p><p>Scan rate: {result.metadata.scanRateVS == null ? "Unreported" : `${result.metadata.scanRateVS} V/s`}</p>
        <p>Temperature: {result.metadata.temperatureC == null ? "Unreported" : `${result.metadata.temperatureC} °C`}</p><p>Reference electrode: {result.metadata.referenceElectrode ?? "Unreported"}</p>
      </CardContent></Card></section>
    </>}
    <section id="references" className="border-t pt-5 text-sm text-muted-foreground"><h2 className="font-medium text-foreground mb-2">Next validation experiment</h2><p>Acquire repeated CV sweeps and independent capacity measurements across multiple physical cells. Record electrode reference, scan rate, temperature, current units, and timestamps. Hold out entire cells during evaluation and report uncertainty and failure rates before making SoH claims.</p></section>
  </div></div>;
}
