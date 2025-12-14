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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { FileText, AlertCircle, BookOpen, FlaskConical, TrendingUp, Brain } from "lucide-react";
import { useNavigation, type ActiveSection } from "@/App";
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

function EquationBlock({ 
  name, 
  equation, 
  meaning, 
  usage 
}: { 
  name: string; 
  equation: string; 
  meaning: string; 
  usage: string;
}) {
  return (
    <div className="space-y-2 py-3">
      <h4 className="text-sm font-medium">{name}</h4>
      <div className="bg-muted/50 rounded-md px-3 py-2 font-mono text-sm">
        {equation}
      </div>
      <p className="text-xs text-muted-foreground"><span className="font-medium">Meaning:</span> {meaning}</p>
      <p className="text-xs text-muted-foreground"><span className="font-medium">Usage:</span> {usage}</p>
    </div>
  );
}

function FeatureBlock({ 
  name, 
  description 
}: { 
  name: string; 
  description: string;
}) {
  return (
    <div className="py-2">
      <span className="text-sm font-medium">{name}</span>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  );
}

function ReferencesSection() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-medium flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          References & Theory
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Scientific reference for electrochemical analysis methodology
        </p>
      </div>

      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <FlaskConical className="w-4 h-4 text-primary" />
            Electrochemical Models
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <EquationBlock
            name="Randles-Sevcik Equation"
            equation="Ip = (2.69 x 10^5) n^(3/2) A D^(1/2) C v^(1/2)"
            meaning="Relates peak current to diffusion coefficient and scan rate for reversible systems."
            usage="Diffusion degradation proxy - used for relative trend analysis across cycles."
          />
          <Separator />
          <EquationBlock
            name="Peak Separation (dEp)"
            equation="dEp = |Epa - Epc|"
            meaning="Voltage difference between anodic and cathodic peaks indicates electrode kinetics."
            usage="Bounded to 300 mV maximum; larger values suggest sluggish kinetics or degradation."
          />
          <Separator />
          <EquationBlock
            name="Reversibility Index"
            equation="R = |log10(Ipa / Ipc)|"
            meaning="Logarithmic ratio of peak currents measures electrochemical reversibility."
            usage="Values near 0 indicate ideal reversibility; increasing values suggest capacity fade."
          />
          <Separator />
          <EquationBlock
            name="Butler-Volmer Kinetics"
            equation="i = i0 [exp(aa*f*eta) - exp(-ac*f*eta)]"
            meaning="Describes charge-transfer kinetics at electrode-electrolyte interface."
            usage="Charge-transfer proxy derived from peak current ratios and overpotential."
          />
          <Separator />
          <EquationBlock
            name="Capacitive vs Faradaic Current"
            equation="i = k1*v + k2*v^(1/2)"
            meaning="Separates surface capacitive effects from diffusion-controlled Faradaic processes."
            usage="Capacitive fraction indicates surface degradation or SEI growth effects."
          />
          <Separator />
          <EquationBlock
            name="Noise Power Index"
            equation="NPI = sigma(di/dV) / mean(|i|)"
            meaning="Normalized derivative noise quantifies signal quality and electrode stability."
            usage="Stability indicator - higher values suggest electrode surface irregularities."
          />
          <Separator />
          <EquationBlock
            name="SEI Growth Model"
            equation="delta(n) = delta0 + k*sqrt(n) (saturating at 100 nm)"
            meaning="Solid-electrolyte interphase thickness grows with square root of cycle count."
            usage="Bounded 1-100 nm; tracks passivation layer evolution affecting capacity."
          />
        </CardContent>
      </Card>

      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <TrendingUp className="w-4 h-4 text-primary" />
            Multi-Cycle Temporal Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-4">
            Computed only when multiple compatible cycles are available.
          </p>
          <div className="space-y-1">
            <FeatureBlock
              name="dEp Slope"
              description="Rate of change in peak separation across cycles; positive values indicate kinetic degradation."
            />
            <Separator />
            <FeatureBlock
              name="Peak Current Decay (Ipa/Ipc)"
              description="Percentage decrease in peak currents per cycle; primary capacity fade indicator."
            />
            <Separator />
            <FeatureBlock
              name="Peak Potential Shift"
              description="Migration of peak potentials indicating changes in thermodynamic equilibrium."
            />
            <Separator />
            <FeatureBlock
              name="Reversibility Drift"
              description="Change in reversibility index over cycles; tracks symmetry evolution."
            />
            <Separator />
            <FeatureBlock
              name="Noise Growth"
              description="Increase in noise power index suggesting progressive surface degradation."
            />
            <Separator />
            <FeatureBlock
              name="Stability Index"
              description="Composite metric (0-1) combining temporal feature consistency across cycles."
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Brain className="w-4 h-4 text-primary" />
            Analysis Methodology
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/30 rounded-md p-4 border border-border">
            <p className="text-sm italic text-muted-foreground">
              "Physics governs behavior. Analysis learns trends from physics-derived features."
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium">Analysis Architecture</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Gradient-based analysis trained on physics-derived electrochemical features.
              </p>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium">Input Features</h4>
              <ul className="text-xs text-muted-foreground mt-1 space-y-1 list-disc list-inside">
                <li>Physics-derived metrics (dEp, reversibility, peak currents, SEI thickness)</li>
                <li>Temporal features (decay rates, drift coefficients, stability indices)</li>
                <li>Cycle index for degradation trajectory modeling</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2 font-medium">
                Note: Raw voltage/current data are never used as direct inputs.
              </p>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium">Analysis Outputs</h4>
              <ul className="text-xs text-muted-foreground mt-1 space-y-1 list-disc list-inside">
                <li>State of Health (SoH) - estimated battery health percentage</li>
                <li>Degradation Rate - capacity fade per cycle</li>
                <li>Remaining Useful Life Proxy - estimated cycles until threshold</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground text-center pt-4">
        <p>Based on established electrochemical principles and standards.</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { setActiveSection } = useNavigation();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<number>(1);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLElement>(null);
  const electrochemicalRef = useRef<HTMLElement>(null);
  const diagnosticsRef = useRef<HTMLElement>(null);
  const trendsRef = useRef<HTMLElement>(null);
  const kineticsRef = useRef<HTMLElement>(null);
  const insightsRef = useRef<HTMLElement>(null);
  const referencesRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const sections = [
      { id: "dashboard" as ActiveSection, ref: dashboardRef },
      { id: "electrochemical-analysis" as ActiveSection, ref: electrochemicalRef },
      { id: "system-diagnostics" as ActiveSection, ref: diagnosticsRef },
      { id: "multi-cycle-trends" as ActiveSection, ref: trendsRef },
      { id: "kinetic-analysis" as ActiveSection, ref: kineticsRef },
      { id: "insights" as ActiveSection, ref: insightsRef },
      { id: "references" as ActiveSection, ref: referencesRef },
    ];

    const observerOptions = {
      root: scrollContainerRef.current,
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id as ActiveSection;
          setActiveSection(sectionId);
        }
      });
    }, observerOptions);

    sections.forEach(({ ref }) => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [setActiveSection]);

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

  return (
    <div className="h-full overflow-y-auto" ref={scrollContainerRef}>
      <div className="p-6 lg:p-8 space-y-8">
        <section id="dashboard" ref={dashboardRef} className="scroll-mt-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
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
            <div className="mt-6">
              <LoadingSkeleton />
            </div>
          ) : !hasData ? (
            <EmptyState />
          ) : (
            <div className="space-y-6 mt-6">
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
            </div>
          )}
        </section>

        {hasData && (
          <>
            <section id="electrochemical-analysis" ref={electrochemicalRef} className="scroll-mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            </section>

            <section id="kinetic-analysis" ref={kineticsRef} className="scroll-mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                                <span className="text-xs text-muted-foreground">Peak Separation (dEp)</span>
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
                                  <span className="text-xs text-muted-foreground ml-1">uA</span>
                                </p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">Cathodic Peak (Ipc)</span>
                                <p className="text-lg font-mono font-semibold">
                                  {formatValue(currentMetrics.peaks.Ipc, 2)}
                                  <span className="text-xs text-muted-foreground ml-1">uA</span>
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
            </section>

            <section id="multi-cycle-trends" ref={trendsRef} className="scroll-mt-4">
              <h2 className="text-lg font-medium mb-4">Multi-Cycle Trends</h2>
              <TrendPlotsGrid metrics={analysisResult.electrochemicalMetrics} />
            </section>

            <section id="system-diagnostics" ref={diagnosticsRef} className="scroll-mt-4">
              <h2 className="text-lg font-medium mb-4">System Diagnostics</h2>
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
                          <span className="text-amber-500 mt-0.5">-</span>
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </section>

            <section id="insights" ref={insightsRef} className="scroll-mt-4">
              <BMSIntelligencePanel
                intelligence={analysisResult.bmsIntelligence}
                testId="bms-intelligence"
              />
            </section>
          </>
        )}

        <section id="references" ref={referencesRef} className="scroll-mt-4">
          <ReferencesSection />
        </section>
      </div>
    </div>
  );
}
