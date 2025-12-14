import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";

interface HealthGaugeProps {
  value: number;
  label?: string;
  testId?: string;
}

export function HealthGauge({ value, label = "State of Health (SoH)", testId }: HealthGaugeProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  
  const { color, bgColor, status } = useMemo(() => {
    if (clampedValue >= 80) {
      return {
        color: "hsl(142, 76%, 36%)",
        bgColor: "hsl(142, 76%, 90%)",
        status: "Healthy",
      };
    } else if (clampedValue >= 50) {
      return {
        color: "hsl(45, 93%, 47%)",
        bgColor: "hsl(45, 93%, 90%)",
        status: "Moderate",
      };
    } else {
      return {
        color: "hsl(0, 84%, 60%)",
        bgColor: "hsl(0, 84%, 90%)",
        status: "Critical",
      };
    }
  }, [clampedValue]);

  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference * 0.75;
  const rotation = -135;

  return (
    <Card className="border border-border" data-testid={testId}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-6">
        <div className="relative w-48 h-48">
          <svg
            className="w-full h-full"
            viewBox="0 0 160 160"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
              className="text-muted/30"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                transition: "stroke-dashoffset 0.5s ease-in-out",
              }}
            />
          </svg>
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ transform: `rotate(${-rotation}deg)` }}
          >
            <span className="text-4xl font-bold font-mono tabular-nums" style={{ color }}>
              {clampedValue.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-muted-foreground">%</span>
          </div>
        </div>
        <div className="flex flex-col items-center mt-4 gap-1">
          <span
            className="text-sm font-medium"
            style={{ color }}
          >
            {status}
          </span>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-muted-foreground">80-100%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs text-muted-foreground">50-80%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-xs text-muted-foreground">&lt;50%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
