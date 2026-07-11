import { apiClient } from "@/api/client";
import { RequestItem } from "@/components/RequestItem";
import { BarChart } from "@/components/charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { RefreshIntervalSelect } from "@/components/ui/refresh-interval-select";
import { SearchInput } from "@/components/ui/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TablePagination } from "@/components/ui/table-pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDetailDrawer } from "@/context/DetailDrawerContext";
import { useDebounce } from "@/hooks/useDebounce";
import { useT } from "@/i18n";
import { useQuery } from "@tanstack/react-query";
import { Download, Filter, RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";

export function RequestsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [timeRange, setTimeRange] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [refreshInterval, setRefreshInterval] = useState(30000);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [appliedStartTime, setAppliedStartTime] = useState("");
  const [appliedEndTime, setAppliedEndTime] = useState("");
  const { openDetail } = useDetailDrawer();
  const t = useT();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  function toDatetimeLocal(date: Date): string {
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
  }

  useEffect(() => {
    setPage(1);
  }, [statusFilter, methodFilter, debouncedSearchTerm, appliedStartTime, appliedEndTime, activeTab]);

  const getStatusCode = (filter: string) => {
    switch (filter) {
      case "2xx": return 200;
      case "3xx": return 300;
      case "4xx": return 400;
      case "5xx": return 500;
      default: return undefined;
    }
  };

  const getCountsParams = () => {
    const params: any = {
      status_code: statusFilter !== "all" ? getStatusCode(statusFilter) : undefined,
      method: methodFilter !== "all" ? methodFilter : undefined,
      search: debouncedSearchTerm || undefined,
    };
    if (appliedStartTime) params.start_time = appliedStartTime;
    if (appliedEndTime) params.end_time = appliedEndTime;
    return params;
  };

  const getTabParams = (tab: string) => {
    switch (tab) {
      case "successful": return { status_code: 200 };
      case "failed": return { min_status_code: 400 };
      case "slow": return { slow_only: true, slow_threshold: 500 };
      default: return {};
    }
  };

  const chartHours = (() => {
    if (appliedStartTime && appliedEndTime) {
      const diffMs = new Date(appliedEndTime).getTime() - new Date(appliedStartTime).getTime();
      return Math.max(1, Math.ceil(diffMs / (1000 * 3600)));
    }
    return timeRange ?? 24;
  })();

  const chartTimeLabel = (() => {
    switch (timeRange) {
      case 1: return t('requests.timeRangeFilters.lastHour');
      case 24: return t('requests.timeRangeFilters.last24Hours');
      case 168: return t('requests.timeRangeFilters.last7Days');
    }
    if (appliedStartTime || appliedEndTime) {
      const parts: string[] = [];
      if (appliedStartTime) parts.push(new Date(appliedStartTime).toLocaleString());
      if (appliedEndTime) parts.push(new Date(appliedEndTime).toLocaleString());
      return parts.length === 2
        ? `${t('requests.timeRangeFilters.customRange')}: ${parts[0]} – ${parts[1]}`
        : `${t('requests.timeRangeFilters.customRange')}: ${parts[0]}`;
    }
    return t('requests.timeRangeFilters.last24Hours');
  })();

  const { data: timeseriesData } = useQuery({
    queryKey: ["requests-timeseries", chartHours, appliedStartTime, appliedEndTime],
    queryFn: () => apiClient.getRequestTimeseries(chartHours, appliedStartTime || undefined, appliedEndTime || undefined),
    refetchInterval: refreshInterval || false,
  });

  const chartData = timeseriesData?.map((point) => {
    const d = new Date(point.iso_time);
    const localTime = chartHours > 48
      ? d.toLocaleDateString([], { weekday: "short", month: "numeric", day: "numeric" })
      : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    return { time: localTime, isoTime: point.iso_time, successful: Math.max(0, point.requests - point.errors), errors: point.errors };
  });

  const getBucketDurationMs = () => {
    if (chartHours === 1) return 60 * 1000;
    if (chartHours > 24) return 24 * 60 * 60 * 1000;
    return 60 * 60 * 1000;
  };

  const handleChartBrush = (startIdx: number, endIdx: number) => {
    if (!chartData?.length) return;
    const startIso = chartData[startIdx]?.isoTime;
    const endIso = chartData[endIdx]?.isoTime;
    if (!startIso || !endIso) return;
    const endDate = new Date(new Date(endIso).getTime() + getBucketDurationMs());
    const newStart = new Date(startIso).toISOString();
    const newEnd = endDate.toISOString();
    setStartTime(toDatetimeLocal(new Date(newStart)));
    setEndTime(toDatetimeLocal(new Date(newEnd)));
    setAppliedStartTime(newStart);
    setAppliedEndTime(newEnd);
    setTimeRange(null);
    setPage(1);
  };

  const { data: allRequests, refetch } = useQuery({
    queryKey: ["all-requests", statusFilter, methodFilter, debouncedSearchTerm, appliedStartTime, appliedEndTime, page, pageSize, activeTab],
    queryFn: () => {
      const params: any = { limit: pageSize, offset: (page - 1) * pageSize, ...getCountsParams(), ...getTabParams(activeTab) };
      return apiClient.getRequests(params);
    },
    refetchInterval: refreshInterval || false,
    placeholderData: (prev) => prev,
  });

  const { data: requestCounts } = useQuery({
    queryKey: ["request-counts", statusFilter, methodFilter, debouncedSearchTerm, appliedStartTime, appliedEndTime],
    queryFn: () => apiClient.getRequestCounts(getCountsParams()),
    refetchInterval: refreshInterval || false,
  });

  const successfulCount = requestCounts?.successful ?? 0;
  const failedCount = requestCounts?.failed ?? 0;
  const slowCount = requestCounts?.slow ?? 0;
  const filteredRequests = allRequests;

  const applyFilters = () => {
    setTimeRange(null);
    setAppliedStartTime(startTime ? new Date(startTime).toISOString() : "");
    setAppliedEndTime(endTime ? new Date(endTime).toISOString() : "");
    setPage(1);
  };

  const clearTimeRange = () => {
    setTimeRange(null);
    setStartTime("");
    setEndTime("");
    setAppliedStartTime("");
    setAppliedEndTime("");
  };

  const exportData = () => {
    if (filteredRequests) {
      const data = JSON.stringify(filteredRequests, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `requests-${new Date().toISOString()}.json`;
      a.click();
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">{t('pages.requests.title')}</h1>
        <RefreshIntervalSelect value={refreshInterval} onChange={setRefreshInterval} />
      </div>

      {/* Chart */}
      <BarChart
        title={`${t("requests.chart.title")} — ${chartTimeLabel}`}
        data={chartData ?? []}
        bars={[
          { dataKey: "successful", name: t("requests.chart.successful"), color: "#0d9488" },
          { dataKey: "errors", name: t("requests.chart.errors"), color: "#ef4444" },
        ]}
        xDataKey="time"
        height={180}
        stacked
        onRangeSelect={handleChartBrush}
      />

      {/* Compact Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card px-3 py-2">
        <SearchInput
          placeholder={t('requests.filters.searchPlaceholder')}
          value={searchTerm}
          onValueChange={setSearchTerm}
          className="h-8 w-48"
        />

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-32">
            <SelectValue placeholder={t('requests.statusFilters.all')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('requests.statusFilters.all')}</SelectItem>
            <SelectItem value="2xx">{t('requests.statusFilters.success')}</SelectItem>
            <SelectItem value="3xx">{t('requests.statusFilters.redirect')}</SelectItem>
            <SelectItem value="4xx">{t('requests.statusFilters.clientErrors')}</SelectItem>
            <SelectItem value="5xx">{t('requests.statusFilters.serverErrors')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="h-8 w-28">
            <SelectValue placeholder={t('requests.methodFilters.all')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('requests.methodFilters.all')}</SelectItem>
            <SelectItem value="GET">{t('requests.methodFilters.get')}</SelectItem>
            <SelectItem value="POST">{t('requests.methodFilters.post')}</SelectItem>
            <SelectItem value="PUT">{t('requests.methodFilters.put')}</SelectItem>
            <SelectItem value="PATCH">{t('requests.methodFilters.patch')}</SelectItem>
            <SelectItem value="DELETE">{t('requests.methodFilters.delete')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Time range quick buttons */}
        <div className="flex items-center gap-1">
          {[
            { label: t('requests.timeRangeFilters.all'), value: null as number | null },
            { label: "1h", value: 1 },
            { label: "24h", value: 24 },
            { label: "7d", value: 168 },
          ].map(({ label, value }) => (
            <Button
              key={label}
              variant={value === null && !timeRange && !appliedStartTime
                || value && timeRange === value ? "default" : "outline"}
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => {
                if (value === null) {
                  clearTimeRange();
                } else {
                  const ago = new Date(Date.now() - value * 3600000);
                  setTimeRange(value);
                  setStartTime(toDatetimeLocal(ago));
                  setEndTime("");
                  setAppliedStartTime(ago.toISOString());
                  setAppliedEndTime("");
                }
              }}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Custom datetime range */}
        <DateTimePicker
          value={startTime}
          onChange={setStartTime}
          placeholder="Start date & time"
          className="w-[160px]"
        />
        <span className="text-xs text-muted-foreground">–</span>
        <DateTimePicker
          value={endTime}
          onChange={setEndTime}
          placeholder="End date & time"
          className="w-[160px]"
        />

        {(startTime || endTime) && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearTimeRange}>
            <X className="h-3.5 w-3.5" />
          </Button>
        )}

        <div className="ml-auto flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={exportData}>
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" className="h-8" onClick={applyFilters}>
            <Filter className="mr-1.5 h-3.5 w-3.5" />
            {t('requests.filters.apply')}
          </Button>
        </div>
      </div>

      {/* Tabs + Request List */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-2">
        <TabsList className="h-8">
          <TabsTrigger value="all" className="h-7 text-xs">
            {t('requests.tabs.all')}
            {requestCounts && requestCounts.total > 0 && (
              <Badge variant="outline" className="ml-1.5 text-xs px-1 py-0">{requestCounts.total}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="successful" className="h-7 text-xs">
            {t('requests.tabs.successful')}
            {successfulCount > 0 && (
              <Badge variant="outline" className="ml-1.5 text-xs px-1 py-0">{successfulCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="failed" className="h-7 text-xs">
            {t('requests.tabs.failed')}
            {failedCount > 0 && (
              <Badge variant="destructive" className="ml-1.5 text-xs px-1 py-0">{failedCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="slow" className="h-7 text-xs">
            {t('requests.tabs.slow')}
            {slowCount > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs px-1 py-0">{slowCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          <div className="rounded-lg border bg-card">
            <div className="divide-y">
              {filteredRequests?.map((request) => (
                <RequestItem
                  key={request.id}
                  request={request}
                  onClick={() => openDetail("request", request.request_id)}
                />
              ))}
              {(!filteredRequests || filteredRequests.length === 0) && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {activeTab === "all" && t('requests.empty.all')}
                  {activeTab === "successful" && t('requests.empty.successful')}
                  {activeTab === "failed" && t('requests.empty.failed')}
                  {activeTab === "slow" && t('requests.empty.slow')}
                </div>
              )}
            </div>
            <div className="border-t px-2 py-1">
              <TablePagination
                page={page}
                pageSize={pageSize}
                itemCount={allRequests?.length ?? 0}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}