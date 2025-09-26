import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Database,
  AlertTriangle,
  TrendingUp,
  Settings,
  Home,
  GitBranch,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";

interface SidebarProps {
  className?: string;
  collapsed?: boolean;
}

const mainNavItems = [
  {
    title: "Dashboard",
    icon: Home,
    href: "/",
    badge: null,
  },
  {
    title: "Requests",
    icon: Activity,
    href: "/requests",
    badge: null,
  },
  {
    title: "链路跟踪",
    icon: GitBranch,
    href: "/tracing",
    badge: null,
  },
  {
    title: "Database",
    icon: Database,
    href: "/database",
    badge: null,
  },
  {
    title: "Exceptions",
    icon: AlertTriangle,
    href: "/exceptions",
    badge: null,
  },
  {
    title: "Performance",
    icon: TrendingUp,
    href: "/performance",
    badge: null,
  },
];

const systemNavItems = [
  {
    title: "Settings",
    icon: Settings,
    href: "/settings",
    badge: null,
  },
];

export function Sidebar({ className, collapsed = false }: SidebarProps) {
  const location = useLocation();

  // Get real-time stats for badges
  const { data: stats } = useQuery({
    queryKey: ["sidebar-stats"],
    queryFn: () => apiClient.getStats(1),
    refetchInterval: 30000, // Update every 30 seconds
  });

  // Update nav items with real data
  const navItemsWithBadges = mainNavItems.map((item) => {
    if (
      item.title === "Exceptions" &&
      stats?.total_exceptions &&
      stats.total_exceptions > 0
    ) {
      return {
        ...item,
        badge: stats.total_exceptions.toString(),
        badgeVariant: "destructive" as const,
      };
    }
    return item;
  });

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="flex items-center mb-6 px-3">
            {!collapsed && (
              <>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🚀</span>
                  <div className="flex flex-col">
                    <h2 className="text-lg font-semibold tracking-tight">
                      FastAPI Radar
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      Performance Monitoring
                    </span>
                  </div>
                </div>
              </>
            )}
            {collapsed && <span className="text-2xl mx-auto">🚀</span>}
          </div>

          <div className="space-y-1">
            <h2
              className={cn(
                "mb-2 px-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase",
                collapsed && "sr-only",
              )}
            >
              {!collapsed && "Navigation"}
            </h2>
            {navItemsWithBadges.map((item) => (
              <Button
                key={item.href}
                variant={
                  location.pathname === item.href ? "secondary" : "ghost"
                }
                className={cn(
                  "w-full justify-start relative",
                  collapsed && "justify-center",
                )}
                asChild
              >
                <Link to={item.href}>
                  <item.icon className={cn("h-4 w-4", !collapsed && "mr-2")} />
                  {!collapsed && (
                    <>
                      {item.title}
                      {item.badge && (
                        <Badge
                          variant={item.badgeVariant || "outline"}
                          className="ml-auto"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Link>
              </Button>
            ))}
          </div>

          <div className="space-y-1 mt-6">
            <h2
              className={cn(
                "mb-2 px-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase",
                collapsed && "sr-only",
              )}
            >
              {!collapsed && "System"}
            </h2>
            {systemNavItems.map((item) => (
              <Button
                key={item.href}
                variant={
                  location.pathname === item.href ? "secondary" : "ghost"
                }
                className={cn(
                  "w-full justify-start",
                  collapsed && "justify-center",
                )}
                asChild
              >
                <Link to={item.href}>
                  <item.icon className={cn("h-4 w-4", !collapsed && "mr-2")} />
                  {!collapsed && item.title}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
