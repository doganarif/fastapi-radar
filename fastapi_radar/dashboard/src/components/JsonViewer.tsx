import { Highlight, themes } from "prism-react-renderer";
import { useTheme } from "@/hooks/useTheme";

interface JsonViewerProps {
  data: string | null | undefined;
  fallback?: string;
}

export function JsonViewer({ data, fallback }: JsonViewerProps) {
  const { theme } = useTheme();

  if (!data) {
    return (
      <pre className="text-xs whitespace-pre-wrap break-all">
        {fallback || "No data"}
      </pre>
    );
  }

  // Try to parse and format as JSON
  let formatted: string;
  let isJson = false;

  try {
    const parsed = JSON.parse(data);
    formatted = JSON.stringify(parsed, null, 2);
    isJson = true;
  } catch {
    formatted = data;
  }

  if (!isJson) {
    return <pre className="text-xs whitespace-pre-wrap break-all">{data}</pre>;
  }

  return (
    <Highlight
      theme={theme === "dark" ? themes.nightOwl : themes.github}
      code={formatted}
      language="json"
    >
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre className={`text-xs ${className}`} style={style}>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}
