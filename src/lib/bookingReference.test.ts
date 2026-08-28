import { describe, expect, it } from "vitest";
import { generateBookingReference } from "./bookingReference";

describe("generateBookingReference", () => {
  it("matches the FY-XXXXXXXX shape using only unambiguous characters", () => {
    const reference = generateBookingReference();
    expect(reference).toMatch(/^FY-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/);
  });

  it("is not deterministic across calls", () => {
    const references = new Set(Array.from({ length: 50 }, () => generateBookingReference()));
    expect(references.size).toBe(50);
  });
});
