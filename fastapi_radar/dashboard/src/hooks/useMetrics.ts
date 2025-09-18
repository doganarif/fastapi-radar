import { useMemo } from "react";
import {
  RequestSummary,
  QueryDetail,
  ExceptionDetail,
  DashboardStats,
} from "@/api/client";

export interface MetricsConfig {
  requests?: RequestSummary[] | null;
  queries?: QueryDetail[] | null;
  exceptions?: ExceptionDetail[] | null;
  stats?: DashboardStats | null;
}

export function useMetrics({
  requests,
  queries,
  exceptions,
  stats,
}: MetricsConfig) {
  return useMemo(() => {
    // Request metrics
    const totalRequests = requests?.length || 0;
    const successfulRequests =
      requests?.filter(
        (r) => r.status_code && r.status_code >= 200 && r.status_code < 300
      ).length || 0;
    const failedRequests =
      requests?.filter((r) => r.status_code && r.status_code >= 400).length ||
      0;
    const slowRequests =
      requests?.filter((r) => r.duration_ms && r.duration_ms > 500).length || 0;

    // Calculate rates based on sample data
    const errorRate =
      totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;
    const successRate = 100 - errorRate;

    // Response time metrics
    const responseTimes =
      requests?.map((r) => r.duration_ms || 0).filter((t) => t > 0) || [];

    const responseTimePercentiles = calculatePercentiles(responseTimes);

    // Average response time from sample
    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) /
          responseTimes.length
        : 0;

    // Query metrics
    const totalQueries = queries?.length || 0;
    const slowQueries =
      queries?.filter((q) => q.duration_ms && q.duration_ms > 100).length || 0;

    const queryTimes =
      queries?.map((q) => q.duration_ms || 0).filter((t) => t > 0) || [];

    const avgQueryTime =
      queryTimes.length > 0
        ? queryTimes.reduce((sum, time) => sum + time, 0) / queryTimes.length
        : 0;

    // Exception metrics
    const totalExceptions = exceptions?.length || 0;

    // Endpoint performance
    const endpointMetrics = requests ? calculateEndpointMetrics(requests) : [];

    // Throughput (use stats for historical data)
    const requestsPerMinute = stats?.requests_per_minute || 0;
    const requestsPerSecond = requestsPerMinute / 60;

    return {
      // Request metrics
      totalRequests,
      successfulRequests,
      failedRequests,
      slowRequests,
      errorRate,
      successRate,

      // Response time metrics
      avgResponseTime,
      responseTimePercentiles,

      // Query metrics
      totalQueries,
      slowQueries,
      avgQueryTime,

      // Exception metrics
      totalExceptions,

      // Endpoint metrics
      endpointMetrics,

      // Throughput metrics
      requestsPerMinute,
      requestsPerSecond,

      // Raw data for further processing
      responseTimes,
      queryTimes,
    };
  }, [requests, queries, exceptions, stats]);
}

function calculatePercentiles(data: number[]) {
  if (!data || data.length === 0) {
    return { p50: 0, p95: 0, p99: 0 };
  }

  const sorted = [...data].sort((a, b) => a - b);
  const p50Index = Math.floor(sorted.length * 0.5);
  const p95Index = Math.floor(sorted.length * 0.95);
  const p99Index = Math.floor(sorted.length * 0.99);

  return {
    p50: sorted[p50Index] || 0,
    p95: sorted[p95Index] || 0,
    p99: sorted[p99Index] || 0,
  };
}

function calculateEndpointMetrics(requests: RequestSummary[]) {
  const endpoints = requests.reduce(
    (acc, req) => {
      const path = req.path;
      if (!acc[path]) {
        acc[path] = {
          count: 0,
          totalTime: 0,
          errors: 0,
          successCount: 0,
          methods: new Set<string>(),
        };
      }
      acc[path].count++;
      acc[path].totalTime += req.duration_ms || 0;
      acc[path].methods.add(req.method);

      if (req.status_code && req.status_code >= 400) {
        acc[path].errors++;
      } else if (
        req.status_code &&
        req.status_code >= 200 &&
        req.status_code < 300
      ) {
        acc[path].successCount++;
      }

      return acc;
    },
    {} as Record<
      string,
      {
        count: number;
        totalTime: number;
        errors: number;
        successCount: number;
        methods: Set<string>;
      }
    >
  );

  return Object.entries(endpoints)
    .map(([path, data]) => ({
      name: path,
      avgResponseTime: Math.round(data.totalTime / data.count),
      calls: data.count,
      errors: data.errors,
      successRate:
        data.count > 0
          ? ((data.successCount / data.count) * 100).toFixed(1)
          : "0.0",
      methods: Array.from(data.methods).join(", "),
    }))
    .sort((a, b) => b.calls - a.calls)
    .slice(0, 20); // Top 20 endpoints
}

// Format helpers
export function formatDuration(ms: number | null | undefined): string {
  if (!ms) return "0ms";
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function formatNumber(num: number | null | undefined): string {
  if (!num) return "0";
  return num.toLocaleString();
}

export function getStatusBadgeVariant(status: number | null) {
  if (!status) return "outline";
  if (status >= 200 && status < 300) return "success";
  if (status >= 300 && status < 400) return "secondary";
  if (status >= 400 && status < 500) return "warning";
  if (status >= 500) return "destructive";
  return "outline";
}

export function getMethodBadgeVariant(method: string) {
  switch (method.toUpperCase()) {
    case "GET":
      return "secondary";
    case "POST":
      return "default";
    case "PUT":
    case "PATCH":
      return "default";
    case "DELETE":
      return "destructive";
    default:
      return "outline";
  }
}
