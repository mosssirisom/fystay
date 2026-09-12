import { describe, expect, it } from "vitest";
import { computePromoDiscount, normalizePromoCode, validatePromoCode } from "./promoCode";

describe("normalizePromoCode", () => {
  it("uppercases and trims", () => {
    expect(normalizePromoCode("  welcome10  ")).toBe("WELCOME10");
  });

  it("is a no-op on an already-normalized code", () => {
    expect(normalizePromoCode("SUMMER20")).toBe("SUMMER20");
  });
});

describe("validatePromoCode", () => {
  const base = {
    active: true,
    expiresAt: null,
    maxRedemptions: null,
    redemptionCount: 0,
    discountType: "PERCENT" as const,
    discountValue: 10,
  };

  it("accepts an active, unexpired, unlimited code", () => {
    expect(validatePromoCode(base)).toEqual({ valid: true });
  });

  it("rejects an inactive code", () => {
    expect(validatePromoCode({ ...base, active: false })).toEqual({
      valid: false,
      error: "This promo code is no longer active",
    });
  });

  it("rejects an expired code", () => {
    const now = new Date("2026-06-01");
    expect(
      validatePromoCode({ ...base, expiresAt: new Date("2026-05-31") }, now),
    ).toEqual({ valid: false, error: "This promo code has expired" });
  });

  it("accepts a code expiring in the future", () => {
    const now = new Date("2026-06-01");
    expect(validatePromoCode({ ...base, expiresAt: new Date("2026-06-02") }, now)).toEqual({
      valid: true,
    });
  });

  it("rejects a code that has reached its redemption limit", () => {
    expect(
      validatePromoCode({ ...base, maxRedemptions: 5, redemptionCount: 5 }),
    ).toEqual({ valid: false, error: "This promo code has reached its redemption limit" });
  });

  it("accepts a code with redemptions remaining", () => {
    expect(validatePromoCode({ ...base, maxRedemptions: 5, redemptionCount: 4 })).toEqual({
      valid: true,
    });
  });
});

describe("computePromoDiscount", () => {
  it("computes a percentage discount off the total", () => {
    expect(computePromoDiscount("PERCENT", 10, 20000)).toBe(2000);
  });

  it("computes a fixed discount as a flat amount", () => {
    expect(computePromoDiscount("FIXED", 1500, 20000)).toBe(1500);
  });

  it("caps a fixed discount at the total, never going negative", () => {
    expect(computePromoDiscount("FIXED", 50000, 20000)).toBe(20000);
  });

  it("caps a percentage discount over 100% at the total", () => {
    expect(computePromoDiscount("PERCENT", 150, 20000)).toBe(20000);
  });

  it("returns 0 for a zero total", () => {
    expect(computePromoDiscount("PERCENT", 10, 0)).toBe(0);
    expect(computePromoDiscount("FIXED", 500, 0)).toBe(0);
  });

  it("rounds a percentage discount to the nearest cent", () => {
    expect(computePromoDiscount("PERCENT", 33, 10001)).toBe(3300);
  });
});
