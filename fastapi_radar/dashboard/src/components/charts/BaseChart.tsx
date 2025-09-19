import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface BaseChartProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  minimal?: boolean;
  actions?: ReactNode;
}

export function BaseChart({
  title,
  description,
  children,
  className,
  minimal = false,
  actions,
}: BaseChartProps) {
  if (minimal) {
    return (
      <div className={cn("space-y-2", className)}>
        {title && (
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">{title}</h4>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
            {actions}
          </div>
        )}
        {children}
      </div>
    );
  }

  return (
    <Card className={cn("", className)}>
      {(title || description || actions) && (
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              {title && <CardTitle className="text-base">{title}</CardTitle>}
              {description && (
                <CardDescription className="text-xs">
                  {description}
                </CardDescription>
              )}
            </div>
            {actions}
          </div>
        </CardHeader>
      )}
      <CardContent className="pb-4">{children}</CardContent>
    </Card>
  );
}

// Chart theme configuration
export const chartTheme = {
  light: {
    grid: "#e5e7eb",
    text: "#6b7280",
    primary: "#000000",
    secondary: "#6b7280",
    accent: "#9ca3af",
    muted: "#e5e7eb",
    background: "#ffffff",
  },
  dark: {
    grid: "#262626",
    text: "#9ca3af",
    primary: "#ffffff",
    secondary: "#9ca3af",
    accent: "#6b7280",
    muted: "#262626",
    background: "#0a0a0a",
  },
};

// Common chart colors in grayscale
export const chartColors = {
  mono: ["#000000", "#404040", "#737373", "#a3a3a3", "#d4d4d4"],
  monoDark: ["#ffffff", "#d4d4d4", "#a3a3a3", "#737373", "#404040"],
  accent: ["#000000", "#dc2626", "#000000", "#dc2626", "#000000"], // Black with red accents for alerts
};

// Helper function to get chart colors based on theme
export function getChartColors(isDark: boolean) {
  return isDark ? chartColors.monoDark : chartColors.mono;
}

// Custom tooltip component for all charts
export const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 backdrop-blur border rounded-md shadow-lg p-2 space-y-1">
        {label && (
          <p className="text-xs font-medium border-b pb-1 mb-1">{label}</p>
        )}
        {payload.map((entry: any, index: number) => (
          <div
            key={index}
            className="flex items-center justify-between gap-4 text-xs"
          >
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium tabular-nums">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Format functions for charts
export const formatters = {
  number: (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  },
  percentage: (value: number) => `${value}%`,
  duration: (value: number) => {
    if (value < 1000) return `${value}ms`;
    return `${(value / 1000).toFixed(1)}s`;
  },
  bytes: (value: number) => {
    if (value >= 1073741824) return `${(value / 1073741824).toFixed(1)}GB`;
    if (value >= 1048576) return `${(value / 1048576).toFixed(1)}MB`;
    if (value >= 1024) return `${(value / 1024).toFixed(1)}KB`;
    return `${value}B`;
  },
};
