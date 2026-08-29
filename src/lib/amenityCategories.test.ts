import { describe, expect, it } from "vitest";
import {
  AMENITY_CATEGORIES,
  availableAmenityCategories,
  matchesAmenityCategories,
} from "./amenityCategories";

describe("AMENITY_CATEGORIES", () => {
  it("matches real freeform amenity text, not just an exact canonical label", () => {
    const wifi = AMENITY_CATEGORIES.find((c) => c.key === "wifi")!;
    expect(wifi.test(["Wifi", "Kitchen"])).toBe(true);
    expect(wifi.test(["Wi-Fi"])).toBe(true);
    expect(wifi.test(["Kitchen"])).toBe(false);

    const parking = AMENITY_CATEGORIES.find((c) => c.key === "parking")!;
    expect(parking.test(["Free parking"])).toBe(true);
    expect(parking.test(["Off-street parking"])).toBe(true);
    expect(parking.test(["Kitchen"])).toBe(false);

    const petFriendly = AMENITY_CATEGORIES.find((c) => c.key === "pet_friendly")!;
    expect(petFriendly.test(["Pet friendly"])).toBe(true);
    expect(petFriendly.test(["Kitchen"])).toBe(false);
  });
});

describe("matchesAmenityCategories", () => {
  it("matches everything when no categories are selected", () => {
    expect(matchesAmenityCategories([], [])).toBe(true);
  });

  it("requires every selected category to match (AND, not OR)", () => {
    const amenities = ["Wifi", "Free parking"];
    expect(matchesAmenityCategories(amenities, ["wifi", "parking"])).toBe(true);
    expect(matchesAmenityCategories(amenities, ["wifi", "kitchen"])).toBe(false);
  });

  it("ignores an unrecognized category key rather than rejecting everything", () => {
    expect(matchesAmenityCategories(["Wifi"], ["wifi", "not-a-real-category"])).toBe(true);
  });
});

describe("availableAmenityCategories", () => {
  it("only returns categories actually backed by at least one listing", () => {
    const listings = [{ amenities: ["Wifi", "Kitchen"] }, { amenities: ["Free parking"] }];
    const available = availableAmenityCategories(listings).map((c) => c.key);
    expect(available).toEqual(expect.arrayContaining(["wifi", "kitchen", "parking"]));
    expect(available).not.toContain("pet_friendly");
    expect(available).not.toContain("accessible");
  });

  it("returns nothing when no listings are given", () => {
    expect(availableAmenityCategories([])).toEqual([]);
  });
});
