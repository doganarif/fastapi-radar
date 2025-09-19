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

export function RequestsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { openDetail } = useDetailDrawer();

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
        <h1 className="text-3xl font-bold tracking-tight">HTTP Requests</h1>
        <p className="text-muted-foreground">
          Monitor and analyze all incoming HTTP requests to your application
        </p>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter and search through request logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <SearchInput
                id="search"
                placeholder="Search by path..."
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status Code</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="All status codes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status codes</SelectItem>
                  <SelectItem value="2xx">2xx Success</SelectItem>
                  <SelectItem value="3xx">3xx Redirect</SelectItem>
                  <SelectItem value="4xx">4xx Client Error</SelectItem>
                  <SelectItem value="5xx">5xx Server Error</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">Method</Label>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger id="method">
                  <SelectValue placeholder="All methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All methods</SelectItem>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
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
            All Requests
            {allRequests && allRequests.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {allRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="successful">
            Successful
            {successfulCount > 0 && (
              <Badge variant="outline" className="ml-2">
                {successfulCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="failed">
            Failed
            {failedCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {failedCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="slow">
            Slow
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
                {activeTab === "all" && "All Requests"}
                {activeTab === "successful" && "Successful Requests"}
                {activeTab === "failed" && "Failed Requests"}
                {activeTab === "slow" && "Slow Requests"}
              </CardTitle>
              <CardDescription>
                {activeTab === "all" && "Complete list of all HTTP requests"}
                {activeTab === "successful" &&
                  "Requests that completed successfully (2xx status codes)"}
                {activeTab === "failed" &&
                  "Requests that resulted in errors (4xx and 5xx status codes)"}
                {activeTab === "slow" && "Requests that took longer than 500ms"}
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
                    {activeTab === "all" && "No requests captured yet"}
                    {activeTab === "successful" && "No successful requests"}
                    {activeTab === "failed" && "No failed requests"}
                    {activeTab === "slow" && "No slow requests"}
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
