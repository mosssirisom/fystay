import { averageRating } from "@/lib/reviews";
import { matchesAmenityCategories } from "@/lib/amenityCategories";
import type { PropertyType } from "@/lib/propertyType";

export type SearchableListing = {
  id: string;
  pricePerNightCents: number;
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  reviews: { rating: number }[];
};

export type ListingFilters = {
  propertyTypes?: PropertyType[];
  minPriceCents?: number;
  maxPriceCents?: number;
  minBedrooms?: number;
  minBathrooms?: number;
  amenityCategories?: string[];
  minRating?: number;
};

/**
 * The single place every "does this listing match the filters" decision is
 * made. Each criterion is independent (AND'd together) and a filter that
 * isn't set never excludes anything, so passing an empty ListingFilters is
 * always a no-op - callers don't need to special-case "no filters active".
 */
export function applyListingFilters<T extends SearchableListing>(
  listings: T[],
  filters: ListingFilters,
): T[] {
  return listings.filter((listing) => {
    if (filters.propertyTypes?.length && !filters.propertyTypes.includes(listing.propertyType)) {
      return false;
    }
    if (filters.minPriceCents !== undefined && listing.pricePerNightCents < filters.minPriceCents) {
      return false;
    }
    if (filters.maxPriceCents !== undefined && listing.pricePerNightCents > filters.maxPriceCents) {
      return false;
    }
    if (filters.minBedrooms !== undefined && listing.bedrooms < filters.minBedrooms) {
      return false;
    }
    if (filters.minBathrooms !== undefined && listing.bathrooms < filters.minBathrooms) {
      return false;
    }
    if (
      filters.amenityCategories?.length &&
      !matchesAmenityCategories(listing.amenities, filters.amenityCategories)
    ) {
      return false;
    }
    if (filters.minRating !== undefined) {
      const rating = averageRating(listing.reviews);
      // No reviews at all can't be claimed to meet a rating bar.
      if (rating === null || rating < filters.minRating) return false;
    }
    return true;
  });
}

export type SortKey = "recommended" | "price_asc" | "price_desc" | "rating_desc" | "reviews_desc";

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "recommended", label: "Recommended" },
  { key: "price_asc", label: "Price: low to high" },
  { key: "price_desc", label: "Price: high to low" },
  { key: "rating_desc", label: "Highest rated" },
  { key: "reviews_desc", label: "Most reviewed" },
];

/**
 * "Recommended" trusts the order listings already arrive in (newest first,
 * from the database query) rather than reshuffling - every other option
 * does a stable sort over that same order, so ties keep breaking the same
 * predictable way.
 */
export function sortListings<T extends SearchableListing>(listings: T[], sort: SortKey): T[] {
  if (sort === "recommended") return listings;

  const withMeta = listings.map((listing) => ({
    listing,
    rating: averageRating(listing.reviews),
    reviewCount: listing.reviews.length,
  }));

  switch (sort) {
    case "price_asc":
      withMeta.sort((a, b) => a.listing.pricePerNightCents - b.listing.pricePerNightCents);
      break;
    case "price_desc":
      withMeta.sort((a, b) => b.listing.pricePerNightCents - a.listing.pricePerNightCents);
      break;
    case "rating_desc":
      // Unrated listings sink to the bottom rather than being treated as 0.
      withMeta.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
      break;
    case "reviews_desc":
      withMeta.sort((a, b) => b.reviewCount - a.reviewCount);
      break;
  }

  return withMeta.map((entry) => entry.listing);
}

function parseCsvParam(value: string | string[] | undefined): string[] {
  const raw = typeof value === "string" ? value : "";
  return raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

/** Parses the whole filter set from URL search params in one place, so the page and any test can agree on the exact param names. */
export function parseListingFiltersFromParams(
  searchParams: Record<string, string | string[] | undefined>,
  knownPropertyTypes: readonly string[],
): ListingFilters {
  const propertyTypes = parseCsvParam(searchParams.propertyType).filter((t) =>
    knownPropertyTypes.includes(t),
  ) as PropertyType[];
  const amenityCategories = parseCsvParam(searchParams.amenities);

  const minPrice = typeof searchParams.minPrice === "string" ? Number(searchParams.minPrice) : NaN;
  const maxPrice = typeof searchParams.maxPrice === "string" ? Number(searchParams.maxPrice) : NaN;
  const minBedroomsRaw =
    typeof searchParams.minBedrooms === "string" ? Number(searchParams.minBedrooms) : NaN;
  const minBathroomsRaw =
    typeof searchParams.minBathrooms === "string" ? Number(searchParams.minBathrooms) : NaN;
  const minRatingRaw =
    typeof searchParams.minRating === "string" ? Number(searchParams.minRating) : NaN;

  return {
    propertyTypes: propertyTypes.length > 0 ? propertyTypes : undefined,
    minPriceCents: Number.isFinite(minPrice) && minPrice > 0 ? Math.round(minPrice * 100) : undefined,
    maxPriceCents: Number.isFinite(maxPrice) && maxPrice > 0 ? Math.round(maxPrice * 100) : undefined,
    minBedrooms: Number.isInteger(minBedroomsRaw) && minBedroomsRaw > 0 ? minBedroomsRaw : undefined,
    minBathrooms: Number.isInteger(minBathroomsRaw) && minBathroomsRaw > 0 ? minBathroomsRaw : undefined,
    amenityCategories: amenityCategories.length > 0 ? amenityCategories : undefined,
    minRating: Number.isFinite(minRatingRaw) && minRatingRaw > 0 ? minRatingRaw : undefined,
  };
}

export function parseSortParam(value: string | string[] | undefined): SortKey {
  const key = typeof value === "string" ? value : "";
  return SORT_OPTIONS.some((option) => option.key === key) ? (key as SortKey) : "recommended";
}

export function parseViewParam(value: string | string[] | undefined): "list" | "map" {
  return value === "map" ? "map" : "list";
}

/** True if any filter/sort/view param is active - not just the core destination/dates/guests search. */
export function hasActiveFilters(filters: ListingFilters, sort: SortKey): boolean {
  return (
    Boolean(filters.propertyTypes?.length) ||
    filters.minPriceCents !== undefined ||
    filters.maxPriceCents !== undefined ||
    filters.minBedrooms !== undefined ||
    filters.minBathrooms !== undefined ||
    Boolean(filters.amenityCategories?.length) ||
    filters.minRating !== undefined ||
    sort !== "recommended"
  );
}
