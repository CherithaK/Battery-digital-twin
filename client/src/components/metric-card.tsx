import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: number | string;
  unit: string;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  status?: "good" | "warning" | "critical" | "neutral";
  testId?: string;
}

export function MetricCard({
  label,
  value,
  unit,
  trend,
  trendValue,
  status = "neutral",
  testId,
}: MetricCardProps) {
  const statusColors = {
    good: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
    critical: "text-red-600 dark:text-red-400",
    neutral: "text-foreground",
  };

  const trendColors = {
    up: "text-emerald-600 dark:text-emerald-400",
    down: "text-red-600 dark:text-red-400",
    stable: "text-muted-foreground",
  };

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <Card className="border border-border" data-testid={testId}>
      <CardContent className="p-6">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                "text-3xl font-bold font-mono tabular-nums",
                statusColors[status]
              )}
            >
              {value}
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              {unit}
            </span>
          </div>
          {trend && trendValue && (
            <div className={cn("flex items-center gap-1 mt-2", trendColors[trend])}>
              <TrendIcon className="w-3 h-3" />
              <span className="text-xs font-medium">{trendValue}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface MetricCardGridProps {
  children: React.ReactNode;
}

export function MetricCardGrid({ children }: MetricCardGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {children}
    </div>
  );
}
