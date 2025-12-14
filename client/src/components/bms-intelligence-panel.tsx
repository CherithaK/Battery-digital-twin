import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  AlertTriangle,
  Shield,
  Lightbulb,
  Heart,
  Gauge,
  Zap,
  TrendingUp,
} from "lucide-react";
import type { BMSIntelligence } from "@shared/schema";
import { cn } from "@/lib/utils";

interface BMSIntelligencePanelProps {
  intelligence: BMSIntelligence | null;
  testId?: string;
}

function formatValue(value: number | null | undefined, decimals: number = 0): string {
  return value != null && !isNaN(value) ? value.toFixed(decimals) : "--";
}

function OperatingEnvelopeSection({
  envelope,
}: {
  envelope: BMSIntelligence["operatingEnvelope"];
}) {
  const riskColors = {
    low: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    moderate: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    high: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
    critical: "bg-red-500/10 text-red-700 dark:text-red-400",
  };

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Gauge className="w-4 h-4 text-primary" />
          Operating Envelope
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Voltage Stress</span>
            <span className="text-xs font-mono">{formatValue(envelope.voltageStressIndex * 100)}%</span>
          </div>
          <Progress value={envelope.voltageStressIndex * 100} className="h-2" />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Current Stress</span>
            <span className="text-xs font-mono">{formatValue(envelope.currentStressIndex * 100)}%</span>
          </div>
          <Progress value={envelope.currentStressIndex * 100} className="h-2" />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Polarization Risk</span>
            <span className="text-xs font-mono">{formatValue(envelope.polarizationRisk * 100)}%</span>
          </div>
          <Progress value={envelope.polarizationRisk * 100} className="h-2" />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-xs font-medium">Risk Level</span>
          <Badge className={cn("uppercase text-xs", riskColors[envelope.operationalRiskLevel])}>
            {envelope.operationalRiskLevel}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function RiskIndicatorsSection({
  indicators,
}: {
  indicators: BMSIntelligence["riskIndicators"];
}) {
  const risks = [
    { label: "Accelerated Aging", active: indicators.acceleratedAging, icon: Activity },
    { label: "Instability Indicator", active: indicators.instabilityDetected, icon: AlertTriangle },
    { label: "Kinetic Limitation", active: indicators.kineticLimitation, icon: Zap },
  ];

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Risk Indicators
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {risks.map((risk) => (
          <div key={risk.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <risk.icon className={cn("w-4 h-4", risk.active ? "text-amber-500" : "text-muted-foreground")} />
              <span className="text-xs">{risk.label}</span>
            </div>
            <Badge
              variant={risk.active ? "secondary" : "outline"}
              className="text-xs"
            >
              {risk.active ? "Active" : "Clear"}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function HealthMarginsSection({
  margins,
}: {
  margins: BMSIntelligence["healthMargins"];
}) {
  const marginItems = [
    { label: "Reversibility Reserve", value: margins.reversibilityReserve },
    { label: "Stability Reserve", value: margins.stabilityReserve },
    { label: "Degradation Buffer", value: margins.degradationBuffer },
  ];

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Shield className="w-4 h-4 text-emerald-500" />
          Health Margins
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {marginItems.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{item.label}</span>
              <span className="text-xs font-mono">{formatValue(item.value * 100)}%</span>
            </div>
            <Progress
              value={item.value * 100}
              className={cn(
                "h-2",
                item.value >= 0.5 ? "[&>div]:bg-emerald-500" : item.value >= 0.25 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500"
              )}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AdaptiveInsightsSection({
  insights,
}: {
  insights: BMSIntelligence["adaptiveInsights"];
}) {
  const recoveryColors = {
    none: "text-red-500",
    low: "text-amber-500",
    moderate: "text-blue-500",
    high: "text-emerald-500",
  };

  const formatAdvisory = (text: string): string => {
    const advisoryMap: Record<string, string> = {
      "Reduce voltage sweep range": "Reducing voltage sweep range may improve stability",
      "Lower scan rate recommended": "Lowering scan rate may improve measurement quality",
      "Reduce cycling frequency to slow degradation": "Reducing cycling frequency may help slow degradation",
      "Maintain current operating parameters": "Current operating parameters appear suitable",
    };
    return advisoryMap[text] || text;
  };

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          Advisory Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Optimal Operating Zone</span>
          <p className="text-sm">{formatAdvisory(insights.optimalOperatingZone)}</p>
        </div>

        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Stress Avoidance</span>
          <p className="text-sm">{formatAdvisory(insights.stressAvoidanceHint)}</p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground">Recovery Potential</span>
          <span className={cn("text-sm font-medium capitalize", recoveryColors[insights.recoveryPotential])}>
            {insights.recoveryPotential}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function HealingMetricsSection({
  healing,
}: {
  healing: BMSIntelligence["healingMetrics"];
}) {
  const trendColors = {
    improving: "text-emerald-500",
    stable: "text-blue-500",
    declining: "text-amber-500",
  };

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Heart className="w-4 h-4 text-pink-500" />
          Healing & Recovery
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Reversible Loss</span>
          <span className="text-xs font-mono">
            {healing.reversibleLossFraction != null
              ? `${formatValue(healing.reversibleLossFraction * 100, 1)}%`
              : "--"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Healing Efficiency</span>
          <span className="text-xs font-mono">
            {healing.healingEfficiency != null
              ? `${formatValue(healing.healingEfficiency * 100, 1)}%`
              : "--"}
          </span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground">Recovery Trend</span>
          {healing.recoveryTrend ? (
            <div className={cn("flex items-center gap-1", trendColors[healing.recoveryTrend])}>
              <TrendingUp className="w-3 h-3" />
              <span className="text-xs capitalize">{healing.recoveryTrend}</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">--</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function BMSIntelligencePanel({ intelligence, testId }: BMSIntelligencePanelProps) {
  if (!intelligence) {
    return (
      <Card className="border border-border" data-testid={testId}>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground">
          <span>Upload CV data to view BMS-inspired intelligence metrics</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid={testId}>
      <h2 className="text-lg font-medium flex items-center gap-2">
        <Activity className="w-5 h-5 text-primary" />
        BMS-Inspired Intelligence Layer
      </h2>
      <p className="text-sm text-muted-foreground -mt-2">
        Advisory recommendations based on electrochemical analysis
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <OperatingEnvelopeSection envelope={intelligence.operatingEnvelope} />
        <RiskIndicatorsSection indicators={intelligence.riskIndicators} />
        <HealthMarginsSection margins={intelligence.healthMargins} />
        <AdaptiveInsightsSection insights={intelligence.adaptiveInsights} />
        <HealingMetricsSection healing={intelligence.healingMetrics} />
      </div>
    </div>
  );
}
