import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient, QueryDetail } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Database } from "lucide-react";
import { format } from "@/lib/date";
// import { Prism as SyntaxHighlighter } from "prism-react-renderer";

export function QueriesList() {
  const [slowOnly, setSlowOnly] = useState(false);

  const { data: queries, isLoading } = useQuery({
    queryKey: ["queries", slowOnly],
    queryFn: () =>
      apiClient.getQueries({
        limit: 100,
        slow_only: slowOnly,
        slow_threshold: 100,
      }),
    refetchInterval: 2000,
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading queries...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant={slowOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setSlowOnly(!slowOnly)}
          >
            {slowOnly ? "Showing slow queries" : "Show all queries"}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {queries?.map((query: QueryDetail) => (
          <QueryItem key={query.id} query={query} />
        ))}
        {queries?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No queries captured yet
          </div>
        )}
      </div>
    </div>
  );
}

interface QueryItemProps {
  query: QueryDetail;
}

function QueryItem({ query }: QueryItemProps) {
  const [expanded, setExpanded] = useState(false);
  const isSlow = query.duration_ms && query.duration_ms > 100;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              {isSlow && <Badge variant="destructive">SLOW</Badge>}
              {query.connection_name && (
                <Badge variant="outline">
                  <Database className="h-3 w-3 mr-1" />
                  {query.connection_name}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                <Clock className="h-3 w-3 inline mr-1" />
                {format(query.created_at)}
              </span>
            </div>
            <code className="text-xs font-mono line-clamp-2">{query.sql}</code>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            {query.duration_ms && (
              <span
                className={`text-sm font-medium ${
                  isSlow ? "text-destructive" : ""
                }`}
              >
                {query.duration_ms.toFixed(1)}ms
              </span>
            )}
            {query.rows_affected !== null &&
              query.rows_affected !== undefined && (
                <Badge variant="secondary">{query.rows_affected} rows</Badge>
              )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t bg-muted/20 p-4 space-y-3">
          <div>
            <h4 className="text-xs font-medium mb-2">SQL Query</h4>
            <div className="bg-background rounded p-2 overflow-auto">
              <SQLHighlighter sql={query.sql} />
            </div>
          </div>

          {query.parameters && query.parameters.length > 0 && (
            <div>
              <h4 className="text-xs font-medium mb-2">Parameters</h4>
              <pre className="text-xs bg-background rounded p-2 overflow-auto">
                {JSON.stringify(query.parameters, null, 2)}
              </pre>
            </div>
          )}

          {query.request_id && (
            <div>
              <h4 className="text-xs font-medium mb-2">Request ID</h4>
              <code className="text-xs font-mono">{query.request_id}</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SQLHighlighter({ sql }: { sql: string }) {
  // Simple SQL syntax highlighting
  const keywords = [
    "SELECT",
    "FROM",
    "WHERE",
    "JOIN",
    "LEFT",
    "RIGHT",
    "INNER",
    "OUTER",
    "INSERT",
    "UPDATE",
    "DELETE",
    "CREATE",
    "DROP",
    "ALTER",
    "TABLE",
    "AND",
    "OR",
    "NOT",
    "IN",
    "EXISTS",
    "BETWEEN",
    "LIKE",
    "AS",
    "ORDER",
    "BY",
    "GROUP",
    "HAVING",
    "LIMIT",
    "OFFSET",
    "UNION",
    "INTO",
    "VALUES",
    "SET",
    "PRIMARY",
    "KEY",
    "FOREIGN",
    "REFERENCES",
  ];

  const highlightSQL = (sql: string) => {
    let highlighted = sql;

    // Highlight keywords
    keywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, "gi");
      highlighted = highlighted.replace(
        regex,
        `<span class="text-blue-600 dark:text-blue-400 font-medium">${keyword}</span>`
      );
    });

    // Highlight strings
    highlighted = highlighted.replace(
      /'([^']*)'/g,
      `<span class="text-green-600 dark:text-green-400">'$1'</span>`
    );

    // Highlight numbers
    highlighted = highlighted.replace(
      /\b(\d+)\b/g,
      `<span class="text-orange-600 dark:text-orange-400">$1</span>`
    );

    return highlighted;
  };

  return (
    <pre
      className="text-xs font-mono whitespace-pre-wrap"
      dangerouslySetInnerHTML={{ __html: highlightSQL(sql) }}
    />
  );
}
