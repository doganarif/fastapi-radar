import { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient, BackgroundTaskInfo } from "@/api/client";
import { useT } from "@/i18n";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDuration } from "@/hooks/useMetrics";
import { cn } from "@/lib/utils";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";

type ConnectionStatus = "connecting" | "connected" | "disconnected";
type NormalizedStatus = "queued" | "running" | "finished" | "failed";

function normalizeStatus(status: string): NormalizedStatus {
  const value = status.toLowerCase();
  if (value.includes("fail")) {
    return "failed";
  }
  if (value.includes("run")) {
    return "running";
  }
  if (value.includes("finish") || value.includes("complete")) {
    return "finished";
  }
  return "queued";
}

function formatTimestamp(timestamp: string | null): string {
  if (!timestamp) {
    return "—";
  }
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }
  return date.toLocaleString();
}

function getParamsPreview(task: BackgroundTaskInfo): string {
  if (!task.params) {
    return "";
  }
  const hasKwargs =
    task.params.kwargs && Object.keys(task.params.kwargs).length > 0;
  const source = hasKwargs ? task.params.kwargs : task.params.args ?? [];
  try {
    const json = JSON.stringify(source, null, hasKwargs ? 2 : 0);
    if (!json) {
      return "";
    }
    if (json.length > 200) {
      return `${json.slice(0, 200)}…`;
    }
    return json;
  } catch {
    return String(source);
  }
}

const statusStyles: Record<NormalizedStatus, string> = {
  queued: "bg-muted text-foreground",
  running:
    "bg-blue-500/10 text-blue-600 border border-blue-500/30 dark:text-blue-400",
  finished:
    "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 dark:text-emerald-400",
  failed:
    "bg-destructive/10 text-destructive border border-destructive/40 dark:text-destructive",
};

