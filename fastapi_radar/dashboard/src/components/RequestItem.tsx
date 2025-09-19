import { RequestSummary } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Clock, AlertCircle, Database } from "lucide-react";
import { format } from "@/lib/date";
import { cn } from "@/lib/utils";

interface RequestItemProps {
  request: RequestSummary;
  onClick: () => void;
  className?: string;
}

export function RequestItem({ request, onClick, className }: RequestItemProps) {
  const getStatusBadgeVariant = (status: number | null) => {
    if (!status) return "outline";
    if (status >= 200 && status < 300) return "success";
    if (status >= 300 && status < 400) return "secondary";
    if (status >= 400 && status < 500) return "warning";
    if (status >= 500) return "destructive";
    return "outline";
  };

  const getMethodBadgeVariant = (method: string) => {
    const variants: Record<string, string> = {
      GET: "secondary",
      POST: "default",
      PUT: "default",
      PATCH: "default",
      DELETE: "destructive",
    };
    return variants[method] || "outline";
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center space-x-4">
        <Badge variant={getMethodBadgeVariant(request.method) as any}>
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
          <Badge variant={getStatusBadgeVariant(request.status_code) as any}>
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
  );
}
