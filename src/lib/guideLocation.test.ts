import { describe, expect, it } from "vitest";
import { entryMatchesCategory, locateEntry, prioritizeEntriesByDistance } from "./guideLocation";
import { LOCAL_GUIDES, type GuideEntry, type TownGuide } from "./localGuide";
import { PLACE_COORDINATES } from "./placeCoordinates";

const TOWER = PLACE_COORDINATES["Blackpool Tower"];
const PLEASURE_BEACH = PLACE_COORDINATES["Blackpool Pleasure Beach"];

describe("locateEntry", () => {
  it("returns null with no origin", () => {
    expect(locateEntry(null, "Blackpool Tower")).toBeNull();
  });

  it("returns null when the entry names no place", () => {
    expect(locateEntry(TOWER, undefined)).toBeNull();
  });

  it("returns null for a place with no known coordinates", () => {
    expect(locateEntry(TOWER, "Somewhere made up")).toBeNull();
  });

  it("computes a real distance for a listing at a place's own coordinates", () => {
    const result = locateEntry(TOWER, "Blackpool Tower");
    expect(result).not.toBeNull();
    expect(result!.distanceMiles).toBeLessThan(0.05);
  });

  it("computes a nonzero distance between two different real places", () => {
    const result = locateEntry(TOWER, "Blackpool Pleasure Beach")!;
    expect(result.distanceMiles).toBeGreaterThan(0);
  });
});

describe("prioritizeEntriesByDistance", () => {
  const near: GuideEntry = { name: "Near", note: "", place: "Blackpool Tower" };
  const far: GuideEntry = { name: "Far", note: "", place: "Blackpool Pleasure Beach" };
  const unplaceable: GuideEntry = { name: "No place", note: "" };
  const entries = [far, unplaceable, near];

  it("returns entries unchanged with no origin", () => {
    expect(prioritizeEntriesByDistance(entries, null)).toEqual(entries);
  });

  it("sorts placeable entries closest-first", () => {
    const result = prioritizeEntriesByDistance(entries, TOWER);
    expect(result[0]).toBe(near);
  });

  it("keeps unplaceable entries after every placeable one, in original relative order", () => {
    const result = prioritizeEntriesByDistance(entries, TOWER);
    expect(result[result.length - 1]).toBe(unplaceable);
  });

  it("never drops or duplicates an entry", () => {
    const result = prioritizeEntriesByDistance(entries, TOWER);
    expect(result).toHaveLength(entries.length);
    expect(new Set(result)).toEqual(new Set(entries));
  });

  it("is a no-op when no entry names a place", () => {
    const noPlaces = [unplaceable, { ...unplaceable, name: "Also no place" }];
    expect(prioritizeEntriesByDistance(noPlaces, TOWER)).toEqual(noPlaces);
  });
});

describe("entryMatchesCategory", () => {
  const guide = LOCAL_GUIDES.blackpool as TownGuide;

  it("is true for an entry that really is listed under that category", () => {
    const dogFriendlyName = guide.dogFriendly[0].name;
    expect(entryMatchesCategory(guide, "dogFriendly", dogFriendlyName)).toBe(true);
  });

  it("is false for a name that isn't in that category", () => {
    expect(entryMatchesCategory(guide, "dogFriendly", "Definitely not a real entry name")).toBe(false);
  });
});
