import { useMemo } from "react";
import { WaterfallSpan } from "@/api/client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WaterfallChartProps {
  spans: WaterfallSpan[];
  totalDurationMs: number;
  className?: string;
}

function formatDuration(ms: number | null): string {
  if (!ms) return "0ms";
  if (ms < 1) return `${ms.toFixed(2)}ms`;
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function getStatusColor(status: string, tags?: Record<string, any>): string {
  // Identify database operations for distinct coloring
  const isDatabase = tags?.component === "database";

  switch (status.toLowerCase()) {
    case "ok":
    case "success":
      return isDatabase ? "bg-blue-600" : "bg-green-500";
    case "slow":
      return "bg-yellow-500";
    case "error":
    case "failure":
      return "bg-red-500";
    case "cancelled":
      return "bg-gray-400";
    case "timeout":
      return "bg-orange-500";
    default:
      return isDatabase ? "bg-blue-400" : "bg-blue-500";
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
    case "cancelled":
    case "timeout":
      return "secondary";
    default:
      return "outline";
  }
}

export function WaterfallChart({
  spans,
  totalDurationMs,
  className,
}: WaterfallChartProps) {
  const chartData = useMemo(() => {
    if (!spans || spans.length === 0) return [];

    // Sort by depth and start time
    const sortedSpans = [...spans].sort((a, b) => {
      if (a.depth !== b.depth) return a.depth - b.depth;
      return a.offset_ms - b.offset_ms;
    });

    return sortedSpans.map((span) => ({
      ...span,
      // Compute position and width in the chart (percent)
      leftPercent: (span.offset_ms / totalDurationMs) * 100,
      widthPercent: ((span.duration_ms || 0) / totalDurationMs) * 100,
    }));
  }, [spans, totalDurationMs]);

  if (!spans || spans.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No span data available for this trace
          </div>
        </CardContent>
      </Card>
    );
  }

  const rowHeight = 40;
  const chartHeight = spans.length * rowHeight + 60; // Extra space for the time axis

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardContent className="p-0">
          <div className="relative overflow-x-auto">
            {/* Time axis */}
            <div className="sticky top-0 bg-background border-b p-4">
              <div className="relative h-6">
                <div className="absolute left-0 text-xs text-muted-foreground">
                  0ms
                </div>
                <div className="absolute left-1/4 text-xs text-muted-foreground">
                  {formatDuration(totalDurationMs * 0.25)}
                </div>
                <div className="absolute left-1/2 text-xs text-muted-foreground">
                  {formatDuration(totalDurationMs * 0.5)}
                </div>
                <div className="absolute left-3/4 text-xs text-muted-foreground">
                  {formatDuration(totalDurationMs * 0.75)}
                </div>
                <div className="absolute right-0 text-xs text-muted-foreground">
                  {formatDuration(totalDurationMs)}
                </div>
              </div>
            </div>

            {/* Waterfall body */}
            <div className="p-4" style={{ minHeight: chartHeight }}>
              <div className="relative">
                {/* Grid lines */}
                <div className="absolute inset-0 pointer-events-none">
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                    <div
                      key={ratio}
                      className="absolute top-0 bottom-0 border-l border-gray-200 dark:border-gray-700"
                      style={{ left: `${ratio * 100}%` }}
                    />
                  ))}
                </div>

                {/* Spans */}
                {chartData.map((span) => (
                  <div
                    key={span.span_id}
                    className="relative mb-1"
                    style={{
                      height: rowHeight - 4,
                      paddingLeft: `${span.depth * 20}px`,
                    }}
                  >
                    <div className="flex items-center h-full">
                      {/* Span name and service */}
                      <div className="flex-shrink-0 w-1/3 pr-4">
                        <div className="text-sm font-medium truncate">
                          {span.operation_name}
                        </div>
                        {span.service_name && (
                          <div className="text-xs text-muted-foreground truncate">
                            {span.service_name}
                          </div>
                        )}
                      </div>

                      {/* Time bar */}
                      <div className="flex-1 relative">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "h-6 rounded cursor-pointer transition-all hover:opacity-80",
                                getStatusColor(
                                  span.status,
                                  span.tags || undefined,
                                ),
                              )}
                              style={{
                                marginLeft: `${span.leftPercent}%`,
                                width: `${Math.max(span.widthPercent, 0.5)}%`, // Minimum width to keep visible
                              }}
                            />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="font-semibold">
                                  {span.operation_name}
                                </div>
                                {span.tags?.component === "database" && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-blue-50"
                                  >
                                    DB
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm">
                                <div>
                                  Duration: {formatDuration(span.duration_ms)}
                                  {span.tags?.["db.slow_query"] && (
                                    <span className="text-yellow-600 ml-1">
                                      (slow query)
                                    </span>
                                  )}
                                </div>
                                <div>
                                  Start: {formatDuration(span.offset_ms)}
                                </div>
                                <div>
                                  Service: {span.service_name || "Unknown"}
                                </div>
                                {span.tags?.["db.operation_type"] && (
                                  <div>
                                    SQL Type:{" "}
                                    <span className="font-mono">
                                      {span.tags["db.operation_type"]}
                                    </span>
                                  </div>
                                )}
                                {span.tags?.["db.rows_affected"] !== null &&
                                  span.tags?.["db.rows_affected"] !==
                                    undefined && (
                                    <div>
                                      Rows: {span.tags["db.rows_affected"]}
                                    </div>
                                  )}
                                <div className="flex items-center gap-1 mt-1">
                                  <span>Status:</span>
                                  <Badge
                                    variant={getStatusVariant(span.status)}
                                    className="text-xs"
                                  >
                                    {span.status}
                                  </Badge>
                                </div>
                              </div>
                              {span.tags &&
                                Object.keys(span.tags).length > 0 && (
                                  <div className="text-sm">
                                    <div className="font-medium">Tags:</div>
                                    <div className="space-y-1">
                                      {Object.entries(span.tags).map(
                                        ([key, value]) => (
                                          <div key={key} className="text-xs">
                                            <span className="font-medium">
                                              {key}:
                                            </span>{" "}
                                            {String(value)}
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      {/* Duration */}
                      <div className="flex-shrink-0 w-20 text-right text-sm">
                        {formatDuration(span.duration_ms)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
