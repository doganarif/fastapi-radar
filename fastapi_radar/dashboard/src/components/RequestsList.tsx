import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient, RequestSummary, RequestDetail } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Clock, AlertCircle, Database } from "lucide-react";
import { format } from "@/lib/date";

export function RequestsList() {
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  const { data: requests, isLoading } = useQuery({
    queryKey: ["requests"],
    queryFn: () => apiClient.getRequests({ limit: 100 }),
    refetchInterval: 2000,
  });

  const { data: requestDetail } = useQuery({
    queryKey: ["request", selectedRequest],
    queryFn: () =>
      selectedRequest ? apiClient.getRequestDetail(selectedRequest) : null,
    enabled: !!selectedRequest,
  });

  const getStatusBadgeVariant = (status: number | null) => {
    if (!status) return "outline";
    if (status >= 200 && status < 300) return "success";
    if (status >= 300 && status < 400) return "warning";
    if (status >= 400 && status < 500) return "warning";
    if (status >= 500) return "destructive";
    return "outline";
  };

  const getMethodBadgeVariant = (method: string) => {
    switch (method) {
      case "GET":
        return "secondary";
      case "POST":
        return "default";
      case "PUT":
        return "default";
      case "DELETE":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading requests...</div>;
  }

  return (
    <div className="space-y-4">
      {!selectedRequest ? (
        <div className="space-y-2">
          {requests?.map((request: RequestSummary) => (
            <div
              key={request.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => setSelectedRequest(request.request_id)}
            >
              <div className="flex items-center space-x-4">
                <Badge variant={getMethodBadgeVariant(request.method)}>
                  {request.method}
                </Badge>
                <div className="flex flex-col">
                  <span className="font-mono text-sm">{request.path}</span>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{format(request.created_at)}</span>
                    {request.query_count > 0 && (
                      <>
                        <Database className="h-3 w-3 ml-2" />
                        <span>{request.query_count} queries</span>
                      </>
                    )}
                    {request.has_exception && (
                      <>
                        <AlertCircle className="h-3 w-3 ml-2 text-destructive" />
                        <span className="text-destructive">Exception</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {request.status_code && (
                  <Badge variant={getStatusBadgeVariant(request.status_code)}>
                    {request.status_code}
                  </Badge>
                )}
                {request.duration_ms && (
                  <span className="text-sm text-muted-foreground">
                    {request.duration_ms.toFixed(0)}ms
                  </span>
                )}
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          ))}
          {requests?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No requests captured yet
            </div>
          )}
        </div>
      ) : (
        <RequestDetailView
          request={requestDetail!}
          onBack={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
}

interface RequestDetailViewProps {
  request: RequestDetail;
  onBack: () => void;
}

function RequestDetailView({ request, onBack }: RequestDetailViewProps) {
  if (!request) return null;

  return (
    <div className="space-y-4">
      <Button onClick={onBack} variant="ghost" size="sm">
        ← Back to list
      </Button>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Request</h3>
            <div className="space-y-2">
              <div>
                <span className="text-xs text-muted-foreground">
                  Method & URL
                </span>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge>{request.method}</Badge>
                  <code className="text-xs">{request.url}</code>
                </div>
              </div>
              {request.client_ip && (
                <div>
                  <span className="text-xs text-muted-foreground">
                    Client IP
                  </span>
                  <div className="font-mono text-sm mt-1">
                    {request.client_ip}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Response</h3>
            <div className="space-y-2">
              <div>
                <span className="text-xs text-muted-foreground">
                  Status & Duration
                </span>
                <div className="flex items-center space-x-2 mt-1">
                  {request.status_code && <Badge>{request.status_code}</Badge>}
                  {request.duration_ms && (
                    <span className="text-sm">
                      {request.duration_ms.toFixed(1)}ms
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {request.headers && (
          <div>
            <h3 className="text-sm font-medium mb-2">Headers</h3>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto">
              {JSON.stringify(request.headers, null, 2)}
            </pre>
          </div>
        )}

        {request.body && (
          <div>
            <h3 className="text-sm font-medium mb-2">Request Body</h3>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto">
              {request.body}
            </pre>
          </div>
        )}

        {request.response_body && (
          <div>
            <h3 className="text-sm font-medium mb-2">Response Body</h3>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto">
              {request.response_body}
            </pre>
          </div>
        )}

        {request.queries.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">
              SQL Queries ({request.queries.length})
            </h3>
            <div className="space-y-2">
              {request.queries.map((query) => (
                <div key={query.id} className="border rounded p-2">
                  <pre className="text-xs overflow-auto">{query.sql}</pre>
                  {query.duration_ms && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {query.duration_ms.toFixed(1)}ms
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {request.exceptions.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2 text-destructive">
              Exceptions
            </h3>
            <div className="space-y-2">
              {request.exceptions.map((exception) => (
                <div
                  key={exception.id}
                  className="border border-destructive rounded p-2"
                >
                  <div className="text-sm font-medium">
                    {exception.exception_type}
                  </div>
                  {exception.exception_value && (
                    <div className="text-sm mt-1">
                      {exception.exception_value}
                    </div>
                  )}
                  <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto">
                    {exception.traceback}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
