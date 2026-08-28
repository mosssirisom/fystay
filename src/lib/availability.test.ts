import { describe, expect, it } from "vitest";
import { isRangeAvailable, nightsBetween, rangesOverlap } from "./availability";

const d = (s: string) => new Date(s);

describe("rangesOverlap", () => {
  it("detects overlapping ranges", () => {
    expect(rangesOverlap(d("2026-01-01"), d("2026-01-05"), d("2026-01-03"), d("2026-01-08"))).toBe(
      true,
    );
  });

  it("treats back-to-back ranges as non-overlapping (checkout day == checkin day)", () => {
    expect(rangesOverlap(d("2026-01-01"), d("2026-01-05"), d("2026-01-05"), d("2026-01-08"))).toBe(
      false,
    );
  });

  it("detects one range fully containing another", () => {
    expect(rangesOverlap(d("2026-01-01"), d("2026-01-10"), d("2026-01-03"), d("2026-01-05"))).toBe(
      true,
    );
  });

  it("returns false for entirely separate ranges", () => {
    expect(rangesOverlap(d("2026-01-01"), d("2026-01-05"), d("2026-02-01"), d("2026-02-05"))).toBe(
      false,
    );
  });
});

describe("isRangeAvailable", () => {
  const booked = [{ checkIn: d("2026-06-10"), checkOut: d("2026-06-15") }];

  it("rejects a zero-night request (checkOut === checkIn)", () => {
    expect(isRangeAvailable(d("2026-06-01"), d("2026-06-01"), [])).toBe(false);
  });

  it("rejects an inverted range (checkOut before checkIn)", () => {
    expect(isRangeAvailable(d("2026-06-05"), d("2026-06-01"), [])).toBe(false);
  });

  it("allows a range with no bookings", () => {
    expect(isRangeAvailable(d("2026-06-01"), d("2026-06-05"), [])).toBe(true);
  });

  it("rejects a range overlapping an existing booking", () => {
    expect(isRangeAvailable(d("2026-06-12"), d("2026-06-18"), booked)).toBe(false);
  });

  it("allows a new booking starting exactly on an existing booking's checkout day", () => {
    expect(isRangeAvailable(d("2026-06-15"), d("2026-06-20"), booked)).toBe(true);
  });

  it("allows a new booking ending exactly on an existing booking's checkin day", () => {
    expect(isRangeAvailable(d("2026-06-05"), d("2026-06-10"), booked)).toBe(true);
  });
});

describe("nightsBetween", () => {
  it("counts calendar nights between two dates", () => {
    expect(nightsBetween(d("2026-06-01"), d("2026-06-05"))).toBe(4);
  });

  it("returns 0 rather than negative for an inverted range", () => {
    expect(nightsBetween(d("2026-06-05"), d("2026-06-01"))).toBe(0);
  });

  it("returns 0 for a same-day range", () => {
    expect(nightsBetween(d("2026-06-01"), d("2026-06-01"))).toBe(0);
  });
});
