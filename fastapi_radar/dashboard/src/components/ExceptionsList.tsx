import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient, ExceptionDetail } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ChevronDown, ChevronRight, Clock } from "lucide-react";
import { format } from "@/lib/date";

export function ExceptionsList() {
  const { data: exceptions, isLoading } = useQuery({
    queryKey: ["exceptions"],
    queryFn: () => apiClient.getExceptions({ limit: 100 }),
    refetchInterval: 2000,
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading exceptions...</div>;
  }

  if (!exceptions || exceptions.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No exceptions captured</p>
        <p className="text-sm text-muted-foreground mt-1">
          Exceptions will appear here when they occur
        </p>
      </div>
    );
  }

  // Group exceptions by type
  const groupedExceptions = exceptions.reduce(
    (acc: Record<string, ExceptionDetail[]>, exception) => {
      if (!acc[exception.exception_type]) {
        acc[exception.exception_type] = [];
      }
      acc[exception.exception_type].push(exception);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-4">
      {Object.entries(groupedExceptions).map(([type, exceptions]) => (
        <ExceptionGroup key={type} type={type} exceptions={exceptions} />
      ))}
    </div>
  );
}

interface ExceptionGroupProps {
  type: string;
  exceptions: ExceptionDetail[];
}

function ExceptionGroup({ type, exceptions }: ExceptionGroupProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className="p-4 bg-destructive/5 hover:bg-destructive/10 cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="font-medium">{type}</span>
            <Badge variant="destructive">{exceptions.length}</Badge>
          </div>
          <span className="text-sm text-muted-foreground">
            Latest: {format(exceptions[0].created_at)}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="divide-y">
          {exceptions.map((exception) => (
            <ExceptionItem key={exception.id} exception={exception} />
          ))}
        </div>
      )}
    </div>
  );
}

interface ExceptionItemProps {
  exception: ExceptionDetail;
}

function ExceptionItem({ exception }: ExceptionItemProps) {
  const [showFullTrace, setShowFullTrace] = useState(false);

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          {exception.exception_value && (
            <p className="text-sm font-medium">{exception.exception_value}</p>
          )}
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{format(exception.created_at)}</span>
            {exception.request_id && (
              <>
                <span>•</span>
                <span>Request: {exception.request_id.slice(0, 8)}...</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-medium">Stack Trace</h4>
          <button
            onClick={() => setShowFullTrace(!showFullTrace)}
            className="text-xs text-primary hover:underline"
          >
            {showFullTrace ? "Show less" : "Show full trace"}
          </button>
        </div>
        <pre
          className={`text-xs bg-muted p-3 rounded overflow-auto ${
            !showFullTrace ? "max-h-40" : ""
          }`}
        >
          {exception.traceback}
        </pre>
      </div>
    </div>
  );
}
