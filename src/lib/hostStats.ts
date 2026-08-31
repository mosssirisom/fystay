const MS_PER_DAY = 1000 * 60 * 60 * 24;

export type RevenueBooking = {
  nightlyPriceCents: number;
  cleaningFeeCents: number;
  totalPriceCents: number;
  refundedAmountCents: number | null;
  paymentStatus: "UNPAID" | "PAID" | "PARTIALLY_REFUNDED" | "REFUNDED";
};

/**
 * What the host actually earns from one booking, in cents: the nightly rate
 * plus cleaning fee, excluding the platform's guest service fee (and any
 * future tax, always 0 today) - see GUEST_SERVICE_FEE_RATE in pricing.ts for
 * why that cut is the platform's, not the host's. A refund reduces this
 * proportionally, on the assumption a refund returns the same percentage of
 * every line in the price breakdown (how cancellation refunds are computed
 * throughout this app - see cancellationPolicy.ts).
 */
export function hostRevenueCents(booking: RevenueBooking): number {
  if (booking.paymentStatus === "UNPAID" || booking.totalPriceCents <= 0) return 0;
  const hostGrossCents = booking.nightlyPriceCents + booking.cleaningFeeCents;
  const refundedCents = booking.refundedAmountCents ?? 0;
  const keptFraction = Math.max(0, 1 - refundedCents / booking.totalPriceCents);
  return Math.round(hostGrossCents * keptFraction);
}

export type EarningsBooking = RevenueBooking & { checkIn: Date };

export type EarningsSummary = {
  totalCents: number;
  thisMonthCents: number;
  upcoming30DaysCents: number;
};

/**
 * totalCents: lifetime, every booking regardless of date.
 * thisMonthCents: bookings checking in during the reference date's calendar
 * month (a simple, stable "how much is this month's business worth" figure).
 * upcoming30DaysCents: bookings checking in over the next 30 days from the
 * reference date, a closer proxy for "what's coming up".
 */
export function summarizeEarnings(
  bookings: EarningsBooking[],
  referenceDate: Date = new Date(),
): EarningsSummary {
  const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const monthEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1);
  const upcomingEnd = new Date(referenceDate.getTime() + 30 * MS_PER_DAY);

  let totalCents = 0;
  let thisMonthCents = 0;
  let upcoming30DaysCents = 0;

  for (const booking of bookings) {
    const revenue = hostRevenueCents(booking);
    if (revenue === 0) continue;
    totalCents += revenue;
    if (booking.checkIn >= monthStart && booking.checkIn < monthEnd) {
      thisMonthCents += revenue;
    }
    if (booking.checkIn >= referenceDate && booking.checkIn < upcomingEnd) {
      upcoming30DaysCents += revenue;
    }
  }

  return { totalCents, thisMonthCents, upcoming30DaysCents };
}

export type OccupancyListing = { id: string; published: boolean };
export type OccupancyBooking = {
  listingId: string;
  checkIn: Date;
  checkOut: Date;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "REFUNDED";
};

function overlapNights(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): number {
  const start = aStart > bStart ? aStart : bStart;
  const end = aEnd < bEnd ? aEnd : bEnd;
  const ms = end.getTime() - start.getTime();
  return ms > 0 ? Math.round(ms / MS_PER_DAY) : 0;
}

/**
 * Booked nights across published listings, within [referenceDate,
 * referenceDate + windowDays), as a percentage of total available nights in
 * that window. Null (never 0) when there are no published listings, since
 * "0% occupied" and "nothing to occupy" mean very different things to a
 * host. Unpublished listings are excluded from both the numerator and
 * denominator - they're not open for booking, so they shouldn't drag the
 * rate down.
 */
export function computeOccupancyRate(params: {
  listings: OccupancyListing[];
  bookings: OccupancyBooking[];
  referenceDate?: Date;
  windowDays?: number;
}): number | null {
  const { listings, bookings, referenceDate = new Date(), windowDays = 30 } = params;
  const published = listings.filter((l) => l.published);
  if (published.length === 0) return null;

  const windowStart = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
  const windowEnd = new Date(windowStart.getTime() + windowDays * MS_PER_DAY);
  const publishedIds = new Set(published.map((l) => l.id));

  let bookedNights = 0;
  for (const booking of bookings) {
    if (!publishedIds.has(booking.listingId)) continue;
    if (booking.status !== "CONFIRMED" && booking.status !== "COMPLETED") continue;
    bookedNights += overlapNights(windowStart, windowEnd, booking.checkIn, booking.checkOut);
  }

  const availableNights = published.length * windowDays;
  return Math.round((bookedNights / availableNights) * 100);
}
