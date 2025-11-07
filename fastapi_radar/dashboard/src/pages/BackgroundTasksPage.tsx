import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Clock, CheckCircle2, XCircle, Loader2, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function BackgroundTasksPage() {
  const navigate = useNavigate();

  const { data: tasks, isLoading, isError, error } = useQuery({
    queryKey: ["background-tasks"],
    queryFn: () => apiClient.getBackgroundTasks({ limit: 100 }),
    refetchInterval: 3000,
  });

  const getStatusColor = (
    status: string
  ): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case "completed":
        return "default";
      case "failed":
        return "destructive";
      case "running":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4" />;
      case "failed":
        return <XCircle className="h-4 w-4" />;
      case "running":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return "N/A";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="border-destructive">
          <CardContent className="py-8 text-center">
            <p className="text-destructive font-medium">Failed to load background tasks</p>
            <p className="text-sm text-muted-foreground mt-2">
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Background Tasks</h1>
        <p className="text-muted-foreground">
          Monitor and track background tasks executed in your application
        </p>
      </div>

      <div className="grid gap-4">
        {tasks && tasks.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No background tasks found
            </CardContent>
          </Card>
        )}

        {tasks?.map((task) => (
          <Card key={task.task_id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    {getStatusIcon(task.status)}
                    {task.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground font-mono">
                    {task.task_id}
                  </p>
                </div>
                <Badge variant={getStatusColor(task.status)}>
                  {task.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Started</p>
                  <p className="font-medium">
                    {task.start_time
                      ? format(new Date(task.start_time), "HH:mm:ss")
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium">{formatDuration(task.duration_ms)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Request ID</p>
                  {task.request_id ? (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 font-mono text-xs"
                      onClick={() => navigate(`/requests/${task.request_id}`)}
                    >
                      {task.request_id.slice(0, 8)}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  ) : (
                    <p className="font-mono text-xs">N/A</p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {format(new Date(task.created_at), "HH:mm:ss")}
                  </p>
                </div>
              </div>
              {task.error && (
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded">
                  <p className="text-sm text-destructive font-medium">Error:</p>
                  <p className="text-sm text-destructive mt-1">{task.error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
