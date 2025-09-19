import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { BaseChart, CustomTooltip, chartTheme, formatters } from "./BaseChart";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

interface LineChartProps {
  title?: string;
  description?: string;
  data: any[];
  lines: {
    dataKey: string;
    name?: string;
    color?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
    dot?: boolean;
  }[];
  xDataKey?: string;
  height?: number;
  minimal?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  formatter?: "number" | "percentage" | "duration" | "bytes";
  className?: string;
}

export function LineChart({
  title,
  description,
  data,
  lines,
  xDataKey = "name",
  height = 250,
  minimal = false,
  showGrid = true,
  showLegend = false,
  formatter = "number",
  className,
}: LineChartProps) {
  const { theme } = useTheme();
  const colors = theme === "dark" ? chartTheme.dark : chartTheme.light;

  const formatValue = formatters[formatter];

  const content = (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart
        data={data}
        margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
      >
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={colors.grid}
            vertical={false}
            strokeOpacity={0.5}
          />
        )}
        <XAxis
          dataKey={xDataKey}
          stroke={colors.text}
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke={colors.text}
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatValue}
          width={45}
        />
        <Tooltip content={<CustomTooltip />} />
        {showLegend && (
          <Legend iconType="line" wrapperStyle={{ fontSize: 11 }} />
        )}
        {lines.map((line, index) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name || line.dataKey}
            stroke={
              line.color || (index === 0 ? colors.primary : colors.secondary)
            }
            strokeWidth={line.strokeWidth || 2}
            strokeDasharray={line.strokeDasharray}
            dot={line.dot === true ? { r: 3 } : false}
            activeDot={line.dot !== false ? { r: 4 } : false}
          />
        ))}
      </RechartsLineChart>
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

interface SparklineProps {
  data: any[];
  dataKey: string;
  height?: number;
  color?: string;
  className?: string;
}

export function Sparkline({
  data,
  dataKey,
  height = 40,
  color,
  className,
}: SparklineProps) {
  const { theme } = useTheme();
  const colors = theme === "dark" ? chartTheme.dark : chartTheme.light;

  return (
    <div className={cn("", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart
          data={data}
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
        >
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color || colors.primary}
            strokeWidth={1.5}
            dot={false}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
