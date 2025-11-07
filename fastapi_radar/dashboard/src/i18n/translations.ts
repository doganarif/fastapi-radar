// FastAPI Radar translations
// Simple key-value structure to avoid over-engineering

export type Language = "en" | "zh";

export interface Translations {
  // Navigation and menus
  nav: {
    dashboard: string;
    requests: string;
    tracking: string;
    database: string;
    exceptions: string;
    performance: string;
    backgroundTasks: string;
    settings: string;
  };

  // Sidebar extras (section titles, etc.)
  sidebar: {
    navigation: string;
    system: string;
    collapse: string;
    expand: string;
  };

  // Page titles and descriptions
  pages: {
    dashboard: {
      title: string;
      description: string;
    };
    requests: {
      title: string;
      description: string;
    };
    tracing: {
      title: string;
      description: string;
      tracesCardTitle: string;
      tracesCardDescription: string;
      noTraces: string;
      viewTrace: string;
    };
    database: {
      title: string;
      description: string;
      cardDescription: string;
    };
    exceptions: {
      title: string;
      description: string;
    };
    performance: {
      title: string;
      description: string;
    };
    settings: {
      title: string;
      description: string;
    };
  };

  // Common UI text
  common: {
    loading: string;
    error: string;
    noData: string;
    refresh: string;
    clear: string;
    save: string;
    cancel: string;
    confirm: string;
    delete: string;
    edit: string;
    view: string;
    search: string;
    filter: string;
    export: string;
    import: string;
    close: string;
    open: string;
    back: string;
    next: string;
    previous: string;
    all: string;
    none: string;
    yes: string;
    no: string;
    viewAll: string;
    copy: string;
    copied: string;
  };

  // Time ranges
  timeRange: {
    lastHour: string;
    last24Hours: string;
    last7Days: string;
    last30Days: string;
  };

  // Metrics and statistics
  metrics: {
    totalRequests: string;
    avgResponseTime: string;
    errorRate: string;
    successRate: string;
    slowQueries: string;
    exceptions: string;
    requestsPerMinute: string;
    databaseQueries: string;
    responseTime: string;
    statusCode: string;
    method: string;
    endpoint: string;
    duration: string;
    timestamp: string;
  };

  // Settings page
  settings: {
    appearance: {
      title: string;
      description: string;
      theme: string;
      themeDescription: string;
      light: string;
      dark: string;
      auto: string;
    };
    database: {
      title: string;
      description: string;
      status: string;
      connected: string;
      disconnected: string;
      queries: string;
      avgQueryTime: string;
    };
    performance: {
      title: string;
      description: string;
      avgResponseTime: string;
      requestsPerMinute: string;
    };
    dataManagement: {
      title: string;
      description: string;
      quickActions: string;
      quickActionsDescription: string;
      clear1Day: string;
      clear7Days: string;
      clear30Days: string;
      dangerZone: string;
      dangerZoneDescription: string;
      clearAll: string;
      loading: string;
      totalRequests: string;
      totalQueries: string;
      totalExceptions: string;
      slowQueries: string;
      avgResponseTime: string;
      requestsPerMinute: string;
    };
    about: {
      title: string;
      description: string;
      content: string;
      features: string;
      feature1: string;
      feature2: string;
      feature3: string;
      feature4: string;
      feature5: string;
      version: string;
      dashboard: string;
      connected: string;
    };
    language: {
      title: string;
      description: string;
      current: string;
      english: string;
      chinese: string;
    };
  };

  // Requests page
  requests: {
    filters: {
      status: string;
      method: string;
      searchPlaceholder: string;
      description: string;
    };
    tabs: {
      all: string;
      recent: string;
      slow: string;
      errors: string;
      successful: string;
      failed: string;
    };
    statusFilters: {
      all: string;
      success: string;
      errors: string;
      clientErrors: string;
      serverErrors: string;
      redirect: string;
    };
    methodFilters: {
      all: string;
      get: string;
      post: string;
      put: string;
      delete: string;
      patch: string;
    };
    descriptions: {
      all: string;
      successful: string;
      failed: string;
      slow: string;
    };
    empty: {
      all: string;
      successful: string;
      failed: string;
      slow: string;
    };
  };

