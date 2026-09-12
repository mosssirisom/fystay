export type AdminBookingSummary = {
  paymentStatus: "UNPAID" | "PAID" | "PARTIALLY_REFUNDED" | "REFUNDED";
  totalPriceCents: number;
  serviceFeeCents: number;
  taxCents: number;
  creditAppliedCents: number;
  promoDiscountCents: number;
};

export type PlatformFinancials = {
  /** Gross booking value: what guests have actually paid across every paid booking, lifetime. */
  grossBookingValueCents: number;
  /**
   * What FYStay itself nets, not what the host earns: the guest service fee
   * (+ tax, always 0 today) minus any referral credit and promo discount
   * applied on that booking - both are the platform's own marketing cost,
   * never the host's (see applyDiscountsToApplicationFee in pricing.ts),
   * so they come out of this figure, not out of grossBookingValueCents.
   * Floored per-booking at 0 the same way that function is, since a
   * booking's combined discounts can in principle exceed its own fee.
   */
  platformRevenueCents: number;
  paidBookingsCount: number;
};

/** UNPAID bookings (abandoned or still-pending requests) contribute nothing here - no money has moved yet. */
export function summarizePlatformFinancials(bookings: AdminBookingSummary[]): PlatformFinancials {
  let grossBookingValueCents = 0;
  let platformRevenueCents = 0;
  let paidBookingsCount = 0;

  for (const booking of bookings) {
    if (booking.paymentStatus === "UNPAID") continue;
    grossBookingValueCents += booking.totalPriceCents;
    platformRevenueCents += Math.max(
      0,
      booking.serviceFeeCents +
        booking.taxCents -
        booking.creditAppliedCents -
        booking.promoDiscountCents,
    );
    paidBookingsCount += 1;
  }

  return { grossBookingValueCents, platformRevenueCents, paidBookingsCount };
}
