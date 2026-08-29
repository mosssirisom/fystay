import { describe, expect, it } from "vitest";
import {
  applyListingFilters,
  hasActiveFilters,
  parseListingFiltersFromParams,
  parseSortParam,
  parseViewParam,
  sortListings,
  type SearchableListing,
} from "./listingSearch";
import { PROPERTY_TYPES } from "./propertyType";

function listing(overrides: Partial<SearchableListing> & { id: string }): SearchableListing {
  return {
    pricePerNightCents: 10000,
    propertyType: "APARTMENT",
    bedrooms: 1,
    bathrooms: 1,
    amenities: [],
    reviews: [],
    ...overrides,
  };
}

describe("applyListingFilters", () => {
  it("is a no-op when nothing is set", () => {
    const listings = [listing({ id: "a" }), listing({ id: "b" })];
    expect(applyListingFilters(listings, {})).toEqual(listings);
  });

  it("filters by property type", () => {
    const listings = [
      listing({ id: "apt", propertyType: "APARTMENT" }),
      listing({ id: "house", propertyType: "HOUSE" }),
      listing({ id: "villa", propertyType: "VILLA" }),
    ];
    const result = applyListingFilters(listings, { propertyTypes: ["HOUSE", "VILLA"] });
    expect(result.map((l) => l.id)).toEqual(["house", "villa"]);
  });

  it("filters by price range", () => {
    const listings = [
      listing({ id: "cheap", pricePerNightCents: 5000 }),
      listing({ id: "mid", pricePerNightCents: 12000 }),
      listing({ id: "pricey", pricePerNightCents: 25000 }),
    ];
    expect(applyListingFilters(listings, { maxPriceCents: 15000 }).map((l) => l.id)).toEqual([
      "cheap",
      "mid",
    ]);
    expect(applyListingFilters(listings, { minPriceCents: 10000 }).map((l) => l.id)).toEqual([
      "mid",
      "pricey",
    ]);
  });

  it("filters by minimum bedrooms and bathrooms", () => {
    const listings = [
      listing({ id: "small", bedrooms: 1, bathrooms: 1 }),
      listing({ id: "big", bedrooms: 3, bathrooms: 2 }),
    ];
    expect(applyListingFilters(listings, { minBedrooms: 2 }).map((l) => l.id)).toEqual(["big"]);
    expect(applyListingFilters(listings, { minBathrooms: 2 }).map((l) => l.id)).toEqual(["big"]);
  });

  it("filters by amenity categories, requiring every selected one", () => {
    const listings = [
      listing({ id: "both", amenities: ["Wifi", "Free parking"] }),
      listing({ id: "wifi-only", amenities: ["Wifi"] }),
      listing({ id: "neither", amenities: ["Sea view"] }),
    ];
    const result = applyListingFilters(listings, { amenityCategories: ["wifi", "parking"] });
    expect(result.map((l) => l.id)).toEqual(["both"]);
  });

  it("filters by minimum rating, excluding listings with no reviews at all", () => {
    const listings = [
      listing({ id: "great", reviews: [{ rating: 5 }, { rating: 5 }] }),
      listing({ id: "ok", reviews: [{ rating: 3 }] }),
      listing({ id: "unrated", reviews: [] }),
    ];
    expect(applyListingFilters(listings, { minRating: 4 }).map((l) => l.id)).toEqual(["great"]);
  });

  it("the exact required combination genuinely narrows results: under £150 + parking", () => {
    // City, dates, and guest capacity are already handled by the database
    // query and the existing availability filter before this ever runs -
    // this covers the two filter-panel criteria from that scenario.
    const listings = [
      listing({ id: "match", pricePerNightCents: 12000, amenities: ["Wifi", "Free parking"] }),
      listing({ id: "too-expensive", pricePerNightCents: 20000, amenities: ["Free parking"] }),
      listing({ id: "no-parking", pricePerNightCents: 9000, amenities: ["Wifi"] }),
    ];
    const result = applyListingFilters(listings, {
      maxPriceCents: 15000,
      amenityCategories: ["parking"],
    });
    expect(result.map((l) => l.id)).toEqual(["match"]);
  });
});

describe("sortListings", () => {
  const listings = [
    listing({ id: "a", pricePerNightCents: 20000, reviews: [{ rating: 4 }] }),
    listing({ id: "b", pricePerNightCents: 10000, reviews: [{ rating: 5 }, { rating: 5 }] }),
    listing({ id: "c", pricePerNightCents: 15000, reviews: [] }),
  ];

  it("recommended keeps the given order", () => {
    expect(sortListings(listings, "recommended").map((l) => l.id)).toEqual(["a", "b", "c"]);
  });

  it("sorts by price ascending and descending", () => {
    expect(sortListings(listings, "price_asc").map((l) => l.id)).toEqual(["b", "c", "a"]);
    expect(sortListings(listings, "price_desc").map((l) => l.id)).toEqual(["a", "c", "b"]);
  });

  it("sorts by highest rated, sinking unrated listings to the bottom", () => {
    expect(sortListings(listings, "rating_desc").map((l) => l.id)).toEqual(["b", "a", "c"]);
  });

  it("sorts by most reviewed", () => {
    expect(sortListings(listings, "reviews_desc").map((l) => l.id)).toEqual(["b", "a", "c"]);
  });
});

describe("parseListingFiltersFromParams", () => {
  it("parses a full filter set from query params", () => {
    const filters = parseListingFiltersFromParams(
      {
        propertyType: "APARTMENT,VILLA",
        amenities: "wifi,parking",
        minPrice: "50",
        maxPrice: "150",
        minBedrooms: "2",
        minBathrooms: "1",
        minRating: "4",
      },
      PROPERTY_TYPES,
    );
    expect(filters).toEqual({
      propertyTypes: ["APARTMENT", "VILLA"],
      amenityCategories: ["wifi", "parking"],
      minPriceCents: 5000,
      maxPriceCents: 15000,
      minBedrooms: 2,
      minBathrooms: 1,
      minRating: 4,
    });
  });

  it("drops an unrecognized property type rather than crashing or matching everything", () => {
    const filters = parseListingFiltersFromParams({ propertyType: "SPACESHIP" }, PROPERTY_TYPES);
    expect(filters.propertyTypes).toBeUndefined();
  });

  it("returns an all-undefined filter set when nothing is present", () => {
    const filters = parseListingFiltersFromParams({}, PROPERTY_TYPES);
    expect(Object.values(filters).every((v) => v === undefined)).toBe(true);
  });
});

describe("parseSortParam / parseViewParam", () => {
  it("falls back to recommended/list for missing or invalid values", () => {
    expect(parseSortParam(undefined)).toBe("recommended");
    expect(parseSortParam("not-a-sort")).toBe("recommended");
    expect(parseSortParam("price_asc")).toBe("price_asc");

    expect(parseViewParam(undefined)).toBe("list");
    expect(parseViewParam("anything-else")).toBe("list");
    expect(parseViewParam("map")).toBe("map");
  });
});

describe("hasActiveFilters", () => {
  it("is false with no filters and the default sort", () => {
    expect(hasActiveFilters({}, "recommended")).toBe(false);
  });

  it("is true when any filter or a non-default sort is set", () => {
    expect(hasActiveFilters({ minPriceCents: 1000 }, "recommended")).toBe(true);
    expect(hasActiveFilters({}, "price_asc")).toBe(true);
  });
});
