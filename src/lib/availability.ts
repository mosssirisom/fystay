import { differenceInCalendarDays } from "date-fns";

export type BookedRange = { checkIn: Date; checkOut: Date };

// A PENDING booking is created before the guest completes Stripe Checkout.
// Without an expiry, an abandoned checkout would block those dates for
// every other guest forever. CONFIRMED bookings always block; PENDING ones
// only block while recent enough that the guest might still complete it.
export const PENDING_BOOKING_HOLD_MINUTES = 30;

// Request-to-book (Listing.instantBook = false - see BookingApprovalStatus):
// how long a request holds its dates while the host hasn't yet responded.
// Much longer than PENDING_BOOKING_HOLD_MINUTES since a host, unlike a
// guest mid-checkout, isn't expected to be online right now.
export const REQUEST_HOLD_HOURS = 24;

/**
 * Prisma `where` clause selecting bookings that currently block
 * availability. A PENDING booking's hold window depends on which stage of
 * request-to-book it's at (see BookingApprovalStatus): NONE (instant book,
 * the common case) holds from creation for PENDING_BOOKING_HOLD_MINUTES,
 * exactly as before this existed; AWAITING holds from creation for the
 * much longer REQUEST_HOLD_HOURS, since the host - not the guest - is who
 * needs time to respond; APPROVED holds from the moment of approval (not
 * the original request) for the same short PENDING_BOOKING_HOLD_MINUTES a
 * guest now has to actually pay. DECLINED/EXPIRED never appear here: both
 * flip the booking's own status to CANCELLED immediately, which already
 * never blocks.
 */
export function blockingBookingWhere(now: Date = new Date()) {
  const holdCutoff = new Date(now.getTime() - PENDING_BOOKING_HOLD_MINUTES * 60 * 1000);
  const requestCutoff = new Date(now.getTime() - REQUEST_HOLD_HOURS * 60 * 60 * 1000);
  return {
    OR: [
      { status: "CONFIRMED" as const },
      {
        status: "PENDING" as const,
        approvalStatus: "NONE" as const,
        createdAt: { gte: holdCutoff },
      },
      {
        status: "PENDING" as const,
        approvalStatus: "AWAITING" as const,
        createdAt: { gte: requestCutoff },
      },
      {
        status: "PENDING" as const,
        approvalStatus: "APPROVED" as const,
        hostRespondedAt: { gte: holdCutoff },
      },
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
 * A listing's minimum/maximum stay rule, kept independent of
 * `isRangeAvailable` per the extension-point note on `blockingRanges` below -
 * this is "is this stay length allowed at all", not "is this date free".
 * `maxNights` of null means no cap. Returns the guest-facing rejection
 * reason, or null when the stay length is fine.
 */
export function stayLengthError(
  nights: number,
  listing: { minNights: number; maxNights: number | null },
): string | null {
  if (nights < listing.minNights) {
    return `This listing requires a minimum stay of ${listing.minNights} night${listing.minNights === 1 ? "" : "s"}`;
  }
  if (listing.maxNights !== null && nights > listing.maxNights) {
    return `This listing allows a maximum stay of ${listing.maxNights} night${listing.maxNights === 1 ? "" : "s"}`;
  }
  return null;
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
