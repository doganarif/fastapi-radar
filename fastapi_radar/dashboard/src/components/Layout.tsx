import { apiClient } from "@/api/client";
import { Sidebar } from "@/components/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Menu, Moon, RefreshCw, Sun, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

export function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const t = useT();

  useEffect(() => {
    const checkHealth = async () => {
      const ok = await apiClient.checkHealth();
      setIsConnected(ok);
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const { refetch: refetchAll } = useQuery({
    queryKey: ["stats"],
    queryFn: () => apiClient.getStats(1),
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchAll();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleClearData = async () => {
    if (confirm("Are you sure you want to clear all captured data?")) {
      await apiClient.clearData();
      await refetchAll();
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div
        className={cn(
          "hidden md:flex h-full bg-background border-r transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        <Sidebar collapsed={sidebarCollapsed} className="w-full" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-background border-b px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden md:flex"
              >
                {sidebarCollapsed ? (
                  <Menu className="h-5 w-5" />
                ) : (
                  <ChevronLeft className="h-5 w-5" />
                )}
              </Button>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center space-x-3">
              {/* Status Badge */}
              <Badge
                variant="outline"
                className={cn(
                  "hidden sm:flex items-center gap-1",
                  !isConnected && "border-red-400 text-red-500"
                )}
              >
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    isConnected
                      ? "bg-green-500 animate-pulse"
                      : "bg-red-500"
                  )}
                />
                {isConnected ? t("layout.connected") : t("layout.disconnected")}
              </Badge>

              {/* Refresh Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                title="Refresh data"
              >
                <RefreshCw
                  className={cn("h-4 w-4", isRefreshing && "animate-spin")}
                />
              </Button>

              {/* Clear Data Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearData}
                title="Clear all data"
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                title="Toggle theme"
              >
                {theme === "light" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-muted/10">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
