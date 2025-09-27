import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TracesList } from "@/components/TracesList";
import { useT } from "@/i18n";

export function TracingPage() {
  const t = useT();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("pages.tracing.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("pages.tracing.description")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("pages.tracing.tracesCardTitle")}</CardTitle>
          <CardDescription>
            {t("pages.tracing.tracesCardDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TracesList />
        </CardContent>
      </Card>
    </div>
  );
}
