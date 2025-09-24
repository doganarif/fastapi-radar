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
import { useT } from "@/i18n";

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
  const t = useT();

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
      type: "successRate",
      label: t("metrics.successRate"),
      value: metrics.successRate,
      status:
        metrics.successRate >= 99
          ? "success"
          : metrics.successRate >= 95
          ? "warning"
          : "error",
      description: `${t("common.all")} ${metrics.totalRequests} ${t(
        "metrics.totalRequests"
      ).toLowerCase()}`,
    },
    {
      type: "avgResponseTime",
      label: t("metrics.avgResponseTime"),
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
      type: "errorRate",
      label: t("metrics.errorRate"),
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
      type: "queryPerformance",
      label: t("performance.queryPerformance"),
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
      category: t("requests.statusFilters.clientErrors"),
      count:
        requests?.filter(
          (r) => r.status_code && r.status_code >= 400 && r.status_code < 500
        ).length || 0,
    },
    {
      category: t("requests.statusFilters.serverErrors"),
      count:
        requests?.filter((r) => r.status_code && r.status_code >= 500).length ||
        0,
    },
    { category: t("metrics.exceptions"), count: metrics.totalExceptions },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("pages.performance.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("pages.performance.description")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">{t("timeRange.lastHour")}</SelectItem>
              <SelectItem value="24h">{t("timeRange.last24Hours")}</SelectItem>
              <SelectItem value="7d">{t("timeRange.last7Days")}</SelectItem>
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
              <SelectItem value="5000">{t("common.refresh")}: 5s</SelectItem>
              <SelectItem value="10000">{t("common.refresh")}: 10s</SelectItem>
              <SelectItem value="30000">{t("common.refresh")}: 30s</SelectItem>
              <SelectItem value="0">
                {t("common.refresh")}: {t("common.no")}
              </SelectItem>
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
                      ? t("performance.excellent")
                      : indicator.status === "warning"
                      ? t("performance.acceptable")
                      : t("performance.needsAttention")
                  }
                  compact
                />
                {indicator.rawValue !== undefined && (
                  <ProgressMeter
                    label=""
                    value={
                      indicator.type === "successRate" ||
                      indicator.type === "errorRate"
                        ? indicator.rawValue
                        : indicator.type === "avgResponseTime"
                        ? Math.min((indicator.rawValue / 1000) * 100, 100)
                        : indicator.type === "queryPerformance"
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
          <TabsTrigger value="overview">
            {t("performance.overview")}
          </TabsTrigger>
          <TabsTrigger value="endpoints">
            {t("performance.endpointPerformance")}
          </TabsTrigger>
          <TabsTrigger value="queries">{t("nav.database")}</TabsTrigger>
          <TabsTrigger value="errors">
            {t("performance.errorAnalysis")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Performance Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Response Time Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {t("metrics.responseTime")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <CompactMetric
                  label={t("performance.p50Median")}
                  value={formatDuration(metrics.responseTimePercentiles.p50)}
                />
                <CompactMetric
                  label={t("performance.p95")}
                  value={formatDuration(metrics.responseTimePercentiles.p95)}
                />
                <CompactMetric
                  label={t("performance.p99")}
                  value={formatDuration(metrics.responseTimePercentiles.p99)}
                />
                <LinearGauge
                  value={metrics.avgResponseTime || 0}
                  max={1000}
                  label={t("performance.average")}
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
                <CardTitle className="text-base">
                  {t("performance.throughput")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <CompactMetric
                  label={t("performance.requestsPerSec")}
                  value={metrics.requestsPerSecond.toFixed(1)}
                />
                <CompactMetric
                  label={t("metrics.totalRequests")}
                  value={formatNumber(stats?.total_requests)}
                />
                <CompactMetric
                  label={t("performance.totalQueries")}
                  value={formatNumber(stats?.total_queries)}
                />
                <CompactMetric
                  label={t("performance.queriesPerRequest")}
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
                <CardTitle className="text-base">
                  {t("performance.errorAnalysis")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <CircularProgress
                  value={100 - metrics.errorRate}
                  size="sm"
                  label={t("performance.healthScore")}
                />
                <CompactMetric
                  label={t("requests.tabs.failed")}
                  value={metrics.failedRequests}
                />
                <CompactMetric
                  label={t("metrics.errorRate")}
                  value={`${metrics.errorRate.toFixed(1)}%`}
                />
                <CompactMetric
                  label={t("metrics.exceptions")}
                  value={metrics.totalExceptions}
                />
              </CardContent>
            </Card>
          </div>

          {/* Metrics Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t("performance.performanceSummary")}</CardTitle>
              <CardDescription>
                {t("performance.realTimeMetrics")} {metrics.totalRequests}{" "}
                {t("performance.recentRequests")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <MetricCard
                  label={t("metrics.successRate")}
                  value={`${metrics.successRate.toFixed(1)}%`}
                  minimal
                />
                <MetricCard
                  label={t("performance.avgResponse")}
                  value={formatDuration(metrics.avgResponseTime)}
                  minimal
                />
                <MetricCard
                  label={t("performance.slowRequests")}
                  value={metrics.slowRequests}
                  minimal
                />
                <MetricCard
                  label={t("performance.activeEndpoints")}
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
              <CardTitle>{t("performance.endpointPerformance")}</CardTitle>
              <CardDescription>
                {t("performance.performanceBreakdown")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {endpointBarData.length > 0 && (
                <BarChart
                  title={t("performance.responseTimesByEndpoint")}
                  data={endpointBarData}
                  bars={[
                    {
                      dataKey: "responseTime",
                      name: t("metrics.avgResponseTime"),
                    },
                  ]}
                  height={300}
                  formatter="duration"
                  minimal
                  horizontal
                />
              )}

              <div className="space-y-4">
                <h4 className="text-sm font-medium">
                  {t("performance.detailedMetrics")}
                </h4>
                {metrics.endpointMetrics.map((endpoint) => (
                  <div
                    key={endpoint.name}
                    className="space-y-2 p-3 border rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-mono">{endpoint.name}</code>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {endpoint.calls} {t("performance.calls")}
                        </Badge>
                        {endpoint.errors > 0 && (
                          <Badge variant="destructive">
                            {endpoint.errors} {t("performance.errors")}
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
                      sublabel={`${t("performance.successRate")}: ${
                        endpoint.successRate
                      }%`}
                      compact
                    />
                  </div>
                ))}
                {metrics.endpointMetrics.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    {t("performance.noEndpointData")}
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
                <CardTitle>{t("performance.queryStatistics")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <CompactMetric
                  label={t("performance.totalQueries")}
                  value={metrics.totalQueries}
                />
                <CompactMetric
                  label={t("performance.slowQueries")}
                  value={metrics.slowQueries}
                />
                <CompactMetric
                  label={t("performance.avgQueryTime")}
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
                <CardTitle>{t("performance.slowQueriesTitle")}</CardTitle>
                <CardDescription>
                  {t("database.slowThreshold")}: 100ms
                </CardDescription>
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
              <CardTitle>{t("performance.errorAnalysisTitle")}</CardTitle>
              <CardDescription>
                {t("performance.errorAnalysis")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <MetricCard
                  label={t("requests.tabs.failed")}
                  value={metrics.failedRequests}
                  minimal
                />
                <MetricCard
                  label={t("metrics.errorRate")}
                  value={`${metrics.errorRate.toFixed(1)}%`}
                  minimal
                />
                <MetricCard
                  label={t("metrics.exceptions")}
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
                    {t("performance.noExceptionsCaptured")}
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
