import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { DashboardPage } from "@/pages/DashboardPage";
import { RequestsPage } from "@/pages/RequestsPage";
import { PerformancePage } from "@/pages/PerformancePage";
import { SettingsPage } from "@/pages/SettingsPage";
import { DetailDrawerProvider } from "@/context/DetailDrawerContext";
import { DetailDrawer } from "@/components/DetailDrawer";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

// Base path for the dashboard (must match the Vite config base)
const BASE_PATH = "/__radar/";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DetailDrawerProvider>
        <BrowserRouter basename={BASE_PATH}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="requests" element={<RequestsPage />} />
              <Route path="performance" element={<PerformancePage />} />
              <Route path="database" element={<DatabasePage />} />
              <Route path="exceptions" element={<ExceptionsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              {/* Fallback to dashboard for unmatched routes */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <DetailDrawerWrapper />
      </DetailDrawerProvider>
    </QueryClientProvider>
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
import { QueriesList } from "@/components/QueriesList";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function DatabasePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Database Monitoring
        </h1>
        <p className="text-muted-foreground">
          Track SQL queries and database performance
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SQL Queries</CardTitle>
          <CardDescription>
            All database queries executed by your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QueriesList />
        </CardContent>
      </Card>
    </div>
  );
}

// Exceptions Page
import { ExceptionsList } from "@/components/ExceptionsList";

function ExceptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Exception Tracking
        </h1>
        <p className="text-muted-foreground">
          Monitor and debug application exceptions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exceptions</CardTitle>
          <CardDescription>
            All exceptions caught during request processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExceptionsList />
        </CardContent>
      </Card>
    </div>
  );
}

// Import useDetailDrawer for the wrapper component
import { useDetailDrawer } from "@/context/DetailDrawerContext";

export default App;
