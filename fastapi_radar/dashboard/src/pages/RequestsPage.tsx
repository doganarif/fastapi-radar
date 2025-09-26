import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchInput } from "@/components/ui/search-input";
import { RequestItem } from "@/components/RequestItem";
import { useDebounce } from "@/hooks/useDebounce";
import { Filter, Download, RefreshCw } from "lucide-react";
import { useDetailDrawer } from "@/context/DetailDrawerContext";
import { useT } from "@/i18n";

export function RequestsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { openDetail } = useDetailDrawer();
  const t = useT();

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Get all requests
  const { data: allRequests, refetch } = useQuery({
    queryKey: ["all-requests", statusFilter, methodFilter, debouncedSearchTerm],
    queryFn: () =>
      apiClient.getRequests({
        limit: 200,
        status_code:
          statusFilter !== "all" ? getStatusCode(statusFilter) : undefined,
        method: methodFilter !== "all" ? methodFilter : undefined,
        search: debouncedSearchTerm || undefined,
      }),
    refetchInterval: 5000,
  });

  // Calculate counts for tabs
  const successfulCount =
    allRequests?.filter(
      (r) => r.status_code && r.status_code >= 200 && r.status_code < 300
    ).length || 0;
  const failedCount =
    allRequests?.filter((r) => r.status_code && r.status_code >= 400).length ||
    0;
  const slowCount =
    allRequests?.filter((r) => r.duration_ms && r.duration_ms > 500).length ||
    0;

  // Filter requests based on active tab
  const filteredRequests =
    activeTab === "all"
      ? allRequests
      : activeTab === "successful"
      ? allRequests?.filter(
          (r) => r.status_code && r.status_code >= 200 && r.status_code < 300
        )
      : activeTab === "failed"
      ? allRequests?.filter((r) => r.status_code && r.status_code >= 400)
      : activeTab === "slow"
      ? allRequests?.filter((r) => r.duration_ms && r.duration_ms > 500)
      : allRequests;

  const getStatusCode = (filter: string) => {
    switch (filter) {
      case "2xx":
        return 200;
      case "3xx":
        return 300;
      case "4xx":
        return 400;
      case "5xx":
        return 500;
      default:
        return undefined;
    }
  };

  const applyFilters = () => {
    refetch();
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('pages.requests.title')}</h1>
        <p className="text-muted-foreground">
          {t('pages.requests.description')}
        </p>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('common.filter')}</CardTitle>
          <CardDescription>
            {t('requests.filters.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">{t('common.search')}</Label>
              <SearchInput
                id="search"
                placeholder={t('requests.filters.searchPlaceholder')}
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">{t('requests.filters.status')}</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">{t('requests.filters.method')}</Label>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger id="method">
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
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={exportData}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button onClick={applyFilters}>
                  <Filter className="mr-2 h-4 w-4" />
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Request Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="all">
            {t('requests.tabs.all')}
            {allRequests && allRequests.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {allRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="successful">
            {t('requests.tabs.successful')}
            {successfulCount > 0 && (
              <Badge variant="outline" className="ml-2">
                {successfulCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="failed">
            {t('requests.tabs.failed')}
            {failedCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {failedCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="slow">
            {t('requests.tabs.slow')}
            {slowCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {slowCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === "all" && t('requests.tabs.all')}
                {activeTab === "successful" && t('requests.tabs.successful')}
                {activeTab === "failed" && t('requests.tabs.failed')}
                {activeTab === "slow" && t('requests.tabs.slow')}
              </CardTitle>
              <CardDescription>
                {activeTab === "all" && t('requests.descriptions.all')}
                {activeTab === "successful" && t('requests.descriptions.successful')}
                {activeTab === "failed" && t('requests.descriptions.failed')}
                {activeTab === "slow" && t('requests.descriptions.slow')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredRequests?.map((request) => (
                  <RequestItem
                    key={request.id}
                    request={request}
                    onClick={() => openDetail("request", request.request_id)}
                  />
                ))}
                {(!filteredRequests || filteredRequests.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    {activeTab === "all" && t('requests.empty.all')}
                    {activeTab === "successful" && t('requests.empty.successful')}
                    {activeTab === "failed" && t('requests.empty.failed')}
                    {activeTab === "slow" && t('requests.empty.slow')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
