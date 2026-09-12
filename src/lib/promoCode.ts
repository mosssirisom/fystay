/**
 * A code is always stored and matched uppercase (see PromoCode.code's own
 * schema comment) - callers should run any user-typed input through this
 * before looking it up, so "welcome10" and "WELCOME10" hit the same row.
 */
export function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase();
}

export type PromoCodeRecord = {
  active: boolean;
  expiresAt: Date | null;
  maxRedemptions: number | null;
  redemptionCount: number;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
};

export type PromoCodeValidation =
  | { valid: true }
  | { valid: false; error: string };

/**
 * Whether a promo code can be used right now - not whether it exists at
 * all (a caller that got null back from a lookup should report "Invalid
 * promo code" itself, since this only knows about codes it was actually
 * given). redemptionCount is read, never written, here: incrementing it
 * happens inside the same transaction as the Booking that uses the code
 * (see the bookings route), so two guests racing for the last redemption
 * can't both succeed.
 */
export function validatePromoCode(
  promoCode: PromoCodeRecord,
  now: Date = new Date(),
): PromoCodeValidation {
  if (!promoCode.active) {
    return { valid: false, error: "This promo code is no longer active" };
  }
  if (promoCode.expiresAt !== null && promoCode.expiresAt < now) {
    return { valid: false, error: "This promo code has expired" };
  }
  if (
    promoCode.maxRedemptions !== null &&
    promoCode.redemptionCount >= promoCode.maxRedemptions
  ) {
    return { valid: false, error: "This promo code has reached its redemption limit" };
  }
  return { valid: true };
}

/**
 * A PERCENT code discounts a percentage of the pre-discount total; a FIXED
 * code discounts a flat pence amount - either way, never more than the
 * total itself (no negative total, no cash-back for an unused remainder),
 * matching computeCreditToApply's same floor/ceiling in referral.ts.
 */
export function computePromoDiscount(
  discountType: "PERCENT" | "FIXED",
  discountValue: number,
  totalBeforeDiscountCents: number,
): number {
  const rawDiscountCents =
    discountType === "PERCENT"
      ? Math.round((totalBeforeDiscountCents * discountValue) / 100)
      : discountValue;
  return Math.max(0, Math.min(rawDiscountCents, totalBeforeDiscountCents));
}
