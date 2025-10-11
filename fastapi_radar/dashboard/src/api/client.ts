export interface RequestSummary {
  id: number;
  request_id: string;
  method: string;
  path: string;
  status_code: number | null;
  duration_ms: number | null;
  query_count: number;
  has_exception: boolean;
  created_at: string;
}

export interface RequestDetail {
  id: number;
  request_id: string;
  method: string;
  url: string;
  path: string;
  query_params: Record<string, any> | null;
  headers: Record<string, string> | null;
  body: string | null;
  status_code: number | null;
  response_body: string | null;
  response_headers: Record<string, string> | null;
  duration_ms: number | null;
  client_ip: string | null;
  created_at: string;
  queries: QueryInfo[];
  exceptions: ExceptionInfo[];
}

export interface QueryInfo {
  id: number;
  sql: string;
  parameters: any[] | null;
  duration_ms: number | null;
  rows_affected: number | null;
  connection_name: string | null;
  created_at: string;
}

export interface QueryDetail {
  id: number;
  request_id: string;
  sql: string;
  parameters: any[] | null;
  duration_ms: number | null;
  rows_affected: number | null;
  connection_name: string | null;
  created_at: string;
}

export interface ExceptionInfo {
  id: number;
  exception_type: string;
  exception_value: string | null;
  traceback: string;
  created_at: string;
}

export interface ExceptionDetail {
  id: number;
  request_id: string;
  exception_type: string;
  exception_value: string | null;
  traceback: string;
  created_at: string;
}

export interface DashboardStats {
  total_requests: number;
  avg_response_time: number | null;
  total_queries: number;
  avg_query_time: number | null;
  total_exceptions: number;
  slow_queries: number;
  requests_per_minute: number;
}

export interface TraceSummary {
  trace_id: string;
  service_name: string | null;
  operation_name: string | null;
  start_time: string;
  end_time: string | null;
  duration_ms: number | null;
  span_count: number;
  status: string;
  created_at: string;
}

export interface WaterfallSpan {
  span_id: string;
  parent_span_id: string | null;
  operation_name: string;
  service_name: string | null;
  start_time: string | null;
  end_time: string | null;
  duration_ms: number | null;
  status: string;
  tags: Record<string, any> | null;
  depth: number;
  offset_ms: number;
}

export interface TraceDetail {
    trace_id: string;
    service_name: string | null;
  operation_name: string | null;
  start_time: string;
  end_time: string | null;
  duration_ms: number | null;
  span_count: number;
  status: string;
  tags: Record<string, any> | null;
  created_at: string;
  spans: WaterfallSpan[];
}

export interface WaterfallData {
  trace_id: string;
  spans: WaterfallSpan[];
  trace_info: {
    service_name: string | null;
    operation_name: string | null;
    total_duration_ms: number | null;
    span_count: number;
    status: string;
  };
}

export interface BackgroundTaskParamsInfo {
  args: any[];
  kwargs: Record<string, any>;
}

export interface BackgroundTaskInfo {
  id: string;
  function_key: string;
  function_name: string;
  status: string;
  queued_at: string;
  started_at: string | null;
  ended_at: string | null;
  duration_ms: number | null;
  params: BackgroundTaskParamsInfo;
  error_message: string | null;
  error_trace: string | null;
}

class APIClient {
  private baseUrl = "/__radar/api";

  async getRequests(params?: {
    limit?: number;
    offset?: number;
    status_code?: number;
    method?: string;
    search?: string;
  }): Promise<RequestSummary[]> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());
    if (params?.status_code)
      queryParams.append("status_code", params.status_code.toString());
    if (params?.method) queryParams.append("method", params.method);
    if (params?.search) queryParams.append("search", params.search);

    const response = await fetch(`${this.baseUrl}/requests?${queryParams}`);
    return response.json();
  }

  async getRequestDetail(requestId: string): Promise<RequestDetail> {
    const response = await fetch(`${this.baseUrl}/requests/${requestId}`);
    return response.json();
  }

  async getQueries(params?: {
    limit?: number;
    offset?: number;
    slow_only?: boolean;
    slow_threshold?: number;
    search?: string;
  }): Promise<QueryDetail[]> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());
    if (params?.slow_only)
      queryParams.append("slow_only", params.slow_only.toString());
    if (params?.slow_threshold)
      queryParams.append("slow_threshold", params.slow_threshold.toString());
    if (params?.search) queryParams.append("search", params.search);

    const response = await fetch(`${this.baseUrl}/queries?${queryParams}`);
    return response.json();
  }

  async getExceptions(params?: {
    limit?: number;
    offset?: number;
    exception_type?: string;
  }): Promise<ExceptionDetail[]> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());
    if (params?.exception_type)
      queryParams.append("exception_type", params.exception_type);

    const response = await fetch(`${this.baseUrl}/exceptions?${queryParams}`);
    return response.json();
  }

  async getStats(hours: number = 1): Promise<DashboardStats> {
    const response = await fetch(`${this.baseUrl}/stats?hours=${hours}`);
    return response.json();
  }

  async clearData(olderThanHours?: number): Promise<{ message: string }> {
    const queryParams = olderThanHours
      ? `?older_than_hours=${olderThanHours}`
      : "";
    const response = await fetch(`${this.baseUrl}/clear${queryParams}`, {
      method: "DELETE",
    });
    return response.json();
  }

  async getTraces(params?: {
    limit?: number;
    offset?: number;
    status?: string;
    service_name?: string;
    min_duration_ms?: number;
    hours?: number;
    search?: string;
  }): Promise<TraceSummary[]> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());
    if (params?.status) queryParams.append("status", params.status);
    if (params?.service_name)
      queryParams.append("service_name", params.service_name);
    if (params?.min_duration_ms)
      queryParams.append("min_duration_ms", params.min_duration_ms.toString());
    if (params?.hours) queryParams.append("hours", params.hours.toString());
    if (params?.search) queryParams.append("search", params.search);

    const response = await fetch(`${this.baseUrl}/traces?${queryParams}`);
    return response.json();
  }

  async getTraceDetail(traceId: string): Promise<TraceDetail> {
    const response = await fetch(`${this.baseUrl}/traces/${traceId}`);
    return response.json();
  }

  async getTraceWaterfall(traceId: string): Promise<WaterfallData> {
    const response = await fetch(`${this.baseUrl}/traces/${traceId}/waterfall`);
    return response.json();
  }

  async getBackgroundTasks(): Promise<BackgroundTaskInfo[]> {
    const response = await fetch(`${this.baseUrl}/background-tasks`);
    return response.json();
  }

  async clearBackgroundTasks(): Promise<{ ok: boolean }> {
    const response = await fetch(`${this.baseUrl}/background-tasks`, {
      method: "DELETE",
    });
    return response.json();
  }

  async rerunBackgroundTask(taskId: string): Promise<{ ok: boolean }> {
    const response = await fetch(`${this.baseUrl}/background-tasks/${taskId}/rerun`, {
      method: "POST",
    });
    return response.json();
  }
}

export const apiClient = new APIClient();
