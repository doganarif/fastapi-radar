import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { useDetailDrawer } from "@/context/DetailDrawerContext";
import { useMetrics, formatDuration, formatNumber } from "@/hooks/useMetrics";

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

  // Use consistent sample size with Dashboard
  const { data: requests } = useQuery({
    queryKey: ["performance-requests", timeRange],
    queryFn: () => apiClient.getRequests({ limit: 100 }), // Same as Dashboard
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

  const performanceIndicators = [
    {
      label: "Success Rate",
      value: metrics.successRate / 100,
      status:
        metrics.successRate >= 99
          ? "excellent"
          : metrics.successRate >= 95
          ? "good"
          : metrics.successRate >= 90
          ? "warning"
          : "critical",
      description: `Based on ${metrics.totalRequests} recent requests`,
    },
    {
      label: "Avg Response Time",
      value: metrics.avgResponseTime ? metrics.avgResponseTime / 1000 : 0, // Convert to normalized value
      status:
        !metrics.avgResponseTime || metrics.avgResponseTime < 100
          ? "excellent"
          : metrics.avgResponseTime < 300
          ? "good"
          : metrics.avgResponseTime < 1000
          ? "warning"
          : "critical",
      description: formatDuration(metrics.avgResponseTime),
    },
    {
      label: "Error Rate",
      value: metrics.errorRate / 100,
      status:
        metrics.errorRate <= 1
          ? "excellent"
          : metrics.errorRate <= 2
          ? "good"
          : metrics.errorRate <= 5
          ? "warning"
          : "critical",
      description: `${metrics.errorRate.toFixed(1)}% of requests failed`,
    },
    {
      label: "Query Performance",
      value: metrics.avgQueryTime
        ? (100 - Math.min((metrics.avgQueryTime / 100) * 100, 100)) / 100
        : 1,
      status:
        !metrics.avgQueryTime || metrics.avgQueryTime < 50
          ? "excellent"
          : metrics.avgQueryTime < 100
          ? "good"
          : metrics.avgQueryTime < 200
          ? "warning"
          : "critical",
      description: formatDuration(metrics.avgQueryTime),
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "text-green-500";
      case "good":
        return "text-blue-500";
      case "warning":
        return "text-yellow-500";
      case "critical":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excellent":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "good":
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Performance Monitoring
          </h1>
          <p className="text-muted-foreground">
            Track application performance metrics and identify bottlenecks
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
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {indicator.label}
                </CardTitle>
                {getStatusIcon(indicator.status)}
              </div>
              <CardDescription className="text-xs">
                {indicator.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-2xl font-bold ${getStatusColor(
                    indicator.status
                  )}`}
                >
                  {indicator.label.includes("Rate")
                    ? `${(indicator.value * 100).toFixed(1)}%`
                    : indicator.label === "Avg Response Time"
                    ? formatDuration(metrics.avgResponseTime)
                    : indicator.label === "Query Performance"
                    ? `${(indicator.value * 100).toFixed(0)}%`
                    : indicator.value.toFixed(2)}
                </span>
              </div>
              <Progress value={indicator.value * 100} className="mt-2 h-2" />
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
          {/* Performance Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Response Time</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">P50 (Median)</span>
                  <span className="font-medium">
                    {formatDuration(metrics.responseTimePercentiles.p50)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">P95</span>
                  <span className="font-medium">
                    {formatDuration(metrics.responseTimePercentiles.p95)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">P99</span>
                  <span className="font-medium">
                    {formatDuration(metrics.responseTimePercentiles.p99)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Throughput</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Requests/sec</span>
                  <span className="font-medium">
                    {metrics.requestsPerSecond.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Requests</span>
                  <span className="font-medium">
                    {formatNumber(stats?.total_requests)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Queries</span>
                  <span className="font-medium">
                    {formatNumber(stats?.total_queries)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Error Rates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Failed Requests</span>
                  <span className="font-medium">{metrics.failedRequests}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Error Rate</span>
                  <span className="font-medium">
                    {metrics.errorRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Exceptions</span>
                  <span className="font-medium">{metrics.totalExceptions}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Metrics Summary</CardTitle>
              <CardDescription>
                Real-time performance metrics based on recent activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Sample Size</p>
                  <p className="font-medium">
                    {metrics.totalRequests} requests
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Success Rate</p>
                  <p className="font-medium text-green-500">
                    {metrics.successRate.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Avg Response</p>
                  <p className="font-medium">
                    {formatDuration(metrics.avgResponseTime)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Slow Requests</p>
                  <p className="font-medium">{metrics.slowRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Endpoint Performance Metrics</CardTitle>
              <CardDescription>
                Detailed performance breakdown by API endpoint
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.endpointMetrics.map((endpoint) => (
                  <div key={endpoint.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono">
                          {endpoint.name}
                        </code>
                        <Badge variant="outline">{endpoint.calls} calls</Badge>
                        {endpoint.errors > 0 && (
                          <Badge variant="destructive">
                            {endpoint.errors} errors
                          </Badge>
                        )}
                        <Badge variant="secondary">
                          {endpoint.successRate}% success
                        </Badge>
                      </div>
                      <span className="text-sm font-medium">
                        {endpoint.avgResponseTime}ms avg
                      </span>
                    </div>
                    <Progress
                      value={Math.min(
                        (endpoint.avgResponseTime / 500) * 100,
                        100
                      )}
                      className="h-2"
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
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Queries</span>
                  <span className="font-medium">{metrics.totalQueries}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Slow Queries</span>
                  <span className="font-medium text-yellow-500">
                    {metrics.slowQueries}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg Query Time</span>
                  <span className="font-medium">
                    {formatDuration(metrics.avgQueryTime)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Slow Queries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {queries
                    ?.filter((q) => q.duration_ms && q.duration_ms > 100)
                    .slice(0, 5)
                    .map((query) => (
                      <div
                        key={query.id}
                        className="text-xs cursor-pointer hover:bg-muted/50 p-2 rounded"
                        onClick={() => openDetail("request", query.request_id)}
                      >
                        <code className="block truncate">{query.sql}</code>
                        <span className="text-muted-foreground">
                          {formatDuration(query.duration_ms)}
                        </span>
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
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Errors</p>
                  <p className="text-2xl font-bold">{metrics.failedRequests}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Error Rate</p>
                  <p className="text-2xl font-bold text-red-500">
                    {metrics.errorRate.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Exceptions</p>
                  <p className="text-2xl font-bold">
                    {metrics.totalExceptions}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Recent Exceptions</h4>
                {exceptions?.slice(0, 10).map((exception) => (
                  <div
                    key={exception.id}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                    onClick={() => openDetail("request", exception.request_id)}
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="destructive">
                        {exception.exception_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(exception.created_at).toLocaleString()}
                      </span>
                    </div>
                    {exception.exception_value && (
                      <p className="text-sm mt-1">
                        {exception.exception_value}
                      </p>
                    )}
                  </div>
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
