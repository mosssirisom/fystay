import { describe, expect, it } from "vitest";
import { formatTravelAddonContextDate, travelAddonContextSummary, travelAddonHref } from "./travelAddons";

describe("travelAddonHref", () => {
  it("builds the plain category-only href when no context is passed - existing call sites unaffected", () => {
    expect(travelAddonHref("AIRPORT_TRANSFER")).toBe("/travel-extras?category=AIRPORT_TRANSFER");
  });

  it("builds the plain category-only href when context is passed but every field is empty", () => {
    expect(travelAddonHref("AIRPORT_TRANSFER", {})).toBe("/travel-extras?category=AIRPORT_TRANSFER");
  });

  it("appends only the context fields that are actually known - never invents missing ones", () => {
    const href = travelAddonHref("AIRPORT_TRANSFER", { destination: "Blackpool" });
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("destination")).toBe("Blackpool");
    expect(params.has("hotel")).toBe(false);
    expect(params.has("checkIn")).toBe(false);
    expect(params.has("airport")).toBe(false);
  });

  it("appends every context field when all are known, including a zero children count", () => {
    const href = travelAddonHref("AIRPORT_TRANSFER", {
      destination: "Blackpool",
      hotelName: "The Grand Lodge",
      checkIn: "2026-10-15",
      checkOut: "2026-10-17",
      adults: 2,
      children: 0,
    });
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("destination")).toBe("Blackpool");
    expect(params.get("hotel")).toBe("The Grand Lodge");
    expect(params.get("checkIn")).toBe("2026-10-15");
    expect(params.get("checkOut")).toBe("2026-10-17");
    expect(params.get("adults")).toBe("2");
    expect(params.get("children")).toBe("0");
  });

  it("never fabricates an airport - only ever appends it if a caller actually supplies one", () => {
    const withAirport = travelAddonHref("AIRPORT_TRANSFER", { airport: "Manchester (MAN)" });
    expect(new URLSearchParams(withAirport.split("?")[1]).get("airport")).toBe("Manchester (MAN)");

    const withoutAirport = travelAddonHref("AIRPORT_TRANSFER", { destination: "Blackpool" });
    expect(new URLSearchParams(withoutAirport.split("?")[1]).has("airport")).toBe(false);
  });
});

describe("formatTravelAddonContextDate", () => {
  it("formats a yyyy-mm-dd string as a short display date", () => {
    expect(formatTravelAddonContextDate("2026-10-15")).toBe("15 Oct");
  });

  it("falls back to the raw value for an unparseable string, rather than 'Invalid Date'", () => {
    expect(formatTravelAddonContextDate("not-a-date")).toBe("not-a-date");
  });
});

describe("travelAddonContextSummary", () => {
  it("returns null when every field is empty - nothing to summarize", () => {
    expect(travelAddonContextSummary({})).toBeNull();
  });

  it("summarizes destination alone", () => {
    expect(travelAddonContextSummary({ destination: "Blackpool" })).toBe("Blackpool");
  });

  it("includes the hotel name alongside the destination when both are known", () => {
    expect(travelAddonContextSummary({ destination: "Blackpool", hotelName: "The Grand Lodge" })).toBe(
      "The Grand Lodge, Blackpool",
    );
  });

  it("includes a formatted date range only when both checkIn and checkOut are known", () => {
    expect(travelAddonContextSummary({ checkIn: "2026-10-15", checkOut: "2026-10-17" })).toBe(
      "15 Oct – 17 Oct",
    );
    expect(travelAddonContextSummary({ checkIn: "2026-10-15" })).toBeNull();
  });

  it("sums adults and children into a single, correctly-pluralized guest count", () => {
    expect(travelAddonContextSummary({ adults: 2, children: 1 })).toBe("3 guests");
    expect(travelAddonContextSummary({ adults: 1, children: 0 })).toBe("1 guest");
  });

  it("omits the guest count entirely when both adults and children are absent", () => {
    expect(travelAddonContextSummary({ destination: "Blackpool" })).toBe("Blackpool");
  });

  it("doesn't repeat the destination when the hotel name already names it (real mock data shape)", () => {
    expect(
      travelAddonContextSummary({ destination: "Blackpool", hotelName: "The Grand Lodge, Blackpool" }),
    ).toBe("The Grand Lodge, Blackpool");
  });

  it("joins every known part in order: destination(+hotel), dates, guests", () => {
    const summary = travelAddonContextSummary({
      destination: "Blackpool",
      hotelName: "The Grand Lodge",
      checkIn: "2026-10-15",
      checkOut: "2026-10-17",
      adults: 2,
      children: 0,
    });
    expect(summary).toBe("The Grand Lodge, Blackpool · 15 Oct – 17 Oct · 2 guests");
  });
});
