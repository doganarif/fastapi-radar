import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/api/client";
import { RequestsList } from "./RequestsList";
import { QueriesList } from "./QueriesList";
import { ExceptionsList } from "./ExceptionsList";
import { StatsCards } from "./StatsCards";
import {
  Activity,
  Database,
  AlertTriangle,
  BarChart3,
  Moon,
  Sun,
  Trash2,
} from "lucide-react";

export function Dashboard() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ["stats"],
    queryFn: () => apiClient.getStats(1),
    refetchInterval: 5000,
  });

  useEffect(() => {
    const savedTheme =
      (localStorage.getItem("theme") as "light" | "dark") || "light";
    setTheme(savedTheme);
    document.documentElement.className = savedTheme;
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.className = newTheme;
  };

  const handleClearData = async () => {
    if (confirm("Are you sure you want to clear all captured data?")) {
      await apiClient.clearData();
      refetchStats();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                🚀 FastAPI Radar
              </h1>
              <Badge variant="outline">Development Mode</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                title="Toggle theme"
              >
                {theme === "light" ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearData}
                title="Clear all data"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {stats && <StatsCards stats={stats} />}

        <Tabs defaultValue="requests" className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Requests
            </TabsTrigger>
            <TabsTrigger value="queries" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Queries
            </TabsTrigger>
            <TabsTrigger value="exceptions" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Exceptions
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>HTTP Requests</CardTitle>
                <CardDescription>
                  Monitor all incoming HTTP requests and their responses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RequestsList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="queries">
            <Card>
              <CardHeader>
                <CardTitle>Database Queries</CardTitle>
                <CardDescription>
                  Track all SQL queries executed by your application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QueriesList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exceptions">
            <Card>
              <CardHeader>
                <CardTitle>Exceptions</CardTitle>
                <CardDescription>
                  View all exceptions caught during request processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ExceptionsList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <Card>
              <CardHeader>
                <CardTitle>Performance Statistics</CardTitle>
                <CardDescription>
                  Overview of application performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">
                              Request Distribution
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {stats.requests_per_minute.toFixed(1)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              requests per minute
                            </p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">
                              Query Performance
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {stats.slow_queries} / {stats.total_queries}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              slow queries
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
