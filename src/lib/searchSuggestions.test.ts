import { describe, expect, it } from "vitest";
import {
  extractDestinationQuery,
  popularDestinations,
  rankDestinations,
  rankHotels,
  type CityAggregate,
  type HotelListing,
} from "./searchSuggestions";

const cities: CityAggregate[] = [
  { city: "Blackpool", country: "United Kingdom", count: 5 },
  { city: "Lytham St Annes", country: "United Kingdom", count: 3 },
  { city: "Fleetwood", country: "United Kingdom", count: 1 },
  { city: "Orlando", country: "United States", count: 2 },
];

const listings: HotelListing[] = [
  { id: "1", title: "Hilton Blackpool", city: "Blackpool", country: "United Kingdom", photos: ["a.jpg"] },
  { id: "2", title: "Seafront Apartment", city: "Blackpool", country: "United Kingdom", photos: [] },
  { id: "3", title: "Cosy Cottage", city: "Fleetwood", country: "United Kingdom", photos: [] },
];

describe("extractDestinationQuery", () => {
  it("strips a natural 'hotels in X' phrase down to the destination", () => {
    expect(extractDestinationQuery("hotels in Blackpool")).toBe("Blackpool");
    expect(extractDestinationQuery("Places to stay in Orlando")).toBe("Orlando");
  });

  it("returns the query unchanged when there's no such phrase", () => {
    expect(extractDestinationQuery("Blackpool")).toBe("Blackpool");
  });
});

describe("rankDestinations", () => {
  it("ranks an exact match above partial matches", () => {
    const results = rankDestinations(cities, "Blackpool");
    expect(results[0].city).toBe("Blackpool");
  });

  it("matches case-insensitively and by partial substring", () => {
    const results = rankDestinations(cities, "lytham");
    expect(results.map((r) => r.city)).toEqual(["Lytham St Annes"]);
  });

  it("matches on country too", () => {
    const results = rankDestinations(cities, "United States");
    expect(results.map((r) => r.city)).toEqual(["Orlando"]);
  });

  it("interprets a natural 'hotels in X' phrase as a destination search", () => {
    const results = rankDestinations(cities, "hotels in Orlando");
    expect(results.map((r) => r.city)).toEqual(["Orlando"]);
  });

  it("returns nothing for an empty query", () => {
    expect(rankDestinations(cities, "")).toEqual([]);
  });

  it("returns no duplicate city/country pairs", () => {
    const results = rankDestinations(cities, "Blackpool");
    const ids = results.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("popularDestinations", () => {
  it("by default includes any destination with at least one real listing", () => {
    const results = popularDestinations(cities);
    expect(results.map((r) => r.city)).toContain("Fleetwood");
  });

  it("can be restricted to a higher minimum real-inventory threshold", () => {
    const results = popularDestinations(cities, { minPerSection: 2 });
    expect(results.map((r) => r.city)).not.toContain("Fleetwood");
  });

  it("ranks by listing count, largest first", () => {
    const results = popularDestinations(cities, { minPerSection: 2 });
    expect(results.map((r) => r.city)).toEqual(["Blackpool", "Lytham St Annes", "Orlando"]);
  });
});

describe("rankHotels", () => {
  it("ranks an exact title match first", () => {
    const results = rankHotels(listings, "Hilton Blackpool");
    expect(results[0].label).toBe("Hilton Blackpool");
  });

  it("matches partial, case-insensitive titles", () => {
    const results = rankHotels(listings, "cottage");
    expect(results.map((r) => r.label)).toEqual(["Cosy Cottage"]);
  });

  it("carries a real photo when one exists and null when it doesn't", () => {
    const results = rankHotels(listings, "a");
    const hilton = results.find((r) => r.label === "Hilton Blackpool");
    const seafront = results.find((r) => r.label === "Seafront Apartment");
    expect(hilton?.photo).toBe("a.jpg");
    expect(seafront?.photo).toBeNull();
  });

  it("returns nothing for an empty query", () => {
    expect(rankHotels(listings, "")).toEqual([]);
  });
});