  // Exceptions page
  exceptions: {
    noExceptions: string;
    recentExceptions: string;
    exceptionType: string;
    message: string;
    traceback: string;
    clickToView: string;
  };

  // Performance page
  performance: {
    overview: string;
    responseTimeChart: string;
    endpointPerformance: string;
    slowestEndpoints: string;
    requestDistribution: string;
    excellent: string;
    acceptable: string;
    needsAttention: string;
    errorAnalysis: string;
    average: string;
    throughput: string;
    requestsPerSec: string;
    systemStatus: string;
    queryPerformance: string;
    responseTimeDescription: string;
    queryActivity: string;
    queryActivityDescription: string;
    topEndpoints: string;
    avgResponseByEndpoint: string;
    recentRequests: string;
    healthScore: string;
    performanceSummary: string;
    realTimeMetrics: string;
    avgResponse: string;
    slowRequests: string;
    activeEndpoints: string;
    performanceBreakdown: string;
    responseTimesByEndpoint: string;
    p50Median: string;
    p95: string;
    p99: string;
    totalQueries: string;
    queriesPerRequest: string;
    slowQueries: string;
    avgQueryTime: string;
    queryStatistics: string;
    slowQueriesTitle: string;
    errorAnalysisTitle: string;
    detailedMetrics: string;
    noEndpointData: string;
    noExceptionsCaptured: string;
    calls: string;
    errors: string;
    successRate: string;
  };

  // Database page
  database: {
    queries: string;
    slowQueries: string;
    queryTime: string;
    queryType: string;
    affectedRows: string;
    searchPlaceholder: string;
    showSlowOnly: string;
    slowThreshold: string;
    noSlowQueries: string;
    noSlowQueriesShort: string;
    noQueries: string;
  };

  detailDrawer: {
    title: {
      request: string;
      query: string;
      exception: string;
      trace: string;
    };
    common: {
      pending: string;
      unknown: string;
    };
    request: {
      overview: {
        timestamp: string;
        clientIp: string;
        requestId: string;
        url: string;
      };
      tabs: {
        headers: string;
        body: string;
        response: string;
        queries: string;
        errors: string;
      };
      headers: {
        requestTitle: string;
        responseTitle: string;
        noRequestHeaders: string;
        noResponseHeaders: string;
      };
      body: {
        queryParameters: string;
        requestTitle: string;
        noRequestBody: string;
        responseTitle: string;
        noResponseBody: string;
      };
      queries: {
        empty: string;
        queryLabel: string;
        rows: string;
        parameters: string;
      };
      errors: {
        empty: string;
      };
    };
    query: {
      placeholder: string;
    };
    exception: {
      placeholder: string;
    };
    trace: {
      overview: {
        unknownOperation: string;
        unknownService: string;
        traceId: string;
        spanCount: string;
        startTime: string;
        duration: string;
        tags: string;
      };
      totalDuration: string;
      waterfall: {
        title: string;
      };
      spans: {
        title: string;
        service: string;
        duration: string;
        startOffset: string;
        depth: string;
        tags: string;
      };
    };
  };
}

