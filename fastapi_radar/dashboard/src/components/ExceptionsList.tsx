import { apiClient, ExceptionDetail } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/ui/table-pagination";
import { useDetailDrawer } from "@/context/DetailDrawerContext";
import { useT } from "@/i18n";
import { format } from "@/lib/date";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ChevronRight, Clock } from "lucide-react";
import { useState } from "react";

interface ExceptionsListProps {
  refreshInterval?: number;
}

export function ExceptionsList({ refreshInterval }: ExceptionsListProps) {
  const { openDetail } = useDetailDrawer();
  const t = useT();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const refetchInterval = refreshInterval !== undefined ? (refreshInterval || false) : 5000;

  const { data: countData } = useQuery({
    queryKey: ["exceptions-count"],
    queryFn: () => apiClient.getExceptionsCount(),
    refetchInterval,
  });

  const { data: exceptions, isLoading } = useQuery({
    queryKey: ["exceptions", page, pageSize],
    queryFn: () =>
      apiClient.getExceptions({
        limit: pageSize,
        offset: (page - 1) * pageSize,
      }),
    refetchInterval,
  });

  if (isLoading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-4">
      {countData !== undefined && (
        <p className="text-sm text-muted-foreground">
          {countData.count} {t('metrics.exceptions').toLowerCase()}
        </p>
      )}

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
              <details
                className="text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  {t('exceptions.traceback')}
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
            {t('exceptions.noExceptions')}
          </div>
        )}
      </div>

      {/* Pagination */}
      <TablePagination
        page={page}
        pageSize={pageSize}
        itemCount={exceptions?.length ?? 0}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        className="pt-2"
      />
    </div>
  );
}
