import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TablePaginationProps {
    page: number;
    pageSize: number;
    itemCount: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
    pageSizeOptions?: number[];
    className?: string;
}

export function TablePagination({
    page,
    pageSize,
    itemCount,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 25, 50, 100],
    className,
}: TablePaginationProps) {
    const t = useT();

    return (
        <div className={cn("flex items-center justify-between pt-4 border-t", className)}>
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                    {t("common.pagination.pageSize")}
                </span>
                <Select
                    value={String(pageSize)}
                    onValueChange={(v) => {
                        onPageSizeChange(Number(v));
                        onPageChange(1);
                    }}
                >
                    <SelectTrigger className="w-20">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {pageSizeOptions.map((size) => (
                            <SelectItem key={size} value={String(size)}>
                                {size}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                    {t("common.pagination.previous")}
                </Button>
                <span className="text-sm text-muted-foreground">
                    {t("common.pagination.page")} {page}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(page + 1)}
                    disabled={itemCount < pageSize}
                >
                    {t("common.pagination.next")}
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
