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
import {
  Moon,
  Sun,
  Database,
  AlertTriangle,
  Trash2,
  Globe,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation, useLanguage, Language } from "@/i18n";

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();

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
        <h1 className="text-3xl font-bold tracking-tight">
          {t("pages.settings.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("pages.settings.description")}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.appearance.title")}</CardTitle>
            <CardDescription>
              {t("settings.appearance.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("settings.appearance.theme")}</Label>
              <p className="text-sm text-muted-foreground mb-3">
                {t("settings.appearance.themeDescription")}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("light")}
                >
                  <Sun className="mr-2 h-4 w-4" />
                  {t("settings.appearance.light")}
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("dark")}
                >
                  <Moon className="mr-2 h-4 w-4" />
                  {t("settings.appearance.dark")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.language.title")}</CardTitle>
            <CardDescription>
              {t("settings.language.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("settings.language.current")}</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant={language === "en" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLanguage("en" as Language)}
                >
                  <Globe className="mr-2 h-4 w-4" />
                  {t("settings.language.english")}
                </Button>
                <Button
                  variant={language === "zh" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLanguage("zh" as Language)}
                >
                  <Globe className="mr-2 h-4 w-4" />
                  {t("settings.language.chinese")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Status */}
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.database.title")}</CardTitle>
            <CardDescription>
              {t("settings.database.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {statsLoading ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                {t("settings.database.loading")}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t("settings.database.totalRequests")}
                  </span>
                  <span className="font-medium">
                    {stats?.total_requests !== undefined
                      ? stats.total_requests.toLocaleString()
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t("settings.database.totalQueries")}
                  </span>
                  <span className="font-medium">
                    {stats?.total_queries !== undefined
                      ? stats.total_queries.toLocaleString()
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t("settings.database.totalExceptions")}
                  </span>
                  <span className="font-medium">
                    {stats?.total_exceptions !== undefined
                      ? stats.total_exceptions.toLocaleString()
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t("settings.database.slowQueries")}
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
                    {t("settings.database.avgResponseTime")}
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
                    {t("settings.database.requestsPerMinute")}
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
            <CardTitle>{t("settings.dataManagement.title")}</CardTitle>
            <CardDescription>
              {t("settings.dataManagement.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("settings.dataManagement.quickActions")}</Label>
              <p className="text-sm text-muted-foreground mb-3">
                {t("settings.dataManagement.quickActionsDescription")}
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => handleClearOldData(24)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("settings.dataManagement.clear1Day")}
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => handleClearOldData(24 * 7)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("settings.dataManagement.clear7Days")}
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => handleClearOldData(24 * 30)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("settings.dataManagement.clear30Days")}
                </Button>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>{t("settings.dataManagement.dangerZone")}</Label>
              <p className="text-sm text-muted-foreground mb-3">
                {t("settings.dataManagement.dangerZoneDescription")}
              </p>
              <Button variant="destructive" onClick={handleClearData}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                {t("settings.dataManagement.clearAll")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t("settings.about.title")}</CardTitle>
            <CardDescription>{t("settings.about.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">{t("settings.about.content")}</p>
              <p>
                <strong>{t("settings.about.features")}:</strong>
              </p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>{t("settings.about.feature1")}</li>
                <li>{t("settings.about.feature2")}</li>
                <li>{t("settings.about.feature3")}</li>
                <li>{t("settings.about.feature4")}</li>
                <li>{t("settings.about.feature5")}</li>
              </ul>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t("settings.about.version")}
              </span>
              <span className="font-medium">0.2.0</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t("settings.about.dashboard")}
              </span>
              <span className="font-medium">
                <Database className="inline h-3 w-3 mr-1" />
                {t("settings.about.connected")}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
