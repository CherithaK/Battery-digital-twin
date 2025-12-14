import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";
import type { ElectrochemicalMetrics } from "@shared/schema";

interface TrendPlotProps {
  title: string;
  yLabel: string;
  data: { cycle: number; value: number | null }[];
  color?: string;
  testId?: string;
}

function TrendPlot({ title, yLabel, data, color = "hsl(210, 78%, 48%)", testId }: TrendPlotProps) {
  const validData = useMemo(() => data.filter((d) => d.value !== null) as { cycle: number; value: number }[], [data]);

  const { bounds, points } = useMemo(() => {
    if (validData.length === 0) {
      return { bounds: { minX: 0, maxX: 10, minY: 0, maxY: 100 }, points: [] };
    }

    const cycles = validData.map((d) => d.cycle);
    const values = validData.map((d) => d.value);
    const minX = Math.min(...cycles);
    const maxX = Math.max(...cycles);
    const minY = Math.min(...values);
    const maxY = Math.max(...values);

    const padX = Math.max(1, (maxX - minX) * 0.1);
    const padY = Math.max(1, (maxY - minY) * 0.1);

    return {
      bounds: {
        minX: minX - padX,
        maxX: maxX + padX,
        minY: minY - padY,
        maxY: maxY + padY,
      },
      points: validData,
    };
  }, [validData]);

  const svgWidth = 300;
  const svgHeight = 200;
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  const plotWidth = svgWidth - margin.left - margin.right;
  const plotHeight = svgHeight - margin.top - margin.bottom;

  const scaleX = (x: number) =>
    margin.left + ((x - bounds.minX) / (bounds.maxX - bounds.minX)) * plotWidth;
  const scaleY = (y: number) =>
    margin.top + plotHeight - ((y - bounds.minY) / (bounds.maxY - bounds.minY)) * plotHeight;

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${scaleX(p.cycle)} ${scaleY(p.value)}`)
    .join(" ");

  return (
    <Card className="border border-border" data-testid={testId}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {points.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            No data available
          </div>
        ) : (
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto">
            <rect
              x={margin.left}
              y={margin.top}
              width={plotWidth}
              height={plotHeight}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.1}
            />

            {[0, 0.5, 1].map((frac) => {
              const y = bounds.minY + frac * (bounds.maxY - bounds.minY);
              return (
                <g key={`y-${frac}`}>
                  <line
                    x1={margin.left}
                    y1={scaleY(y)}
                    x2={margin.left + plotWidth}
                    y2={scaleY(y)}
                    stroke="currentColor"
                    strokeOpacity={0.1}
                    strokeDasharray="2,2"
                  />
                  <text
                    x={margin.left - 5}
                    y={scaleY(y)}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="text-xs fill-muted-foreground font-mono"
                  >
                    {y.toFixed(1)}
                  </text>
                </g>
              );
            })}

            <path d={pathD} fill="none" stroke={color} strokeWidth={2} />

            {points.map((p, i) => (
              <circle
                key={i}
                cx={scaleX(p.cycle)}
                cy={scaleY(p.value)}
                r={4}
                fill={color}
                stroke="white"
                strokeWidth={1.5}
              />
            ))}

            <text
              x={svgWidth / 2}
              y={svgHeight - 5}
              textAnchor="middle"
              className="text-xs fill-muted-foreground"
            >
              Cycle Number
            </text>
            <text
              x={12}
              y={svgHeight / 2}
              textAnchor="middle"
              transform={`rotate(-90, 12, ${svgHeight / 2})`}
              className="text-xs fill-muted-foreground"
            >
              {yLabel}
            </text>
          </svg>
        )}
      </CardContent>
    </Card>
  );
}

interface TrendPlotsGridProps {
  metrics: ElectrochemicalMetrics[];
}

export function TrendPlotsGrid({ metrics }: TrendPlotsGridProps) {
  const deltaEpData = useMemo(
    () => metrics.map((m) => ({ cycle: m.cycleId, value: m.peaks.deltaEp })),
    [metrics]
  );

  const ipaData = useMemo(
    () => metrics.map((m) => ({ cycle: m.cycleId, value: m.peaks.Ipa })),
    [metrics]
  );

  const ipcData = useMemo(
    () => metrics.map((m) => ({ cycle: m.cycleId, value: m.peaks.Ipc != null ? Math.abs(m.peaks.Ipc) : null })),
    [metrics]
  );

  const reversibilityData = useMemo(
    () => metrics.map((m) => ({ cycle: m.cycleId, value: m.peaks.reversibility })),
    [metrics]
  );

  const noiseData = useMemo(
    () => metrics.map((m) => ({ cycle: m.cycleId, value: m.noiseIndex })),
    [metrics]
  );

  const seiData = useMemo(
    () => metrics.map((m) => ({ cycle: m.cycleId, value: m.seiThickness })),
    [metrics]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <TrendPlot
        title="Peak Separation (ΔEp)"
        yLabel="mV"
        data={deltaEpData}
        color="hsl(210, 78%, 48%)"
        testId="plot-delta-ep"
      />
      <TrendPlot
        title="Anodic Peak Current (Ipa)"
        yLabel="µA"
        data={ipaData}
        color="hsl(150, 65%, 38%)"
        testId="plot-ipa"
      />
      <TrendPlot
        title="Cathodic Peak Current (|Ipc|)"
        yLabel="µA"
        data={ipcData}
        color="hsl(340, 70%, 45%)"
        testId="plot-ipc"
      />
      <TrendPlot
        title="Reversibility Index"
        yLabel="|log(Ipa/Ipc)|"
        data={reversibilityData}
        color="hsl(280, 65%, 48%)"
        testId="plot-reversibility"
      />
      <TrendPlot
        title="Noise Index"
        yLabel="RMS/Peak"
        data={noiseData}
        color="hsl(30, 75%, 45%)"
        testId="plot-noise"
      />
      <TrendPlot
        title="SEI Thickness"
        yLabel="nm"
        data={seiData}
        color="hsl(200, 60%, 50%)"
        testId="plot-sei"
      />
    </div>
  );
}
