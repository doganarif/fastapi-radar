import { cn } from "@/lib/utils";
import { CheckCircle, AlertTriangle, AlertCircle, XCircle } from "lucide-react";

export type StatusLevel = "success" | "warning" | "error" | "info" | "neutral";

interface StatusIndicatorProps {
  status: StatusLevel;
  label: string;
  description?: string;
  value?: string | number;
  compact?: boolean;
  className?: string;
  onClick?: () => void;
}

export function StatusIndicator({
  status,
  label,
  description,
  value,
  compact = false,
  className,
  onClick,
}: StatusIndicatorProps) {
  const getStatusIcon = () => {
    const iconClass = "h-4 w-4";
    switch (status) {
      case "success":
        return <CheckCircle className={iconClass} />;
      case "warning":
        return <AlertTriangle className={iconClass} />;
      case "error":
        return <XCircle className={iconClass} />;
      case "info":
        return <AlertCircle className={iconClass} />;
      default:
        return <div className="h-4 w-4 rounded-full bg-muted" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "success":
        return "text-foreground";
      case "warning":
        return "text-muted-foreground";
      case "error":
        return "text-destructive";
      case "info":
        return "text-muted-foreground";
      default:
        return "text-muted-foreground";
    }
  };

  const getBorderColor = () => {
    switch (status) {
      case "success":
        return "border-l-foreground";
      case "warning":
        return "border-l-muted-foreground";
      case "error":
        return "border-l-destructive";
      case "info":
        return "border-l-muted-foreground";
      default:
        return "border-l-border";
    }
  };

  if (compact) {
    return (
      <div
        className={cn("flex items-center gap-2", className)}
        onClick={onClick}
      >
        <span className={cn(getStatusColor())}>{getStatusIcon()}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{label}</p>
        </div>
        {value && (
          <span className="text-sm tabular-nums text-muted-foreground">
            {value}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn("border-l-2 pl-4 py-2", getBorderColor(), className)}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <span className={cn("mt-0.5", getStatusColor())}>
          {getStatusIcon()}
        </span>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{label}</p>
            {value && (
              <span className="text-sm tabular-nums text-muted-foreground">
                {value}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface StatusDotProps {
  status: "online" | "offline" | "busy" | "away";
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
  className?: string;
}

export function StatusDot({
  status,
  size = "md",
  pulse = false,
  className,
}: StatusDotProps) {
  const getStatusColor = () => {
    switch (status) {
      case "online":
        return "bg-foreground";
      case "offline":
        return "bg-muted-foreground";
      case "busy":
        return "bg-destructive";
      case "away":
        return "bg-muted-foreground/60";
      default:
        return "bg-border";
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case "sm":
        return "h-2 w-2";
      case "md":
        return "h-3 w-3";
      case "lg":
        return "h-4 w-4";
      default:
        return "h-3 w-3";
    }
  };

  return (
    <span className={cn("relative inline-flex", className)}>
      {pulse && status === "online" && (
        <span
          className={cn(
            "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
            getStatusColor()
          )}
        />
      )}
      <span
        className={cn(
          "relative inline-flex rounded-full",
          getSizeClass(),
          getStatusColor()
        )}
      />
    </span>
  );
}
