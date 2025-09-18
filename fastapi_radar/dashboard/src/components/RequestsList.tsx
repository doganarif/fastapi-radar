import { useQuery } from "@tanstack/react-query";
import { apiClient, RequestSummary } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Clock, AlertCircle, Database } from "lucide-react";
import { format } from "@/lib/date";
import { useDetailDrawer } from "@/context/DetailDrawerContext";

export function RequestsList() {
  const { openDetail } = useDetailDrawer();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["requests"],
    queryFn: () => apiClient.getRequests({ limit: 100 }),
    refetchInterval: 2000,
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
    <div className="space-y-2">
      {requests?.map((request: RequestSummary) => (
        <div
          key={request.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
          onClick={() => openDetail("request", request.request_id)}
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
  );
}
