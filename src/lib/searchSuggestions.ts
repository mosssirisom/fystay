/**
 * Pure matching/ranking logic behind the destination + hotel autocomplete on
 * the homepage search bar. Kept free of Prisma so it can be unit tested
 * directly; the API route (src/app/api/search/suggestions/route.ts) supplies
 * the real listing data and calls these functions.
 */

export type DestinationSuggestion = {
  type: "destination";
  id: string;
  city: string;
  country: string;
  label: string;
  sublabel: string;
};

export type HotelSuggestion = {
  type: "hotel";
  id: string;
  label: string;
  sublabel: string;
  photo: string | null;
};

export type CityAggregate = {
  city: string;
  country: string;
  count: number;
};

export type HotelListing = {
  id: string;
  title: string;
  city: string;
  country: string;
  photos: string[];
};

const HOTEL_PHRASE_PREFIXES = [
  "hotels in",
  "hotel in",
  "properties in",
  "property in",
  "places in",
  "places to stay in",
  "stays in",
  "accommodation in",
];

/** 0 = exact match, 1 = starts with, 2 = contains, null = no match. */
function matchRank(value: string, query: string): number | null {
  const normalizedValue = value.trim().toLowerCase();
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return null;
  if (normalizedValue === normalizedQuery) return 0;
  if (normalizedValue.startsWith(normalizedQuery)) return 1;
  if (normalizedValue.includes(normalizedQuery)) return 2;
  return null;
}

/**
 * Interprets natural phrases like "hotels in Blackpool" as a destination
 * search for "Blackpool", so typing that phrase surfaces the right
 * destination rather than only searching hotel titles for the literal text.
 */
export function extractDestinationQuery(rawQuery: string): string {
  const trimmed = rawQuery.trim();
  const lower = trimmed.toLowerCase();
  for (const prefix of HOTEL_PHRASE_PREFIXES) {
    if (lower.startsWith(`${prefix} `)) {
      return trimmed.slice(prefix.length + 1).trim();
    }
  }
  return trimmed;
}

function destinationLabel(city: string, country: string): DestinationSuggestion {
  return {
    type: "destination",
    id: `${city}|${country}`,
    city,
    country,
    label: city,
    sublabel: country,
  };
}

/** Ranks and dedupes real city/country combinations against a search query. */
export function rankDestinations(
  cities: CityAggregate[],
  query: string,
  limit = 5,
): DestinationSuggestion[] {
  const effectiveQuery = extractDestinationQuery(query);
  const ranked = cities
    .map((entry) => {
      const cityRank = matchRank(entry.city, effectiveQuery);
      const countryRank = matchRank(entry.country, effectiveQuery);
      const rank = cityRank === null ? countryRank : countryRank === null ? cityRank : Math.min(cityRank, countryRank);
      return rank === null ? null : { entry, rank };
    })
    .filter((x): x is { entry: CityAggregate; rank: number } => x !== null)
    .sort((a, b) => a.rank - b.rank || b.entry.count - a.entry.count || a.entry.city.localeCompare(b.entry.city));

  return ranked.slice(0, limit).map(({ entry }) => destinationLabel(entry.city, entry.country));
}

/**
 * Popular destinations shown when the field is focused but empty — only
 * real cities with at least one published listing, never invented. Unlike
 * the homepage's browse-by-category rows (MIN_LISTINGS_PER_SECTION), a
 * single real listing is still a genuine, useful suggestion here.
 */
export function popularDestinations(
  cities: CityAggregate[],
  { minPerSection = 1, limit = 6 } = {},
): DestinationSuggestion[] {
  return cities
    .filter((entry) => entry.count >= minPerSection)
    .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city))
    .slice(0, limit)
    .map((entry) => destinationLabel(entry.city, entry.country));
}

/** Ranks real listings (hotels/properties) by title against the raw query. */
export function rankHotels(listings: HotelListing[], query: string, limit = 5): HotelSuggestion[] {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];

  const ranked = listings
    .map((listing) => {
      const rank = matchRank(listing.title, trimmedQuery);
      return rank === null ? null : { listing, rank };
    })
    .filter((x): x is { listing: HotelListing; rank: number } => x !== null)
    .sort((a, b) => a.rank - b.rank || a.listing.title.localeCompare(b.listing.title));

  return ranked.slice(0, limit).map(({ listing }) => ({
    type: "hotel" as const,
    id: listing.id,
    label: listing.title,
    sublabel: `${listing.city}, ${listing.country}`,
    photo: listing.photos[0] ?? null,
  }));
}
