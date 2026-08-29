import { describe, expect, it } from "vitest";
import {
  computeCancellationRefund,
  daysBeforeCheckIn,
  resolveCancellationPolicy,
} from "./cancellationPolicy";

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

describe("resolveCancellationPolicy", () => {
  it("resolves the three fixed policies by kind", () => {
    expect(resolveCancellationPolicy({ cancellationPolicy: "FLEXIBLE" }).label).toBe("Flexible");
    expect(resolveCancellationPolicy({ cancellationPolicy: "MODERATE" }).label).toBe("Moderate");
    expect(resolveCancellationPolicy({ cancellationPolicy: "STRICT" }).label).toBe("Strict");
  });

  it("builds a CUSTOM policy from the listing's own cutoff and percentage", () => {
    const policy = resolveCancellationPolicy({
      cancellationPolicy: "CUSTOM",
      customCancellationCutoffDays: 14,
      customCancellationRefundPercent: 75,
    });
    expect(policy.tiers).toEqual([
      { minDaysBeforeCheckIn: 14, refundPercent: 75 },
      { minDaysBeforeCheckIn: 0, refundPercent: 0 },
    ]);
  });

  it("falls back to a sane default for an incompletely configured CUSTOM policy", () => {
    const policy = resolveCancellationPolicy({
      cancellationPolicy: "CUSTOM",
      customCancellationCutoffDays: null,
      customCancellationRefundPercent: null,
    });
    expect(policy.tiers[0]).toEqual({ minDaysBeforeCheckIn: 7, refundPercent: 50 });
  });
});

describe("daysBeforeCheckIn", () => {
  it("counts whole days remaining, and goes negative once check-in has passed", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    expect(daysBeforeCheckIn(new Date("2026-01-06T00:00:00Z"), now)).toBe(5);
    expect(daysBeforeCheckIn(new Date("2025-12-30T00:00:00Z"), now)).toBe(-2);
  });
});

describe("computeCancellationRefund", () => {
  it("refunds nothing when nothing was paid, regardless of policy or timing", () => {
    const policy = resolveCancellationPolicy({ cancellationPolicy: "FLEXIBLE" });
    const refund = computeCancellationRefund({
      policy,
      amountPaidCents: 0,
      checkIn: daysFromNow(30),
    });
    expect(refund).toEqual({ refundPercent: 0, refundCents: 0, nonRefundableCents: 0 });
  });

  it("FLEXIBLE: full refund a week out, nothing once check-in has passed", () => {
    const policy = resolveCancellationPolicy({ cancellationPolicy: "FLEXIBLE" });
    expect(
      computeCancellationRefund({ policy, amountPaidCents: 22000, checkIn: daysFromNow(7) }),
    ).toEqual({ refundPercent: 100, refundCents: 22000, nonRefundableCents: 0 });
    expect(
      computeCancellationRefund({ policy, amountPaidCents: 22000, checkIn: daysFromNow(-1) }),
    ).toEqual({ refundPercent: 0, refundCents: 0, nonRefundableCents: 22000 });
  });

  it("MODERATE: steps down from 100% to 50% to 0% as the cutoffs pass", () => {
    const policy = resolveCancellationPolicy({ cancellationPolicy: "MODERATE" });
    expect(
      computeCancellationRefund({ policy, amountPaidCents: 30000, checkIn: daysFromNow(5) })
        .refundPercent,
    ).toBe(100);
    expect(
      computeCancellationRefund({ policy, amountPaidCents: 30000, checkIn: daysFromNow(3) })
        .refundPercent,
    ).toBe(50);
    expect(
      computeCancellationRefund({ policy, amountPaidCents: 30000, checkIn: daysFromNow(0) })
        .refundPercent,
    ).toBe(0);
  });

  it("STRICT: half back a week out, otherwise nothing", () => {
    const policy = resolveCancellationPolicy({ cancellationPolicy: "STRICT" });
    const refund = computeCancellationRefund({
      policy,
      amountPaidCents: 10000,
      checkIn: daysFromNow(10),
    });
    expect(refund).toEqual({ refundPercent: 50, refundCents: 5000, nonRefundableCents: 5000 });
    expect(
      computeCancellationRefund({ policy, amountPaidCents: 10000, checkIn: daysFromNow(2) })
        .refundCents,
    ).toBe(0);
  });

  it("CUSTOM: applies the host's own cutoff and percentage", () => {
    const policy = resolveCancellationPolicy({
      cancellationPolicy: "CUSTOM",
      customCancellationCutoffDays: 3,
      customCancellationRefundPercent: 90,
    });
    const refund = computeCancellationRefund({
      policy,
      amountPaidCents: 10000,
      checkIn: daysFromNow(3),
    });
    expect(refund).toEqual({ refundPercent: 90, refundCents: 9000, nonRefundableCents: 1000 });
  });

  it("rounds a fractional refund to the nearest whole penny", () => {
    const policy = resolveCancellationPolicy({ cancellationPolicy: "STRICT" });
    // 50% of £1.01 (101p) is 50.5p, rounds to 51p.
    const refund = computeCancellationRefund({ policy, amountPaidCents: 101, checkIn: daysFromNow(10) });
    expect(refund.refundCents).toBe(51);
    expect(refund.nonRefundableCents).toBe(50);
  });
});
