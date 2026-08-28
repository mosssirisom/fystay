"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { type DateRange } from "react-day-picker";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DateRangeField } from "@/components/DateRangeField";
import { GuestCategoryPicker } from "@/components/GuestCategoryPicker";
import { formatPrice } from "@/lib/format";
import { nightsBetween, rangesOverlap } from "@/lib/availability";
import { computeBookingPricing } from "@/lib/pricing";
import { isPetFriendly, totalOccupants, type GuestCounts } from "@/lib/search";

type Props = {
  listingId: string;
  pricePerNightCents: number;
  cleaningFeeCents: number;
  maxGuests: number;
  amenities: string[];
  bookedRanges: { checkIn: string; checkOut: string }[];
  isLoggedIn: boolean;
};

export function BookingWidget({
  listingId,
  pricePerNightCents,
  cleaningFeeCents,
  maxGuests,
  amenities,
  bookedRanges,
  isLoggedIn,
}: Props) {
  const router = useRouter();
  const [range, setRange] = useState<DateRange | undefined>();
  const [guestCounts, setGuestCounts] = useState<GuestCounts>({
    adults: 1,
    children: 0,
    infants: 0,
    pets: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [reserving, setReserving] = useState(false);
  // The selection an availability check last confirmed as free. Compared
  // against the current selection during render (rather than reset via an
  // effect) so changing dates or guests after a successful check
  // automatically requires a fresh check, with no extra state to keep in sync.
  const [checkedSelection, setCheckedSelection] = useState<{
    checkIn: string;
    checkOut: string;
    guests: number;
  } | null>(null);
  const petsAllowed = isPetFriendly(amenities);
  const guests = totalOccupants(guestCounts);

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
  const pricing = computeBookingPricing({ nights, pricePerNightCents, cleaningFeeCents });

  const availabilityChecked = Boolean(
    checkedSelection &&
      range?.from?.toISOString() === checkedSelection.checkIn &&
      range?.to?.toISOString() === checkedSelection.checkOut &&
      guests === checkedSelection.guests,
  );

  function isSelectionValid(): boolean {
    if (!range?.from || !range?.to) return false;
    return !parsedBookedRanges.some((r) =>
      rangesOverlap(range.from as Date, range.to as Date, r.checkIn, r.checkOut),
    );
  }

  async function handleCheckAvailability() {
    setError(null);

    if (!range?.from || !range?.to) {
      setError("Select your check-in and check-out dates.");
      return;
    }
    if (!isSelectionValid()) {
      setError("Those dates overlap an existing booking.");
      return;
    }

    setChecking(true);
    try {
      const params = new URLSearchParams({
        checkIn: range.from.toISOString(),
        checkOut: range.to.toISOString(),
        guests: String(guests),
      });
      const res = await fetch(`/api/listings/${listingId}/availability?${params}`);
      const data = await res.json();

      if (!res.ok || !data.available) {
        const message = data.error ?? "Those dates aren't available.";
        setError(message);
        toast.error(message);
        return;
      }

      setCheckedSelection({
        checkIn: range.from.toISOString(),
        checkOut: range.to.toISOString(),
        guests,
      });
      toast.success("Good news — those dates are available.");
    } catch {
      setError("Something went wrong. Please try again.");
      toast.error("Something went wrong. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  async function handleContinueToCheckout() {
    setError(null);

    if (!range?.from || !range?.to) return;

    setReserving(true);
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
        setCheckedSelection(null);
        setReserving(false);
        return;
      }

      router.push(`/checkout/${bookingData.booking.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
      toast.error("Something went wrong. Please try again.");
      setReserving(false);
    }
  }

  const hasDates = Boolean(range?.from && range?.to);

  return (
    <Card className="sticky top-20 p-5">
      <CardContent className="p-0">
        <p className="text-lg font-semibold text-foreground">
          {formatPrice(pricePerNightCents)}{" "}
          <span className="text-sm font-normal text-zinc-500">night</span>
        </p>

        <div className="mt-4 flex flex-col gap-2">
          <DateRangeField range={range} onChange={setRange} disabledRanges={disabledDays} />
          <GuestCategoryPicker
            value={guestCounts}
            onChange={setGuestCounts}
            capacity={maxGuests}
            showPets={petsAllowed}
            triggerClassName="rounded-lg border border-border-subtle px-3 py-2 hover:border-zinc-300 hover:bg-transparent"
          />
        </div>

        {nights > 0 && (
          <div className="mt-4 flex flex-col gap-2 border-t border-border-subtle pt-4 text-sm text-zinc-700">
            <div className="flex justify-between">
              <span>
                {formatPrice(pricePerNightCents)} × {nights} night{nights > 1 ? "s" : ""}
              </span>
              <span>{formatPrice(pricing.nightlySubtotalCents)}</span>
            </div>
            {pricing.cleaningFeeCents > 0 && (
              <div className="flex justify-between">
                <span>Cleaning fee</span>
                <span>{formatPrice(pricing.cleaningFeeCents)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Service fee</span>
              <span>{formatPrice(pricing.serviceFeeCents)}</span>
            </div>
            <div className="flex justify-between border-t border-border-subtle pt-2 font-semibold text-foreground">
              <span>Total</span>
              <span>{formatPrice(pricing.totalPriceCents)}</span>
            </div>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {!isLoggedIn ? (
          <Button
            onClick={() => router.push(`/login?callbackUrl=/listings/${listingId}`)}
            size="lg"
            className="mt-4 w-full"
          >
            Log in to book
          </Button>
        ) : availabilityChecked ? (
          <Button
            onClick={handleContinueToCheckout}
            loading={reserving}
            size="lg"
            className="mt-4 w-full"
          >
            Continue to payment
          </Button>
        ) : (
          <Button
            onClick={handleCheckAvailability}
            loading={checking}
            disabled={!hasDates}
            size="lg"
            className="mt-4 w-full"
          >
            Check availability
          </Button>
        )}

        {isLoggedIn && (
          <p className="mt-3 text-center text-xs text-zinc-500">
            {availabilityChecked ? "You won't be charged yet" : "We'll confirm your dates are free"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
