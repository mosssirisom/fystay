import { differenceInCalendarDays } from "date-fns";

export type BookedRange = { checkIn: Date; checkOut: Date };

// A PENDING booking is created before the guest completes Stripe Checkout.
// Without an expiry, an abandoned checkout would block those dates for
// every other guest forever. CONFIRMED bookings always block; PENDING ones
// only block while recent enough that the guest might still complete it.
export const PENDING_BOOKING_HOLD_MINUTES = 30;

/** Prisma `where` clause selecting bookings that currently block availability. */
export function blockingBookingWhere(now: Date = new Date()) {
  const cutoff = new Date(now.getTime() - PENDING_BOOKING_HOLD_MINUTES * 60 * 1000);
  return {
    OR: [
      { status: "CONFIRMED" as const },
      { status: "PENDING" as const, createdAt: { gte: cutoff } },
    ],
  };
}

export function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function isRangeAvailable(
  checkIn: Date,
  checkOut: Date,
  bookedRanges: BookedRange[],
): boolean {
  if (checkOut <= checkIn) return false;
  return bookedRanges.every(
    (range) => !rangesOverlap(checkIn, checkOut, range.checkIn, range.checkOut),
  );
}

export function nightsBetween(checkIn: Date, checkOut: Date): number {
  return Math.max(0, differenceInCalendarDays(checkOut, checkIn));
}
