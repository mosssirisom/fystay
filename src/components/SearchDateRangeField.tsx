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
  // Picking dates only updates this local draft; the parent (and, on the
  // search results page, the live-filtered results) only sees the change
  // once Done is pressed. Closing any other way - clicking outside,
  // Escape - discards the draft instead of confirming it.
  const [draftRange, setDraftRange] = useState(range);
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

  function toggleOpen() {
    setOpen((v) => {
      const next = !v;
      // Re-seed the draft from the last confirmed range each time the
      // panel opens, so a previously discarded/unfinished pick never
      // reappears.
      if (next) setDraftRange(range);
      return next;
    });
  }

  function confirm() {
    onChange(draftRange);
    setOpen(false);
  }

  const displayRange = open ? draftRange : range;
  const checkInLabel = displayRange?.from ? format(displayRange.from, "d MMM") : null;
  const checkOutLabel = displayRange?.to ? format(displayRange.to, "d MMM") : null;

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
        onClick={toggleOpen}
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
        onClick={toggleOpen}
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
            selected={draftRange}
            onSelect={setDraftRange}
            disabled={{ before: new Date() }}
            numberOfMonths={1}
            startMonth={new Date()}
          />
          <div className="flex justify-end border-t border-border-subtle pt-2">
            <button
              type="button"
              onClick={confirm}
              className="focus-ring rounded-full bg-brand-700 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
