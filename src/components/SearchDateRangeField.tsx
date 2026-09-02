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

  return (
    <div ref={containerRef} className={cn("relative flex items-stretch", className)}>
      {/* Two labelled halves (Check-in / Check-out) sharing one popover and
          one underlying range, rather than a single combined "Dates"
          field - the shape guests expect from a booking search, without
          changing how dates are actually picked, stored, or submitted. */}
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="date-range-panel"
        onClick={() => setOpen((v) => !v)}
        className="focus-ring flex flex-1 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left hover:bg-surface-muted sm:py-1.5"
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-brand-600" />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold text-foreground">Check-in</span>
          <span
            className={cn(
              "block truncate text-sm",
              checkInLabel ? "text-foreground" : "text-zinc-500",
            )}
          >
            {checkInLabel ?? "Add date"}
          </span>
        </span>
      </button>

      <div className="my-2 w-px shrink-0 bg-border-subtle" aria-hidden />

      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="date-range-panel"
        onClick={() => setOpen((v) => !v)}
        className="focus-ring flex flex-1 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left hover:bg-surface-muted sm:py-1.5"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold text-foreground">Check-out</span>
          <span
            className={cn(
              "block truncate text-sm",
              checkOutLabel ? "text-foreground" : "text-zinc-500",
            )}
          >
            {checkOutLabel ?? "Add date"}
          </span>
        </span>
      </button>

      {open && (
        <div
          id="date-range-panel"
          role="dialog"
          aria-label="Choose check-in and check-out dates"
          className="animate-dropdown-in absolute left-1/2 top-full z-20 mt-2 w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-2xl border border-border-subtle bg-surface p-3 shadow-[var(--shadow-popover)]"
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
