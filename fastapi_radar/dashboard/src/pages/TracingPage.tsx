import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RefreshIntervalSelect } from "@/components/ui/refresh-interval-select";
import { TracesList } from "@/components/TracesList";
import { useT } from "@/i18n";

export function TracingPage() {
  const t = useT();
  const [refreshInterval, setRefreshInterval] = useState(30000);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("pages.tracing.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("pages.tracing.description")}
          </p>
        </div>
        <RefreshIntervalSelect value={refreshInterval} onChange={setRefreshInterval} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("pages.tracing.tracesCardTitle")}</CardTitle>
          <CardDescription>
            {t("pages.tracing.tracesCardDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TracesList refreshInterval={refreshInterval} />
        </CardContent>
      </Card>
    </div>
  );
}
