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
import { Separator } from "@/components/ui/separator";
import { Moon, Sun, Database, AlertTriangle, Trash2 } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export function SettingsPage() {
  const { theme, setTheme } = useTheme();

  // Get real stats for database status
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["settings-stats"],
    queryFn: () => apiClient.getStats(24 * 7), // Last 7 days
    refetchInterval: 30000,
  });

  const handleClearData = async () => {
    if (confirm("Are you sure you want to clear all captured data?")) {
      await apiClient.clearData();
      window.location.reload();
    }
  };

  const handleClearOldData = async (hours: number) => {
    const days = hours / 24;
    const displayDays = days === 1 ? "1 day" : `${days} days`;
    if (
      confirm(`Are you sure you want to clear data older than ${displayDays}?`)
    ) {
      await apiClient.clearData(hours);
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your dashboard preferences and data
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize the look and feel of your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Choose between light and dark mode
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("light")}
                >
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("dark")}
                >
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Status */}
        <Card>
          <CardHeader>
            <CardTitle>Database Status</CardTitle>
            <CardDescription>
              Current database usage and statistics (last 7 days)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {statsLoading ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Loading statistics...
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Requests
                  </span>
                  <span className="font-medium">
                    {stats?.total_requests !== undefined
                      ? stats.total_requests.toLocaleString()
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Queries
                  </span>
                  <span className="font-medium">
                    {stats?.total_queries !== undefined
                      ? stats.total_queries.toLocaleString()
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Exceptions
                  </span>
                  <span className="font-medium">
                    {stats?.total_exceptions !== undefined
                      ? stats.total_exceptions.toLocaleString()
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Slow Queries
                  </span>
                  <span className="font-medium">
                    {stats?.slow_queries !== undefined
                      ? stats.slow_queries.toLocaleString()
                      : "—"}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Avg Response Time
                  </span>
                  <span className="font-medium">
                    {stats?.avg_response_time !== null &&
                    stats?.avg_response_time !== undefined
                      ? `${Math.round(stats.avg_response_time)}ms`
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Requests/Minute
                  </span>
                  <span className="font-medium">
                    {stats?.requests_per_minute !== undefined
                      ? stats.requests_per_minute.toFixed(1)
                      : "—"}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>
              Manage your captured monitoring data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Quick Actions</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Clear captured data to free up space or start fresh
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => handleClearOldData(24)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear data older than 1 day
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => handleClearOldData(24 * 7)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear data older than 7 days
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => handleClearOldData(24 * 30)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear data older than 30 days
                </Button>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Danger Zone</Label>
              <p className="text-sm text-muted-foreground mb-3">
                This action cannot be undone
              </p>
              <Button variant="destructive" onClick={handleClearData}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Clear All Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>About FastAPI Radar</CardTitle>
            <CardDescription>
              Real-time monitoring dashboard for FastAPI applications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">
                FastAPI Radar provides comprehensive monitoring for your FastAPI
                applications, including request tracking, database query
                analysis, and exception monitoring.
              </p>
              <p>
                <strong>Features:</strong>
              </p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Real-time request monitoring</li>
                <li>Database query performance tracking</li>
                <li>Exception and error tracking</li>
                <li>Performance metrics and analytics</li>
                <li>Dark/Light theme support</li>
              </ul>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium">0.1.2</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Dashboard</span>
              <span className="font-medium">
                <Database className="inline h-3 w-3 mr-1" />
                Connected
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
