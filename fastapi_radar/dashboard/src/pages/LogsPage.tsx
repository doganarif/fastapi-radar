import { apiClient, LogRecord } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Input } from "@/components/ui/input";
import { RefreshIntervalSelect } from "@/components/ui/refresh-interval-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TablePagination } from "@/components/ui/table-pagination";
import { useT } from "@/i18n";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, RefreshCw, Search } from "lucide-react";
import { useState } from "react";

const LEVEL_COLORS: Record<
  string,
  "default" | "destructive" | "secondary" | "outline"
> = {
  DEBUG: "outline",
  INFO: "secondary",
  WARNING: "default",
  ERROR: "destructive",
  CRITICAL: "destructive",
};

function LogRow({ log }: { log: LogRecord }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border-b last:border-b-0 py-3 px-4 hover:bg-muted/30">
      <div className="flex items-start gap-3">
        <Badge
          variant={LEVEL_COLORS[log.level] ?? "outline"}
          className="shrink-0 mt-0.5 font-mono text-xs w-16 justify-center"
        >
          {log.level}
        </Badge>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-mono">
              {format(new Date(log.created_at), "HH:mm:ss.SSS")}
            </span>
            {log.logger_name && (
              <span className="text-xs text-muted-foreground">
                [{log.logger_name}]
              </span>
            )}
          </div>
          <p className="text-sm mt-0.5 break-words font-mono">{log.message}</p>
          {log.pathname && (
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              {log.pathname}
              {log.lineno ? `:${log.lineno}` : ""}
              {log.func_name ? ` in ${log.func_name}` : ""}
            </p>
          )}
          {log.exc_info && (
            <div className="mt-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? (
                  <ChevronUp className="h-3 w-3 mr-1" />
                ) : (
                  <ChevronDown className="h-3 w-3 mr-1" />
                )}
                {expanded ? "Hide traceback" : "Show traceback"}
              </Button>
              {expanded && (
                <pre className="mt-1 text-xs bg-muted rounded p-2 overflow-x-auto whitespace-pre-wrap">
                  {log.exc_info}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function LogsPage() {
  const t = useT();
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<string>("all");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedLevel, setAppliedLevel] = useState<string>("all");
  const [appliedStartTime, setAppliedStartTime] = useState("");
  const [appliedEndTime, setAppliedEndTime] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  const filterParams = {
    level: appliedLevel !== "all" ? appliedLevel : undefined,
    search: appliedSearch || undefined,
    start_time: appliedStartTime || undefined,
    end_time: appliedEndTime || undefined,
  };

  const { data: logsCount } = useQuery({
    queryKey: ["logs-count", appliedLevel, appliedSearch, appliedStartTime, appliedEndTime],
    queryFn: () => apiClient.getLogsCount(filterParams),
    refetchInterval: refreshInterval || false,
  });

  const { data: logs, isLoading, isError, refetch } = useQuery({
    queryKey: ["logs", appliedLevel, appliedSearch, appliedStartTime, appliedEndTime, page, pageSize],
    queryFn: () =>
      apiClient.getLogs({
        limit: pageSize,
        offset: (page - 1) * pageSize,
        ...filterParams,
      }),
    refetchInterval: refreshInterval || false,
  });

  const applyFilters = () => {
    setAppliedSearch(search);
    setAppliedLevel(level);
    setAppliedStartTime(startTime ? new Date(startTime).toISOString() : "");
    setAppliedEndTime(endTime ? new Date(endTime).toISOString() : "");
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") applyFilters();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("pages.logs.title")}
          </h1>
          <p className="text-muted-foreground">{t("pages.logs.description")}</p>
        </div>
        <RefreshIntervalSelect value={refreshInterval} onChange={setRefreshInterval} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("logs.searchPlaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t("logs.level")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("logs.levelFilters.all")}</SelectItem>
                <SelectItem value="DEBUG">DEBUG</SelectItem>
                <SelectItem value="INFO">INFO</SelectItem>
                <SelectItem value="WARNING">WARNING</SelectItem>
                <SelectItem value="ERROR">ERROR</SelectItem>
                <SelectItem value="CRITICAL">CRITICAL</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted-foreground shrink-0">{t("logs.startTime")}</span>
              <DateTimePicker
                value={startTime}
                onChange={setStartTime}
                placeholder={t("logs.startTime")}
                className="w-[190px]"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted-foreground shrink-0">{t("logs.endTime")}</span>
              <DateTimePicker
                value={endTime}
                onChange={setEndTime}
                placeholder={t("logs.endTime")}
                className="w-[190px]"
              />
            </div>

            <Button onClick={applyFilters}>{t("requests.filters.apply")}</Button>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Log list */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>
            {t("logs.records")}
            {logsCount !== undefined && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({logsCount.count})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          {isLoading && (
            <div className="py-8 text-center text-muted-foreground">
              {t("common.loading")}
            </div>
          )}
          {isError && (
            <div className="py-8 text-center text-destructive">
              {t("common.error")}
            </div>
          )}
          {!isLoading && !isError && (!logs || logs.length === 0) && (
            <div className="py-8 text-center text-muted-foreground">
              {t("logs.noLogs")}
            </div>
          )}
          {logs && logs.length > 0 && (
            <div>
              {logs.map((log) => (
                <LogRow key={log.id} log={log} />
              ))}
            </div>
          )}

          {/* Pagination */}
          <TablePagination
            page={page}
            pageSize={pageSize}
            itemCount={logs?.length ?? 0}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            className="px-4 pb-4"
          />
        </CardContent>
      </Card>
    </div>
  );
}
