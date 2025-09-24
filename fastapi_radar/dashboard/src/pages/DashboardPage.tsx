import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  Database,
  AlertTriangle,
  Clock,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";
import { format } from "date-fns";
import { useDetailDrawer } from "@/context/DetailDrawerContext";
import {
  useMetrics,
  formatDuration,
  getStatusBadgeVariant,
} from "@/hooks/useMetrics";
import { Link } from "react-router-dom";
import { useT } from "@/i18n";

// Import new reusable components
import { MetricCard, CompactMetric } from "@/components/metrics";
import { StatusIndicator, StatusDot } from "@/components/metrics";
import { ProgressMeter, CircularProgress } from "@/components/metrics";
import {
  LineChart,
  AreaChart,
  SimpleBarChart,
  DistributionChart,
} from "@/components/charts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function DashboardPage() {
  const [timeRange, setTimeRange] = useState<number>(1); // hours
  const [autoRefresh] = useState(true);
  const { openDetail } = useDetailDrawer();
  const t = useT();

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ["stats", timeRange],
    queryFn: () => apiClient.getStats(timeRange),
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const { data: recentRequests, refetch: refetchRequests } = useQuery({
    queryKey: ["recent-requests"],
    queryFn: () => apiClient.getRequests({ limit: 100 }),
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const { data: slowQueries, refetch: refetchQueries } = useQuery({
    queryKey: ["slow-queries"],
    queryFn: () =>
      apiClient.getQueries({ slow_only: true, limit: 10, slow_threshold: 100 }),
    refetchInterval: autoRefresh ? 10000 : false,
  });

  const { data: recentExceptions, refetch: refetchExceptions } = useQuery({
    queryKey: ["recent-exceptions"],
    queryFn: () => apiClient.getExceptions({ limit: 5 }),
    refetchInterval: autoRefresh ? 10000 : false,
  });

  // Use centralized metrics calculations
  const metrics = useMetrics({
    requests: recentRequests,
    queries: null,
    exceptions: recentExceptions,
    stats,
  });

  const handleRefreshAll = async () => {
    await Promise.all([
      refetchStats(),
      refetchRequests(),
      refetchQueries(),
      refetchExceptions(),
    ]);
  };

  // Prepare data for charts
  const timeSeriesData =
    recentRequests
      ?.slice(0, 20)
      .reverse()
      .map((req) => ({
        name: format(new Date(req.created_at), "HH:mm"),
        response: req.duration_ms || 0,
        queries: req.query_count || 0,
      })) || [];

  const statusDistribution = [
    {
      category: "Success",
      count: metrics.successfulRequests,
      percentage: metrics.successRate,
    },
    {
      category: "Errors",
      count: metrics.failedRequests,
      percentage: metrics.errorRate,
    },
  ];

  const endpointData = metrics.endpointMetrics.slice(0, 5).map((endpoint) => ({
    name: endpoint.name,
    value: endpoint.avgResponseTime,
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("pages.dashboard.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("pages.dashboard.description")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={timeRange.toString()}
            onValueChange={(v) => setTimeRange(parseInt(v))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">{t("timeRange.lastHour")}</SelectItem>
              <SelectItem value="24">{t("timeRange.last24Hours")}</SelectItem>
              <SelectItem value="168">{t("timeRange.last7Days")}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefreshAll}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label={t("metrics.totalRequests")}
          value={stats?.total_requests || 0}
          change={undefined}
          changeLabel={`${metrics.requestsPerMinute.toFixed(1)} ${t(
            "metrics.requestsPerMinute"
          ).toLowerCase()}`}
          icon={<Activity className="h-8 w-8" />}
        />

        <MetricCard
          label={t("metrics.avgResponseTime")}
          value={formatDuration(metrics.avgResponseTime)}
          trend={metrics.avgResponseTime < 100 ? "down" : "up"}
          changeLabel={
            metrics.avgResponseTime < 100
              ? t("performance.excellent")
              : t("performance.needsAttention")
          }
          icon={<Clock className="h-8 w-8" />}
        />

        <MetricCard
          label={t("metrics.databaseQueries")}
          value={stats?.total_queries || 0}
          changeLabel={
            stats?.slow_queries
              ? `${stats.slow_queries} ${t(
                  "metrics.slowQueries"
                ).toLowerCase()}`
              : t("database.noSlowQueriesShort")
          }
          trend={stats?.slow_queries ? "up" : "neutral"}
          icon={<Database className="h-8 w-8" />}
        />

        <MetricCard
          label={t("metrics.exceptions")}
          value={stats?.total_exceptions || 0}
          trend={stats?.total_exceptions === 0 ? "neutral" : "up"}
          changeLabel={
            stats?.total_exceptions === 0 ? t("common.all") : t("common.error")
          }
          icon={<AlertTriangle className="h-8 w-8" />}
        />
      </div>

      {/* Performance Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Success Rate */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {t("performance.overview")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CircularProgress
              value={metrics.successRate}
              max={100}
              size="md"
              label={t("metrics.successRate")}
            />
            <div className="space-y-2">
              <CompactMetric
                label={t("metrics.totalRequests")}
                value={metrics.totalRequests}
              />
              <CompactMetric
                label={t("requests.tabs.errors")}
                value={metrics.failedRequests}
              />
              <CompactMetric
                label={t("metrics.errorRate")}
                value={`${metrics.errorRate.toFixed(1)}%`}
              />
            </div>
          </CardContent>
        </Card>

        {/* Response Time Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {t("metrics.responseTime")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
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
            <div className="pt-2">
              <ProgressMeter
                label={t("performance.queryPerformance")}
                value={
                  stats?.avg_query_time
                    ? 100 - Math.min((stats.avg_query_time / 200) * 100, 100)
                    : 100
                }
                compact
                status={
                  !stats?.avg_query_time || stats.avg_query_time < 50
                    ? "success"
                    : stats.avg_query_time < 100
                    ? "warning"
                    : "danger"
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {t("performance.requestDistribution")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DistributionChart data={statusDistribution} />
            <div className="mt-4 space-y-2">
              <StatusIndicator
                status={
                  metrics.successRate >= 95
                    ? "success"
                    : metrics.successRate >= 90
                    ? "warning"
                    : "error"
                }
                label={t("performance.systemStatus")}
                description={`${metrics.requestsPerSecond.toFixed(1)} ${t(
                  "performance.requestsPerSec"
                )}`}
                compact
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Series Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <AreaChart
          title={t("performance.responseTimeChart")}
          description={t("performance.responseTimeDescription")}
          data={timeSeriesData}
          areas={[
            { dataKey: "response", name: t("metrics.responseTime") + " (ms)" },
          ]}
          height={200}
          formatter="duration"
        />

        <LineChart
          title={t("performance.queryActivity")}
          description={t("performance.queryActivityDescription")}
          data={timeSeriesData}
          lines={[{ dataKey: "queries", name: t("database.queries") }]}
          height={200}
          showGrid={true}
        />
      </div>

      {/* Endpoint Performance */}
      {endpointData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {t("performance.topEndpoints")}
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/performance">
                  {t("common.viewAll")}
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
            <CardDescription>
              {t("performance.avgResponseByEndpoint")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={endpointData} />
          </CardContent>
        </Card>
      )}

      {/* Activity Feed */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Requests */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {t("performance.recentRequests")}
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/requests">
                  {t("common.viewAll")}
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentRequests?.slice(0, 5).map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 -mx-2 rounded transition-colors"
                  onClick={() => openDetail("request", request.request_id)}
                >
                  <div className="flex items-center gap-3">
                    <StatusDot
                      status={
                        request.status_code && request.status_code < 400
                          ? "online"
                          : "offline"
                      }
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {request.method} {request.path}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(request.created_at), "HH:mm:ss")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        getStatusBadgeVariant(request.status_code) as any
                      }
                    >
                      {request.status_code}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDuration(request.duration_ms)}
                    </p>
                  </div>
                </div>
              ))}
              {(!recentRequests || recentRequests.length === 0) && (
                <p className="text-center text-muted-foreground py-4">
                  {t("requests.empty.all")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Slow Queries */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {t("database.slowQueries")}
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/database">
                  {t("common.viewAll")}
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {slowQueries?.slice(0, 5).map((query) => (
                <div
                  key={query.id}
                  className="space-y-1 cursor-pointer hover:bg-muted/50 p-2 -mx-2 rounded transition-colors"
                  onClick={() => openDetail("request", query.request_id)}
                >
                  <code className="text-xs bg-muted px-2 py-1 rounded block truncate">
                    {query.sql.substring(0, 50)}...
                  </code>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(query.created_at), "HH:mm:ss")}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {formatDuration(query.duration_ms)}
                    </Badge>
                  </div>
                </div>
              ))}
              {(!slowQueries || slowQueries.length === 0) && (
                <p className="text-center text-muted-foreground py-4">
                  {t("database.noSlowQueries")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Exceptions */}
      {recentExceptions && recentExceptions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {t("exceptions.recentExceptions")}
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/exceptions">
                  {t("common.viewAll")}
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentExceptions.slice(0, 3).map((exception) => (
                <StatusIndicator
                  key={exception.id}
                  status="error"
                  label={exception.exception_type}
                  description={
                    exception.exception_value || t("exceptions.clickToView")
                  }
                  value={format(new Date(exception.created_at), "HH:mm")}
                  className="cursor-pointer hover:bg-muted/50 p-2 -mx-2 rounded transition-colors"
                  onClick={() => openDetail("request", exception.request_id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
