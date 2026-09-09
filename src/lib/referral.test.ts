import { describe, expect, it } from "vitest";
import { computeCreditToApply, generateReferralCode } from "./referral";

describe("generateReferralCode", () => {
  it("generates a 6-character code", () => {
    expect(generateReferralCode()).toHaveLength(6);
  });

  it("only uses unambiguous uppercase letters and digits (no 0/O/1/I)", () => {
    const code = generateReferralCode();
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
  });

  it("generates different codes across calls (not a fixed constant)", () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateReferralCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe("computeCreditToApply", () => {
  it("applies the full balance when it's less than the total", () => {
    expect(computeCreditToApply(500, 10000)).toBe(500);
  });

  it("caps at the total when the balance exceeds it", () => {
    expect(computeCreditToApply(10000, 500)).toBe(500);
  });

  it("applies exactly the total when balance equals it", () => {
    expect(computeCreditToApply(500, 500)).toBe(500);
  });

  it("is 0 with no balance", () => {
    expect(computeCreditToApply(0, 10000)).toBe(0);
  });

  it("is 0 with no total to apply against", () => {
    expect(computeCreditToApply(500, 0)).toBe(0);
  });

  it("never goes negative for a negative total", () => {
    expect(computeCreditToApply(500, -100)).toBe(0);
  });
});
