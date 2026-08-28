import { describe, expect, it } from "vitest";
import { formatPrice } from "./format";

describe("formatPrice", () => {
  it("formats whole pounds with no decimal places", () => {
    expect(formatPrice(7500)).toBe("£75");
  });

  it("rounds to the nearest pound rather than showing pence", () => {
    expect(formatPrice(7550)).toBe("£76"); // 75.50 -> rounds up
  });

  it("formats zero", () => {
    expect(formatPrice(0)).toBe("£0");
  });

  it("formats large amounts with thousands separators", () => {
    expect(formatPrice(123456700)).toBe("£1,234,567");
  });
});
