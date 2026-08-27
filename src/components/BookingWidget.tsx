"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";
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
    () => parsedBookedRanges.map((r) => ({ from: r.checkIn, to: r.checkOut })),
    [parsedBookedRanges],
  );

  const nights =
    range?.from && range?.to ? nightsBetween(range.from, range.to) : 0;
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
        setLoading(false);
        return;
      }

      window.location.href = checkoutData.url;
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 p-5 shadow-sm">
      <p className="text-lg font-semibold">
        {formatPrice(pricePerNightCents)} <span className="text-sm font-normal text-zinc-500">night</span>
      </p>

      <div className="mt-4">
        <DayPicker
          mode="range"
          selected={range}
          onSelect={setRange}
          disabled={[{ before: new Date() }, ...disabledDays]}
          numberOfMonths={1}
        />
      </div>

      <label className="mt-3 flex flex-col gap-1 text-xs font-medium text-zinc-600">
        Guests
        <input
          type="number"
          min={1}
          max={maxGuests}
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none"
        />
      </label>

      {nights > 0 && (
        <div className="mt-4 flex justify-between text-sm text-zinc-700">
          <span>
            {formatPrice(pricePerNightCents)} x {nights} night{nights > 1 ? "s" : ""}
          </span>
          <span>{formatPrice(totalPriceCents)}</span>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        onClick={handleReserve}
        disabled={loading}
        className="mt-4 w-full rounded-full bg-rose-600 px-4 py-2.5 font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
      >
        {loading ? "Reserving…" : "Reserve"}
      </button>
    </div>
  );
}
