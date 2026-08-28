import { describe, expect, it } from "vitest";
import { canReviewBooking } from "./reviews";

const now = new Date("2026-06-15");

describe("canReviewBooking", () => {
  it("allows a completed, confirmed, unreviewed booking", () => {
    expect(
      canReviewBooking({ status: "CONFIRMED", checkOut: new Date("2026-06-10") }, now),
    ).toBe(true);
  });

  it("rejects a booking that hasn't checked out yet", () => {
    expect(
      canReviewBooking({ status: "CONFIRMED", checkOut: new Date("2026-06-20") }, now),
    ).toBe(false);
  });

  it("rejects a PENDING booking", () => {
    expect(
      canReviewBooking({ status: "PENDING", checkOut: new Date("2026-06-10") }, now),
    ).toBe(false);
  });

  it("rejects a CANCELLED booking", () => {
    expect(
      canReviewBooking({ status: "CANCELLED", checkOut: new Date("2026-06-10") }, now),
    ).toBe(false);
  });

  it("rejects a booking that already has a review", () => {
    expect(
      canReviewBooking(
        { status: "CONFIRMED", checkOut: new Date("2026-06-10"), review: { id: "r1" } },
        now,
      ),
    ).toBe(false);
  });

  it("allows a booking checking out exactly now", () => {
    expect(canReviewBooking({ status: "CONFIRMED", checkOut: now }, now)).toBe(true);
  });
});
