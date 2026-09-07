import { computeBookingPricing } from "@/lib/pricing";

export type CancellableBooking = {
  status: string;
  checkIn: Date;
};

/** A guest may cancel a booking any time before its stay begins. */
export function canCancelBooking(booking: CancellableBooking, now: Date = new Date()): boolean {
  return (
    (booking.status === "PENDING" || booking.status === "CONFIRMED") && booking.checkIn > now
  );
}

export type ChangeableBooking = {
  status: string;
  checkIn: Date;
};

/**
 * A guest may request a date/guest change on a CONFIRMED, upcoming booking,
 * as long as it doesn't already have a pending request awaiting the host's
 * response.
 */
export function canRequestBookingChange(
  booking: ChangeableBooking,
  hasPendingRequest: boolean,
  now: Date = new Date(),
): boolean {
  return booking.status === "CONFIRMED" && booking.checkIn > now && !hasPendingRequest;
}

/** Positive: the guest owes more. Negative: the guest is due a refund. */
export function computePriceDeltaCents(params: {
  requestedNights: number;
  pricePerNightCents: number;
  cleaningFeeCents?: number;
  weeklyDiscountPercent?: number | null;
  monthlyDiscountPercent?: number | null;
  currentTotalPriceCents: number;
}): number {
  const {
    requestedNights,
    pricePerNightCents,
    cleaningFeeCents,
    weeklyDiscountPercent,
    monthlyDiscountPercent,
    currentTotalPriceCents,
  } = params;
  const { totalPriceCents } = computeBookingPricing({
    nights: requestedNights,
    pricePerNightCents,
    cleaningFeeCents,
    weeklyDiscountPercent,
    monthlyDiscountPercent,
  });
  return totalPriceCents - currentTotalPriceCents;
}
