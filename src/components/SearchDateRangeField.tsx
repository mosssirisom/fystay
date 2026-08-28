"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/cn";

export function SearchDateRangeField({
  range,
  onChange,
  className,
}: {
  range: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const checkInLabel = range?.from ? format(range.from, "d MMM") : null;
  const checkOutLabel = range?.to ? format(range.to, "d MMM") : null;
  const value = checkInLabel
    ? checkOutLabel
      ? `${checkInLabel} – ${checkOutLabel}`
      : `${checkInLabel} – Add checkout`
    : "Add dates";

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-surface-muted sm:py-1.5"
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-zinc-400" />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold text-foreground">Dates</span>
          <span
            className={cn(
              "block truncate text-sm",
              checkInLabel ? "text-foreground" : "text-zinc-500",
            )}
          >
            {value}
          </span>
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose check-in and check-out dates"
          className="absolute left-1/2 top-full z-20 mt-2 w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-2xl border border-border-subtle bg-surface p-3 shadow-[var(--shadow-popover)]"
        >
          <DayPicker
            mode="range"
            min={1}
            selected={range}
            onSelect={(next) => {
              onChange(next);
              if (next?.from && next?.to) setOpen(false);
            }}
            disabled={{ before: new Date() }}
            numberOfMonths={1}
            startMonth={new Date()}
          />
        </div>
      )}
    </div>
  );
}
