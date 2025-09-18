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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Database,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { useDetailDrawer } from "@/context/DetailDrawerContext";
import {
  useMetrics,
  formatDuration,
  getStatusBadgeVariant,
} from "@/hooks/useMetrics";
import { Link } from "react-router-dom";

export function DashboardPage() {
  const [timeRange, setTimeRange] = useState<number>(1); // hours
  const [autoRefresh] = useState(true);
  const { openDetail } = useDetailDrawer();

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ["stats", timeRange],
    queryFn: () => apiClient.getStats(timeRange),
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const { data: recentRequests, refetch: refetchRequests } = useQuery({
    queryKey: ["recent-requests"],
    queryFn: () => apiClient.getRequests({ limit: 100 }), // Consistent sample size
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
    queries: null, // Not needed for dashboard overview
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-muted-foreground">
            Real-time monitoring and performance metrics for your FastAPI
            application
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
              <SelectItem value="1">Last Hour</SelectItem>
              <SelectItem value="24">Last 24 Hours</SelectItem>
              <SelectItem value="168">Last 7 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefreshAll}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Requests
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.total_requests || 0}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>{metrics.requestsPerMinute.toFixed(1) || 0} req/min</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Response Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(metrics.avgResponseTime)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {metrics.avgResponseTime < 100 ? (
                <>
                  <TrendingDown className="mr-1 h-3 w-3 text-green-500" />
                  <span className="text-green-500">Fast</span>
                </>
              ) : (
                <>
                  <TrendingUp className="mr-1 h-3 w-3 text-yellow-500" />
                  <span className="text-yellow-500">Could be faster</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Database Queries
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.total_queries || 0}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {stats?.slow_queries ? (
                <>
                  <span className="text-yellow-500">{stats.slow_queries}</span>
                  <span className="ml-1">slow queries detected</span>
                </>
              ) : (
                <span className="text-green-500">All queries fast</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exceptions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.total_exceptions || 0}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {stats?.total_exceptions === 0 ? (
                <span className="text-green-500">All systems operational</span>
              ) : (
                <>
                  <ArrowUpRight className="mr-1 h-3 w-3 text-red-500" />
                  <span className="text-red-500">Needs attention</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Success Rate</CardTitle>
              <CardDescription>
                Based on last {metrics.totalRequests} requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {metrics.successRate.toFixed(1)}%
                  </span>
                  <Badge
                    variant={
                      metrics.successRate >= 95
                        ? "default"
                        : metrics.successRate >= 90
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {metrics.successRate >= 95
                      ? "Excellent"
                      : metrics.successRate >= 90
                      ? "Good"
                      : "Poor"}
                  </Badge>
                </div>
                <Progress value={metrics.successRate} className="h-2" />
                {metrics.failedRequests > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {metrics.failedRequests} errors out of{" "}
                    {metrics.totalRequests} requests
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Query Performance</CardTitle>
              <CardDescription>Average database query time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {stats.avg_query_time
                      ? `${stats.avg_query_time.toFixed(0)}ms`
                      : "0ms"}
                  </span>
                  <Badge
                    variant={
                      !stats.avg_query_time || stats.avg_query_time < 50
                        ? "default"
                        : stats.avg_query_time < 100
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {!stats.avg_query_time || stats.avg_query_time < 50
                      ? "Fast"
                      : stats.avg_query_time < 100
                      ? "Normal"
                      : "Slow"}
                  </Badge>
                </div>
                <Progress
                  value={
                    stats.avg_query_time
                      ? Math.min((stats.avg_query_time / 200) * 100, 100)
                      : 0
                  }
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Requests */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Requests</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/requests">
                  View all
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
            <CardDescription>Latest HTTP requests to your API</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentRequests?.slice(0, 5).map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                  onClick={() => openDetail("request", request.request_id)}
                >
                  <div className="flex items-center space-x-4">
                    <Badge
                      variant={
                        getStatusBadgeVariant(request.status_code) as any
                      }
                    >
                      {request.status_code || "pending"}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">
                        {request.method} {request.path}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(request.created_at), "HH:mm:ss")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatDuration(request.duration_ms)}
                    </p>
                    {request.query_count > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {request.query_count} queries
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {(!recentRequests || recentRequests.length === 0) && (
                <p className="text-center text-muted-foreground py-4">
                  No requests yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Slow Queries */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Slow Queries</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/database">
                  View all
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
            <CardDescription>
              Database queries taking longer than expected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {slowQueries?.slice(0, 5).map((query) => (
                <div
                  key={query.id}
                  className="space-y-2 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                  onClick={() => openDetail("request", query.request_id)}
                >
                  <div className="flex items-center justify-between">
                    <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[300px]">
                      {query.sql.substring(0, 50)}...
                    </code>
                    <Badge variant="destructive">
                      {formatDuration(query.duration_ms)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(query.created_at), "HH:mm:ss")}
                  </p>
                </div>
              ))}
              {(!slowQueries || slowQueries.length === 0) && (
                <p className="text-center text-muted-foreground py-4">
                  No slow queries detected
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Exceptions */}
      {recentExceptions && recentExceptions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Exceptions</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/exceptions">
                  View all
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
            <CardDescription>
              Errors and exceptions caught in your application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentExceptions.slice(0, 3).map((exception) => (
                <div
                  key={exception.id}
                  className="space-y-2 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => openDetail("request", exception.request_id)}
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="destructive">
                      {exception.exception_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(exception.created_at), "HH:mm:ss")}
                    </span>
                  </div>
                  {exception.exception_value && (
                    <p className="text-sm">{exception.exception_value}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Click to view full traceback and request details
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
