import { describe, expect, it } from "vitest";
import { normalizeTicketmasterEvent } from "./ticketmasterNormalize";
import type { TicketmasterEvent } from "./ticketmasterSource";

function event(overrides: Partial<TicketmasterEvent>): TicketmasterEvent {
  return {
    id: "evt-1",
    name: "Some Gig",
    dates: { start: { dateTime: "2026-09-20T19:30:00Z" } },
    ...overrides,
  };
}

describe("normalizeTicketmasterEvent", () => {
  it("normalizes a well-formed event", () => {
    const result = normalizeTicketmasterEvent(
      event({
        classifications: [{ segment: { name: "Music" } }],
        _embedded: { venues: [{ name: "Winter Gardens", location: { latitude: "53.81", longitude: "-3.05" } }] },
        priceRanges: [{ min: 10, max: 25, currency: "GBP" }],
        url: "https://example.com/event",
      }),
    );
    expect(result).toMatchObject({
      sourceId: "evt-1",
      name: "Some Gig",
      category: "Music",
      venueName: "Winter Gardens",
      latitude: 53.81,
      longitude: -3.05,
      priceRange: "GBP 10–25",
      url: "https://example.com/event",
    });
    expect(result?.startsAt).toEqual(new Date("2026-09-20T19:30:00Z"));
  });

  it("falls back to a localDate-only start time when dateTime is missing", () => {
    const result = normalizeTicketmasterEvent(event({ dates: { start: { localDate: "2026-09-20" } } }));
    expect(result?.startsAt.getUTCFullYear()).toBe(2026);
  });

  it("returns null when there's no usable start time at all", () => {
    expect(normalizeTicketmasterEvent(event({ dates: { start: {} } }))).toBeNull();
  });

  it("defaults category to a generic label when Ticketmaster gives none", () => {
    const result = normalizeTicketmasterEvent(event({ classifications: undefined }));
    expect(result?.category).toBe("Event");
  });

  it("leaves venue/location/price/url null rather than guessing when absent", () => {
    const result = normalizeTicketmasterEvent(event({}));
    expect(result?.venueName).toBeNull();
    expect(result?.latitude).toBeNull();
    expect(result?.priceRange).toBeNull();
    expect(result?.url).toBeNull();
  });
});
