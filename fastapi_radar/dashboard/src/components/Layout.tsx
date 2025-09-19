import { useState } from "react";
import { Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Menu,
  Moon,
  Sun,
  User,
  Settings,
  LogOut,
  HelpCircle,
  ChevronLeft,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";

export function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);

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
                className="hidden sm:flex items-center gap-1"
              >
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                Connected
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

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-4 w-4" />
                    <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">
                        High error rate detected
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Error rate exceeded 5% in the last 5 minutes
                      </p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">Slow query warning</p>
                      <p className="text-xs text-muted-foreground">
                        3 queries took longer than 1000ms
                      </p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-center">
                    View all notifications
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>AD</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Help & Support
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
