import { describe, expect, it } from "vitest";
import { eventsToday } from "./concierge";
import type { LocalEvent } from "@prisma/client";

function event(startsAt: Date): LocalEvent {
  return {
    id: "evt-1",
    source: "TICKETMASTER",
    sourceId: "src-1",
    townSlug: "blackpool",
    name: "Test event",
    category: "OTHER",
    venueName: null,
    latitude: null,
    longitude: null,
    startsAt,
    endsAt: null,
    url: null,
    imageUrl: null,
    priceRange: null,
    rawData: null,
    lastFetchedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as LocalEvent;
}

describe("eventsToday", () => {
  const now = new Date("2026-09-09T12:00:00");

  it("includes an event later the same calendar day", () => {
    const result = eventsToday([event(new Date("2026-09-09T19:00:00"))], now);
    expect(result).toHaveLength(1);
  });

  it("includes an event earlier the same calendar day", () => {
    const result = eventsToday([event(new Date("2026-09-09T08:00:00"))], now);
    expect(result).toHaveLength(1);
  });

  it("excludes an event tomorrow", () => {
    const result = eventsToday([event(new Date("2026-09-10T08:00:00"))], now);
    expect(result).toHaveLength(0);
  });

  it("excludes an event yesterday", () => {
    const result = eventsToday([event(new Date("2026-09-08T23:00:00"))], now);
    expect(result).toHaveLength(0);
  });
});
