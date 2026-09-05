import { describe, expect, it } from "vitest";
import { computeBookingPricing, GUEST_SERVICE_FEE_RATE, splitByHostShare } from "./pricing";

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
