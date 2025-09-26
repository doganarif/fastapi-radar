import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient, QueryDetail } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SearchInput } from "@/components/ui/search-input";
import { useDebounce } from "@/hooks/useDebounce";
import { Clock, Database, AlertCircle } from "lucide-react";
import { format } from "@/lib/date";
import { useDetailDrawer } from "@/context/DetailDrawerContext";
import { useT } from "@/i18n";

export function QueriesList() {
  const [showSlowOnly, setShowSlowOnly] = useState(false);
  const [slowThreshold, setSlowThreshold] = useState(100);
  const [searchTerm, setSearchTerm] = useState("");
  const { openDetail } = useDetailDrawer();
  const t = useT();

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data: queries, isLoading } = useQuery({
    queryKey: ["queries", showSlowOnly, slowThreshold, debouncedSearchTerm],
    queryFn: () =>
      apiClient.getQueries({
        limit: 100,
        slow_only: showSlowOnly,
        slow_threshold: slowThreshold,
        search: debouncedSearchTerm || undefined,
      }),
    refetchInterval: 5000,
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading queries...</div>;
  }

  const formatDuration = (ms: number | null) => {
    if (!ms) return "0ms";
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getDurationBadgeVariant = (ms: number | null) => {
    if (!ms) return "secondary";
    if (ms < 50) return "success";
    if (ms < 100) return "secondary";
    if (ms < 500) return "warning";
    return "destructive";
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <SearchInput
        placeholder={t('database.searchPlaceholder')}
        value={searchTerm}
        onValueChange={setSearchTerm}
      />

      {/* Filters */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="slow-only"
              checked={showSlowOnly}
              onCheckedChange={setShowSlowOnly}
            />
            <Label htmlFor="slow-only">{t('database.showSlowOnly')}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="threshold">{t('database.slowThreshold')}:</Label>
            <Input
              id="threshold"
              type="number"
              value={slowThreshold}
              onChange={(e) => setSlowThreshold(Number(e.target.value))}
              className="w-24"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {queries?.map((query: QueryDetail) => (
          <div
            key={query.id}
            className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => openDetail("request", query.request_id)}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1 mr-4">
                  <code className="text-xs bg-muted px-2 py-1 rounded block overflow-x-auto">
                    {query.sql}
                  </code>
                </div>
                <Badge
                  variant={getDurationBadgeVariant(query.duration_ms) as any}
                >
                  {formatDuration(query.duration_ms)}
                </Badge>
              </div>
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{format(query.created_at)}</span>
                </div>
                {query.rows_affected !== null && (
                  <div className="flex items-center space-x-1">
                    <Database className="h-3 w-3" />
                    <span>{query.rows_affected} rows</span>
                  </div>
                )}
                {query.connection_name && (
                  <span className="font-mono">{query.connection_name}</span>
                )}
                {query.duration_ms && query.duration_ms > slowThreshold && (
                  <div className="flex items-center space-x-1">
                    <AlertCircle className="h-3 w-3 text-yellow-500" />
                    <span className="text-yellow-500">Slow</span>
                  </div>
                )}
              </div>
              {query.parameters && query.parameters.length > 0 && (
                <div className="text-xs">
                  <span className="text-muted-foreground">Parameters: </span>
                  <code className="bg-muted px-1 rounded">
                    {JSON.stringify(query.parameters)}
                  </code>
                </div>
              )}
            </div>
          </div>
        ))}
        {queries?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {showSlowOnly ? t('database.noSlowQueries') : t('database.noQueries')}
          </div>
        )}
      </div>
    </div>
  );
}
