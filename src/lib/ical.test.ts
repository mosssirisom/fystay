import { describe, expect, it } from "vitest";
import { generateIcs } from "./ical";

const d = (s: string) => new Date(s);

describe("generateIcs", () => {
  it("wraps events in a valid VCALENDAR envelope", () => {
    const ics = generateIcs({ calendarName: "Test listing", events: [] });
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("X-WR-CALNAME:Test listing");
  });

  it("renders one VEVENT per event with UID, all-day DTSTART/DTEND, and SUMMARY", () => {
    const ics = generateIcs({
      calendarName: "Test listing",
      events: [{ uid: "booking-1", start: d("2026-06-10T00:00:00Z"), end: d("2026-06-15T00:00:00Z"), summary: "Booked" }],
    });
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("UID:booking-1");
    expect(ics).toContain("DTSTART;VALUE=DATE:20260610");
    expect(ics).toContain("DTEND;VALUE=DATE:20260615");
    expect(ics).toContain("SUMMARY:Booked");
    expect(ics).toContain("END:VEVENT");
  });

  it("escapes commas, semicolons, and backslashes in free text", () => {
    const ics = generateIcs({
      calendarName: "Test",
      events: [{ uid: "u1", start: d("2026-01-01"), end: d("2026-01-02"), summary: "Reason: a, b; c\\d" }],
    });
    expect(ics).toContain("SUMMARY:Reason: a\\, b\\; c\\\\d");
  });

  it("uses CRLF line endings per RFC 5545", () => {
    const ics = generateIcs({ calendarName: "Test", events: [] });
    expect(ics).toContain("\r\n");
    expect(ics.endsWith("\r\n")).toBe(true);
  });

  it("folds a line longer than 75 octets onto a continuation line starting with a space", () => {
    const longSummary = "x".repeat(100);
    const ics = generateIcs({
      calendarName: "Test",
      events: [{ uid: "u1", start: d("2026-01-01"), end: d("2026-01-02"), summary: longSummary }],
    });
    expect(ics).toContain("\r\n ");
    const lines = ics.split("\r\n");
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(75);
    }
  });

  it("renders multiple events independently", () => {
    const ics = generateIcs({
      calendarName: "Test",
      events: [
        { uid: "u1", start: d("2026-01-01"), end: d("2026-01-02"), summary: "One" },
        { uid: "u2", start: d("2026-02-01"), end: d("2026-02-02"), summary: "Two" },
      ],
    });
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain("UID:u1");
    expect(ics).toContain("UID:u2");
  });
});
