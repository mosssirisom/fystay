/**
 * Pure eligibility logic for buying a Trip Extra (see
 * docs/trip-extras-roadmap.md) against a Booking - kept separate from the
 * API route so it's directly unit-testable, the same pattern as
 * stayLengthError in availability.ts.
 */

export type ExtraPurchaseBooking = {
  status: string;
};

export type ExtraPurchaseOffering = {
  active: boolean;
  providerActive: boolean;
};

export type ExistingBookingExtra = {
  offeringId: string;
  status: string;
};

/**
 * A Trip Extra is only offered against a stay that's actually going ahead -
 * a PENDING (unpaid) or CANCELLED booking has nothing to send a transfer
 * to yet/anymore. Deliberately allows COMPLETED too: a guest realizing on
 * the day they need a transfer after all shouldn't be blocked just because
 * their stay's own checkout date has technically passed.
 */
export function tripExtraPurchaseError(
  booking: ExtraPurchaseBooking,
  offering: ExtraPurchaseOffering,
  offeringId: string,
  existingExtras: ExistingBookingExtra[],
): string | null {
  if (booking.status !== "CONFIRMED" && booking.status !== "COMPLETED") {
    return "This booking needs to be confirmed before you can add extras to it";
  }
  if (!offering.active || !offering.providerActive) {
    return "This extra isn't available right now";
  }
  // A guest can buy different extras for the same booking, but not the same
  // one twice while an earlier purchase of it is actually paid - a
  // cancelled/refunded one frees it up again (plans changed, rebooking),
  // and a still-PENDING_PAYMENT one (an abandoned Stripe checkout) doesn't
  // block a fresh attempt either - the API route is responsible for
  // reusing or superseding that stale row, the same way the main booking
  // checkout reuses/replaces a stale stripeSessionId, rather than this
  // eligibility check treating an incomplete payment as a real purchase.
  const alreadyPaid = existingExtras.some(
    (extra) => extra.offeringId === offeringId && extra.status === "PAID",
  );
  if (alreadyPaid) {
    return "You've already added this extra to this booking";
  }
  return null;
}
