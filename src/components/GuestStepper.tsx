"use client";

import { Minus, Plus, Users } from "lucide-react";
import { cn } from "@/lib/cn";

export function GuestStepper({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border-subtle px-3 py-2">
      <span className="flex items-center gap-2 text-sm text-zinc-700">
        <Users className="h-4 w-4 text-zinc-400" />
        Guests
      </span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, value - 1))}
          disabled={value <= 1}
          aria-label="Decrease guests"
          className={cn(
            "focus-ring flex h-7 w-7 items-center justify-center rounded-full border border-border-subtle text-zinc-600",
            "disabled:pointer-events-none disabled:opacity-40",
            "hover:border-zinc-400",
          )}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-4 text-center text-sm font-medium">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label="Increase guests"
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
}
