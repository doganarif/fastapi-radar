import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Moon,
  Sun,
  Database,
  Mail,
  Smartphone,
  Key,
  AlertTriangle,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState("5");
  const [retentionDays, setRetentionDays] = useState("30");
  const [slowQueryThreshold, setSlowQueryThreshold] = useState("100");

  // Get real stats for database status
  const { data: stats } = useQuery({
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

  const handleClearOldData = async () => {
    const days = parseInt(retentionDays);
    if (
      confirm(`Are you sure you want to clear data older than ${days} days?`)
    ) {
      await apiClient.clearData(days * 24);
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your dashboard preferences and configuration
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose between light and dark mode
                  </p>
                </div>
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
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select defaultValue="utc">
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utc">UTC</SelectItem>
                    <SelectItem value="est">Eastern Time</SelectItem>
                    <SelectItem value="pst">Pacific Time</SelectItem>
                    <SelectItem value="cet">Central European Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dashboard Behavior</CardTitle>
              <CardDescription>
                Configure how the dashboard behaves
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-refresh">Auto Refresh</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically refresh data at regular intervals
                  </p>
                </div>
                <Switch
                  id="auto-refresh"
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
              </div>
              {autoRefresh && (
                <div className="space-y-2">
                  <Label htmlFor="refresh-interval">Refresh Interval</Label>
                  <Select
                    value={refreshInterval}
                    onValueChange={setRefreshInterval}
                  >
                    <SelectTrigger id="refresh-interval">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 seconds</SelectItem>
                      <SelectItem value="10">10 seconds</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="60">1 minute</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to be notified about important events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts via email
                    </p>
                  </div>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <Label htmlFor="push-notifications">
                      Push Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts in your browser
                    </p>
                  </div>
                </div>
                <Switch
                  id="push-notifications"
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Alert Triggers</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <Label className="font-normal">
                      High error rate (&gt;5%)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <Label className="font-normal">
                      Slow response time (&gt;1000ms)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch />
                    <Label className="font-normal">
                      Database connection failures
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <Label className="font-normal">Unhandled exceptions</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Thresholds</CardTitle>
              <CardDescription>
                Define what constitutes slow performance in your application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slow-query">Slow Query Threshold (ms)</Label>
                <Input
                  id="slow-query"
                  type="number"
                  value={slowQueryThreshold}
                  onChange={(e) => setSlowQueryThreshold(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Queries taking longer than this will be marked as slow
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="slow-request">
                  Slow Request Threshold (ms)
                </Label>
                <Input id="slow-request" type="number" defaultValue="500" />
                <p className="text-sm text-muted-foreground">
                  Requests taking longer than this will be marked as slow
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="error-rate">Error Rate Alert (%)</Label>
                <Input id="error-rate" type="number" defaultValue="5" />
                <p className="text-sm text-muted-foreground">
                  Alert when error rate exceeds this percentage
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monitoring Configuration</CardTitle>
              <CardDescription>
                Configure what data to collect and monitor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="collect-headers">Collect Request Headers</Label>
                <Switch id="collect-headers" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="collect-body">Collect Request Body</Label>
                <Switch id="collect-body" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="collect-response">Collect Response Body</Label>
                <Switch id="collect-response" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="track-user">Track User Sessions</Label>
                <Switch id="track-user" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage security and privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="api-key"
                    type="password"
                    value="••••••••••••••••••••"
                    readOnly
                    disabled
                  />
                  <Button variant="outline" disabled>
                    <Key className="mr-2 h-4 w-4" />
                    Not Available
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  API key management is not available in the current version
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Data Privacy</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <Label className="font-normal">Mask sensitive data</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <Label className="font-normal">Encrypt stored data</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch />
                    <Label className="font-normal">Enable audit logging</Label>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Access Control</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Require authentication</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      Enable two-factor authentication
                    </span>
                    <Switch />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Retention</CardTitle>
              <CardDescription>
                Configure how long to keep monitoring data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="retention">Data Retention Period</Label>
                <Select value={retentionDays} onValueChange={setRetentionDays}>
                  <SelectTrigger id="retention">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Data older than this will be automatically deleted
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Data Management Actions</Label>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    disabled
                  >
                    <Database className="mr-2 h-4 w-4" />
                    Export All Data (Coming Soon)
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleClearOldData}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Clear Old Data
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    onClick={handleClearData}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Clear All Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Database Status</CardTitle>
              <CardDescription>
                Current database usage and statistics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Requests
                </span>
                <span className="font-medium">
                  {stats?.total_requests?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Queries
                </span>
                <span className="font-medium">
                  {stats?.total_queries?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Exceptions
                </span>
                <span className="font-medium">
                  {stats?.total_exceptions?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Slow Queries
                </span>
                <span className="font-medium">
                  {stats?.slow_queries?.toLocaleString() || 0}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Average Response Time
                </span>
                <span className="font-medium">
                  {stats?.avg_response_time?.toFixed(0) || 0}ms
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Requests Per Minute
                </span>
                <span className="font-medium">
                  {stats?.requests_per_minute?.toFixed(1) || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
