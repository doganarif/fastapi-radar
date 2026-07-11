import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, isValid, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";
import * as React from "react";

interface DateTimePickerProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

function parseDatetimeLocal(value: string): Date | null {
    if (!value) return null;
    const d = parse(value, "yyyy-MM-dd'T'HH:mm", new Date());
    return isValid(d) ? d : null;
}

function toDatetimeLocal(date: Date): string {
    return format(date, "yyyy-MM-dd'T'HH:mm");
}

export function DateTimePicker({
    value,
    onChange,
    placeholder = "Pick date & time",
    className,
}: DateTimePickerProps) {
    const [open, setOpen] = React.useState(false);
    const selected = parseDatetimeLocal(value);
    const timeValue = value ? value.slice(11, 16) : "00:00";

    const handleDaySelect = (day: Date | undefined) => {
        if (!day) {
            onChange("");
            return;
        }

        const [hours, minutes] = timeValue.split(":").map(Number);
        day.setHours(hours, minutes, 0, 0);
        onChange(toDatetimeLocal(day));
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = e.target.value; // HH:mm
        if (!selected) {
            const today = new Date();
            const [hours, minutes] = time.split(":").map(Number);
            today.setHours(hours, minutes, 0, 0);
            onChange(toDatetimeLocal(today));
        } else {
            const newDate = new Date(selected);
            const [hours, minutes] = time.split(":").map(Number);
            newDate.setHours(hours, minutes, 0, 0);
            onChange(toDatetimeLocal(newDate));
        }
    };

    const displayLabel = selected
        ? format(selected, "MMM d, yyyy  HH:mm")
        : placeholder;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "h-8 justify-start gap-1.5 px-2 text-xs font-normal",
                        !selected && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
                    <span>{displayLabel}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selected ?? undefined}
                    onSelect={handleDaySelect}
                    initialFocus
                />
                {/* Time input */}
                <div className="border-t px-3 py-2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Time</span>
                    <input
                        type="time"
                        value={timeValue}
                        onChange={handleTimeChange}
                        className="h-7 flex-1 rounded-md border bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
            </PopoverContent>
        </Popover>
    );
}
