import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDetailDrawer } from "@/context/DetailDrawerContext";
import { useMetrics, formatDuration, formatNumber } from "@/hooks/useMetrics";

// Import new reusable components
import { MetricCard, CompactMetric } from "@/components/metrics";
import {
  ProgressMeter,
  LinearGauge,
  CircularProgress,
} from "@/components/metrics";
import { StatusIndicator } from "@/components/metrics";
import { BarChart, DistributionChart } from "@/components/charts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function PerformancePage() {
  const [timeRange, setTimeRange] = useState("1h");
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const { openDetail } = useDetailDrawer();

  const timeRangeHours =
    timeRange === "1h" ? 1 : timeRange === "24h" ? 24 : 168;

  const { data: stats } = useQuery({
    queryKey: ["performance-stats", timeRange],
    queryFn: () => apiClient.getStats(timeRangeHours),
    refetchInterval: refreshInterval,
  });

  const { data: requests } = useQuery({
    queryKey: ["performance-requests", timeRange],
    queryFn: () => apiClient.getRequests({ limit: 100 }),
    refetchInterval: refreshInterval,
  });

  const { data: queries } = useQuery({
    queryKey: ["performance-queries", timeRange],
    queryFn: () => apiClient.getQueries({ limit: 100 }),
    refetchInterval: refreshInterval,
  });

  const { data: exceptions } = useQuery({
    queryKey: ["performance-exceptions", timeRange],
    queryFn: () => apiClient.getExceptions({ limit: 100 }),
    refetchInterval: refreshInterval,
  });

  // Use centralized metrics calculations
  const metrics = useMetrics({
    requests,
    queries,
    exceptions,
    stats,
  });

  // Prepare data for charts
  const performanceIndicators = [
    {
      label: "Success Rate",
      value: metrics.successRate,
      status:
        metrics.successRate >= 99
          ? "success"
          : metrics.successRate >= 95
          ? "warning"
          : "error",
      description: `Based on ${metrics.totalRequests} requests`,
    },
    {
      label: "Avg Response Time",
      value: formatDuration(metrics.avgResponseTime),
      rawValue: metrics.avgResponseTime,
      status:
        !metrics.avgResponseTime || metrics.avgResponseTime < 100
          ? "success"
          : metrics.avgResponseTime < 300
          ? "warning"
          : "error",
    },
    {
      label: "Error Rate",
      value: `${metrics.errorRate.toFixed(1)}%`,
      rawValue: metrics.errorRate,
      status:
        metrics.errorRate <= 1
          ? "success"
          : metrics.errorRate <= 2
          ? "warning"
          : "error",
    },
    {
      label: "Query Performance",
      value: formatDuration(metrics.avgQueryTime),
      rawValue: metrics.avgQueryTime,
      status:
        !metrics.avgQueryTime || metrics.avgQueryTime < 50
          ? "success"
          : metrics.avgQueryTime < 100
          ? "warning"
          : "error",
    },
  ];

  const endpointBarData = metrics.endpointMetrics
    .slice(0, 10)
    .map((endpoint) => ({
      name: endpoint.name,
      responseTime: endpoint.avgResponseTime,
      calls: endpoint.calls,
    }));

  const errorDistribution = [
    {
      category: "4xx Errors",
      count:
        requests?.filter(
          (r) => r.status_code && r.status_code >= 400 && r.status_code < 500
        ).length || 0,
    },
    {
      category: "5xx Errors",
      count:
        requests?.filter((r) => r.status_code && r.status_code >= 500).length ||
        0,
    },
    { category: "Exceptions", count: metrics.totalExceptions },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance</h1>
          <p className="text-muted-foreground">
            Monitor and analyze application performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={refreshInterval.toString()}
            onValueChange={(v) => setRefreshInterval(parseInt(v))}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5000">Refresh: 5s</SelectItem>
              <SelectItem value="10000">Refresh: 10s</SelectItem>
              <SelectItem value="30000">Refresh: 30s</SelectItem>
              <SelectItem value="0">Refresh: Off</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid gap-4 md:grid-cols-4">
        {performanceIndicators.map((indicator) => (
          <Card key={indicator.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {indicator.label}
              </CardTitle>
              {indicator.description && (
                <CardDescription className="text-xs">
                  {indicator.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-2xl font-bold tabular-nums">
                  {indicator.value}
                </div>
                <StatusIndicator
                  status={indicator.status as any}
                  label={
                    indicator.status === "success"
                      ? "Excellent"
                      : indicator.status === "warning"
                      ? "Acceptable"
                      : "Needs Attention"
                  }
                  compact
                />
                {indicator.rawValue !== undefined && (
                  <ProgressMeter
                    label=""
                    value={
                      indicator.label.includes("Rate")
                        ? indicator.rawValue
                        : indicator.label === "Avg Response Time"
                        ? Math.min((indicator.rawValue / 1000) * 100, 100)
                        : indicator.label === "Query Performance"
                        ? Math.min((indicator.rawValue / 200) * 100, 100)
                        : 0
                    }
                    max={100}
                    showPercentage={false}
                    compact
                    status={
                      indicator.status === "success"
                        ? "success"
                        : indicator.status === "warning"
                        ? "warning"
                        : "danger"
                    }
                  />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="queries">Database</TabsTrigger>
          <TabsTrigger value="errors">Error Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Performance Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Response Time Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Response Time</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <CompactMetric
                  label="P50 (Median)"
                  value={formatDuration(metrics.responseTimePercentiles.p50)}
                />
                <CompactMetric
                  label="P95"
                  value={formatDuration(metrics.responseTimePercentiles.p95)}
                />
                <CompactMetric
                  label="P99"
                  value={formatDuration(metrics.responseTimePercentiles.p99)}
                />
                <LinearGauge
                  value={metrics.avgResponseTime || 0}
                  max={1000}
                  label="Average"
                  thresholds={[
                    { value: 100, label: "100ms" },
                    { value: 300, label: "300ms" },
                    { value: 1000, label: "1s" },
                  ]}
                />
              </CardContent>
            </Card>

            {/* Throughput Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Throughput</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <CompactMetric
                  label="Requests/sec"
                  value={metrics.requestsPerSecond.toFixed(1)}
                />
                <CompactMetric
                  label="Total Requests"
                  value={formatNumber(stats?.total_requests)}
                />
                <CompactMetric
                  label="Total Queries"
                  value={formatNumber(stats?.total_queries)}
                />
                <CompactMetric
                  label="Queries/Request"
                  value={
                    stats?.total_queries && stats?.total_requests
                      ? (stats.total_queries / stats.total_requests).toFixed(1)
                      : "0"
                  }
                />
              </CardContent>
            </Card>

            {/* Error Rates Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Error Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <CircularProgress
                  value={100 - metrics.errorRate}
                  size="sm"
                  label="Health Score"
                />
                <CompactMetric
                  label="Failed Requests"
                  value={metrics.failedRequests}
                />
                <CompactMetric
                  label="Error Rate"
                  value={`${metrics.errorRate.toFixed(1)}%`}
                />
                <CompactMetric
                  label="Exceptions"
                  value={metrics.totalExceptions}
                />
              </CardContent>
            </Card>
          </div>

          {/* Metrics Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
              <CardDescription>
                Real-time metrics based on {metrics.totalRequests} recent
                requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <MetricCard
                  label="Success Rate"
                  value={`${metrics.successRate.toFixed(1)}%`}
                  minimal
                />
                <MetricCard
                  label="Avg Response"
                  value={formatDuration(metrics.avgResponseTime)}
                  minimal
                />
                <MetricCard
                  label="Slow Requests"
                  value={metrics.slowRequests}
                  minimal
                />
                <MetricCard
                  label="Active Endpoints"
                  value={metrics.endpointMetrics.length}
                  minimal
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Endpoint Performance</CardTitle>
              <CardDescription>
                Performance breakdown by API endpoint
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {endpointBarData.length > 0 && (
                <BarChart
                  title="Response Times by Endpoint"
                  data={endpointBarData}
                  bars={[
                    { dataKey: "responseTime", name: "Avg Response Time" },
                  ]}
                  height={300}
                  formatter="duration"
                  minimal
                  horizontal
                />
              )}

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Detailed Metrics</h4>
                {metrics.endpointMetrics.map((endpoint) => (
                  <div
                    key={endpoint.name}
                    className="space-y-2 p-3 border rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-mono">{endpoint.name}</code>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{endpoint.calls} calls</Badge>
                        {endpoint.errors > 0 && (
                          <Badge variant="destructive">
                            {endpoint.errors} errors
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ProgressMeter
                      label={`${endpoint.avgResponseTime}ms average`}
                      value={Math.min(
                        (endpoint.avgResponseTime / 500) * 100,
                        100
                      )}
                      showPercentage={false}
                      sublabel={`Success rate: ${endpoint.successRate}%`}
                      compact
                    />
                  </div>
                ))}
                {metrics.endpointMetrics.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No endpoint data available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queries" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Query Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <CompactMetric
                  label="Total Queries"
                  value={metrics.totalQueries}
                />
                <CompactMetric
                  label="Slow Queries"
                  value={metrics.slowQueries}
                />
                <CompactMetric
                  label="Avg Query Time"
                  value={formatDuration(metrics.avgQueryTime)}
                />
                <ProgressMeter
                  label="Query Performance Score"
                  value={
                    metrics.avgQueryTime
                      ? 100 - Math.min((metrics.avgQueryTime / 200) * 100, 100)
                      : 100
                  }
                  status={
                    !metrics.avgQueryTime || metrics.avgQueryTime < 50
                      ? "success"
                      : metrics.avgQueryTime < 100
                      ? "warning"
                      : "danger"
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Slow Queries</CardTitle>
                <CardDescription>Queries exceeding 100ms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {queries
                    ?.filter((q) => q.duration_ms && q.duration_ms > 100)
                    .slice(0, 5)
                    .map((query) => (
                      <div
                        key={query.id}
                        className="text-xs cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
                        onClick={() => openDetail("request", query.request_id)}
                      >
                        <code className="block truncate">{query.sql}</code>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-muted-foreground">
                            {new Date(query.created_at).toLocaleTimeString()}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {formatDuration(query.duration_ms)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  {(!queries ||
                    queries.filter((q) => q.duration_ms && q.duration_ms > 100)
                      .length === 0) && (
                    <p className="text-center text-muted-foreground py-4">
                      No slow queries detected
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Analysis</CardTitle>
              <CardDescription>
                Breakdown of errors and exceptions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <MetricCard
                  label="Total Errors"
                  value={metrics.failedRequests}
                  minimal
                />
                <MetricCard
                  label="Error Rate"
                  value={`${metrics.errorRate.toFixed(1)}%`}
                  minimal
                />
                <MetricCard
                  label="Exceptions"
                  value={metrics.totalExceptions}
                  minimal
                />
              </div>

              <DistributionChart data={errorDistribution} />

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Recent Exceptions</h4>
                {exceptions?.slice(0, 10).map((exception) => (
                  <StatusIndicator
                    key={exception.id}
                    status="error"
                    label={exception.exception_type}
                    description={exception.exception_value || undefined}
                    value={new Date(exception.created_at).toLocaleTimeString()}
                    className="cursor-pointer hover:bg-muted/50 p-2 -mx-2 rounded transition-colors"
                    onClick={() => openDetail("request", exception.request_id)}
                  />
                ))}
                {(!exceptions || exceptions.length === 0) && (
                  <p className="text-center text-muted-foreground py-4">
                    No exceptions captured
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
