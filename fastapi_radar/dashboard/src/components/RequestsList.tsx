import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { SearchInput } from "@/components/ui/search-input";
import { RequestItem } from "@/components/RequestItem";
import { useDebounce } from "@/hooks/useDebounce";
import { useDetailDrawer } from "@/context/DetailDrawerContext";

export function RequestsList() {
  const { openDetail } = useDetailDrawer();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data: requests, isLoading } = useQuery({
    queryKey: ["requests", debouncedSearchTerm],
    queryFn: () =>
      apiClient.getRequests({
        limit: 100,
        search: debouncedSearchTerm || undefined,
      }),
    refetchInterval: 2000,
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading requests...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <SearchInput
        placeholder="Search by path..."
        value={searchTerm}
        onValueChange={setSearchTerm}
      />

      {/* Requests List */}
      <div className="space-y-2">
        {requests?.map((request) => (
          <RequestItem
            key={request.id}
            request={request}
            onClick={() => openDetail("request", request.request_id)}
          />
        ))}
        {requests?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No requests captured yet
          </div>
        )}
      </div>
    </div>
  );
}
