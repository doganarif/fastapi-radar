import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient, TraceSummary } from "@/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDetailDrawer } from "@/context/DetailDrawerContext";
import { formatDistanceToNow } from "date-fns";
import {
  Search,
  RefreshCw,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface TracesListProps {
  className?: string;
}

function formatDuration(ms: number | null): string {
  if (!ms) return "N/A";
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case "ok":
    case "success":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "error":
    case "failure":
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    default:
      return <Activity className="h-4 w-4 text-blue-500" />;
  }
}

function getStatusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status.toLowerCase()) {
    case "ok":
    case "success":
      return "default";
    case "error":
    case "failure":
      return "destructive";
    default:
      return "secondary";
  }
}

export function TracesList({ className }: TracesListProps) {
  const { openDetail } = useDetailDrawer();

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    service: "",
    hours: 24,
    minDuration: 0,
  });

  const [page, setPage] = useState(0);
  const pageSize = 50;

  const {
    data: traces = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["traces", filters, page],
    queryFn: () =>
      apiClient.getTraces({
        limit: pageSize,
        offset: page * pageSize,
        status: filters.status || undefined,
        service_name: filters.service || undefined,
        min_duration_ms: filters.minDuration || undefined,
        hours: filters.hours,
      }),
    refetchInterval: 30000,
  });

  const handleTraceClick = (trace: TraceSummary) => {
    openDetail("trace", trace.trace_id);
  };

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Failed to load traces
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              There was an error loading the trace data.
            </p>
            <Button onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* 过滤器 */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by operation name..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="pl-9"
                />
              </div>
            </div>

            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters({ ...filters, status: value })
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="ok">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.hours.toString()}
              onValueChange={(value) =>
                setFilters({ ...filters, hours: parseInt(value) })
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last hour</SelectItem>
                <SelectItem value="6">Last 6 hours</SelectItem>
                <SelectItem value="24">Last 24 hours</SelectItem>
                <SelectItem value="168">Last week</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={() => refetch()} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 追踪列表 */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-muted rounded" />
                  </div>
                ))}
              </div>
            </div>
          ) : traces.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No traces found matching your criteria.</p>
            </div>
          ) : (
            <div className="divide-y">
              {traces.map((trace) => (
                <div
                  key={trace.trace_id}
                  className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleTraceClick(trace)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(trace.status)}
                        <h3 className="font-medium truncate">
                          {trace.operation_name || "Unknown Operation"}
                        </h3>
                        <Badge
                          variant={getStatusVariant(trace.status)}
                          className="text-xs"
                        >
                          {trace.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Service: {trace.service_name || "Unknown"}</span>
                        <span>Spans: {trace.span_count}</span>
                        <span>
                          Duration: {formatDuration(trace.duration_ms)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(new Date(trace.start_time), {
                            addSuffix: true,
                          })}
                        </span>
                        <span className="text-muted-foreground/60">•</span>
                        <span>{trace.trace_id.slice(0, 8)}...</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 分页 */}
          {traces.length === pageSize && (
            <div className="p-4 border-t flex justify-center">
              <Button variant="outline" onClick={() => setPage(page + 1)}>
                Load more
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
