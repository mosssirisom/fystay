import { describe, expect, it } from "vitest";
import { isOpenAt } from "./openingHours";

// A Wednesday (Mo=0 in this parser's own indexing) at 10:00 and at 22:00.
const WED_MORNING = new Date("2026-09-09T10:00:00");
const WED_NIGHT = new Date("2026-09-09T22:00:00");
const SUNDAY_NOON = new Date("2026-09-13T12:00:00");

describe("isOpenAt", () => {
  it("returns null for a missing opening_hours value", () => {
    expect(isOpenAt(null, WED_MORNING)).toBeNull();
    expect(isOpenAt(undefined, WED_MORNING)).toBeNull();
  });

  it("treats 24/7 as always open", () => {
    expect(isOpenAt("24/7", WED_NIGHT)).toBe(true);
    expect(isOpenAt("24/7", SUNDAY_NOON)).toBe(true);
  });

  it("matches a simple weekday range and time window", () => {
    expect(isOpenAt("Mo-Fr 09:00-17:00", WED_MORNING)).toBe(true);
    expect(isOpenAt("Mo-Fr 09:00-17:00", WED_NIGHT)).toBe(false);
  });

  it("doesn't match a day outside the range", () => {
    expect(isOpenAt("Mo-Fr 09:00-17:00", SUNDAY_NOON)).toBe(false);
  });

  it("supports multiple time ranges in one day (a lunch closure)", () => {
    const hours = "Mo-Su 09:00-12:00,13:00-18:00";
    expect(isOpenAt(hours, new Date("2026-09-09T11:00:00"))).toBe(true);
    expect(isOpenAt(hours, new Date("2026-09-09T12:30:00"))).toBe(false);
    expect(isOpenAt(hours, new Date("2026-09-09T14:00:00"))).toBe(true);
  });

  it("supports multiple day-groups separated by semicolons", () => {
    const hours = "Mo-Fr 09:00-17:00; Sa 10:00-14:00";
    expect(isOpenAt(hours, new Date("2026-09-12T11:00:00"))).toBe(true); // Saturday
    expect(isOpenAt(hours, SUNDAY_NOON)).toBe(false);
  });

  it("returns null (unknown) for syntax it doesn't confidently understand, rather than guessing", () => {
    expect(isOpenAt("PH off", WED_MORNING)).toBeNull();
    expect(isOpenAt("sunrise-sunset", WED_MORNING)).toBeNull();
    expect(isOpenAt("Jan-Mar Mo-Fr 09:00-17:00", WED_MORNING)).toBeNull();
  });
});
