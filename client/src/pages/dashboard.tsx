import { useState, useCallback, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MetricCard, MetricCardGrid } from "@/components/metric-card";
import { HealthGauge } from "@/components/health-gauge";
import { CVPlot } from "@/components/cv-plot";
import { TrendPlotsGrid } from "@/components/trend-plots";
import { CSVUpload } from "@/components/csv-upload";
import { ElectrochemicalCell3D } from "@/components/electrochemical-cell-3d";
import { BMSIntelligencePanel } from "@/components/bms-intelligence-panel";
import { TheoryModelsPanel } from "@/components/theory-models-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, AlertCircle } from "lucide-react";
import { useNavigation } from "@/App";
import type { AnalysisResult, AnalysisResponse } from "@shared/schema";

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
        <FileText className="w-10 h-10 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">No Analysis Data</h2>
      <p className="text-sm text-muted-foreground max-w-md">
        Upload a CSV file containing cyclic voltammetry data (cycle, voltage, current columns)
        to begin electrochemical analysis and view BMS-inspired intelligence metrics.
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <MetricCardGrid>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border border-border">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </MetricCardGrid>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}

function formatValue(value: number | null | undefined, decimals: number = 2): string {
  return value != null && !isNaN(value) ? value.toFixed(decimals) : "--";
}

