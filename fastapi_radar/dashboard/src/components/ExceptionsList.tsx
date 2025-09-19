import { useQuery } from "@tanstack/react-query";
import { apiClient, ExceptionDetail } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, ChevronRight } from "lucide-react";
import { format } from "@/lib/date";
import { useDetailDrawer } from "@/context/DetailDrawerContext";

export function ExceptionsList() {
  const { openDetail } = useDetailDrawer();

  const { data: exceptions, isLoading } = useQuery({
    queryKey: ["exceptions"],
    queryFn: () =>
      apiClient.getExceptions({
        limit: 100,
      }),
    refetchInterval: 5000,
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading exceptions...</div>;
  }

  return (
    <div className="space-y-2">
      {exceptions?.map((exception: ExceptionDetail) => (
        <div
          key={exception.id}
          className="p-4 border border-destructive/50 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
          onClick={() => openDetail("request", exception.request_id)}
        >
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <Badge variant="destructive">{exception.exception_type}</Badge>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            {exception.exception_value && (
              <p className="text-sm">{exception.exception_value}</p>
            )}
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{format(exception.created_at)}</span>
            </div>
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                View traceback preview
              </summary>
              <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto max-h-40 text-destructive">
                {exception.traceback}
              </pre>
            </details>
          </div>
        </div>
      ))}
      {exceptions?.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No exceptions captured yet
        </div>
      )}
    </div>
  );
}
