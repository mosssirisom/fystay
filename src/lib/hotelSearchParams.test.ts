import { describe, expect, it } from "vitest";
import { buildHotelSearchQuery, parseHotelSearchParams } from "./hotelSearchParams";

const NOW = new Date("2027-06-01T12:00:00");

const validRaw = {
  destination: "Blackpool",
  checkIn: "2027-06-10",
  checkOut: "2027-06-13",
  adults: "2",
  children: "1",
  rooms: "1",
};

describe("parseHotelSearchParams", () => {
  it("accepts a fully valid search", () => {
    const result = parseHotelSearchParams(validRaw, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.params.destination).toBe("Blackpool");
      expect(result.params.adults).toBe(2);
      expect(result.params.children).toBe(1);
      expect(result.params.rooms).toBe(1);
      expect(result.params.checkIn.getDate()).toBe(10);
      expect(result.params.checkOut.getDate()).toBe(13);
    }
  });

  it("defaults adults to 1, children/rooms to their own defaults when omitted", () => {
    const result = parseHotelSearchParams(
      { destination: "Lytham", checkIn: "2027-06-10", checkOut: "2027-06-12" },
      NOW,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.params.adults).toBe(1);
      expect(result.params.children).toBe(0);
      expect(result.params.rooms).toBe(1);
    }
  });

  it("trims destination whitespace", () => {
    const result = parseHotelSearchParams({ ...validRaw, destination: "  Blackpool  " }, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.params.destination).toBe("Blackpool");
  });

  describe("destination validation", () => {
    it("rejects an empty destination", () => {
      const result = parseHotelSearchParams({ ...validRaw, destination: "" }, NOW);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.destination).toMatch(/enter a destination/i);
    });

    it("rejects a destination that's only whitespace", () => {
      const result = parseHotelSearchParams({ ...validRaw, destination: "   " }, NOW);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.destination).toBeDefined();
    });

    it("rejects an absurdly long destination", () => {
      const result = parseHotelSearchParams({ ...validRaw, destination: "x".repeat(101) }, NOW);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.destination).toMatch(/too long/i);
    });
  });

  describe("date validation", () => {
    it("rejects a missing check-in", () => {
      const result = parseHotelSearchParams({ ...validRaw, checkIn: "" }, NOW);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.dates).toBeDefined();
    });

    it("rejects a missing check-out", () => {
      const result = parseHotelSearchParams({ ...validRaw, checkOut: "" }, NOW);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.dates).toBeDefined();
    });

    it("rejects an unparseable date string", () => {
      const result = parseHotelSearchParams({ ...validRaw, checkIn: "not-a-date" }, NOW);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.dates).toBeDefined();
    });

    it("rejects a check-in in the past", () => {
      const result = parseHotelSearchParams({ ...validRaw, checkIn: "2027-05-01", checkOut: "2027-05-03" }, NOW);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.dates).toMatch(/past/i);
    });

    it("accepts a check-in of today", () => {
      const result = parseHotelSearchParams(
        { ...validRaw, checkIn: "2027-06-01", checkOut: "2027-06-03" },
        NOW,
      );
      expect(result.ok).toBe(true);
    });

    it("rejects check-out equal to check-in", () => {
      const result = parseHotelSearchParams(
        { ...validRaw, checkIn: "2027-06-10", checkOut: "2027-06-10" },
        NOW,
      );
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.dates).toMatch(/after check-in/i);
    });

    it("rejects check-out before check-in", () => {
      const result = parseHotelSearchParams(
        { ...validRaw, checkIn: "2027-06-10", checkOut: "2027-06-05" },
        NOW,
      );
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.dates).toMatch(/after check-in/i);
    });

    it("rejects a stay longer than the max supported nights", () => {
      const result = parseHotelSearchParams(
        { ...validRaw, checkIn: "2027-06-10", checkOut: "2027-08-10" },
        NOW,
      );
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.dates).toMatch(/nights/i);
    });
  });

  describe("guest validation", () => {
    it("rejects zero adults", () => {
      const result = parseHotelSearchParams({ ...validRaw, adults: "0" }, NOW);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.guests).toMatch(/adults/i);
    });

    it("falls back to the default (1) for a negative adults value, matching parseGuestParam's own rule", () => {
      // parseGuestParam (src/lib/search.ts, already used by FYStay's own
      // listing search) discards a negative value and substitutes the
      // fallback rather than erroring - this validator inherits that same
      // "ignore garbage, don't reject the whole search" behavior rather
      // than adding a second, differently-worded rule on top of it.
      const result = parseHotelSearchParams({ ...validRaw, adults: "-1" }, NOW);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.params.adults).toBe(1);
    });

    it("rejects an unreasonably large adults value", () => {
      const result = parseHotelSearchParams({ ...validRaw, adults: "500" }, NOW);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.guests).toMatch(/adults/i);
    });

    it("rejects zero rooms", () => {
      const result = parseHotelSearchParams({ ...validRaw, rooms: "0" }, NOW);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.guests).toMatch(/rooms/i);
    });

    it("rejects too many rooms", () => {
      const result = parseHotelSearchParams({ ...validRaw, rooms: "50" }, NOW);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.guests).toMatch(/rooms/i);
    });

    it("accepts zero children", () => {
      const result = parseHotelSearchParams({ ...validRaw, children: "0" }, NOW);
      expect(result.ok).toBe(true);
    });

    it("rejects too many children", () => {
      const result = parseHotelSearchParams({ ...validRaw, children: "50" }, NOW);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.guests).toMatch(/children/i);
    });
  });

  it("reports multiple field errors at once when several fields are invalid", () => {
    const result = parseHotelSearchParams({ destination: "", checkIn: "", checkOut: "", adults: "0" }, NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.destination).toBeDefined();
      expect(result.errors.dates).toBeDefined();
      expect(result.errors.guests).toBeDefined();
    }
  });
});

describe("buildHotelSearchQuery", () => {
  it("omits default-valued guest fields", () => {
    const query = buildHotelSearchQuery({
      destination: "Blackpool",
      checkIn: new Date(2027, 5, 10),
      checkOut: new Date(2027, 5, 13),
      adults: 1,
      children: 0,
      rooms: 1,
    });
    const params = new URLSearchParams(query);
    expect(params.get("destination")).toBe("Blackpool");
    expect(params.get("checkIn")).toBe("2027-06-10");
    expect(params.get("checkOut")).toBe("2027-06-13");
    expect(params.has("adults")).toBe(false);
    expect(params.has("children")).toBe(false);
    expect(params.has("rooms")).toBe(false);
  });

  it("includes non-default guest fields", () => {
    const query = buildHotelSearchQuery({
      destination: "Blackpool",
      adults: 3,
      children: 2,
      rooms: 2,
    });
    const params = new URLSearchParams(query);
    expect(params.get("adults")).toBe("3");
    expect(params.get("children")).toBe("2");
    expect(params.get("rooms")).toBe("2");
  });

  it("round-trips through parseHotelSearchParams", () => {
    const query = buildHotelSearchQuery({
      destination: "Blackpool",
      checkIn: new Date(2027, 5, 10),
      checkOut: new Date(2027, 5, 13),
      adults: 4,
      children: 1,
      rooms: 2,
    });
    const raw = Object.fromEntries(new URLSearchParams(query));
    const result = parseHotelSearchParams(raw, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.params.adults).toBe(4);
      expect(result.params.children).toBe(1);
      expect(result.params.rooms).toBe(2);
    }
  });
});
