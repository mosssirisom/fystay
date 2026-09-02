import { describe, expect, it } from "vitest";
import {
  beachStaysSection,
  featuredListings,
  groupByCity,
  isBeachStay,
  recentlyAddedSection,
  type FeaturableListing,
  type MarketplaceListing,
} from "./marketplace";

function listing(overrides: Partial<MarketplaceListing> & { id: string }): MarketplaceListing {
  return {
    city: "Blackpool",
    amenities: [],
    createdAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("isBeachStay", () => {
  it("matches sea/ocean/beach amenities case-insensitively", () => {
    expect(isBeachStay(["Wifi", "Sea view"])).toBe(true);
    expect(isBeachStay(["OCEAN VIEW"])).toBe(true);
    expect(isBeachStay(["Beach access"])).toBe(true);
  });

  it("returns false when nothing matches", () => {
    expect(isBeachStay(["Wifi", "Kitchen"])).toBe(false);
    expect(isBeachStay([])).toBe(false);
  });
});

describe("groupByCity", () => {
  it("only includes cities that meet the minimum listing count", () => {
    const listings = [
      listing({ id: "1", city: "Blackpool" }),
      listing({ id: "2", city: "Blackpool" }),
      listing({ id: "3", city: "Fleetwood" }), // only 1 — excluded
    ];

    const sections = groupByCity(listings);

    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe("Popular in Blackpool");
    expect(sections[0].listings.map((l) => l.id)).toEqual(["1", "2"]);
  });

  it("returns no sections when no city meets the threshold", () => {
    const listings = [
      listing({ id: "1", city: "Blackpool" }),
      listing({ id: "2", city: "Fleetwood" }),
      listing({ id: "3", city: "Lytham St Annes" }),
    ];

    expect(groupByCity(listings)).toEqual([]);
  });

  it("caps the number of sections and prioritizes larger cities", () => {
    const listings = [
      ...Array.from({ length: 2 }, (_, i) => listing({ id: `a${i}`, city: "A" })),
      ...Array.from({ length: 4 }, (_, i) => listing({ id: `b${i}`, city: "B" })),
      ...Array.from({ length: 3 }, (_, i) => listing({ id: `c${i}`, city: "C" })),
    ];

    const sections = groupByCity(listings, { maxSections: 2 });

    expect(sections.map((s) => s.title)).toEqual(["Popular in B", "Popular in C"]);
  });
});

describe("beachStaysSection", () => {
  it("returns null when fewer than the minimum qualify", () => {
    const listings = [listing({ id: "1", amenities: ["Sea view"] })];
    expect(beachStaysSection(listings)).toBeNull();
  });

  it("returns a section once enough listings qualify", () => {
    const listings = [
      listing({ id: "1", amenities: ["Sea view"] }),
      listing({ id: "2", amenities: ["Ocean view"] }),
      listing({ id: "3", amenities: ["Wifi"] }),
    ];
    const section = beachStaysSection(listings);
    expect(section?.listings.map((l) => l.id)).toEqual(["1", "2"]);
  });
});

describe("recentlyAddedSection", () => {
  const now = new Date("2026-06-15");

  it("returns null when the whole catalog is recent (would duplicate the main feed)", () => {
    const listings = [
      listing({ id: "1", createdAt: new Date("2026-06-01") }),
      listing({ id: "2", createdAt: new Date("2026-06-10") }),
    ];
    expect(recentlyAddedSection(listings, { now })).toBeNull();
  });

  it("returns null when too few listings fall in the recency window", () => {
    const listings = [
      listing({ id: "1", createdAt: new Date("2026-06-10") }), // recent
      listing({ id: "2", createdAt: new Date("2025-01-01") }), // old
      listing({ id: "3", createdAt: new Date("2024-01-01") }), // old
    ];
    expect(recentlyAddedSection(listings, { now })).toBeNull();
  });

  it("returns the recent subset, newest first, once the catalog has grown beyond it", () => {
    const listings = [
      listing({ id: "old-1", createdAt: new Date("2024-01-01") }),
      listing({ id: "old-2", createdAt: new Date("2024-06-01") }),
      listing({ id: "new-1", createdAt: new Date("2026-06-01") }),
      listing({ id: "new-2", createdAt: new Date("2026-06-10") }),
    ];
    const section = recentlyAddedSection(listings, { now });
    expect(section?.listings.map((l) => l.id)).toEqual(["new-2", "new-1"]);
  });
});

function featurable(overrides: Partial<FeaturableListing> & { id: string }): FeaturableListing {
  return {
    title: `Listing ${overrides.id}`,
    city: "Blackpool",
    country: "England",
    pricePerNightCents: 10000,
    photos: ["data:image/svg+xml,placeholder"],
    amenities: [],
    maxGuests: 2,
    bedrooms: 1,
    reviews: [],
    ...overrides,
  };
}

describe("featuredListings", () => {
  it("excludes listings with no photos", () => {
    const listings = [
      featurable({ id: "has-photo" }),
      featurable({ id: "no-photo", photos: [] }),
    ];
    expect(featuredListings(listings).map((l) => l.id)).toEqual(["has-photo"]);
  });

  it("ranks by average rating, highest first", () => {
    const listings = [
      featurable({ id: "low", reviews: [{ rating: 3 }] }),
      featurable({ id: "high", reviews: [{ rating: 5 }] }),
      featurable({ id: "mid", reviews: [{ rating: 4 }] }),
    ];
    expect(featuredListings(listings).map((l) => l.id)).toEqual(["high", "mid", "low"]);
  });

  it("sorts a listing with no reviews yet last, not first", () => {
    const listings = [
      featurable({ id: "unrated", reviews: [] }),
      featurable({ id: "rated", reviews: [{ rating: 1 }] }),
    ];
    expect(featuredListings(listings).map((l) => l.id)).toEqual(["rated", "unrated"]);
  });

  it("breaks a rating tie by review count", () => {
    const listings = [
      featurable({ id: "few-reviews", reviews: [{ rating: 5 }] }),
      featurable({ id: "many-reviews", reviews: [{ rating: 5 }, { rating: 5 }, { rating: 5 }] }),
    ];
    expect(featuredListings(listings).map((l) => l.id)).toEqual(["many-reviews", "few-reviews"]);
  });

  it("caps the result at maxFeatured", () => {
    const listings = Array.from({ length: 8 }, (_, i) => featurable({ id: `${i}` }));
    expect(featuredListings(listings, 3)).toHaveLength(3);
  });

  it("carries through the first photo, price, and computed rating", () => {
    const listings = [
      featurable({
        id: "1",
        photos: ["photo-a.jpg", "photo-b.jpg"],
        pricePerNightCents: 15000,
        reviews: [{ rating: 4 }, { rating: 2 }],
      }),
    ];
    const [result] = featuredListings(listings);
    expect(result.photo).toBe("photo-a.jpg");
    expect(result.pricePerNightCents).toBe(15000);
    expect(result.rating).toBe(3);
    expect(result.reviewCount).toBe(2);
  });
});
