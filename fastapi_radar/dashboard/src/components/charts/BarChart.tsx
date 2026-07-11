import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceArea,
} from "recharts";
import {
  BaseChart,
  CustomTooltip,
  chartTheme,
  formatters,
  getChartColors,
} from "./BaseChart";
import { useTheme } from "@/hooks/useTheme";
import { useState } from "react";

interface BarChartProps {
  title?: string;
  description?: string;
  data: any[];
  bars: {
    dataKey: string;
    name?: string;
    color?: string;
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
  horizontal?: boolean;
  onRangeSelect?: (startIndex: number, endIndex: number) => void;
}

export function BarChart({
  title,
  description,
  data,
  bars,
  xDataKey = "name",
  height = 250,
  minimal = false,
  showGrid = true,
  showLegend = false,
  formatter = "number",
  className,
  stacked = false,
  horizontal = false,
  onRangeSelect,
}: BarChartProps) {
  const { theme } = useTheme();
  const colors = theme === "dark" ? chartTheme.dark : chartTheme.light;
  const monoColors = getChartColors(theme === "dark");
  const formatValue = formatters[formatter];

  const [refAreaLeft, setRefAreaLeft] = useState<string | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const getIndex = (label: string) =>
    data.findIndex((d) => String(d[xDataKey]) === label);

  const handleMouseDown = (e: any) => {
    if (!onRangeSelect || !e?.activeLabel) return;
    setRefAreaLeft(e.activeLabel);
    setRefAreaRight(null);
    setIsDragging(true);
  };

  const handleMouseMove = (e: any) => {
    if (!isDragging || !e?.activeLabel) return;
    setRefAreaRight(e.activeLabel);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const effectiveRight = refAreaRight ?? refAreaLeft;
    if (refAreaLeft !== null && effectiveRight !== null && onRangeSelect) {
      let startIdx = getIndex(refAreaLeft);
      let endIdx = getIndex(effectiveRight);
      if (startIdx > endIdx) [startIdx, endIdx] = [endIdx, startIdx];
      if (startIdx !== -1 && endIdx !== -1) {
        onRangeSelect(startIdx, endIdx);
      }
    }
    setRefAreaLeft(null);
    setRefAreaRight(null);
  };

  const handleMouseLeave = () => {
    handleMouseUp();
    setIsHovering(false);
  };

  const content = (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ top: 5, right: 5, left: horizontal ? 50 : 0, bottom: 5 }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          cursor: onRangeSelect ? (isDragging ? "col-resize" : "crosshair") : undefined,
          userSelect: "none",
        }}
      >
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={colors.grid}
            vertical={horizontal}
            horizontal={!horizontal}
            strokeOpacity={0.5}
          />
        )}
        {horizontal ? (
          <>
            <XAxis
              type="number"
              stroke={colors.text}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatValue}
            />
            <YAxis
              type="category"
              dataKey={xDataKey}
              stroke={colors.text}
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
          </>
        ) : (
          <>
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
          </>
        )}
        {isHovering && !isDragging && <Tooltip content={<CustomTooltip />} />}
        {showLegend && (
          <Legend iconType="rect" wrapperStyle={{ fontSize: 11 }} />
        )}
        {bars.map((bar, index) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            name={bar.name || bar.dataKey}
            stackId={stacked ? "1" : bar.stackId}
            fill={bar.color || monoColors[index % monoColors.length]}
            radius={stacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
            maxBarSize={40}
          />
        ))}
        {isDragging && refAreaLeft && refAreaRight && (
          <ReferenceArea
            x1={refAreaLeft}
            x2={refAreaRight}
            stroke={colors.text}
            strokeOpacity={0.4}
            fill={colors.text}
            fillOpacity={0.12}
          />
        )}
      </RechartsBarChart>
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

interface SimpleBarChartProps {
  data: { name: string; value: number; color?: string }[];
  maxValue?: number;
  showValues?: boolean;
  className?: string;
}

export function SimpleBarChart({
  data,
  maxValue,
  showValues = true,
  className,
}: SimpleBarChartProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value));

  return (
    <div className={className}>
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.name} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground truncate">
                {item.name}
              </span>
              {showValues && (
                <span className="font-medium tabular-nums ml-2">
                  {item.value}
                </span>
              )}
            </div>
            <div className="h-2 bg-muted rounded-sm overflow-hidden">
              <div
                className="h-full bg-foreground transition-all duration-500 ease-out rounded-sm"
                style={{
                  width: `${(item.value / max) * 100}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