// English translations
const en: Translations = {
  nav: {
    dashboard: "Dashboard",
    requests: "Requests",
    tracking: "Tracking",
    database: "Database",
    exceptions: "Exceptions",
    performance: "Performance",
    backgroundTasks: "Background Tasks",
    settings: "Settings",
  },

  sidebar: {
    navigation: "Navigation",
    system: "System",
    collapse: "Collapse sidebar",
    expand: "Expand sidebar",
  },

  pages: {
    dashboard: {
      title: "Dashboard",
      description: "Real-time monitoring for your FastAPI application",
    },
    requests: {
      title: "Requests",
      description: "Monitor HTTP requests and responses",
    },
    tracing: {
      title: "Tracing",
      description:
        "View distributed traces and waterfall diagrams for your services",
      tracesCardTitle: "Traces",
      tracesCardDescription:
        "Browse all distributed tracing data and open detailed waterfall views",
      noTraces: "No trace data available",
      viewTrace: "View trace",
    },
    database: {
      title: "Database",
      description: "Database query monitoring and analysis",
      cardDescription: "All database queries executed by your application",
    },
    exceptions: {
      title: "Exceptions",
      description: "Track and analyze application exceptions",
    },
    performance: {
      title: "Performance",
      description: "Application performance metrics and analysis",
    },
    settings: {
      title: "Settings",
      description: "Manage your dashboard preferences and data",
    },
  },

  common: {
    loading: "Loading...",
    error: "Error",
    noData: "No data available",
    refresh: "Refresh",
    clear: "Clear",
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    delete: "Delete",
    edit: "Edit",
    view: "View",
    search: "Search",
    filter: "Filter",
    export: "Export",
    import: "Import",
    close: "Close",
    open: "Open",
    back: "Back",
    next: "Next",
    previous: "Previous",
    all: "All",
    none: "None",
    yes: "Yes",
    no: "No",
    viewAll: "View all",
    copy: "Copy",
    copied: "Copied!",
  },

  timeRange: {
    lastHour: "Last Hour",
    last24Hours: "Last 24 Hours",
    last7Days: "Last 7 Days",
    last30Days: "Last 30 Days",
  },

  metrics: {
    totalRequests: "Total Requests",
    avgResponseTime: "Avg Response Time",
    errorRate: "Error Rate",
    successRate: "Success Rate",
    slowQueries: "Slow Queries",
    exceptions: "Exceptions",
    requestsPerMinute: "Requests/Minute",
    databaseQueries: "Database Queries",
    responseTime: "Response Time",
    statusCode: "Status Code",
    method: "Method",
    endpoint: "Endpoint",
    duration: "Duration",
    timestamp: "Timestamp",
  },

  settings: {
    appearance: {
      title: "Appearance",
      description: "Customize the look and feel of your dashboard",
      theme: "Theme",
      themeDescription: "Choose between light and dark mode",
      light: "Light",
      dark: "Dark",
      auto: "Auto",
    },
    database: {
      title: "Database Status",
      description: "Current database connection and performance",
      status: "Status",
      connected: "Connected",
      disconnected: "Disconnected",
      queries: "Queries",
      avgQueryTime: "Avg Query Time",
    },
    performance: {
      title: "Performance Overview",
      description: "Current application performance metrics",
      avgResponseTime: "Avg Response Time",
      requestsPerMinute: "Requests/Minute",
    },
    dataManagement: {
      title: "Data Management",
      description: "Manage your captured monitoring data",
      quickActions: "Quick Actions",
      quickActionsDescription:
        "Clear captured data to free up space or start fresh",
      clear1Day: "Clear data older than 1 day",
      clear7Days: "Clear data older than 7 days",
      clear30Days: "Clear data older than 30 days",
      dangerZone: "Danger Zone",
      dangerZoneDescription: "This action cannot be undone",
      clearAll: "Clear All Data",
      loading: "Loading statistics...",
      totalRequests: "Total Requests",
      totalQueries: "Total Queries",
      totalExceptions: "Total Exceptions",
      slowQueries: "Slow Queries",
      avgResponseTime: "Avg Response Time",
      requestsPerMinute: "Requests/Minute",
    },
    about: {
      title: "About FastAPI Radar",
      description: "Real-time monitoring dashboard for FastAPI applications",
      content:
        "FastAPI Radar provides comprehensive monitoring for your FastAPI applications, including request tracking, database query analysis, and exception monitoring.",
      features: "Features",
      feature1: "Real-time request monitoring",
      feature2: "Database query performance tracking",
      feature3: "Exception and error tracking",
      feature4: "Performance metrics and analytics",
      feature5: "Dark/Light theme support",
      version: "Version",
      dashboard: "Dashboard",
      connected: "Connected",
    },
    language: {
      title: "Language",
      description: "Choose your preferred language",
      current: "Current Language",
      english: "English",
      chinese: "中文",
    },
  },

  requests: {
    filters: {
      status: "Status",
      method: "Method",
      searchPlaceholder: "Search by path...",
      description: "Filter and search through request logs",
    },
    tabs: {
      all: "All Requests",
      recent: "Recent",
      slow: "Slow",
      errors: "Errors",
      successful: "Successful",
      failed: "Failed",
    },
    statusFilters: {
      all: "All status codes",
      success: "2xx Success",
      errors: "All Errors",
      clientErrors: "4xx Client Error",
      serverErrors: "5xx Server Error",
      redirect: "3xx Redirect",
    },
    methodFilters: {
      all: "All methods",
      get: "GET",
      post: "POST",
      put: "PUT",
      delete: "DELETE",
      patch: "PATCH",
    },
    descriptions: {
      all: "Complete list of all HTTP requests",
      successful: "Requests that completed successfully (2xx status codes)",
      failed: "Requests that resulted in errors (4xx and 5xx status codes)",
      slow: "Requests that took longer than 500ms",
    },
    empty: {
      all: "No requests captured yet",
      successful: "No successful requests",
      failed: "No failed requests",
      slow: "No slow requests",
    },
  },

  exceptions: {
    noExceptions: "No exceptions found",
    recentExceptions: "Recent Exceptions",
    exceptionType: "Exception Type",
    message: "Message",
    traceback: "Traceback",
    clickToView: "Click to view full traceback",
  },

  performance: {
    overview: "Performance Overview",
    responseTimeChart: "Response Time Trend",
    endpointPerformance: "Endpoint Performance",
    slowestEndpoints: "Slowest Endpoints",
    requestDistribution: "Request Distribution",
    excellent: "Excellent",
    acceptable: "Acceptable",
    needsAttention: "Needs Attention",
    errorAnalysis: "Error Analysis",
    average: "Average",
    throughput: "Throughput",
    requestsPerSec: "requests/sec",
    systemStatus: "System Status",
    queryPerformance: "Query Performance",
    responseTimeDescription: "Average response times over time",
    queryActivity: "Query Activity",
    queryActivityDescription: "Database query count per request",
    topEndpoints: "Top Endpoints",
    avgResponseByEndpoint: "Average response time by endpoint",
    recentRequests: "Recent Requests",
    healthScore: "Health Score",
    performanceSummary: "Performance Summary",
    realTimeMetrics: "Real-time metrics based on",
    avgResponse: "Avg Response",
    slowRequests: "Slow Requests",
    activeEndpoints: "Active Endpoints",
    performanceBreakdown: "Performance breakdown by API endpoint",
    responseTimesByEndpoint: "Response Times by Endpoint",
    p50Median: "P50 (Median)",
    p95: "P95",
    p99: "P99",
    totalQueries: "Total Queries",
    queriesPerRequest: "Queries/Request",
    slowQueries: "Slow Queries",
    avgQueryTime: "Avg Query Time",
    queryStatistics: "Query Statistics",
    slowQueriesTitle: "Slow Queries",
    errorAnalysisTitle: "Error Analysis",
    detailedMetrics: "Detailed Metrics",
    noEndpointData: "No endpoint data available",
    noExceptionsCaptured: "No exceptions captured",
    calls: "calls",
    errors: "errors",
    successRate: "Success rate",
  },

  database: {
    queries: "Database Queries",
    slowQueries: "Slow Queries",
    queryTime: "Query Time",
    queryType: "Query Type",
    affectedRows: "Affected Rows",
    searchPlaceholder: "Search queries...",
    showSlowOnly: "Show slow queries only",
    slowThreshold: "Slow threshold (ms)",
    noSlowQueries: "No slow queries found",
    noSlowQueriesShort: "All fast",
    noQueries: "No queries captured yet",
  },

  detailDrawer: {
    title: {
      request: "Request Details",
      query: "Query Details",
      exception: "Exception Details",
      trace: "Trace Details",
    },
    common: {
      pending: "pending",
      unknown: "Unknown",
    },
    request: {
      overview: {
        timestamp: "Timestamp",
        clientIp: "Client IP",
        requestId: "Request ID",
        url: "URL",
      },
      tabs: {
        headers: "Headers",
        body: "Body",
        response: "Response",
        queries: "Queries",
        errors: "Errors",
      },
      headers: {
        requestTitle: "Request Headers",
        responseTitle: "Response Headers",
        noRequestHeaders: "No headers",
        noResponseHeaders: "No response headers",
      },
      body: {
        queryParameters: "Query Parameters",
        requestTitle: "Request Body",
        noRequestBody: "No request body",
        responseTitle: "Response Body",
        noResponseBody: "No response body",
      },
      queries: {
        empty: "No queries executed",
        queryLabel: "Query",
        rows: "rows",
        parameters: "Parameters:",
      },
      errors: {
        empty: "No exceptions occurred",
      },
    },
    query: {
      placeholder: "Query details view",
    },
    exception: {
      placeholder: "Exception details view",
    },
    trace: {
      overview: {
        unknownOperation: "Unknown Operation",
        unknownService: "Unknown Service",
        traceId: "Trace ID",
        spanCount: "Span Count",
        startTime: "Start Time",
        duration: "Duration",
        tags: "Tags",
      },
      totalDuration: "Total duration",
      waterfall: {
        title: "Waterfall",
      },
      spans: {
        title: "Span Details",
        service: "Service",
        duration: "Duration",
        startOffset: "Start Offset",
        depth: "Depth",
        tags: "Tags:",
      },
    },
  },
};

