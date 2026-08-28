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

/**
 * Merges a listing's blocking Bookings and its host-set AvailabilityBlocks
 * into the single list of ranges `isRangeAvailable` checks against. To a
 * guest, a manually blocked date and a reserved one are indistinguishable:
 * both simply aren't bookable. Every call site that decides whether a date
 * range can be booked (the availability-check endpoint, booking creation,
 * change requests, search filtering, and the widget's disabled calendar
 * days) should build its range list through this function rather than
 * passing bookings alone, so a block is never accidentally left out of one
 * of them.
 *
 * Extension point: future rules that aren't "is this specific date already
 * spoken for" (minimum/maximum stay, an advance-booking window, buffer days
 * between stays, seasonal availability) don't belong here. They're
 * independent predicates over a candidate date range and a listing, not
 * more entries in this range list, so add them as their own pure functions
 * and have callers run them alongside `isRangeAvailable` rather than
 * folding them into this merge.
 */
export function blockingRanges(
  bookings: BookedRange[],
  blocks: { startDate: Date; endDate: Date }[] = [],
): BookedRange[] {
  return [...bookings, ...blocks.map((b) => ({ checkIn: b.startDate, checkOut: b.endDate }))];
}