export function BackgroundTasksPage() {
  const t = useT();
  const [tasks, setTasks] = useState<BackgroundTaskInfo[]>([]);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("connecting");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [rerunning, setRerunning] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await apiClient.getBackgroundTasks();
      setTasks(data);
      setErrorMessage(null);
    } catch (error) {
      console.error("Failed to refresh background tasks", error);
      setErrorMessage(
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const basePath = (import.meta.env.BASE_URL || "/__radar/").replace(
      /\/+$/,
      "",
    );
    const websocketUrl = `${protocol}://${window.location.host}${basePath}/ws/background-tasks`;
    const socket = new WebSocket(websocketUrl);
    let isClosed = false;

    socket.onopen = () => {
      if (!isClosed) {
        setConnectionStatus("connected");
      }
    };

    socket.onclose = () => {
      if (!isClosed) {
        setConnectionStatus("disconnected");
      }
    };

    socket.onerror = () => {
      if (!isClosed) {
        setConnectionStatus("disconnected");
      }
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.tasks) {
          setTasks(payload.tasks);
          setErrorMessage(null);
        }
      } catch (error) {
        console.error("Failed to parse background tasks payload", error);
      }
    };

    return () => {
      isClosed = true;
      socket.close();
    };
  }, []);

  const handleClear = useCallback(async () => {
    if (!tasks.length) {
      return;
    }
    const confirmed = window.confirm(`${t("backgroundTasks.actions.clear")}?`);
    if (!confirmed) {
      return;
    }

    setIsClearing(true);
    try {
      await apiClient.clearBackgroundTasks();
      await handleRefresh();
    } catch (error) {
      console.error("Failed to clear background tasks", error);
      setErrorMessage(
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setIsClearing(false);
    }
  }, [handleRefresh, t, tasks.length]);

  const handleRerun = useCallback(async (taskId: string) => {
    setRerunning((prev) => {
      const next = new Set(prev);
      next.add(taskId);
      return next;
    });
    try {
      const result = await apiClient.rerunBackgroundTask(taskId);
      if (!result.ok) {
        throw new Error("Failed to rerun task");
      }
    } catch (error) {
      console.error("Failed to rerun background task", error);
      setErrorMessage(
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setRerunning((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  }, []);

  const summary = useMemo(() => {
    const totals = tasks.reduce(
      (acc, task) => {
        const status = normalizeStatus(task.status);
        acc[status] += 1;
        return acc;
      },
      {
        queued: 0,
        running: 0,
        finished: 0,
        failed: 0,
      } as Record<NormalizedStatus, number>,
    );

    return [
      {
        label: t("backgroundTasks.status.running"),
        value: totals.running,
      },
      {
        label: t("backgroundTasks.status.failed"),
        value: totals.failed,
      },
      {
        label: t("backgroundTasks.status.finished"),
        value: totals.finished,
      },
      {
        label: t("backgroundTasks.status.queued"),
        value: totals.queued,
      },
    ];
  }, [tasks, t]);

  const connectionLabel =
    connectionStatus === "connected"
      ? t("backgroundTasks.connection.connected")
      : connectionStatus === "connecting"
      ? t("common.loading")
      : t("backgroundTasks.connection.disconnected");

  const connectionDotClass =
    connectionStatus === "connected"
      ? "bg-emerald-500"
      : connectionStatus === "connecting"
      ? "bg-amber-500"
      : "bg-red-500";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("pages.backgroundTasks.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("pages.backgroundTasks.description")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summary.map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardDescription>{item.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 pb-3 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <CardTitle>{t("pages.backgroundTasks.title")}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span
                className={cn("h-2 w-2 rounded-full", connectionDotClass)}
              />
              {connectionLabel}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={isClearing || !tasks.length}
            >
              {isClearing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </div>
          )}
          {tasks.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {t("backgroundTasks.empty")}
            </div>
          ) : (
            <ScrollArea className="w-full">
              <table className="w-full min-w-[960px] table-fixed text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-muted-foreground">
                    <th className="px-3 py-2 font-medium">
                      {t("backgroundTasks.fields.id")}
                    </th>
                    <th className="px-3 py-2 font-medium">
                      {t("backgroundTasks.fields.function")}
                    </th>
                    <th className="px-3 py-2 font-medium">
                      {t("backgroundTasks.fields.status")}
                    </th>
                    <th className="px-3 py-2 font-medium">
                      {t("backgroundTasks.fields.queuedAt")}
                    </th>
                    <th className="px-3 py-2 font-medium">
                      {t("backgroundTasks.fields.startedAt")}
                    </th>
                    <th className="px-3 py-2 font-medium">
                      {t("backgroundTasks.fields.finishedAt")}
                    </th>
                    <th className="px-3 py-2 font-medium">
                      {t("backgroundTasks.fields.duration")}
                    </th>
                    <th className="px-3 py-2 font-medium">
                      {t("backgroundTasks.fields.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => {
                    const status = normalizeStatus(task.status);
                    const isRerunning = rerunning.has(task.id);
                    const canRerun = status !== "running";
                    const paramsPreview = getParamsPreview(task);

                    return (
                      <tr
                        key={task.id}
                        className="border-b border-border/60 last:border-b-0"
                      >
                        <td className="px-3 py-3 align-top font-mono text-xs">
                          <div className="break-all">{task.id}</div>
                          {paramsPreview && (
                            <pre className="mt-2 max-h-24 overflow-hidden whitespace-pre-wrap rounded-md bg-muted/50 p-2 font-mono text-[10px] leading-relaxed">
                              {paramsPreview}
                            </pre>
                          )}
                        </td>
                        <td className="px-3 py-3 align-top text-sm">
                          <div className="font-medium">
                            {task.function_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {task.function_key}
                          </div>
                        </td>
                        <td className="px-3 py-3 align-top text-sm">
                          <Badge
                            variant="secondary"
                            className={cn("capitalize", statusStyles[status])}
                          >
                            {t(`backgroundTasks.status.${status}`)}
                          </Badge>
                          {task.error_message && (
                            <div className="mt-2 text-xs text-destructive">
                              {task.error_message}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 align-top text-xs text-muted-foreground">
                          {formatTimestamp(task.queued_at)}
                        </td>
                        <td className="px-3 py-3 align-top text-xs text-muted-foreground">
                          {formatTimestamp(task.started_at)}
                        </td>
                        <td className="px-3 py-3 align-top text-xs text-muted-foreground">
                          {formatTimestamp(task.ended_at)}
                        </td>
                        <td className="px-3 py-3 align-top text-xs text-muted-foreground">
                          {formatDuration(task.duration_ms)}
                        </td>
                        <td className="px-3 py-3 align-top text-xs">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isRerunning || !canRerun}
                              onClick={() => handleRerun(task.id)}
                            >
                              {isRerunning ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                t("backgroundTasks.actions.rerun")
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
