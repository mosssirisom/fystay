// Platform service fee charged to the guest, on top of the nightly
// subtotal, the same way most OTAs price a stay. Kept as a single named
// constant so the rate lives in one place if it's ever revisited.
export const GUEST_SERVICE_FEE_RATE = 0.1;

export type BookingPriceBreakdown = {
  nightlySubtotalCents: number;
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
}): BookingPriceBreakdown {
  const { nights, pricePerNightCents, cleaningFeeCents = 0 } = params;
  const nightlySubtotalCents = Math.max(0, nights) * pricePerNightCents;
  const serviceFeeCents = Math.round(nightlySubtotalCents * GUEST_SERVICE_FEE_RATE);
  const taxCents = 0;
  const totalPriceCents = nightlySubtotalCents + cleaningFeeCents + serviceFeeCents + taxCents;

  return { nightlySubtotalCents, cleaningFeeCents, serviceFeeCents, taxCents, totalPriceCents };
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
