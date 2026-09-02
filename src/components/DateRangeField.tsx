"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker, type DateRange, type Matcher } from "react-day-picker";
import "react-day-picker/style.css";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/cn";

const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

export function DateRangeField({
  range,
  onChange,
  disabledRanges,
}: {
  range: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  disabledRanges: Matcher[];
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

  const label = range?.from
    ? range.to
      ? `${dateFormatter.format(range.from)} – ${dateFormatter.format(range.to)}`
      : `${dateFormatter.format(range.from)} – Add checkout`
    : "Add dates";

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "focus-ring flex w-full items-center gap-2 rounded-lg border border-border-subtle px-3 py-2.5 text-left text-sm hover:border-zinc-300",
          !range?.from && "text-zinc-500",
        )}
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-zinc-400" />
        {label}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose check-in and check-out dates"
          className="absolute left-1/2 top-full z-20 mt-2 w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 overflow-x-auto rounded-2xl border border-border-subtle bg-surface p-3 shadow-[var(--shadow-popover)]"
        >
          <DayPicker
            mode="range"
            min={1}
            selected={range}
            onSelect={(next) => {
              onChange(next);
              if (next?.from && next?.to) setOpen(false);
            }}
            disabled={disabledRanges}
            numberOfMonths={1}
            startMonth={new Date()}
          />
        </div>
      )}
    </div>
  );
}
