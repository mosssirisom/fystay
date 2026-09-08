import { describe, expect, it } from "vitest";
import {
  accessibilityFromTags,
  categorizeOverpassElement,
  dogFriendlyFromTags,
  normalizeOverpassElement,
} from "./overpassCategory";
import type { OverpassElement } from "./overpassSource";

describe("categorizeOverpassElement", () => {
  it("maps every tag combination this app actually queries for", () => {
    expect(categorizeOverpassElement({ amenity: "restaurant" })).toBe("RESTAURANT");
    expect(categorizeOverpassElement({ amenity: "cafe" })).toBe("CAFE");
    expect(categorizeOverpassElement({ amenity: "pub" })).toBe("PUB");
    expect(categorizeOverpassElement({ amenity: "pharmacy" })).toBe("PHARMACY");
    expect(categorizeOverpassElement({ amenity: "parking" })).toBe("PARKING");
    expect(categorizeOverpassElement({ amenity: "charging_station" })).toBe("EV_CHARGING");
    expect(categorizeOverpassElement({ amenity: "toilets" })).toBe("TOILET");
    expect(categorizeOverpassElement({ shop: "supermarket" })).toBe("SUPERMARKET");
    expect(categorizeOverpassElement({ shop: "convenience" })).toBe("SUPERMARKET");
    expect(categorizeOverpassElement({ leisure: "park" })).toBe("PARK");
    expect(categorizeOverpassElement({ leisure: "playground" })).toBe("PLAYGROUND");
    expect(categorizeOverpassElement({ natural: "beach" })).toBe("BEACH");
    expect(categorizeOverpassElement({ tourism: "attraction" })).toBe("ATTRACTION");
    expect(categorizeOverpassElement({ tourism: "museum" })).toBe("MUSEUM");
    expect(categorizeOverpassElement({ tourism: "viewpoint" })).toBe("VIEWPOINT");
  });

  it("returns null for tags outside this app's query, rather than guessing OTHER", () => {
    expect(categorizeOverpassElement({ amenity: "fuel" })).toBeNull();
    expect(categorizeOverpassElement({ landuse: "residential" })).toBeNull();
    expect(categorizeOverpassElement({})).toBeNull();
  });
});

describe("accessibilityFromTags", () => {
  it("keeps OSM's wheelchair values distinct rather than collapsing to yes/no", () => {
    expect(accessibilityFromTags({ wheelchair: "yes" })).toBe("Wheelchair accessible");
    expect(accessibilityFromTags({ wheelchair: "limited" })).toBe("Limited wheelchair access");
    expect(accessibilityFromTags({ wheelchair: "no" })).toBe("Not wheelchair accessible");
  });

  it("returns null (unknown), not a guessed answer, when untagged", () => {
    expect(accessibilityFromTags({})).toBeNull();
  });
});

describe("dogFriendlyFromTags", () => {
  it("treats yes and leashed as dog-friendly", () => {
    expect(dogFriendlyFromTags({ dog: "yes" })).toBe(true);
    expect(dogFriendlyFromTags({ dog: "leashed" })).toBe(true);
  });

  it("treats an untagged place as unknown (null), not false", () => {
    expect(dogFriendlyFromTags({})).toBeNull();
  });

  it("treats dog=no as explicitly false", () => {
    expect(dogFriendlyFromTags({ dog: "no" })).toBe(false);
  });
});

describe("normalizeOverpassElement", () => {
  function element(overrides: Partial<OverpassElement>): OverpassElement {
    return { type: "node", id: 123, lat: 53.81, lon: -3.05, ...overrides };
  }

  it("normalizes a well-formed node into a place", () => {
    const place = normalizeOverpassElement(
      element({ tags: { name: "The Cottage", amenity: "restaurant", "addr:street": "Queen Street" } }),
    );
    expect(place).toMatchObject({
      sourceId: "node/123",
      name: "The Cottage",
      category: "RESTAURANT",
      latitude: 53.81,
      longitude: -3.05,
      address: "Queen Street",
    });
  });

  it("uses a way/relation's center when it has no lat/lon of its own", () => {
    const place = normalizeOverpassElement(
      element({ type: "way", lat: undefined, lon: undefined, center: { lat: 53.9, lon: -3.0 }, tags: { name: "Marine Park", leisure: "park" } }),
    );
    expect(place?.latitude).toBe(53.9);
    expect(place?.longitude).toBe(-3.0);
  });

  it("skips an element with no name - nothing to show a guest", () => {
    expect(normalizeOverpassElement(element({ tags: { amenity: "restaurant" } }))).toBeNull();
  });

  it("skips an element with tags this app doesn't categorize", () => {
    expect(normalizeOverpassElement(element({ tags: { name: "Some Garage", amenity: "fuel" } }))).toBeNull();
  });

  it("skips a way/relation with neither its own coordinates nor a center", () => {
    const place = normalizeOverpassElement({ type: "way", id: 1, tags: { name: "Ghost Park", leisure: "park" } });
    expect(place).toBeNull();
  });
});