export default function Dashboard() {
  const { activeSection } = useNavigation();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<number>(1);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const dashboardRef = useRef<HTMLDivElement>(null);
  const electrochemicalRef = useRef<HTMLDivElement>(null);
  const diagnosticsRef = useRef<HTMLDivElement>(null);
  const trendsRef = useRef<HTMLDivElement>(null);
  const kineticsRef = useRef<HTMLDivElement>(null);
  const insightsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const refs: Record<string, React.RefObject<HTMLDivElement | null>> = {
      "dashboard": dashboardRef,
      "electrochemical-analysis": electrochemicalRef,
      "system-diagnostics": diagnosticsRef,
      "multi-cycle-trends": trendsRef,
      "kinetic-analysis": kineticsRef,
      "insights": insightsRef,
    };

    const targetRef = refs[activeSection];
    if (targetRef?.current && activeSection !== "theory-models") {
      targetRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeSection]);

  const uploadMutation = useMutation({
    mutationFn: async ({ content, fileName }: { content: string; fileName: string }) => {
      const response = await apiRequest("POST", "/api/analyze", { fileContent: content, fileName });
      return await response.json() as AnalysisResponse;
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        setAnalysisResult(data.data);
        setSelectedCycle(data.data.cycles[0]?.cycleId || 1);
        setUploadError(null);
        setUploadSuccess(true);
      } else {
        setUploadError(data.error || "Analysis failed. Please check your CSV format.");
        setUploadSuccess(false);
      }
    },
    onError: (error: Error) => {
      setUploadError(error.message || "Upload failed. Please try again.");
      setUploadSuccess(false);
    },
  });

  const handleUpload = useCallback(
    (content: string, fileName: string) => {
      setUploadSuccess(false);
      setUploadError(null);
      uploadMutation.mutate({ content, fileName });
    },
    [uploadMutation]
  );

  const getHealthStatus = (value: number): "good" | "warning" | "critical" => {
    if (value >= 80) return "good";
    if (value >= 50) return "warning";
    return "critical";
  };

  const hasData = analysisResult !== null;

  if (activeSection === "theory-models") {
    return <TheoryModelsPanel testId="theory-models-panel" />;
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 lg:p-8 space-y-8">
        <div ref={dashboardRef} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Electrochemical analysis and BMS-inspired intelligence layer
            </p>
          </div>
          <div className="w-full lg:w-96">
            <CSVUpload
              onUpload={handleUpload}
              isLoading={uploadMutation.isPending}
              error={uploadError}
              success={uploadSuccess}
              testId="csv-upload-zone"
            />
          </div>
        </div>

        {uploadMutation.isPending ? (
          <LoadingSkeleton />
        ) : !hasData ? (
          <EmptyState />
        ) : (
          <div className="space-y-8">
            <div className="flex items-center gap-4 flex-wrap">
              <Badge variant="outline" className="gap-1">
                <FileText className="w-3 h-3" />
                {analysisResult.fileName}
              </Badge>
              <Badge variant="outline">
                {analysisResult.validCycles} / {analysisResult.totalCycles} valid cycles
              </Badge>
              {analysisResult.warnings.length > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {analysisResult.warnings.length} warnings
                </Badge>
              )}
              {analysisResult.mlEstimates.isOutOfDistribution && (
                <Badge variant="secondary" className="gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Limited training data similarity
                </Badge>
              )}
            </div>

            <MetricCardGrid>
              <MetricCard
                label="State of Health"
                value={formatValue(analysisResult.healthScore, 1)}
                unit="%"
                status={getHealthStatus(analysisResult.healthScore)}
                trend={
                  analysisResult.temporalFeatures?.IpaDecayRate != null
                    ? analysisResult.temporalFeatures.IpaDecayRate > 0
                      ? "down"
                      : "stable"
                    : undefined
                }
                trendValue={
                  analysisResult.temporalFeatures?.IpaDecayRate != null
                    ? `${formatValue(Math.abs(analysisResult.temporalFeatures.IpaDecayRate), 2)}%/cycle`
                    : undefined
                }
                testId="metric-soh"
              />
              <MetricCard
                label="Degradation Rate"
                value={formatValue(analysisResult.mlEstimates.degradationRate, 2)}
                unit="%/cycle"
                status={analysisResult.mlEstimates.degradationRate > 1 ? "warning" : "good"}
                testId="metric-degradation"
              />
              <MetricCard
                label="Stability Index"
                value={formatValue((analysisResult.temporalFeatures?.stabilityIndex ?? 0) * 100, 1)}
                unit="%"
                status={
                  (analysisResult.temporalFeatures?.stabilityIndex ?? 0) >= 0.8
                    ? "good"
                    : (analysisResult.temporalFeatures?.stabilityIndex ?? 0) >= 0.5
                    ? "warning"
                    : "critical"
                }
                testId="metric-stability"
              />
            </MetricCardGrid>

            <div ref={electrochemicalRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h2 className="text-lg font-medium">Electrochemical Analysis</h2>
                <CVPlot
                  cycles={analysisResult.cycles}
                  peaks={analysisResult.electrochemicalMetrics.map((m) => m.peaks)}
                  selectedCycle={selectedCycle}
                  onCycleChange={setSelectedCycle}
                  testId="cv-voltammogram"
                />
              </div>
              <div className="space-y-4">
                <h2 className="text-lg font-medium">Health Assessment</h2>
                <HealthGauge
                  value={analysisResult.healthScore}
                  testId="health-gauge"
                />
              </div>
            </div>

            <div ref={kineticsRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h2 className="text-lg font-medium">Kinetic Analysis</h2>
                <ElectrochemicalCell3D
                  stateOfHealth={analysisResult.healthScore}
                  testId="3d-cell"
                />
              </div>
              <Card className="border border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Electrochemical Parameters</CardTitle>
                </CardHeader>
                <CardContent>
                  {analysisResult.electrochemicalMetrics.length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      {(() => {
                        const currentMetrics = analysisResult.electrochemicalMetrics.find(
                          (m) => m.cycleId === selectedCycle
                        );
                        if (!currentMetrics) return null;

                        return (
                          <>
                            <div className="space-y-1">
                              <span className="text-xs text-muted-foreground">Peak Separation (ΔEp)</span>
                              <p className="text-lg font-mono font-semibold">
                                {formatValue(currentMetrics.peaks.deltaEp, 1)}
                                <span className="text-xs text-muted-foreground ml-1">mV</span>
                              </p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-xs text-muted-foreground">Reversibility</span>
                              <p className="text-lg font-mono font-semibold">
                                {formatValue(currentMetrics.peaks.reversibility, 3)}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-xs text-muted-foreground">Anodic Peak (Ipa)</span>
                              <p className="text-lg font-mono font-semibold">
                                {formatValue(currentMetrics.peaks.Ipa, 2)}
                                <span className="text-xs text-muted-foreground ml-1">µA</span>
                              </p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-xs text-muted-foreground">Cathodic Peak (Ipc)</span>
                              <p className="text-lg font-mono font-semibold">
                                {formatValue(currentMetrics.peaks.Ipc, 2)}
                                <span className="text-xs text-muted-foreground ml-1">µA</span>
                              </p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-xs text-muted-foreground">SEI Thickness</span>
                              <p className="text-lg font-mono font-semibold">
                                {formatValue(currentMetrics.seiThickness, 1)}
                                <span className="text-xs text-muted-foreground ml-1">nm</span>
                              </p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-xs text-muted-foreground">Noise Index</span>
                              <p className="text-lg font-mono font-semibold">
                                {currentMetrics.noiseIndex != null
                                  ? formatValue(currentMetrics.noiseIndex * 100, 2)
                                  : "--"}
                                <span className="text-xs text-muted-foreground ml-1">%</span>
                              </p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div ref={trendsRef}>
              <h2 className="text-lg font-medium mb-4">Multi-Cycle Trends</h2>
              <TrendPlotsGrid metrics={analysisResult.electrochemicalMetrics} />
            </div>

            <div ref={diagnosticsRef}>
              <h2 className="text-lg font-medium mb-4">System Diagnostics</h2>
            </div>

            <div ref={insightsRef}>
              <BMSIntelligencePanel
                intelligence={analysisResult.bmsIntelligence}
                testId="bms-intelligence"
              />
            </div>

            {analysisResult.warnings.length > 0 && (
              <Card className="border border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    Analysis Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysisResult.warnings.map((warning, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-amber-500 mt-0.5">•</span>
                        {warning}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
