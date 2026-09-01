/**
 * Browse-by-category sections shown below the main search results on the
 * homepage (e.g. "Popular in Blackpool", "Beach stays"). Every section here
 * is derived from real listing data with a minimum-count threshold, so a
 * category only appears once the catalog actually supports it, rather than
 * ever padding the page with a near-empty or fabricated row.
 */

import { averageRating } from "./reviews";

export const MIN_LISTINGS_PER_SECTION = 2;
export const MAX_CITY_SECTIONS = 2;
const RECENT_WINDOW_DAYS = 30;
const MAX_FEATURED_LISTINGS = 5;

export type MarketplaceListing = {
  id: string;
  city: string;
  amenities: string[];
  createdAt: Date;
};

export type MarketplaceSection<T> = {
  key: string;
  title: string;
  subtitle: string;
  listings: T[];
};

/** A freeform-amenities heuristic, matching the same pattern as isPetFriendly. */
export function isBeachStay(amenities: string[]): boolean {
  return amenities.some((amenity) => /sea|ocean|beach/i.test(amenity));
}

/** Groups listings by city, keeping only cities with enough listings to read as a real category. */
export function groupByCity<T extends MarketplaceListing>(
  listings: T[],
  { minPerSection = MIN_LISTINGS_PER_SECTION, maxSections = MAX_CITY_SECTIONS } = {},
): MarketplaceSection<T>[] {
  const byCity = new Map<string, T[]>();
  for (const listing of listings) {
    const existing = byCity.get(listing.city);
    if (existing) {
      existing.push(listing);
    } else {
      byCity.set(listing.city, [listing]);
    }
  }

  return Array.from(byCity.entries())
    .filter(([, cityListings]) => cityListings.length >= minPerSection)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, maxSections)
    .map(([city, cityListings]) => ({
      key: `city-${city}`,
      title: `Popular in ${city}`,
      subtitle: `${cityListings.length} local stay${cityListings.length === 1 ? "" : "s"} to explore`,
      listings: cityListings,
    }));
}

export function beachStaysSection<T extends MarketplaceListing>(
  listings: T[],
  minPerSection = MIN_LISTINGS_PER_SECTION,
): MarketplaceSection<T> | null {
  const beachListings = listings.filter((listing) => isBeachStay(listing.amenities));
  if (beachListings.length < minPerSection) return null;
  return {
    key: "beach-stays",
    title: "Beach stays",
    subtitle: "Places with sea views, right on the coast",
    listings: beachListings,
  };
}

/**
 * Only meaningful once the catalog has grown beyond "everything is recent" —
 * with a small or brand-new set of listings this intentionally returns null
 * rather than duplicating the same listings the main search results already
 * show in the same newest-first order.
 */
export function recentlyAddedSection<T extends MarketplaceListing>(
  listings: T[],
  {
    minPerSection = MIN_LISTINGS_PER_SECTION,
    windowDays = RECENT_WINDOW_DAYS,
    now = new Date(),
  } = {},
): MarketplaceSection<T> | null {
  const cutoff = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
  const recent = listings
    .filter((listing) => listing.createdAt >= cutoff)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  if (recent.length < minPerSection || recent.length >= listings.length) return null;

  return {
    key: "recently-added",
    title: "Recently added",
    subtitle: "New stays just listed on the Fylde Coast",
    listings: recent,
  };
}

export type FeaturableListing = {
  id: string;
  title: string;
  city: string;
  country: string;
  pricePerNightCents: number;
  photos: string[];
  reviews: { rating: number }[];
};

export type FeaturedListing = {
  id: string;
  title: string;
  city: string;
  country: string;
  pricePerNightCents: number;
  photo: string;
  rating: number | null;
  reviewCount: number;
};

/**
 * The homepage hero's rotating spotlight: published listings with at least
 * one photo, ranked so the best-reviewed stays lead (highest average
 * rating, then most reviews). A listing with no reviews yet sorts last,
 * not first, since a null rating is "unproven", not "perfect". Ties within
 * the same rating/review-count are left in whatever order the caller
 * passed in - querying newest-first makes that tiebreak "most recent" for
 * free, without this function needing to know about createdAt at all.
 */
export function featuredListings<T extends FeaturableListing>(
  listings: T[],
  maxFeatured = MAX_FEATURED_LISTINGS,
): FeaturedListing[] {
  return listings
    .filter((listing) => listing.photos.length > 0)
    .map((listing) => ({
      id: listing.id,
      title: listing.title,
      city: listing.city,
      country: listing.country,
      pricePerNightCents: listing.pricePerNightCents,
      photo: listing.photos[0],
      rating: averageRating(listing.reviews),
      reviewCount: listing.reviews.length,
    }))
    .sort((a, b) => {
      const ratingDiff = (b.rating ?? -1) - (a.rating ?? -1);
      if (ratingDiff !== 0) return ratingDiff;
      return b.reviewCount - a.reviewCount;
    })
    .slice(0, maxFeatured);
}
