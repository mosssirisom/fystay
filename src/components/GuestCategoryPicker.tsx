"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { summarizeGuests, type GuestCounts } from "@/lib/search";

const ROWS: {
  key: keyof GuestCounts;
  label: string;
  hint: string;
  min: number;
  max: number;
}[] = [
  { key: "adults", label: "Adults", hint: "Ages 13 or above", min: 1, max: 16 },
  { key: "children", label: "Children", hint: "Ages 2 – 12", min: 0, max: 16 },
  { key: "infants", label: "Infants", hint: "Under 2", min: 0, max: 5 },
  { key: "pets", label: "Pets", hint: "Bringing a service animal?", min: 0, max: 5 },
];

export function GuestCategoryPicker({
  value,
  onChange,
  capacity,
  showPets = true,
  className,
  triggerClassName,
}: {
  value: GuestCounts;
  onChange: (value: GuestCounts) => void;
  /** Caps combined adults + children, e.g. to a specific listing's maxGuests. */
  capacity?: number;
  /** Hide the Pets row entirely, e.g. when a listing doesn't allow pets. */
  showPets?: boolean;
  className?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const rows = showPets ? ROWS : ROWS.filter((row) => row.key !== "pets");

  function maxFor(key: keyof GuestCounts, rowMax: number): number {
    if (capacity === undefined) return rowMax;
    if (key === "adults") return Math.min(rowMax, capacity - value.children);
    if (key === "children") return Math.min(rowMax, capacity - value.adults);
    return rowMax;
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function update(key: keyof GuestCounts, next: number) {
    onChange({ ...value, [key]: next });
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="guest-picker-panel"
        className={cn(
          "focus-ring flex w-full items-center gap-2 rounded-xl px-3 py-1 text-left hover:bg-surface-muted",
          triggerClassName,
        )}
      >
        <Users className="h-4 w-4 shrink-0 text-zinc-400" />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold text-foreground">Guests</span>
          <span className="block truncate text-sm text-zinc-500">{summarizeGuests(value)}</span>
        </span>
      </button>

      {open && (
        <div
          id="guest-picker-panel"
          className="absolute left-0 top-full z-20 mt-2 w-72 rounded-2xl border border-border-subtle bg-surface p-4 shadow-[var(--shadow-popover)]"
        >
          <div className="flex flex-col divide-y divide-border-subtle">
            {rows.map((row) => {
              const rowMax = maxFor(row.key, row.max);
              return (
                <div
                  key={row.key}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{row.label}</p>
                    <p className="text-xs text-zinc-500">{row.hint}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => update(row.key, Math.max(row.min, value[row.key] - 1))}
                      disabled={value[row.key] <= row.min}
                      aria-label={`Decrease ${row.label.toLowerCase()}`}
                      className={cn(
                        "focus-ring flex h-7 w-7 items-center justify-center rounded-full border border-border-subtle text-zinc-600",
                        "disabled:pointer-events-none disabled:opacity-40",
                        "hover:border-zinc-400",
                      )}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-4 text-center text-sm font-medium">{value[row.key]}</span>
                    <button
                      type="button"
                      onClick={() => update(row.key, Math.min(rowMax, value[row.key] + 1))}
                      disabled={value[row.key] >= rowMax}
                      aria-label={`Increase ${row.label.toLowerCase()}`}
                      className={cn(
                        "focus-ring flex h-7 w-7 items-center justify-center rounded-full border border-border-subtle text-zinc-600",
                        "disabled:pointer-events-none disabled:opacity-40",
                        "hover:border-zinc-400",
                      )}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {capacity !== undefined && (
            <p className="mt-3 text-xs text-zinc-500">
              This place has a maximum of {capacity} guest{capacity === 1 ? "" : "s"}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
