import * as React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onValueChange: (value: string) => void;
  debounceMs?: number;
}

export function SearchInput({
  value,
  onValueChange,
  debounceMs = 300,
  className,
  placeholder = "Search...",
  ...props
}: SearchInputProps) {
  const [localValue, setLocalValue] = React.useState(value);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

  // Update local value when prop changes (for external updates)
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout for debounced update
      timeoutRef.current = setTimeout(() => {
        onValueChange(newValue);
      }, debounceMs);
    },
    [onValueChange, debounceMs]
  );

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
      <Input
        {...props}
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn("pl-10", className)}
      />
    </div>
  );
}
