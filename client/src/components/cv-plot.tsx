import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMemo } from "react";
import type { CycleData, PeakData } from "@shared/schema";

interface CVPlotProps {
  cycles: CycleData[];
  peaks: PeakData[];
  selectedCycle: number;
  onCycleChange: (cycle: number) => void;
  testId?: string;
}

export function CVPlot({
  cycles,
  peaks,
  selectedCycle,
  onCycleChange,
  testId,
}: CVPlotProps) {
  const cycleData = useMemo(() => {
    return cycles.find((c) => c.cycleId === selectedCycle);
  }, [cycles, selectedCycle]);

  const peakData = useMemo(() => {
    const idx = cycles.findIndex((c) => c.cycleId === selectedCycle);
    return peaks[idx] || null;
  }, [cycles, peaks, selectedCycle]);

  const { forwardPoints, reversePoints, bounds } = useMemo(() => {
    if (!cycleData) {
      return { forwardPoints: [], reversePoints: [], bounds: { minV: 0, maxV: 1, minI: -1, maxI: 1 } };
    }

    const forward: { v: number; i: number }[] = [];
    const reverse: { v: number; i: number }[] = [];

    for (let j = 0; j < cycleData.voltage.length; j++) {
      const point = { v: cycleData.voltage[j], i: cycleData.normalizedCurrent[j] };
      if (cycleData.scanDirection[j] === 1) {
        forward.push(point);
      } else {
        reverse.push(point);
      }
    }

    const allV = cycleData.voltage;
    const allI = cycleData.normalizedCurrent;
    const minV = Math.min(...allV);
    const maxV = Math.max(...allV);
    const minI = Math.min(...allI);
    const maxI = Math.max(...allI);

    const padV = (maxV - minV) * 0.1 || 0.1;
    const padI = (maxI - minI) * 0.1 || 1;

    return {
      forwardPoints: forward,
      reversePoints: reverse,
      bounds: {
        minV: minV - padV,
        maxV: maxV + padV,
        minI: minI - padI,
        maxI: maxI + padI,
      },
    };
  }, [cycleData]);

  const svgWidth = 600;
  const svgHeight = 400;
  const margin = { top: 40, right: 40, bottom: 60, left: 80 };
  const plotWidth = svgWidth - margin.left - margin.right;
  const plotHeight = svgHeight - margin.top - margin.bottom;

  const scaleX = (v: number) =>
    margin.left + ((v - bounds.minV) / (bounds.maxV - bounds.minV)) * plotWidth;
  const scaleY = (i: number) =>
    margin.top + plotHeight - ((i - bounds.minI) / (bounds.maxI - bounds.minI)) * plotHeight;

  const createPath = (points: { v: number; i: number }[]) => {
    if (points.length === 0) return "";
    const sortedPoints = [...points].sort((a, b) => a.v - b.v);
    return sortedPoints
      .map((p, idx) => `${idx === 0 ? "M" : "L"} ${scaleX(p.v)} ${scaleY(p.i)}`)
      .join(" ");
  };

  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    const range = bounds.maxV - bounds.minV;
    const step = range / 5;
    for (let i = 0; i <= 5; i++) {
      ticks.push(bounds.minV + i * step);
    }
    return ticks;
  }, [bounds]);

  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    const range = bounds.maxI - bounds.minI;
    const step = range / 5;
    for (let i = 0; i <= 5; i++) {
      ticks.push(bounds.minI + i * step);
    }
    return ticks;
  }, [bounds]);

  return (
    <Card className="border border-border" data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
        <CardTitle className="text-lg font-medium">CV Voltammogram</CardTitle>
        {cycles.length > 0 && (
          <Select
            value={selectedCycle.toString()}
            onValueChange={(v) => onCycleChange(parseInt(v))}
          >
            <SelectTrigger className="w-32" data-testid="select-cycle">
              <SelectValue placeholder="Select cycle" />
            </SelectTrigger>
            <SelectContent>
              {cycles.map((c) => (
                <SelectItem key={c.cycleId} value={c.cycleId.toString()}>
                  Cycle {c.cycleId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardHeader>
      <CardContent>
        {!cycleData ? (
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            <span>Upload CSV data to view voltammogram</span>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto max-h-96"
              style={{ minWidth: 400 }}
            >
              <rect
                x={margin.left}
                y={margin.top}
                width={plotWidth}
                height={plotHeight}
                fill="none"
                stroke="currentColor"
                strokeOpacity={0.1}
              />

              {xTicks.map((tick, i) => (
                <g key={`x-${i}`}>
                  <line
                    x1={scaleX(tick)}
                    y1={margin.top}
                    x2={scaleX(tick)}
                    y2={margin.top + plotHeight}
                    stroke="currentColor"
                    strokeOpacity={0.1}
                    strokeDasharray="2,2"
                  />
                  <text
                    x={scaleX(tick)}
                    y={margin.top + plotHeight + 20}
                    textAnchor="middle"
                    className="text-xs fill-muted-foreground font-mono"
                  >
                    {tick.toFixed(2)}
                  </text>
                </g>
              ))}

              {yTicks.map((tick, i) => (
                <g key={`y-${i}`}>
                  <line
                    x1={margin.left}
                    y1={scaleY(tick)}
                    x2={margin.left + plotWidth}
                    y2={scaleY(tick)}
                    stroke="currentColor"
                    strokeOpacity={0.1}
                    strokeDasharray="2,2"
                  />
                  <text
                    x={margin.left - 10}
                    y={scaleY(tick)}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="text-xs fill-muted-foreground font-mono"
                  >
                    {tick.toFixed(1)}
                  </text>
                </g>
              ))}

              <text
                x={svgWidth / 2}
                y={svgHeight - 10}
                textAnchor="middle"
                className="text-sm fill-muted-foreground"
              >
                Voltage (V)
              </text>
              <text
                x={20}
                y={svgHeight / 2}
                textAnchor="middle"
                transform={`rotate(-90, 20, ${svgHeight / 2})`}
                className="text-sm fill-muted-foreground"
              >
                Current (µA)
              </text>

              <path
                d={createPath(forwardPoints)}
                fill="none"
                stroke="hsl(210, 78%, 48%)"
                strokeWidth={2}
              />
              <path
                d={createPath(reversePoints)}
                fill="none"
                stroke="hsl(340, 70%, 45%)"
                strokeWidth={2}
              />

              {peakData?.Epa != null && peakData?.Ipa != null && (
                <g>
                  <circle
                    cx={scaleX(peakData.Epa)}
                    cy={scaleY(peakData.Ipa)}
                    r={6}
                    fill="hsl(210, 78%, 48%)"
                    stroke="white"
                    strokeWidth={2}
                  />
                  <text
                    x={scaleX(peakData.Epa) + 10}
                    y={scaleY(peakData.Ipa) - 10}
                    className="text-xs fill-foreground font-mono"
                  >
                    Ipa: {peakData.Ipa.toFixed(2)} µA
                  </text>
                </g>
              )}

              {peakData?.Epc != null && peakData?.Ipc != null && (
                <g>
                  <circle
                    cx={scaleX(peakData.Epc)}
                    cy={scaleY(peakData.Ipc)}
                    r={6}
                    fill="hsl(340, 70%, 45%)"
                    stroke="white"
                    strokeWidth={2}
                  />
                  <text
                    x={scaleX(peakData.Epc) + 10}
                    y={scaleY(peakData.Ipc) + 15}
                    className="text-xs fill-foreground font-mono"
                  >
                    Ipc: {peakData.Ipc.toFixed(2)} µA
                  </text>
                </g>
              )}

              <g transform={`translate(${margin.left + 10}, ${margin.top + 10})`}>
                <rect
                  x={0}
                  y={0}
                  width={140}
                  height={50}
                  fill="hsl(var(--background))"
                  fillOpacity={0.9}
                  rx={4}
                />
                <line x1={10} y1={15} x2={30} y2={15} stroke="hsl(210, 78%, 48%)" strokeWidth={2} />
                <text x={35} y={18} className="text-xs fill-foreground">Forward scan</text>
                <line x1={10} y1={35} x2={30} y2={35} stroke="hsl(340, 70%, 45%)" strokeWidth={2} />
                <text x={35} y={38} className="text-xs fill-foreground">Reverse scan</text>
              </g>
            </svg>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
