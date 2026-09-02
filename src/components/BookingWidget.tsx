"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { type DateRange } from "react-day-picker";
import { toast } from "sonner";
import { Lock, MessageCircle, ShieldCheck, Star } from "lucide-react";
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
  rating?: number | null;
  reviewCount?: number;
};

export function BookingWidget({
  listingId,
  pricePerNightCents,
  cleaningFeeCents,
  maxGuests,
  amenities,
  bookedRanges,
  isLoggedIn,
  rating = null,
  reviewCount = 0,
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
    // lg:sticky (not a plain sticky): on the single-column mobile layout
    // this card sits in normal flow well below the description/amenities/
    // reviews, so a sticky position there would just make it awkwardly
    // pin itself over content while scrolling past, for no benefit -
    // MobileBookingBar is what gives mobile guests a fast way back to it.
    <Card className="p-0 shadow-[var(--shadow-popover)] lg:sticky lg:top-24">
      {/* rounded-t-2xl on the strip itself (matching the Card's own
          rounded-2xl) rather than overflow-hidden on the Card - the Card
          also hosts the Guests popover and the date-range calendar, both
          absolutely positioned and taller than the card, which an
          overflow-hidden ancestor would clip instead of letting them float
          over the page. */}
      <div className="h-1.5 w-full rounded-t-2xl bg-gradient-to-r from-brand-600 via-brand-400 to-accent-400" aria-hidden />
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-2xl font-bold text-brand-800">
            {formatPrice(pricePerNightCents)}
            <span className="ml-1 text-sm font-normal text-zinc-500">/ night</span>
          </p>
          {rating !== null && (
            <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-zinc-600">
              <Star className="h-4 w-4 fill-accent-500 text-accent-500" aria-hidden />
              {rating.toFixed(1)}
              {reviewCount > 0 && <span className="text-zinc-500">({reviewCount})</span>}
            </span>
          )}
        </div>

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

        <div className="mt-4 flex flex-col gap-2 border-t border-border-subtle pt-4 text-xs text-zinc-500">
          {isLoggedIn && (
            <p className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
              {availabilityChecked ? "You won't be charged yet" : "We'll confirm your dates are free"}
            </p>
          )}
          <p className="flex items-center gap-2">
            <Lock className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
            Secure payment via Stripe - we never see your card details
          </p>
          <p className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
            Message your host directly once you&apos;re booked
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
