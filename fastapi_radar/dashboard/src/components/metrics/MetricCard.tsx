import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  trend?: "up" | "down" | "neutral";
  icon?: ReactNode;
  className?: string;
  minimal?: boolean;
}

export function MetricCard({
  label,
  value,
  change,
  changeLabel,
  trend,
  icon,
  className,
  minimal = false,
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend) {
      case "up":
        return <ArrowUp className="h-3 w-3" />;
      case "down":
        return <ArrowDown className="h-3 w-3" />;
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return "text-muted-foreground";
    switch (trend) {
      case "up":
        return change && change > 0
          ? "text-foreground"
          : "text-muted-foreground";
      case "down":
        return change && change < 0
          ? "text-destructive"
          : "text-muted-foreground";
      default:
        return "text-muted-foreground";
    }
  };

  if (minimal) {
    return (
      <div className={cn("space-y-1", className)}>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        {(change !== undefined || changeLabel) && (
          <div
            className={cn("flex items-center gap-1 text-xs", getTrendColor())}
          >
            {getTrendIcon()}
            {change !== undefined && (
              <span>
                {change > 0 ? "+" : ""}
                {change}%
              </span>
            )}
            {changeLabel && <span>{changeLabel}</span>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border bg-card p-6",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          <p className="text-3xl font-semibold tabular-nums">{value}</p>
          {(change !== undefined || changeLabel) && (
            <div
              className={cn("flex items-center gap-1 text-xs", getTrendColor())}
            >
              {getTrendIcon()}
              {change !== undefined && (
                <span>
                  {change > 0 ? "+" : ""}
                  {change}%
                </span>
              )}
              {changeLabel && <span>{changeLabel}</span>}
            </div>
          )}
        </div>
        {icon && <div className="text-muted-foreground/20">{icon}</div>}
      </div>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-muted/5 pointer-events-none" />
    </div>
  );
}

interface CompactMetricProps {
  label: string;
  value: string | number;
  sublabel?: string;
  className?: string;
}

export function CompactMetric({
  label,
  value,
  sublabel,
  className,
}: CompactMetricProps) {
  return (
    <div className={cn("flex items-center justify-between py-2", className)}>
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        {sublabel && (
          <span className="text-xs text-muted-foreground/60">{sublabel}</span>
        )}
      </div>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}
