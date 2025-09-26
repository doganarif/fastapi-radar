import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TracesList } from "@/components/TracesList";

export function TracingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">链路跟踪</h1>
        <p className="text-muted-foreground">
          查看应用程序的分布式追踪信息和瀑布流图
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>追踪记录</CardTitle>
          <CardDescription>
            浏览所有链路追踪数据，点击查看详细的瀑布流图
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TracesList />
        </CardContent>
      </Card>
    </div>
  );
}
