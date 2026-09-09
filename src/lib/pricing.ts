// Platform service fee charged to the guest, on top of the nightly
// subtotal, the same way most OTAs price a stay. Kept as a single named
// constant so the rate lives in one place if it's ever revisited.
export const GUEST_SERVICE_FEE_RATE = 0.1;

// Airbnb-style length-of-stay discount thresholds. A stay only qualifies
// once it meets or exceeds the relevant minimum - a 6-night stay never
// gets the weekly rate, a 27-night stay never gets the monthly one.
export const WEEKLY_DISCOUNT_MIN_NIGHTS = 7;
export const MONTHLY_DISCOUNT_MIN_NIGHTS = 28;

export type LengthOfStayDiscountLabel = "weekly" | "monthly";

/**
 * Picks which length-of-stay discount (if either) applies to a given stay.
 * Monthly takes priority at 28+ nights when the host has set one, since a
 * host who bothers configuring both rates means the monthly one for their
 * longest stays; a stay of 28+ nights still falls back to the weekly rate
 * if no monthly rate is set, rather than getting no discount at all.
 */
export function resolveLengthOfStayDiscount(params: {
  nights: number;
  weeklyDiscountPercent?: number | null;
  monthlyDiscountPercent?: number | null;
}): { percent: number; label: LengthOfStayDiscountLabel | null } {
  const { nights, weeklyDiscountPercent, monthlyDiscountPercent } = params;

  if (nights >= MONTHLY_DISCOUNT_MIN_NIGHTS && monthlyDiscountPercent) {
    return { percent: monthlyDiscountPercent, label: "monthly" };
  }
  if (nights >= WEEKLY_DISCOUNT_MIN_NIGHTS && weeklyDiscountPercent) {
    return { percent: weeklyDiscountPercent, label: "weekly" };
  }
  return { percent: 0, label: null };
}

export type BookingPriceBreakdown = {
  /** Gross, before any length-of-stay discount: nights * pricePerNightCents. */
  nightlySubtotalCents: number;
  lengthOfStayDiscountPercent: number;
  lengthOfStayDiscountCents: number;
  lengthOfStayDiscountLabel: LengthOfStayDiscountLabel | null;
  cleaningFeeCents: number;
  serviceFeeCents: number;
  taxCents: number;
  totalPriceCents: number;
};

/**
 * The single source of truth for turning a stay length + a listing's rates
 * into what the guest actually owes. Used both to preview a price before a
 * booking exists (the widget, the availability check) and to snapshot a
 * price onto a booking at creation time, so the two can never disagree.
 *
 * taxCents is always 0 today: FYStay doesn't yet compute jurisdiction-
 * specific occupancy tax, so it isn't fabricated here. The field exists so
 * the breakdown (and the UI line for it) is ready the moment that logic
 * exists, without another schema change.
 */
export function computeBookingPricing(params: {
  nights: number;
  pricePerNightCents: number;
  cleaningFeeCents?: number;
  weeklyDiscountPercent?: number | null;
  monthlyDiscountPercent?: number | null;
}): BookingPriceBreakdown {
  const {
    nights,
    pricePerNightCents,
    cleaningFeeCents = 0,
    weeklyDiscountPercent,
    monthlyDiscountPercent,
  } = params;
  const nightlySubtotalCents = Math.max(0, nights) * pricePerNightCents;
  const { percent: lengthOfStayDiscountPercent, label: lengthOfStayDiscountLabel } =
    resolveLengthOfStayDiscount({ nights, weeklyDiscountPercent, monthlyDiscountPercent });
  const lengthOfStayDiscountCents = Math.round(
    (nightlySubtotalCents * lengthOfStayDiscountPercent) / 100,
  );
  const discountedNightlySubtotalCents = nightlySubtotalCents - lengthOfStayDiscountCents;
  const serviceFeeCents = Math.round(discountedNightlySubtotalCents * GUEST_SERVICE_FEE_RATE);
  const taxCents = 0;
  const totalPriceCents =
    discountedNightlySubtotalCents + cleaningFeeCents + serviceFeeCents + taxCents;

  return {
    nightlySubtotalCents,
    lengthOfStayDiscountPercent,
    lengthOfStayDiscountCents,
    lengthOfStayDiscountLabel,
    cleaningFeeCents,
    serviceFeeCents,
    taxCents,
    totalPriceCents,
  };
}

/**
 * Splits an arbitrary charge against an existing booking (currently only the
 * extra payment for an approved date/guest change - see
 * src/app/api/bookings/[id]/change-requests/[requestId]/pay/route.ts) into a
 * host share and a platform share, in the same proportion as the booking's
 * own nightly+cleaning vs total split. priceDeltaCents itself doesn't carry
 * its own fee breakdown, so this reuses the same "every line moves together"
 * assumption already applied to refunds (see hostRevenueCents in
 * hostStats.ts) - just applied to a charge instead of a refund.
 */
/**
 * A referral credit (see referral.ts) is FYStay's own marketing cost, not
 * the host's to bear - so it comes out of the platform's own
 * applicationFeeCents first, and only reduces the host's share if the
 * credit is somehow larger than the entire platform fee (never negative
 * either way; Math.max(0, ...) is the floor, not a rounding nicety).
 */
export function applyReferralCreditToApplicationFee(
  grossApplicationFeeCents: number,
  creditAppliedCents: number,
): number {
  return Math.max(0, grossApplicationFeeCents - creditAppliedCents);
}

export function splitByHostShare(
  amountCents: number,
  booking: { nightlyPriceCents: number; cleaningFeeCents: number; totalPriceCents: number },
): { hostShareCents: number; platformShareCents: number } {
  if (booking.totalPriceCents <= 0) {
    return { hostShareCents: amountCents, platformShareCents: 0 };
  }
  const hostFraction =
    (booking.nightlyPriceCents + booking.cleaningFeeCents) / booking.totalPriceCents;
  const hostShareCents = Math.round(amountCents * hostFraction);
  return { hostShareCents, platformShareCents: amountCents - hostShareCents };
}
