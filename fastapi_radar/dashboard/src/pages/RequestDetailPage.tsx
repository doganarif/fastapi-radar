import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Copy, Play } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { JsonViewer } from "@/components/JsonViewer";

export function RequestDetailPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const { data: request, isLoading, isError, error } = useQuery({
    queryKey: ["request-detail", requestId],
    queryFn: () => (requestId ? apiClient.getRequestDetail(requestId) : null),
    enabled: !!requestId,
  });

  const replayMutation = useMutation({
    mutationFn: (id: string) => apiClient.replayRequest(id),
    onSuccess: (data) => {
      navigate(`/requests/${data.new_request_id}`);
    },
  });

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const exportAsCurl = async () => {
    if (!requestId) return;
    setExportError(null);
    try {
      const response = await apiClient.getRequestAsCurl(requestId);
      copyToClipboard(response.curl, "curl");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to export as cURL";
      setExportError(message);
      setTimeout(() => setExportError(null), 3000);
    }
  };

  const formatJson = (data: unknown) => {
    if (!data) return null;
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const getStatusColor = (
    statusCode: number | null
  ): "default" | "secondary" | "destructive" => {
    if (!statusCode) return "secondary";
    if (statusCode >= 200 && statusCode < 300) return "default";
    if (statusCode >= 300 && statusCode < 400) return "secondary";
    return "destructive";
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return "0ms";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Card className="border-destructive max-w-md">
          <CardContent className="py-8 text-center">
            <p className="text-destructive font-medium">Failed to load request</p>
            <p className="text-sm text-muted-foreground mt-2">
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </CardContent>
        </Card>
        <Button onClick={() => navigate("/requests")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Requests
        </Button>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="text-muted-foreground">Request not found</div>
        <Button onClick={() => navigate("/requests")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Requests
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/requests")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportAsCurl}>
            <Copy className="h-4 w-4 mr-2" />
            {copiedField === "curl" ? "Copied!" : "Export as cURL"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => requestId && replayMutation.mutate(requestId)}
            disabled={replayMutation.isPending}
          >
            <Play className="h-4 w-4 mr-2" />
            {replayMutation.isPending ? "Replaying..." : "Replay"}
          </Button>
        </div>
      </div>

      {/* Export Error */}
      {exportError && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-destructive text-sm">{exportError}</p>
          </CardContent>
        </Card>
      )}

      {/* Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge variant={getStatusColor(request.status_code)} className="text-lg px-3 py-1">
                  {request.status_code || "Pending"}
                </Badge>
                <span className="text-2xl font-bold font-mono">{request.method}</span>
              </div>
              <p className="text-lg text-muted-foreground break-all">{request.path}</p>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {formatDuration(request.duration_ms)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Timestamp</p>
              <p className="font-medium">{format(new Date(request.created_at), "PPpp")}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Client IP</p>
              <p className="font-medium">{request.client_ip || "Unknown"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Queries</p>
              <p className="font-medium">{request.queries.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Exceptions</p>
              <p className="font-medium">{request.exceptions.length}</p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Request ID</p>
            <p className="font-mono text-sm break-all">{request.request_id}</p>
          </div>

          <div className="space-y-2 mt-4">
            <p className="text-sm text-muted-foreground">Full URL</p>
            <p className="font-mono text-sm break-all">{request.url}</p>
          </div>
        </CardContent>
      </Card>

      {/* Replay Result */}
      {replayMutation.isSuccess && (
        <Card className="border-green-500">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Replay Successful</span>
              <Badge variant={replayMutation.data.status_code < 400 ? "default" : "destructive"}>
                {replayMutation.data.status_code}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-mono">{replayMutation.data.elapsed_ms.toFixed(0)}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Original:</span>
              <span className="font-mono">{replayMutation.data.original_duration_ms?.toFixed(0)}ms</span>
            </div>
          </CardContent>
        </Card>
      )}

      {replayMutation.isError && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-destructive">Replay failed: {replayMutation.error?.message}</p>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Card>
        <Tabs defaultValue="overview" className="w-full">
          <CardHeader>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="headers">Headers</TabsTrigger>
              <TabsTrigger value="body">Request</TabsTrigger>
              <TabsTrigger value="response">Response</TabsTrigger>
              <TabsTrigger value="queries">
                Queries {request.queries.length > 0 && `(${request.queries.length})`}
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent>
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Request Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Method:</span>
                      <span className="font-mono">{request.method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="font-mono">{request.status_code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-mono">{formatDuration(request.duration_ms)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Queries:</span>
                      <span className="font-mono">{request.queries.length}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{format(new Date(request.created_at), "HH:mm:ss")}</span>
                    </div>
                    {request.queries.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">DB Time:</span>
                        <span className="font-mono">
                          {request.queries.reduce((sum, q) => sum + (q.duration_ms || 0), 0).toFixed(0)}ms
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="headers" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Request Headers</h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(formatJson(request.headers) || "", "req-headers")}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      {copiedField === "req-headers" ? "Copied" : "Copy"}
                    </Button>
                  </div>
                  <ScrollArea className="h-[300px] rounded-md border p-4">
                    <JsonViewer data={formatJson(request.headers)} fallback="No request headers" />
                  </ScrollArea>
                </div>

                {request.response_headers && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium">Response Headers</h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(formatJson(request.response_headers) || "", "res-headers")}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        {copiedField === "res-headers" ? "Copied" : "Copy"}
                      </Button>
                    </div>
                    <ScrollArea className="h-[300px] rounded-md border p-4">
                      <JsonViewer data={formatJson(request.response_headers)} fallback="No response headers" />
                    </ScrollArea>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="body" className="space-y-4">
              {request.query_params && Object.keys(request.query_params).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Query Parameters</h3>
                  <ScrollArea className="h-[150px] rounded-md border p-4">
                    <JsonViewer data={formatJson(request.query_params)} />
                  </ScrollArea>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Request Body</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(request.body || "", "body")}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {copiedField === "body" ? "Copied" : "Copy"}
                  </Button>
                </div>
                <ScrollArea className="h-[400px] rounded-md border p-4">
                  <JsonViewer data={request.body} fallback="No request body" />
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="response" className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Response Body</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(request.response_body || "", "response")}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {copiedField === "response" ? "Copied" : "Copy"}
                  </Button>
                </div>
                <ScrollArea className="h-[500px] rounded-md border p-4">
                  <JsonViewer data={request.response_body} fallback="No response body" />
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="queries" className="space-y-4">
              {request.queries.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No database queries captured</p>
              ) : (
                <div className="space-y-3">
                  {request.queries.map((query, index) => (
                    <Card key={query.id}>
                      <CardHeader className="py-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">Query #{index + 1}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{query.duration_ms?.toFixed(0)}ms</Badge>
                            {query.rows_affected !== null && (
                              <Badge variant="secondary">{query.rows_affected} rows</Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[120px] rounded-md border p-3">
                          <pre className="text-xs whitespace-pre-wrap break-all">{query.sql}</pre>
                        </ScrollArea>
                        {query.parameters && query.parameters.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1">Parameters</p>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {JSON.stringify(query.parameters)}
                            </code>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Exceptions */}
      {request.exceptions.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle>Exceptions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {request.exceptions.map((exception) => (
              <Card key={exception.id} className="border-destructive/50">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm text-destructive">{exception.exception_type}</CardTitle>
                </CardHeader>
                <CardContent>
                  {exception.exception_value && (
                    <p className="text-sm mb-2">{exception.exception_value}</p>
                  )}
                  <ScrollArea className="h-[200px] rounded-md border border-destructive/20 p-3">
                    <pre className="text-xs text-destructive whitespace-pre-wrap break-all">
                      {exception.traceback}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
