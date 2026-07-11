import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { DashboardPage } from "@/pages/DashboardPage";
import { RequestsPage } from "@/pages/RequestsPage";
import { RequestDetailPage } from "@/pages/RequestDetailPage";
import { TracingPage } from "@/pages/TracingPage";
import { PerformancePage } from "@/pages/PerformancePage";
import { SettingsPage } from "@/pages/SettingsPage";
import { BackgroundTasksPage } from "@/pages/BackgroundTasksPage";
import { LogsPage } from "@/pages/LogsPage";

import { DetailDrawerProvider } from "@/context/DetailDrawerContext";
import { DetailDrawer } from "@/components/DetailDrawer";
import { LanguageProvider, useT } from "@/i18n";
import { useDetailDrawer } from "@/context/DetailDrawerContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

// Base path is injected at runtime by the server into window.__RADAR_BASE_PATH__.
// Falls back to the default path for local dev.
const BASE_PATH: string = (window as { __RADAR_BASE_PATH__?: string }).__RADAR_BASE_PATH__ ?? "/__radar/";

function App() {
  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <DetailDrawerProvider>
          <BrowserRouter basename={BASE_PATH}>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<DashboardPage />} />
                <Route path="requests" element={<RequestsPage />} />
                <Route path="requests/:requestId" element={<RequestDetailPage />} />
                <Route path="tracing" element={<TracingPage />} />
                <Route path="performance" element={<PerformancePage />} />
                <Route path="database" element={<DatabasePageWrapped />} />
                <Route path="exceptions" element={<ExceptionsPageWrapped />} />
                <Route path="background-tasks" element={<BackgroundTasksPage />} />
                <Route path="logs" element={<LogsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                {/* Fallback to dashboard for unmatched routes */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
            <DetailDrawerWrapper />
          </BrowserRouter>
        </DetailDrawerProvider>
      </QueryClientProvider>
    </LanguageProvider>
  );
}

// Wrapper component to use the context
function DetailDrawerWrapper() {
  const { isOpen, closeDetail, detailType, detailId } = useDetailDrawer();
  return (
    <DetailDrawer
      open={isOpen}
      onOpenChange={closeDetail}
      type={detailType}
      id={detailId}
    />
  );
}

// Database Page
import { useState } from "react";
import { QueriesList } from "@/components/QueriesList";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RefreshIntervalSelect } from "@/components/ui/refresh-interval-select";

function DatabasePageWrapped() {
  const t = useT();
  const [refreshInterval, setRefreshInterval] = useState(5000);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("pages.database.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("pages.database.description")}
          </p>
        </div>
        <RefreshIntervalSelect value={refreshInterval} onChange={setRefreshInterval} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("database.queries")}</CardTitle>
          <CardDescription>
            {t("pages.database.cardDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QueriesList refreshInterval={refreshInterval} />
        </CardContent>
      </Card>
    </div>
  );
}

// Exceptions Page
import { ExceptionsList } from "@/components/ExceptionsList";

function ExceptionsPageWrapped() {
  const t = useT();
  const [refreshInterval, setRefreshInterval] = useState(5000);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("pages.exceptions.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("pages.exceptions.description")}
          </p>
        </div>
        <RefreshIntervalSelect value={refreshInterval} onChange={setRefreshInterval} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("exceptions.recentExceptions")}</CardTitle>
          <CardDescription>{t("pages.exceptions.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ExceptionsList refreshInterval={refreshInterval} />
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
