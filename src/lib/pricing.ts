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
 * taxCents is always 0 today: FY Stay doesn't yet compute jurisdiction-
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
