import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { format } from "date-fns";
import {
  AlertTriangle,
  ChevronDown,
  Copy,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { WaterfallChart } from "./WaterfallChart";

interface DetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "request" | "query" | "exception" | "trace" | null;
  id: string | null;
}

export function DetailDrawer({
  open,
  onOpenChange,
  type,
  id,
}: DetailDrawerProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data: requestDetail } = useQuery({
    queryKey: ["request-detail", id],
    queryFn: () =>
      id && type === "request" ? apiClient.getRequestDetail(id) : null,
    enabled: !!id && type === "request",
  });

  const { data: traceDetail } = useQuery({
    queryKey: ["trace-detail", id],
    queryFn: () =>
      id && type === "trace" ? apiClient.getTraceDetail(id) : null,
    enabled: !!id && type === "trace",
  });

  const { data: waterfallData } = useQuery({
    queryKey: ["trace-waterfall", id],
    queryFn: () =>
      id && type === "trace" ? apiClient.getTraceWaterfall(id) : null,
    enabled: !!id && type === "trace",
  });

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStatusColor = (statusCode: number | null) => {
    if (!statusCode) return "secondary";
    if (statusCode >= 200 && statusCode < 300) return "default";
    if (statusCode >= 300 && statusCode < 400) return "secondary";
    if (statusCode >= 400 && statusCode < 500) return "warning";
    return "destructive";
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return "0ms";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatJson = (data: any) => {
    if (!data) return null;
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const renderRequestDetail = () => {
    if (!requestDetail) return null;

    return (
      <div className="space-y-4">
        {/* Overview Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={getStatusColor(requestDetail.status_code) as any}>
                {requestDetail.status_code || "pending"}
              </Badge>
              <span className="font-mono text-sm">{requestDetail.method}</span>
              <span className="text-sm text-muted-foreground">
                {requestDetail.path}
              </span>
            </div>
            <Badge variant="outline">
              {formatDuration(requestDetail.duration_ms)}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Timestamp</p>
              <p className="font-medium">
                {format(new Date(requestDetail.created_at), "PPpp")}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Client IP</p>
              <p className="font-medium">
                {requestDetail.client_ip || "Unknown"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Request ID</p>
              <p className="font-mono text-xs">{requestDetail.request_id}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">URL</p>
              <p className="font-mono text-xs break-all">{requestDetail.url}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Tabs for detailed information */}
        <Tabs defaultValue="headers" className="w-full">
          <TabsList className="flex flex-wrap w-full gap-1">
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="body">Body</TabsTrigger>
            <TabsTrigger value="response">Response</TabsTrigger>
            <TabsTrigger value="queries">
              Queries{" "}
              {requestDetail.queries.length > 0 &&
                `(${requestDetail.queries.length})`}
            </TabsTrigger>
            <TabsTrigger value="errors">
              Errors{" "}
              {requestDetail.exceptions.length > 0 &&
                `(${requestDetail.exceptions.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="headers" className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Request Headers</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    copyToClipboard(
                      formatJson(requestDetail.headers) || "",
                      "req-headers",
                    )
                  }
                >
                  <Copy className="h-3 w-3 mr-1" />
                  {copiedField === "req-headers" ? "Copied!" : "Copy"}
                </Button>
              </div>
              <ScrollArea className="h-[200px] rounded-md border p-3">
                <pre className="text-xs whitespace-pre-wrap break-all">
                  {formatJson(requestDetail.headers) || "No headers"}
                </pre>
              </ScrollArea>
            </div>

            {requestDetail.response_headers && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Response Headers</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      copyToClipboard(
                        formatJson(requestDetail.response_headers) || "",
                        "res-headers",
                      )
                    }
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {copiedField === "res-headers" ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <ScrollArea className="h-[200px] rounded-md border p-3">
                  <pre className="text-xs whitespace-pre-wrap break-all">
                    {formatJson(requestDetail.response_headers) ||
                      "No response headers"}
                  </pre>
                </ScrollArea>
              </div>
            )}
          </TabsContent>

          <TabsContent value="body" className="space-y-4 mt-4">
            {requestDetail.query_params &&
              Object.keys(requestDetail.query_params).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Query Parameters</h4>
                  <ScrollArea className="h-[100px] rounded-md border p-3">
                    <pre className="text-xs whitespace-pre-wrap break-all">
                      {formatJson(requestDetail.query_params)}
                    </pre>
                  </ScrollArea>
                </div>
              )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Request Body</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    copyToClipboard(requestDetail.body || "", "body")
                  }
                >
                  <Copy className="h-3 w-3 mr-1" />
                  {copiedField === "body" ? "Copied!" : "Copy"}
                </Button>
              </div>
              <ScrollArea className="h-[300px] rounded-md border p-3">
                <pre className="text-xs whitespace-pre-wrap break-all">
                  {requestDetail.body || "No request body"}
                </pre>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="response" className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Response Body</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    copyToClipboard(
                      requestDetail.response_body || "",
                      "response",
                    )
                  }
                >
                  <Copy className="h-3 w-3 mr-1" />
                  {copiedField === "response" ? "Copied!" : "Copy"}
                </Button>
              </div>
              <ScrollArea className="h-[400px] rounded-md border p-3">
                <pre className="text-xs whitespace-pre-wrap break-all">
                  {requestDetail.response_body || "No response body"}
                </pre>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="queries" className="space-y-4 mt-4">
            {requestDetail.queries.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No queries executed
              </p>
            ) : (
              <div className="space-y-3">
                {requestDetail.queries.map((query, index) => (
                  <Card key={query.id}>
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">
                          Query #{index + 1}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {formatDuration(query.duration_ms)}
                          </Badge>
                          {query.rows_affected !== null && (
                            <Badge variant="secondary">
                              {query.rows_affected} rows
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <ScrollArea className="h-[100px] rounded-md border p-2">
                          <pre className="text-xs whitespace-pre-wrap break-all">
                            {query.sql}
                          </pre>
                        </ScrollArea>
                        {query.parameters && query.parameters.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              Parameters:
                            </p>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {JSON.stringify(query.parameters)}
                            </code>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="errors" className="space-y-4 mt-4">
            {requestDetail.exceptions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No exceptions occurred
              </p>
            ) : (
              <div className="space-y-3">
                {requestDetail.exceptions.map((exception) => (
                  <Card key={exception.id} className="border-destructive">
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          {exception.exception_type}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {exception.exception_value && (
                          <p className="text-sm">{exception.exception_value}</p>
                        )}
                        <ScrollArea className="h-[200px] rounded-md border border-destructive/20 p-2">
                          <pre className="text-xs text-destructive whitespace-pre-wrap break-all">
                            {exception.traceback}
                          </pre>
                        </ScrollArea>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  const renderQueryDetail = () => {
    if (!id || type !== "query") return null;

    // For standalone query detail
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Query details view</p>
      </div>
    );
  };

  const renderExceptionDetail = () => {
    if (!id || type !== "exception") return null;

    // For standalone exception detail
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Exception details view</p>
      </div>
    );
  };

  const renderTraceDetail = () => {
    if (!traceDetail || !waterfallData) return null;

    const formatDuration = (ms: number | null) => {
      if (!ms) return "0ms";
      if (ms < 1000) return `${ms.toFixed(0)}ms`;
      if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
      return `${(ms / 60000).toFixed(2)}m`;
    };

    const getStatusIcon = (status: string) => {
      switch (status.toLowerCase()) {
        case "ok":
        case "success":
          return <CheckCircle className="h-5 w-5 text-green-500" />;
        case "error":
        case "failure":
          return <XCircle className="h-5 w-5 text-red-500" />;
        default:
          return <Activity className="h-5 w-5 text-blue-500" />;
      }
    };

    const getStatusVariant = (
      status: string,
    ): "default" | "secondary" | "destructive" | "outline" => {
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
    };

    return (
      <div className="space-y-6">
        {/* Trace Overview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(traceDetail.status)}
              <div>
                <h2 className="text-xl font-semibold">
                  {traceDetail.operation_name || "Unknown Operation"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {traceDetail.service_name || "Unknown Service"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusVariant(traceDetail.status)}>
                {traceDetail.status}
              </Badge>
              <Badge variant="outline">
                {formatDuration(traceDetail.duration_ms)}
              </Badge>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Trace ID</p>
              <p className="font-mono text-sm">{traceDetail.trace_id}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Span Count</p>
              <p className="font-medium">{traceDetail.span_count}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Start Time</p>
              <p className="text-sm">
                {format(new Date(traceDetail.start_time), "PPpp")}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-medium">
                {formatDuration(traceDetail.duration_ms)}
              </p>
            </div>
          </div>

          {/* Tags */}
          {traceDetail.tags && Object.keys(traceDetail.tags).length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Tags</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(traceDetail.tags).map(([key, value]) => (
                  <Badge key={key} variant="outline" className="text-xs">
                    {key}: {String(value)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Waterfall Chart */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">瀑布流图</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                总时长:{" "}
                {formatDuration(waterfallData.trace_info.total_duration_ms)}
              </span>
            </div>
          </div>

          <WaterfallChart
            spans={waterfallData.spans}
            totalDurationMs={waterfallData.trace_info.total_duration_ms || 0}
          />
        </div>

        {/* Spans List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Span详情</h3>
          <div className="space-y-2">
            {waterfallData.spans.map((span) => (
              <Card key={span.span_id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(span.status)}
                        <h4 className="font-medium">{span.operation_name}</h4>
                        <Badge
                          variant={getStatusVariant(span.status)}
                          className="text-xs"
                        >
                          {span.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Service</p>
                          <p>{span.service_name || "Unknown"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Duration</p>
                          <p>{formatDuration(span.duration_ms)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Start Offset</p>
                          <p>{formatDuration(span.offset_ms)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Depth</p>
                          <p>{span.depth}</p>
                        </div>
                      </div>

                      {span.tags && Object.keys(span.tags).length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-muted-foreground mb-1">
                            Tags:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(span.tags).map(([key, value]) => (
                              <Badge
                                key={key}
                                variant="outline"
                                className="text-xs"
                              >
                                {key}: {String(value)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle className="flex items-center justify-between">
              <span>
                {type === "request" && "Request Details"}
                {type === "query" && "Query Details"}
                {type === "exception" && "Exception Details"}
                {type === "trace" && "链路跟踪详情"}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="flex-1 px-6 py-4">
            {type === "request" && renderRequestDetail()}
            {type === "query" && renderQueryDetail()}
            {type === "exception" && renderExceptionDetail()}
            {type === "trace" && renderTraceDetail()}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
