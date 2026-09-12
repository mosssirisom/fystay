import { describe, expect, it } from "vitest";
import { summarizePlatformFinancials, type AdminBookingSummary } from "./adminSummary";

function booking(overrides: Partial<AdminBookingSummary> = {}): AdminBookingSummary {
  return {
    paymentStatus: "PAID",
    totalPriceCents: 20000,
    serviceFeeCents: 2000,
    taxCents: 0,
    creditAppliedCents: 0,
    promoDiscountCents: 0,
    ...overrides,
  };
}

describe("summarizePlatformFinancials", () => {
  it("ignores UNPAID bookings entirely", () => {
    const result = summarizePlatformFinancials([booking({ paymentStatus: "UNPAID" })]);
    expect(result).toEqual({
      grossBookingValueCents: 0,
      platformRevenueCents: 0,
      paidBookingsCount: 0,
    });
  });

  it("counts a PAID booking's total and service fee", () => {
    const result = summarizePlatformFinancials([booking()]);
    expect(result.grossBookingValueCents).toBe(20000);
    expect(result.platformRevenueCents).toBe(2000);
    expect(result.paidBookingsCount).toBe(1);
  });

  it("counts PARTIALLY_REFUNDED and REFUNDED bookings too - money still moved", () => {
    const result = summarizePlatformFinancials([
      booking({ paymentStatus: "PARTIALLY_REFUNDED" }),
      booking({ paymentStatus: "REFUNDED" }),
    ]);
    expect(result.paidBookingsCount).toBe(2);
  });

  it("subtracts referral credit and promo discount from platform revenue, not gross booking value", () => {
    const result = summarizePlatformFinancials([
      booking({ serviceFeeCents: 2000, creditAppliedCents: 500, promoDiscountCents: 300 }),
    ]);
    expect(result.grossBookingValueCents).toBe(20000);
    expect(result.platformRevenueCents).toBe(1200);
  });

  it("floors platform revenue at 0 when combined discounts exceed the fee", () => {
    const result = summarizePlatformFinancials([
      booking({ serviceFeeCents: 500, creditAppliedCents: 400, promoDiscountCents: 300 }),
    ]);
    expect(result.platformRevenueCents).toBe(0);
  });

  it("sums across multiple bookings", () => {
    const result = summarizePlatformFinancials([booking(), booking({ totalPriceCents: 10000, serviceFeeCents: 1000 })]);
    expect(result.grossBookingValueCents).toBe(30000);
    expect(result.platformRevenueCents).toBe(3000);
    expect(result.paidBookingsCount).toBe(2);
  });

  it("returns all zeros for an empty list", () => {
    expect(summarizePlatformFinancials([])).toEqual({
      grossBookingValueCents: 0,
      platformRevenueCents: 0,
      paidBookingsCount: 0,
    });
  });
});
