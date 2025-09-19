import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  BaseChart,
  CustomTooltip,
  chartTheme,
  getChartColors,
} from "./BaseChart";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

interface PieChartProps {
  title?: string;
  description?: string;
  data: { name: string; value: number; color?: string }[];
  height?: number;
  minimal?: boolean;
  showLegend?: boolean;
  className?: string;
  donut?: boolean;
  showLabels?: boolean;
  showPercentage?: boolean;
}

export function PieChart({
  title,
  description,
  data,
  height = 250,
  minimal = false,
  showLegend = true,
  className,
  donut = false,
  showLabels = false,
  showPercentage = true,
}: PieChartProps) {
  const { theme } = useTheme();
  const colors = theme === "dark" ? chartTheme.dark : chartTheme.light;
  const monoColors = getChartColors(theme === "dark");

  const renderLabel = (entry: any) => {
    if (!showLabels) return null;
    if (showPercentage) {
      const percent = (
        (entry.value / data.reduce((a, b) => a + b.value, 0)) *
        100
      ).toFixed(0);
      return `${percent}%`;
    }
    return entry.value;
  };

  const content = (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderLabel}
          outerRadius={height / 3}
          innerRadius={donut ? height / 5 : 0}
          fill={colors.primary}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || monoColors[index % monoColors.length]}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        {showLegend && (
          <Legend
            verticalAlign="middle"
            align="right"
            layout="vertical"
            wrapperStyle={{ fontSize: 11, paddingLeft: "10px" }}
          />
        )}
      </RechartsPieChart>
    </ResponsiveContainer>
  );

  return (
    <BaseChart
      title={title}
      description={description}
      minimal={minimal}
      className={className}
    >
      {content}
    </BaseChart>
  );
}

interface DonutChartProps {
  value: number;
  max?: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  color?: string;
  className?: string;
}

export function DonutChart({
  value,
  max = 100,
  label,
  size = "md",
  color,
  className,
}: DonutChartProps) {
  const { theme } = useTheme();
  const colors = theme === "dark" ? chartTheme.dark : chartTheme.light;
  const percentage = (value / max) * 100;

  const getSizeConfig = () => {
    switch (size) {
      case "sm":
        return { width: 80, height: 80, outerRadius: 30, innerRadius: 20 };
      case "md":
        return { width: 120, height: 120, outerRadius: 45, innerRadius: 30 };
      case "lg":
        return { width: 160, height: 160, outerRadius: 60, innerRadius: 40 };
      default:
        return { width: 120, height: 120, outerRadius: 45, innerRadius: 30 };
    }
  };

  const config = getSizeConfig();
  const data = [
    { name: "Value", value: percentage },
    { name: "Remaining", value: 100 - percentage },
  ];

  return (
    <div
      className={cn("relative inline-flex flex-col items-center", className)}
    >
      <ResponsiveContainer width={config.width} height={config.height}>
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            startAngle={90}
            endAngle={-270}
            innerRadius={config.innerRadius}
            outerRadius={config.outerRadius}
            fill={color || colors.primary}
            dataKey="value"
          >
            <Cell fill={color || colors.primary} />
            <Cell fill={colors.muted} />
          </Pie>
        </RechartsPieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "font-semibold tabular-nums",
            size === "sm" ? "text-sm" : size === "md" ? "text-lg" : "text-2xl"
          )}
        >
          {percentage.toFixed(0)}%
        </span>
        {label && (
          <span className="text-xs text-muted-foreground">{label}</span>
        )}
      </div>
    </div>
  );
}

interface DistributionChartProps {
  data: { category: string; count: number; percentage?: number }[];
  className?: string;
}

export function DistributionChart({ data, className }: DistributionChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className={cn("space-y-3", className)}>
      {data.map((item) => {
        const percentage = item.percentage || (item.count / total) * 100;
        return (
          <div key={item.category} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{item.category}</span>
              <div className="flex items-center gap-2">
                <span className="font-medium tabular-nums">{item.count}</span>
                <span className="text-xs text-muted-foreground">
                  ({percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-foreground rounded-full transition-all duration-500 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
