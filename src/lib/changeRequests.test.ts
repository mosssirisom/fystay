import { describe, expect, it } from "vitest";
import { canCancelBooking, canRequestBookingChange, computePriceDeltaCents } from "./changeRequests";

const now = new Date("2026-06-15");

describe("canCancelBooking", () => {
  it("allows cancelling an upcoming booking", () => {
    expect(canCancelBooking({ status: "CONFIRMED", checkIn: new Date("2026-06-20") }, now)).toBe(
      true,
    );
  });

  it("rejects a booking that has already started", () => {
    expect(canCancelBooking({ status: "CONFIRMED", checkIn: new Date("2026-06-10") }, now)).toBe(
      false,
    );
  });

  it("rejects an already-cancelled booking", () => {
    expect(canCancelBooking({ status: "CANCELLED", checkIn: new Date("2026-06-20") }, now)).toBe(
      false,
    );
  });

  it("allows cancelling a PENDING (unpaid) upcoming booking", () => {
    expect(canCancelBooking({ status: "PENDING", checkIn: new Date("2026-06-20") }, now)).toBe(
      true,
    );
  });
});

describe("canRequestBookingChange", () => {
  it("allows a change request on a CONFIRMED, upcoming booking with no pending request", () => {
    expect(
      canRequestBookingChange({ status: "CONFIRMED", checkIn: new Date("2026-06-20") }, false, now),
    ).toBe(true);
  });

  it("rejects a booking that already has a pending request", () => {
    expect(
      canRequestBookingChange({ status: "CONFIRMED", checkIn: new Date("2026-06-20") }, true, now),
    ).toBe(false);
  });

  it("rejects a PENDING (unpaid) booking", () => {
    expect(
      canRequestBookingChange({ status: "PENDING", checkIn: new Date("2026-06-20") }, false, now),
    ).toBe(false);
  });

  it("rejects a booking that has already started", () => {
    expect(
      canRequestBookingChange({ status: "CONFIRMED", checkIn: new Date("2026-06-10") }, false, now),
    ).toBe(false);
  });
});

describe("computePriceDeltaCents", () => {
  it("is positive when the new stay costs more", () => {
    expect(computePriceDeltaCents(5, 10000, 30000)).toBe(20000);
  });

  it("is negative when the new stay costs less", () => {
    expect(computePriceDeltaCents(2, 10000, 30000)).toBe(-10000);
  });

  it("is zero when the price is unchanged", () => {
    expect(computePriceDeltaCents(3, 10000, 30000)).toBe(0);
  });
});
