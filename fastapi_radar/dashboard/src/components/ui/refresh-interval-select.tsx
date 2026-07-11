import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/i18n";

interface RefreshIntervalSelectProps {
  value: number;
  onChange: (value: number) => void;
}

export function RefreshIntervalSelect({
  value,
  onChange,
}: RefreshIntervalSelectProps) {
  const t = useT();
  return (
    <Select
      value={value.toString()}
      onValueChange={(v) => onChange(parseInt(v))}
    >
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="5000">{t("common.refresh")}: 5s</SelectItem>
        <SelectItem value="10000">{t("common.refresh")}: 10s</SelectItem>
        <SelectItem value="30000">{t("common.refresh")}: 30s</SelectItem>
        <SelectItem value="0">
          {t("common.refresh")}: {t("common.no")}
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
