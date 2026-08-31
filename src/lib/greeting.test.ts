import { describe, expect, it } from "vitest";
import { firstName, timeOfDayGreeting } from "./greeting";

describe("timeOfDayGreeting", () => {
  it("returns morning before midday", () => {
    expect(timeOfDayGreeting(new Date("2026-01-01T09:00:00"))).toBe("morning");
  });

  it("returns afternoon from midday to before 6pm", () => {
    expect(timeOfDayGreeting(new Date("2026-01-01T13:37:00"))).toBe("afternoon");
    expect(timeOfDayGreeting(new Date("2026-01-01T17:59:00"))).toBe("afternoon");
  });

  it("returns evening from 6pm onward", () => {
    expect(timeOfDayGreeting(new Date("2026-01-01T18:00:00"))).toBe("evening");
    expect(timeOfDayGreeting(new Date("2026-01-01T23:30:00"))).toBe("evening");
  });
});

describe("firstName", () => {
  it("returns the first word of a full name", () => {
    expect(firstName("Nitisat Sirisom")).toBe("Nitisat");
  });

  it("returns the whole string when there's only one word", () => {
    expect(firstName("Madonna")).toBe("Madonna");
  });

  it("trims surrounding whitespace", () => {
    expect(firstName("  Alex Host  ")).toBe("Alex");
  });
});
