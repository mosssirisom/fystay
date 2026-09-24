"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Minus, Plus, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAnchoredPortalPosition } from "@/lib/useAnchoredPortalPosition";

export type HotelGuestCounts = {
  adults: number;
  children: number;
  rooms: number;
};

const ROWS: { key: keyof HotelGuestCounts; label: string; hint: string; min: number; max: number }[] = [
  { key: "adults", label: "Adults", hint: "Ages 13 or above", min: 1, max: 16 },
  { key: "children", label: "Children", hint: "Ages 2 – 12", min: 0, max: 16 },
  { key: "rooms", label: "Rooms", hint: "How many rooms to book", min: 1, max: 8 },
];

export function summarizeHotelGuests({ adults, children, rooms }: HotelGuestCounts): string {
  const guests = adults + children;
  const guestPart = `${guests} guest${guests === 1 ? "" : "s"}`;
  const roomPart = `${rooms} room${rooms === 1 ? "" : "s"}`;
  return `${guestPart}, ${roomPart}`;
}

/**
 * Adults/children/rooms stepper for hotel search - deliberately not a
 * reuse of GuestCategoryPicker (FYStay's own listing search), which has no
 * concept of rooms and does carry infants/pets fields that don't apply
 * here. Same interaction pattern (portal popover, +/- steppers, a Done
 * button that confirms a draft rather than applying every click live) so
 * it reads as the same design system, not a different control bolted on.
 */
export function HotelGuestRoomPicker({
  value,
  onChange,
  className,
  triggerClassName,
}: {
  value: HotelGuestCounts;
  onChange: (value: HotelGuestCounts) => void;
  className?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const position = useAnchoredPortalPosition(containerRef, open);

  const displayValue = open ? draft : value;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
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

  function toggleOpen() {
    setOpen((v) => {
      const next = !v;
      if (next) setDraft(value);
      return next;
    });
  }

  function update(key: keyof HotelGuestCounts, next: number) {
    setDraft((d) => ({ ...d, [key]: next }));
  }

  function confirm() {
    onChange(draft);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={toggleOpen}
        aria-expanded={open}
        aria-controls="hotel-guest-room-panel"
        className={cn(
          "focus-ring flex w-full items-center gap-2 rounded-xl px-3 py-1 text-left hover:bg-surface-muted",
          triggerClassName,
        )}
      >
        <Users className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold text-foreground">Guests &amp; rooms</span>
          <span className="block truncate text-sm text-stone-500">{summarizeHotelGuests(displayValue)}</span>
        </span>
      </button>

      {open &&
        position &&
        createPortal(
          <div
            ref={panelRef}
            id="hotel-guest-room-panel"
            role="dialog"
            aria-label="Choose adults, children and rooms"
            style={{ top: position.top + 8, left: position.left }}
            className="animate-dropdown-in absolute z-[60] w-72 rounded-2xl border border-border-subtle bg-surface p-4 shadow-[var(--shadow-popover)]"
          >
            <div className="flex flex-col divide-y divide-border-subtle">
              {ROWS.map((row) => (
                <div key={row.key} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{row.label}</p>
                    <p className="text-xs text-stone-500">{row.hint}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => update(row.key, Math.max(row.min, draft[row.key] - 1))}
                      disabled={draft[row.key] <= row.min}
                      aria-label={`Decrease ${row.label.toLowerCase()}`}
                      className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle text-stone-600 hover:border-stone-400 disabled:pointer-events-none disabled:opacity-40"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-4 text-center text-sm font-medium">{draft[row.key]}</span>
                    <button
                      type="button"
                      onClick={() => update(row.key, Math.min(row.max, draft[row.key] + 1))}
                      disabled={draft[row.key] >= row.max}
                      aria-label={`Increase ${row.label.toLowerCase()}`}
                      className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle text-stone-600 hover:border-stone-400 disabled:pointer-events-none disabled:opacity-40"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-end border-t border-border-subtle pt-3">
              <button
                type="button"
                onClick={confirm}
                className="focus-ring rounded-full bg-brand-700 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
              >
                Done
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
