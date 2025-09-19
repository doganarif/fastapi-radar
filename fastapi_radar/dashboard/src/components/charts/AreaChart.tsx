import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { BaseChart, CustomTooltip, chartTheme, formatters } from "./BaseChart";
import { useTheme } from "@/hooks/useTheme";

interface AreaChartProps {
  title?: string;
  description?: string;
  data: any[];
  areas: {
    dataKey: string;
    name?: string;
    color?: string;
    fillOpacity?: number;
    stackId?: string;
  }[];
  xDataKey?: string;
  height?: number;
  minimal?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  formatter?: "number" | "percentage" | "duration" | "bytes";
  className?: string;
  stacked?: boolean;
}

export function AreaChart({
  title,
  description,
  data,
  areas,
  xDataKey = "name",
  height = 250,
  minimal = false,
  showGrid = true,
  showLegend = false,
  formatter = "number",
  className,
  stacked = false,
}: AreaChartProps) {
  const { theme } = useTheme();
  const colors = theme === "dark" ? chartTheme.dark : chartTheme.light;
  const formatValue = formatters[formatter];

  const content = (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart
        data={data}
        margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
      >
        <defs>
          {areas.map((area, index) => (
            <linearGradient
              key={`gradient-${area.dataKey}`}
              id={`gradient-${area.dataKey}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="5%"
                stopColor={
                  area.color ||
                  (index === 0 ? colors.primary : colors.secondary)
                }
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor={
                  area.color ||
                  (index === 0 ? colors.primary : colors.secondary)
                }
                stopOpacity={0}
              />
            </linearGradient>
          ))}
        </defs>
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
        {areas.map((area, index) => (
          <Area
            key={area.dataKey}
            type="monotone"
            dataKey={area.dataKey}
            name={area.name || area.dataKey}
            stackId={stacked ? "1" : area.stackId}
            stroke={
              area.color || (index === 0 ? colors.primary : colors.secondary)
            }
            strokeWidth={2}
            fill={`url(#gradient-${area.dataKey})`}
            fillOpacity={area.fillOpacity || 1}
          />
        ))}
      </RechartsAreaChart>
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

interface MiniAreaChartProps {
  data: any[];
  dataKey: string;
  height?: number;
  color?: string;
  className?: string;
}

export function MiniAreaChart({
  data,
  dataKey,
  height = 60,
  color,
  className,
}: MiniAreaChartProps) {
  const { theme } = useTheme();
  const colors = theme === "dark" ? chartTheme.dark : chartTheme.light;

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart
          data={data}
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient
              id={`mini-gradient-${dataKey}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="5%"
                stopColor={color || colors.primary}
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor={color || colors.primary}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color || colors.primary}
            strokeWidth={1.5}
            fill={`url(#mini-gradient-${dataKey})`}
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
