import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTheme } from "@/hooks/useTheme";

interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

interface BaseChartProps {
  title?: string;
  description?: string;
  data: ChartData[];
  className?: string;
}

// Custom tooltip for dark mode support
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-2">
        <p className="text-sm font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function ResponseTimeChart({
  title = "Response Time",
  description = "Average response time over time",
  data,
  className,
}: BaseChartProps) {
  const { theme } = useTheme();
  const gridColor = theme === "dark" ? "#374151" : "#e5e7eb";
  const textColor = theme === "dark" ? "#9ca3af" : "#6b7280";

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorResponse" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="name"
              stroke={textColor}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={textColor}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}ms`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#8b5cf6"
              fillOpacity={1}
              fill="url(#colorResponse)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function RequestVolumeChart({
  title = "Request Volume",
  description = "Number of requests over time",
  data,
  className,
}: BaseChartProps) {
  const { theme } = useTheme();
  const gridColor = theme === "dark" ? "#374151" : "#e5e7eb";
  const textColor = theme === "dark" ? "#9ca3af" : "#6b7280";

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="name"
              stroke={textColor}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={textColor}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              fill="#10b981"
              radius={[8, 8, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function StatusCodeDistribution({
  title = "Status Code Distribution",
  description = "Distribution of HTTP status codes",
  data,
  className,
}: BaseChartProps) {
  const COLORS = {
    "2xx": "#10b981",
    "3xx": "#3b82f6",
    "4xx": "#f59e0b",
    "5xx": "#ef4444",
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry: any) =>
                `${entry.name} (${(entry.percent * 100).toFixed(0)}%)`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.name as keyof typeof COLORS] || "#8884d8"}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function EndpointPerformanceChart({
  title = "Endpoint Performance",
  description = "Performance metrics by endpoint",
  data,
  className,
}: BaseChartProps) {
  const { theme } = useTheme();
  const gridColor = theme === "dark" ? "#374151" : "#e5e7eb";
  const textColor = theme === "dark" ? "#9ca3af" : "#6b7280";

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              type="number"
              stroke={textColor}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}ms`}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke={textColor}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={100}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              fill="#8b5cf6"
              radius={[0, 8, 8, 0]}
              maxBarSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface DatabaseChartData {
  name: string;
  queries?: number;
  slowQueries?: number;
  [key: string]: any;
}

interface DatabaseChartProps {
  title?: string;
  description?: string;
  data: DatabaseChartData[];
  className?: string;
}

export function DatabaseQueryChart({
  title = "Database Query Performance",
  description = "Query execution times",
  data,
  className,
}: DatabaseChartProps) {
  const { theme } = useTheme();
  const gridColor = theme === "dark" ? "#374151" : "#e5e7eb";
  const textColor = theme === "dark" ? "#9ca3af" : "#6b7280";

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="name"
              stroke={textColor}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={textColor}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}ms`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="queries"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Query Time"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="slowQueries"
              stroke="#ef4444"
              strokeWidth={2}
              name="Slow Queries"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface RadarChartData {
  metric: string;
  value: number;
  [key: string]: any;
}

interface RadarChartProps {
  title?: string;
  description?: string;
  data: RadarChartData[];
  className?: string;
}

export function SystemMetricsRadar({
  title = "System Health",
  description = "Overall system performance metrics",
  data,
  className,
}: RadarChartProps) {
  const { theme } = useTheme();
  const gridColor = theme === "dark" ? "#374151" : "#e5e7eb";
  const textColor = theme === "dark" ? "#9ca3af" : "#6b7280";

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={data}>
            <PolarGrid stroke={gridColor} />
            <PolarAngleAxis dataKey="metric" stroke={textColor} fontSize={12} />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              stroke={textColor}
              fontSize={10}
            />
            <Radar
              name="Performance"
              dataKey="value"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.6}
              strokeWidth={2}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
