"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { type DateRange } from "react-day-picker";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DateRangeField } from "@/components/DateRangeField";
import { GuestStepper } from "@/components/GuestStepper";
import { formatPrice } from "@/lib/format";
import { nightsBetween, rangesOverlap } from "@/lib/availability";

type Props = {
  listingId: string;
  pricePerNightCents: number;
  maxGuests: number;
  bookedRanges: { checkIn: string; checkOut: string }[];
  isLoggedIn: boolean;
};

export function BookingWidget({
  listingId,
  pricePerNightCents,
  maxGuests,
  bookedRanges,
  isLoggedIn,
}: Props) {
  const router = useRouter();
  const [range, setRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const parsedBookedRanges = useMemo(
    () =>
      bookedRanges.map((r) => ({
        checkIn: new Date(r.checkIn),
        checkOut: new Date(r.checkOut),
      })),
    [bookedRanges],
  );

  const disabledDays = useMemo(
    () => [{ before: new Date() }, ...parsedBookedRanges.map((r) => ({ from: r.checkIn, to: r.checkOut }))],
    [parsedBookedRanges],
  );

  const nights = range?.from && range?.to ? nightsBetween(range.from, range.to) : 0;
  const totalPriceCents = nights * pricePerNightCents;

  function isSelectionValid(): boolean {
    if (!range?.from || !range?.to) return false;
    return !parsedBookedRanges.some((r) =>
      rangesOverlap(range.from as Date, range.to as Date, r.checkIn, r.checkOut),
    );
  }

  async function handleReserve() {
    setError(null);

    if (!isLoggedIn) {
      router.push(`/login?callbackUrl=/listings/${listingId}`);
      return;
    }
    if (!range?.from || !range?.to) {
      setError("Select your check-in and check-out dates.");
      return;
    }
    if (!isSelectionValid()) {
      setError("Those dates overlap an existing booking.");
      return;
    }

    setLoading(true);
    try {
      const bookingRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          checkIn: range.from.toISOString(),
          checkOut: range.to.toISOString(),
          guests,
        }),
      });
      const bookingData = await bookingRes.json();
      if (!bookingRes.ok) {
        setError(bookingData.error ?? "Could not create booking.");
        toast.error(bookingData.error ?? "Could not create booking.");
        setLoading(false);
        return;
      }

      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: bookingData.booking.id }),
      });
      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) {
        setError(checkoutData.error ?? "Could not start checkout.");
        toast.error(checkoutData.error ?? "Could not start checkout.");
        setLoading(false);
        return;
      }

      window.location.href = checkoutData.url;
    } catch {
      setError("Something went wrong. Please try again.");
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <Card className="sticky top-20 p-5">
      <CardContent className="p-0">
        <p className="text-lg font-semibold text-foreground">
          {formatPrice(pricePerNightCents)}{" "}
          <span className="text-sm font-normal text-zinc-500">night</span>
        </p>

        <div className="mt-4 flex flex-col gap-2">
          <DateRangeField range={range} onChange={setRange} disabledRanges={disabledDays} />
          <GuestStepper value={guests} max={maxGuests} onChange={setGuests} />
        </div>

        {nights > 0 && (
          <div className="mt-4 flex flex-col gap-2 border-t border-border-subtle pt-4 text-sm text-zinc-700">
            <div className="flex justify-between">
              <span>
                {formatPrice(pricePerNightCents)} × {nights} night{nights > 1 ? "s" : ""}
              </span>
              <span>{formatPrice(totalPriceCents)}</span>
            </div>
            <div className="flex justify-between border-t border-border-subtle pt-2 font-semibold text-foreground">
              <span>Total</span>
              <span>{formatPrice(totalPriceCents)}</span>
            </div>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <Button onClick={handleReserve} loading={loading} size="lg" className="mt-4 w-full">
          {isLoggedIn ? "Reserve" : "Log in to book"}
        </Button>

        {isLoggedIn && (
          <p className="mt-3 text-center text-xs text-zinc-500">You won&apos;t be charged yet</p>
        )}
      </CardContent>
    </Card>
  );
}
