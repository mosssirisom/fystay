import { describe, expect, it } from "vitest";
import {
  computeBookingPricing,
  GUEST_SERVICE_FEE_RATE,
  resolveLengthOfStayDiscount,
  splitByHostShare,
} from "./pricing";

describe("computeBookingPricing", () => {
  it("computes the nightly subtotal and service fee for a stay with no cleaning fee", () => {
    const result = computeBookingPricing({ nights: 3, pricePerNightCents: 10000 });

    expect(result.nightlySubtotalCents).toBe(30000);
    expect(result.cleaningFeeCents).toBe(0);
    expect(result.serviceFeeCents).toBe(3000);
    expect(result.taxCents).toBe(0);
    expect(result.totalPriceCents).toBe(33000);
  });

  it("includes the cleaning fee in the total but not in the service-fee base", () => {
    const result = computeBookingPricing({
      nights: 2,
      pricePerNightCents: 5000,
      cleaningFeeCents: 2500,
    });

    expect(result.nightlySubtotalCents).toBe(10000);
    expect(result.cleaningFeeCents).toBe(2500);
    expect(result.serviceFeeCents).toBe(1000);
    expect(result.totalPriceCents).toBe(13500);
  });

  it("returns all zeroes for a zero-night stay", () => {
    const result = computeBookingPricing({ nights: 0, pricePerNightCents: 12345 });
    expect(result.totalPriceCents).toBe(0);
  });

  it("rounds the service fee to the nearest whole cent/penny", () => {
    const result = computeBookingPricing({ nights: 1, pricePerNightCents: 999 });
    expect(result.serviceFeeCents).toBe(Math.round(999 * GUEST_SERVICE_FEE_RATE));
  });

  it("applies no discount below the weekly threshold, even if one is set", () => {
    const result = computeBookingPricing({
      nights: 6,
      pricePerNightCents: 10000,
      weeklyDiscountPercent: 10,
    });
    expect(result.lengthOfStayDiscountCents).toBe(0);
    expect(result.lengthOfStayDiscountLabel).toBeNull();
    expect(result.totalPriceCents).toBe(66000);
  });

  it("applies the weekly discount to the nightly subtotal at 7+ nights", () => {
    const result = computeBookingPricing({
      nights: 7,
      pricePerNightCents: 10000,
      weeklyDiscountPercent: 10,
    });
    // 70000 gross - 10% = 63000, service fee on the discounted amount.
    expect(result.nightlySubtotalCents).toBe(70000);
    expect(result.lengthOfStayDiscountPercent).toBe(10);
    expect(result.lengthOfStayDiscountCents).toBe(7000);
    expect(result.lengthOfStayDiscountLabel).toBe("weekly");
    expect(result.serviceFeeCents).toBe(6300);
    expect(result.totalPriceCents).toBe(69300);
  });

  it("applies the monthly discount instead of the weekly one at 28+ nights", () => {
    const result = computeBookingPricing({
      nights: 28,
      pricePerNightCents: 10000,
      weeklyDiscountPercent: 10,
      monthlyDiscountPercent: 20,
    });
    expect(result.lengthOfStayDiscountPercent).toBe(20);
    expect(result.lengthOfStayDiscountLabel).toBe("monthly");
  });

  it("falls back to the weekly discount at 28+ nights if no monthly rate is set", () => {
    const result = computeBookingPricing({
      nights: 30,
      pricePerNightCents: 10000,
      weeklyDiscountPercent: 10,
    });
    expect(result.lengthOfStayDiscountPercent).toBe(10);
    expect(result.lengthOfStayDiscountLabel).toBe("weekly");
  });

  it("includes the cleaning fee in the total after the discount, not before", () => {
    const result = computeBookingPricing({
      nights: 7,
      pricePerNightCents: 10000,
      cleaningFeeCents: 5000,
      weeklyDiscountPercent: 10,
    });
    expect(result.totalPriceCents).toBe(63000 + 6300 + 5000);
  });
});

describe("resolveLengthOfStayDiscount", () => {
  it("applies neither discount when nothing is configured", () => {
    expect(resolveLengthOfStayDiscount({ nights: 30 })).toEqual({ percent: 0, label: null });
  });

  it("treats a 0% discount as unset (no discount applied)", () => {
    const result = resolveLengthOfStayDiscount({ nights: 10, weeklyDiscountPercent: 0 });
    expect(result).toEqual({ percent: 0, label: null });
  });
});

describe("splitByHostShare", () => {
  const booking = { nightlyPriceCents: 27000, cleaningFeeCents: 3000, totalPriceCents: 33000 };

  it("splits an amount in the same proportion as the booking's own nightly+cleaning vs total", () => {
    const result = splitByHostShare(11000, booking);
    // (27000 + 3000) / 33000 = 10/11 host share.
    expect(result.hostShareCents).toBe(10000);
    expect(result.platformShareCents).toBe(1000);
  });

  it("always sums back to the original amount, even after rounding", () => {
    const result = splitByHostShare(101, booking);
    expect(result.hostShareCents + result.platformShareCents).toBe(101);
  });

  it("gives the host share the entire amount when the booking has no total to prorate against", () => {
    const result = splitByHostShare(5000, { ...booking, totalPriceCents: 0 });
    expect(result).toEqual({ hostShareCents: 5000, platformShareCents: 0 });
  });

  it("never produces a negative platform share, since host revenue never exceeds the total", () => {
    const result = splitByHostShare(4999, booking);
    expect(result.platformShareCents).toBeGreaterThanOrEqual(0);
  });
});
