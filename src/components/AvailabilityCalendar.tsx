"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DayPicker, type DateRange, type Matcher } from "react-day-picker";
import "react-day-picker/style.css";
import { toast } from "sonner";
import { Ban, CalendarX2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Field, FieldError, Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { nightsBetween } from "@/lib/availability";
import { cn } from "@/lib/cn";

const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

type BookingRow = {
  id: string;
  checkIn: Date;
  checkOut: Date;
  // The page only ever fetches PENDING/CONFIRMED bookings, but Prisma's
  // generated type for a `status: { in: [...] }` filter doesn't narrow to
  // that subset, so this accepts the full enum.
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "REFUNDED";
  guests: number;
  guestName: string | null;
  reference: string;
};

type BlockRow = {
  id: string;
  startDate: Date;
  endDate: Date;
  reason: string | null;
};

const LEGEND = [
  { label: "Available", swatchClassName: "bg-surface border border-border-subtle" },
  { label: "Booked", swatchClassName: "bg-red-100" },
  { label: "Pending", swatchClassName: "bg-amber-100" },
  { label: "Blocked", swatchClassName: "bg-zinc-300" },
];

export function AvailabilityCalendar({
  listingId,
  bookings,
  blocks,
}: {
  listingId: string;
  bookings: BookingRow[];
  blocks: BlockRow[];
}) {
  const router = useRouter();
  const [range, setRange] = useState<DateRange | undefined>();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unblockTarget, setUnblockTarget] = useState<BlockRow | null>(null);
  const [unblocking, setUnblocking] = useState(false);

  const confirmedRanges = useMemo(
    () => bookings.filter((b) => b.status === "CONFIRMED").map((b) => ({ from: b.checkIn, to: b.checkOut })),
    [bookings],
  );
  const pendingRanges = useMemo(
    () => bookings.filter((b) => b.status === "PENDING").map((b) => ({ from: b.checkIn, to: b.checkOut })),
    [bookings],
  );
  const blockedRanges = useMemo(
    () => blocks.map((b) => ({ from: b.startDate, to: b.endDate })),
    [blocks],
  );

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const disabledDays: Matcher[] = useMemo(
    () => [{ before: today }, ...confirmedRanges, ...pendingRanges, ...blockedRanges],
    [today, confirmedRanges, pendingRanges, blockedRanges],
  );

  const nights = range?.from && range?.to ? nightsBetween(range.from, range.to) : 0;

  async function handleBlockDates() {
    setError(null);
    if (!range?.from || !range?.to) {
      setError("Select a date range to block.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/blocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: range.from.toISOString(),
          endDate: range.to.toISOString(),
          reason: reason.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not block those dates.");
        toast.error(data.error ?? "Could not block those dates.");
        return;
      }

      toast.success("Dates blocked");
      setRange(undefined);
      setReason("");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUnblock() {
    if (!unblockTarget) return;
    setUnblocking(true);
    const res = await fetch(`/api/listings/${listingId}/blocks/${unblockTarget.id}`, {
      method: "DELETE",
    });
    setUnblocking(false);
    setUnblockTarget(null);

    if (res.ok) {
      toast.success("Dates unblocked");
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Could not unblock those dates.");
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      <Card className="p-5">
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {LEGEND.map((item) => (
              <span key={item.label} className="flex items-center gap-1.5 text-xs text-zinc-600">
                <span className={cn("h-3 w-3 rounded-full", item.swatchClassName)} aria-hidden />
                {item.label}
              </span>
            ))}
          </div>

          <div className="mt-4 flex justify-center overflow-x-auto">
            <DayPicker
              mode="range"
              selected={range}
              onSelect={setRange}
              disabled={disabledDays}
              modifiers={{ confirmed: confirmedRanges, pending: pendingRanges, blocked: blockedRanges }}
              modifiersClassNames={{
                confirmed: "!bg-red-100 !text-red-700",
                pending: "!bg-amber-100 !text-amber-800",
                blocked: "!bg-zinc-300 !text-zinc-600 line-through",
              }}
              startMonth={today}
              numberOfMonths={1}
            />
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-border-subtle pt-4">
            <Field>
              <Label htmlFor="blockReason">Reason (optional)</Label>
              <Input
                id="blockReason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Maintenance, personal use"
              />
              <FieldError>{error}</FieldError>
            </Field>
            <Button
              onClick={handleBlockDates}
              loading={submitting}
              disabled={nights === 0}
              className="self-start"
            >
              <Ban className="h-4 w-4" />
              Block selected dates
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="p-5">
        <CardHeader className="p-0">
          <CardTitle>Bookings</CardTitle>
        </CardHeader>
        <CardContent className="mt-3 p-0">
          {bookings.length === 0 ? (
            <p className="text-sm text-zinc-500">No confirmed or pending bookings yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border-subtle">
              {bookings.map((booking) => (
                <li key={booking.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {dateFormatter.format(booking.checkIn)} – {dateFormatter.format(booking.checkOut)}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-zinc-500">
                      <Users className="h-3.5 w-3.5" />
                      {booking.guestName ?? "Guest"} · {booking.guests} guest
                      {booking.guests > 1 ? "s" : ""} · #{booking.reference}
                    </p>
                  </div>
                  <Badge variant={booking.status === "CONFIRMED" ? "success" : "warning"}>
                    {booking.status === "CONFIRMED" ? "Confirmed" : "Pending"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="p-5">
        <CardHeader className="p-0">
          <CardTitle>Blocked dates</CardTitle>
        </CardHeader>
        <CardContent className="mt-3 p-0">
          {blocks.length === 0 ? (
            <p className="text-sm text-zinc-500">No dates manually blocked.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border-subtle">
              {blocks.map((block) => (
                <li key={block.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {dateFormatter.format(block.startDate)} – {dateFormatter.format(block.endDate)}
                    </p>
                    {block.reason && <p className="text-xs text-zinc-500">{block.reason}</p>}
                  </div>
                  <button
                    onClick={() => setUnblockTarget(block)}
                    className="focus-ring flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-zinc-700 hover:bg-surface-muted"
                  >
                    <CalendarX2 className="h-4 w-4" />
                    Unblock
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={unblockTarget !== null}
        onClose={() => setUnblockTarget(null)}
        onConfirm={handleUnblock}
        loading={unblocking}
        title="Unblock these dates"
        description={
          unblockTarget
            ? `Make ${dateFormatter.format(unblockTarget.startDate)} – ${dateFormatter.format(unblockTarget.endDate)} bookable again?`
            : ""
        }
        confirmLabel="Unblock"
      />
    </div>
  );
}