// Chinese translations
const zh: Translations = {
  nav: {
    dashboard: "仪表板",
    requests: "请求监控",
    tracking: "链路跟踪",
    database: "数据库",
    exceptions: "异常监控",
    performance: "性能分析",
    backgroundTasks: "后台任务",
    settings: "设置",
  },

  sidebar: {
    navigation: "导航",
    system: "系统",
    collapse: "收起侧边栏",
    expand: "展开侧边栏",
  },

  pages: {
    dashboard: {
      title: "仪表板",
      description: "FastAPI 应用程序实时监控",
    },
    requests: {
      title: "请求监控",
      description: "监控 HTTP 请求和响应",
    },
    tracing: {
      title: "链路跟踪",
      description: "查看服务的分布式追踪和瀑布流图",
      tracesCardTitle: "追踪记录",
      tracesCardDescription: "浏览所有链路追踪数据，点击查看详细的瀑布流图",
      noTraces: "暂无追踪数据",
      viewTrace: "查看追踪详情",
    },
    database: {
      title: "数据库监控",
      description: "数据库查询监控和分析",
      cardDescription: "您的应用程序执行的所有数据库查询",
    },
    exceptions: {
      title: "异常监控",
      description: "跟踪和分析应用程序异常",
    },
    performance: {
      title: "性能分析",
      description: "应用程序性能指标和分析",
    },
    settings: {
      title: "设置",
      description: "管理仪表板偏好设置和数据",
    },
  },

  common: {
    loading: "加载中...",
    error: "错误",
    noData: "暂无数据",
    refresh: "刷新",
    clear: "清除",
    save: "保存",
    cancel: "取消",
    confirm: "确认",
    delete: "删除",
    edit: "编辑",
    view: "查看",
    search: "搜索",
    filter: "筛选",
    export: "导出",
    import: "导入",
    close: "关闭",
    open: "打开",
    back: "返回",
    next: "下一页",
    previous: "上一页",
    all: "全部",
    none: "无",
    yes: "是",
    no: "否",
    viewAll: "查看全部",
    copy: "复制",
    copied: "已复制!",
  },

  timeRange: {
    lastHour: "最近1小时",
    last24Hours: "最近24小时",
    last7Days: "最近7天",
    last30Days: "最近30天",
  },

  metrics: {
    totalRequests: "总请求数",
    avgResponseTime: "平均响应时间",
    errorRate: "错误率",
    successRate: "成功率",
    slowQueries: "慢查询",
    exceptions: "异常数",
    requestsPerMinute: "每分钟请求数",
    databaseQueries: "数据库查询",
    responseTime: "响应时间",
    statusCode: "状态码",
    method: "请求方法",
    endpoint: "端点",
    duration: "持续时间",
    timestamp: "时间戳",
  },

  settings: {
    appearance: {
      title: "外观设置",
      description: "自定义仪表板的外观和感觉",
      theme: "主题",
      themeDescription: "选择浅色或深色模式",
      light: "浅色",
      dark: "深色",
      auto: "自动",
    },
    database: {
      title: "数据库状态",
      description: "当前数据库连接和性能",
      status: "状态",
      connected: "已连接",
      disconnected: "未连接",
      queries: "查询数",
      avgQueryTime: "平均查询时间",
    },
    performance: {
      title: "性能概览",
      description: "当前应用程序性能指标",
      avgResponseTime: "平均响应时间",
      requestsPerMinute: "每分钟请求数",
    },
    dataManagement: {
      title: "数据管理",
      description: "管理捕获的监控数据",
      quickActions: "快速操作",
      quickActionsDescription: "清除捕获的数据以释放空间或重新开始",
      clear1Day: "清除1天前的数据",
      clear7Days: "清除7天前的数据",
      clear30Days: "清除30天前的数据",
      dangerZone: "危险区域",
      dangerZoneDescription: "此操作无法撤销",
      clearAll: "清除所有数据",
      loading: "加载统计数据中...",
      totalRequests: "总请求数",
      totalQueries: "总查询数",
      totalExceptions: "总异常数",
      slowQueries: "慢查询",
      avgResponseTime: "平均响应时间",
      requestsPerMinute: "每分钟请求数",
    },
    about: {
      title: "关于 FastAPI Radar",
      description: "FastAPI 应用程序实时监控仪表板",
      content:
        "FastAPI Radar 为您的 FastAPI 应用程序提供全面的监控，包括请求跟踪、数据库查询分析和异常监控。",
      features: "功能特性",
      feature1: "实时请求监控",
      feature2: "数据库查询性能跟踪",
      feature3: "异常和错误跟踪",
      feature4: "性能指标和分析",
      feature5: "深色/浅色主题支持",
      version: "版本",
      dashboard: "仪表板",
      connected: "已连接",
    },
    language: {
      title: "语言设置",
      description: "选择您的首选语言",
      current: "当前语言",
      english: "English",
      chinese: "中文",
    },
  },

  requests: {
    filters: {
      status: "状态码",
      method: "请求方法",
      searchPlaceholder: "按路径搜索...",
      description: "筛选和搜索请求日志",
    },
    tabs: {
      all: "所有请求",
      recent: "最近",
      slow: "慢请求",
      errors: "错误",
      successful: "成功",
      failed: "失败",
    },
    statusFilters: {
      all: "所有状态码",
      success: "2xx 成功",
      errors: "所有错误",
      clientErrors: "4xx 客户端错误",
      serverErrors: "5xx 服务器错误",
      redirect: "3xx 重定向",
    },
    methodFilters: {
      all: "所有方法",
      get: "GET",
      post: "POST",
      put: "PUT",
      delete: "DELETE",
      patch: "PATCH",
    },
    descriptions: {
      all: "所有 HTTP 请求的完整列表",
      successful: "成功完成的请求 (2xx 状态码)",
      failed: "导致错误的请求 (4xx 和 5xx 状态码)",
      slow: "耗时超过 500ms 的请求",
    },
    empty: {
      all: "尚未捕获任何请求",
      successful: "没有成功的请求",
      failed: "没有失败的请求",
      slow: "没有慢请求",
    },
  },

  exceptions: {
    noExceptions: "未发现异常",
    recentExceptions: "最近异常",
    exceptionType: "异常类型",
    message: "消息",
    traceback: "堆栈跟踪",
    clickToView: "点击查看完整堆栈跟踪",
  },

  performance: {
    overview: "性能概览",
    responseTimeChart: "响应时间趋势",
    endpointPerformance: "端点性能",
    slowestEndpoints: "最慢端点",
    requestDistribution: "请求分布",
    excellent: "优秀",
    acceptable: "可接受",
    needsAttention: "需要关注",
    errorAnalysis: "错误分析",
    average: "平均值",
    throughput: "吞吐量",
    requestsPerSec: "每秒请求数",
    systemStatus: "系统状态",
    queryPerformance: "查询性能",
    responseTimeDescription: "随时间变化的平均响应时间",
    queryActivity: "查询活动",
    queryActivityDescription: "每个请求的数据库查询数量",
    topEndpoints: "热门端点",
    avgResponseByEndpoint: "按端点统计的平均响应时间",
    recentRequests: "最近请求",
    healthScore: "健康评分",
    performanceSummary: "性能摘要",
    realTimeMetrics: "基于最近请求的实时指标",
    avgResponse: "平均响应",
    slowRequests: "慢请求",
    activeEndpoints: "活跃端点",
    performanceBreakdown: "按 API 端点分解的性能",
    responseTimesByEndpoint: "按端点统计的响应时间",
    p50Median: "P50 (中位数)",
    p95: "P95",
    p99: "P99",
    totalQueries: "总查询数",
    queriesPerRequest: "每个请求的查询数",
    slowQueries: "慢查询",
    avgQueryTime: "平均查询时间",
    queryStatistics: "查询统计",
    slowQueriesTitle: "慢查询",
    errorAnalysisTitle: "错误分析",
    detailedMetrics: "详细指标",
    noEndpointData: "无端点数据",
    noExceptionsCaptured: "未捕获异常",
    calls: "次调用",
    errors: "个错误",
    successRate: "成功率",
  },

  database: {
    queries: "数据库查询",
    slowQueries: "慢查询",
    queryTime: "查询时间",
    queryType: "查询类型",
    affectedRows: "影响行数",
    searchPlaceholder: "搜索查询...",
    showSlowOnly: "仅显示慢查询",
    slowThreshold: "慢查询阈值 (ms)",
    noSlowQueries: "未发现慢查询",
    noSlowQueriesShort: "全部快速",
    noQueries: "尚未捕获任何查询",
  },

  detailDrawer: {
    title: {
      request: "请求详情",
      query: "查询详情",
      exception: "异常详情",
      trace: "链路跟踪详情",
    },
    common: {
      pending: "待处理",
      unknown: "未知",
    },
    request: {
      overview: {
        timestamp: "时间",
        clientIp: "客户端 IP",
        requestId: "请求 ID",
        url: "URL",
      },
      tabs: {
        headers: "请求头",
        body: "请求体",
        response: "响应体",
        queries: "数据库查询",
        errors: "异常",
      },
      headers: {
        requestTitle: "请求头",
        responseTitle: "响应头",
        noRequestHeaders: "无请求头",
        noResponseHeaders: "无响应头",
      },
      body: {
        queryParameters: "查询参数",
        requestTitle: "请求体",
        noRequestBody: "无请求体",
        responseTitle: "响应体",
        noResponseBody: "无响应体",
      },
      queries: {
        empty: "无数据库查询",
        queryLabel: "查询",
        rows: "行",
        parameters: "参数:",
      },
      errors: {
        empty: "无异常发生",
      },
    },
    query: {
      placeholder: "查询详情视图",
    },
    exception: {
      placeholder: "异常详情视图",
    },
    trace: {
      overview: {
        unknownOperation: "未知操作",
        unknownService: "未知服务",
        traceId: "Trace ID",
        spanCount: "Span 数量",
        startTime: "开始时间",
        duration: "持续时间",
        tags: "标签",
      },
      totalDuration: "总时长",
      waterfall: {
        title: "瀑布图",
      },
      spans: {
        title: "Span 详情",
        service: "服务",
        duration: "持续时间",
        startOffset: "起始偏移",
        depth: "层级",
        tags: "标签:",
      },
    },
  },
};

// Export translations
export const translations = {
  en,
  zh,
} as const;

// Default language
export const DEFAULT_LANGUAGE: Language = "en";

// Get translation object
export function getTranslation(language: Language): Translations {
  return translations[language] || translations[DEFAULT_LANGUAGE];
}

// Helper to get nested translation values
export function getNestedTranslation(
  translations: Translations,
  key: string,
): string {
  const keys = key.split(".");
  let value: any = translations;

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = value[k];
    } else {
      return key; // If translation missing, return key
    }
  }

  return typeof value === "string" ? value : key;
}
