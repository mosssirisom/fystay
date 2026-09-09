import { describe, expect, it } from "vitest";
import { parseIcsEvents } from "./icalParse";

function ics(body: string): string {
  return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${body}END:VCALENDAR\r\n`;
}

describe("parseIcsEvents", () => {
  it("parses a single all-day VEVENT", () => {
    const events = parseIcsEvents(
      ics(
        "BEGIN:VEVENT\r\nUID:abc-123\r\nDTSTART;VALUE=DATE:20260610\r\nDTEND;VALUE=DATE:20260615\r\nEND:VEVENT\r\n",
      ),
    );
    expect(events).toEqual([
      { uid: "abc-123", start: new Date(Date.UTC(2026, 5, 10)), end: new Date(Date.UTC(2026, 5, 15)) },
    ]);
  });

  it("parses a DATE-TIME value with a Z suffix", () => {
    const events = parseIcsEvents(
      ics(
        "BEGIN:VEVENT\r\nUID:dt-1\r\nDTSTART:20260610T140000Z\r\nDTEND:20260615T110000Z\r\nEND:VEVENT\r\n",
      ),
    );
    expect(events).toEqual([
      {
        uid: "dt-1",
        start: new Date(Date.UTC(2026, 5, 10, 14, 0, 0)),
        end: new Date(Date.UTC(2026, 5, 15, 11, 0, 0)),
      },
    ]);
  });

  it("unfolds a UID value split across a continuation line back into one property", () => {
    // A single long UID folded mid-value, per RFC 5545 - the continuation
    // line's one leading space is the fold marker itself, not part of the
    // value, so unfolding must strip it before property parsing runs.
    const events = parseIcsEvents(
      ics("BEGIN:VEVENT\r\nUID:long-uid-part-one-\r\n part-two\r\nDTSTART;VALUE=DATE:20260610\r\nDTEND;VALUE=DATE:20260611\r\nEND:VEVENT\r\n"),
    );
    expect(events[0]?.uid).toBe("long-uid-part-one-part-two");
  });

  it("skips a VEVENT missing UID, DTSTART, or DTEND", () => {
    const events = parseIcsEvents(
      ics("BEGIN:VEVENT\r\nDTSTART;VALUE=DATE:20260610\r\nDTEND;VALUE=DATE:20260611\r\nEND:VEVENT\r\n"),
    );
    expect(events).toEqual([]);
  });

  it("skips an event with an unparseable date rather than throwing", () => {
    const events = parseIcsEvents(
      ics("BEGIN:VEVENT\r\nUID:bad-date\r\nDTSTART:not-a-date\r\nDTEND;VALUE=DATE:20260611\r\nEND:VEVENT\r\n"),
    );
    expect(events).toEqual([]);
  });

  it("parses multiple VEVENTs from the same feed", () => {
    const events = parseIcsEvents(
      ics(
        "BEGIN:VEVENT\r\nUID:one\r\nDTSTART;VALUE=DATE:20260101\r\nDTEND;VALUE=DATE:20260102\r\nEND:VEVENT\r\n" +
          "BEGIN:VEVENT\r\nUID:two\r\nDTSTART;VALUE=DATE:20260201\r\nDTEND;VALUE=DATE:20260202\r\nEND:VEVENT\r\n",
      ),
    );
    expect(events.map((e) => e.uid)).toEqual(["one", "two"]);
  });

  it("returns an empty array for a feed with no events", () => {
    expect(parseIcsEvents(ics(""))).toEqual([]);
  });

  it("ignores property parameters, reading only the value after the last relevant colon", () => {
    const events = parseIcsEvents(
      ics(
        "BEGIN:VEVENT\r\nUID:params-1\r\nDTSTART;TZID=Europe/London;VALUE=DATE:20260301\r\nDTEND;VALUE=DATE:20260302\r\nEND:VEVENT\r\n",
      ),
    );
    expect(events).toEqual([
      { uid: "params-1", start: new Date(Date.UTC(2026, 2, 1)), end: new Date(Date.UTC(2026, 2, 2)) },
    ]);
  });
});
