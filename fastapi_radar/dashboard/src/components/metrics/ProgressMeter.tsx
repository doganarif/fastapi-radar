import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface ProgressMeterProps {
  label: string;
  value: number;
  max?: number;
  showPercentage?: boolean;
  sublabel?: string;
  status?: "default" | "success" | "warning" | "danger";
  className?: string;
  compact?: boolean;
}

export function ProgressMeter({
  label,
  value,
  max = 100,
  showPercentage = true,
  sublabel,
  status = "default",
  className,
  compact = false,
}: ProgressMeterProps) {
  const percentage = Math.round((value / max) * 100);

  const getStatusColor = () => {
    if (status === "success") return "bg-foreground";
    if (status === "warning") return "bg-muted-foreground";
    if (status === "danger") return "bg-destructive";
    return "";
  };

  if (compact) {
    return (
      <div className={cn("space-y-1", className)}>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{label}</span>
          {showPercentage && (
            <span className="font-medium tabular-nums">{percentage}%</span>
          )}
        </div>
        <Progress value={percentage} className={cn("h-1", getStatusColor())} />
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{label}</p>
          {sublabel && (
            <p className="text-xs text-muted-foreground">{sublabel}</p>
          )}
        </div>
        {showPercentage && (
          <span className="text-lg font-semibold tabular-nums">
            {percentage}%
          </span>
        )}
      </div>
      <Progress value={percentage} className={cn("h-2", getStatusColor())} />
    </div>
  );
}

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  strokeWidth?: number;
  label?: string;
  showValue?: boolean;
  className?: string;
}

export function CircularProgress({
  value,
  max = 100,
  size = "md",
  strokeWidth = 4,
  label,
  showValue = true,
  className,
}: CircularProgressProps) {
  const percentage = Math.round((value / max) * 100);

  const getSizeConfig = () => {
    switch (size) {
      case "sm":
        return { width: 60, height: 60, radius: 25 };
      case "md":
        return { width: 80, height: 80, radius: 35 };
      case "lg":
        return { width: 120, height: 120, radius: 50 };
      default:
        return { width: 80, height: 80, radius: 35 };
    }
  };

  const { width, height, radius } = getSizeConfig();
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className={cn("relative inline-flex flex-col items-center", className)}
    >
      <svg width={width} height={height} className="transform -rotate-90">
        <circle
          cx={width / 2}
          cy={height / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted"
        />
        <circle
          cx={width / 2}
          cy={height / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="text-foreground transition-all duration-500 ease-in-out"
          strokeLinecap="round"
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              "font-semibold tabular-nums",
              size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-lg"
            )}
          >
            {percentage}%
          </span>
        </div>
      )}
      {label && (
        <p className="mt-2 text-xs text-muted-foreground text-center">
          {label}
        </p>
      )}
    </div>
  );
}

interface LinearGaugeProps {
  value: number;
  max?: number;
  thresholds?: { value: number; label: string; color?: string }[];
  label?: string;
  showScale?: boolean;
  className?: string;
}

export function LinearGauge({
  value,
  max = 100,
  thresholds = [],
  label,
  showScale = false,
  className,
}: LinearGaugeProps) {
  const percentage = Math.round((value / max) * 100);

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-sm font-semibold tabular-nums">{value}</span>
        </div>
      )}
      <div className="relative">
        <div className="h-6 bg-muted rounded-sm overflow-hidden">
          <div
            className="h-full bg-foreground transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        {thresholds.map((threshold) => (
          <div
            key={threshold.value}
            className="absolute top-0 h-6 w-px bg-border"
            style={{ left: `${(threshold.value / max) * 100}%` }}
          >
            {showScale && (
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
                {threshold.label}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
