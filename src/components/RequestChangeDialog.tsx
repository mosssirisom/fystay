"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { type DateRange } from "react-day-picker";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { DateRangeField } from "@/components/DateRangeField";
import { formatPrice } from "@/lib/format";
import { nightsBetween, rangesOverlap } from "@/lib/availability";
import { cn } from "@/lib/cn";

export function RequestChangeDialog({
  bookingId,
  currentCheckIn,
  currentCheckOut,
  currentGuests,
  currentTotalPriceCents,
  pricePerNightCents,
  maxGuests,
  otherBookedRanges,
}: {
  bookingId: string;
  currentCheckIn: Date;
  currentCheckOut: Date;
  currentGuests: number;
  currentTotalPriceCents: number;
  pricePerNightCents: number;
  maxGuests: number;
  otherBookedRanges: { checkIn: Date; checkOut: Date }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>({
    from: currentCheckIn,
    to: currentCheckOut,
  });
  const [guests, setGuests] = useState(currentGuests);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabledDays = useMemo(
    () => [{ before: new Date() }, ...otherBookedRanges.map((r) => ({ from: r.checkIn, to: r.checkOut }))],
    [otherBookedRanges],
  );

  const nights = range?.from && range?.to ? nightsBetween(range.from, range.to) : 0;
  const newTotalPriceCents = nights * pricePerNightCents;
  const priceDeltaCents = newTotalPriceCents - currentTotalPriceCents;

  function isSelectionValid(): boolean {
    if (!range?.from || !range?.to) return false;
    return !otherBookedRanges.some((r) =>
      rangesOverlap(range.from as Date, range.to as Date, r.checkIn, r.checkOut),
    );
  }

  async function handleSubmit() {
    setError(null);
    if (!range?.from || !range?.to) {
      setError("Select your new check-in and check-out dates.");
      return;
    }
    if (!isSelectionValid()) {
      setError("Those dates overlap another booking.");
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/bookings/${bookingId}/change-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checkIn: range.from.toISOString(),
        checkOut: range.to.toISOString(),
        guests,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not submit change request.");
      toast.error(data.error ?? "Could not submit change request.");
      return;
    }

    setOpen(false);
    toast.success("Change requested. The host will review it shortly.");
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="focus-ring rounded-lg px-2 py-1 text-sm font-medium text-zinc-700 hover:bg-surface-muted"
      >
        Request changes
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Request a change">
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-1.5 text-xs font-semibold text-foreground">Dates</p>
            <DateRangeField range={range} onChange={setRange} disabledRanges={disabledDays} />
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold text-foreground">Guests</p>
            <div className="flex items-center gap-3 rounded-lg border border-border-subtle px-3 py-2">
              <button
                type="button"
                onClick={() => setGuests((g) => Math.max(1, g - 1))}
                disabled={guests <= 1}
                aria-label="Decrease guests"
                className={cn(
                  "focus-ring flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle text-zinc-600",
                  "disabled:pointer-events-none disabled:opacity-40 hover:border-zinc-400",
                )}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-6 text-center text-sm font-medium">{guests}</span>
              <button
                type="button"
                onClick={() => setGuests((g) => Math.min(maxGuests, g + 1))}
                disabled={guests >= maxGuests}
                aria-label="Increase guests"
                className={cn(
                  "focus-ring flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle text-zinc-600",
                  "disabled:pointer-events-none disabled:opacity-40 hover:border-zinc-400",
                )}
              >
                <Plus className="h-4 w-4" />
              </button>
              <span className="text-xs text-zinc-500">Max {maxGuests}</span>
            </div>
          </div>

          {nights > 0 && priceDeltaCents !== 0 && (
            <p className="text-sm text-zinc-600">
              {priceDeltaCents > 0
                ? `You'll owe an extra ${formatPrice(priceDeltaCents)} if approved.`
                : `You'll be refunded ${formatPrice(Math.abs(priceDeltaCents))} if approved.`}
            </p>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={loading}>
              Submit request
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
