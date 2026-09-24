/**
 * The one place the hotel search UI (Phase 5) actually calls to reach a
 * provider - every page/component gets here through this module, never by
 * importing an adapter or the registry directly (see this package's own
 * types.ts top comment). Two responsibilities live here that don't belong
 * in a pure lib file because both need Prisma:
 *
 *   1. Deciding WHICH provider(s) to query: every ACTIVE HotelProvider row
 *      in the database, not a hardcoded provider. Today that's only ever
 *      the seeded "mock" row (see src/lib/demoSeed.ts) - "booking_com"
 *      stays unseeded/INACTIVE until real partner credentials exist (see
 *      providers/bookingCom.ts) - but the loop below already handles
 *      however many providers are ACTIVE at once, so flipping a real
 *      provider on later is a database change, not a code change here or
 *      in any page that calls this module.
 *   2. Caching each result into AffiliateHotel, keyed by (providerId,
 *      externalId) - not for freshness (the hotel detail page always
 *      re-fetches live details/availability - see getHotelForBooking
 *      below), but because AffiliateHotel.slug is the stable, public
 *      identifier `/hotels/[destination]/[slug]` resolves by. A hotel
 *      needs exactly one durable slug the first time it's ever seen, and
 *      needs to keep answering to that same slug on every later search
 *      that surfaces it again.
 */
import { prisma } from "@/lib/prisma";
import { getHotelProviderAdapter } from "@/lib/hotelProviders/registry";
import {
  HotelProviderAdapterError,
  type AvailabilityParams,
  type HotelDeal,
  type HotelDetails,
  type HotelSearchParams,
  type HotelSearchResult,
} from "@/lib/hotelProviders/types";
import { buildHotelSlugBase, ensureUniqueSlug, slugify } from "@/lib/hotelSlug";

export type HotelSearchCard = HotelSearchResult & {
  slug: string;
  providerCode: string;
  providerName: string;
};

export type HotelSearchOutcome =
  | { status: "ok"; results: HotelSearchCard[] }
  | { status: "unavailable"; message: string };

/**
 * Batches the slug-uniqueness check into one query per provider search
 * call (findMany + a Set), rather than one query per hotel - the search
 * results this runs against are a handful of rows, never worth N+1 queries.
 */
async function upsertAffiliateHotels(
  providerId: string,
  results: HotelSearchResult[],
): Promise<Map<string, string>> {
  const resultByExternalId = new Map(results.map((r) => [r.externalId, r]));
  const externalIds = results.map((r) => r.externalId);
  const existing = await prisma.affiliateHotel.findMany({
    where: { providerId, externalId: { in: externalIds } },
    select: { id: true, externalId: true, slug: true },
  });
  const existingByExternalId = new Map(existing.map((row) => [row.externalId, row]));

  const toCreate = results.filter((r) => !existingByExternalId.has(r.externalId));
  const candidateBases = toCreate.map((r) => buildHotelSlugBase(r.name, r.city));
  const potentiallyTaken =
    candidateBases.length > 0
      ? await prisma.affiliateHotel.findMany({
          where: { OR: candidateBases.map((base) => ({ slug: { startsWith: base } })) },
          select: { slug: true },
        })
      : [];
  const takenSlugs = new Set(potentiallyTaken.map((row) => row.slug));

  const slugByExternalId = new Map<string, string>();
  for (const row of existing) slugByExternalId.set(row.externalId, row.slug);

  const creates = toCreate.map((result) => {
    const base = buildHotelSlugBase(result.name, result.city);
    const slug = ensureUniqueSlug(base, (candidate) => takenSlugs.has(candidate));
    takenSlugs.add(slug);
    slugByExternalId.set(result.externalId, slug);
    return { result, slug };
  });

  // Every row in `existing` was looked up by an externalId drawn from
  // `results` itself (the where clause above), so resultByExternalId is
  // guaranteed to have an entry for each - this loop is exhaustive over
  // that same source array, never a value not already known to exist.
  const updates = existing.flatMap((row) => {
    const result = resultByExternalId.get(row.externalId);
    if (!result) return [];
    return [
      prisma.affiliateHotel.update({
        where: { id: row.id },
        data: {
          name: result.name,
          city: result.city,
          country: result.country,
          latitude: result.latitude,
          longitude: result.longitude,
          starRating: result.starRating,
          guestRating: result.guestRating,
          reviewCount: result.reviewCount,
          primaryPhotoUrl: result.primaryPhotoUrl,
          currency: result.currency,
          lastKnownPriceCents: result.priceCents,
          lastFetchedAt: new Date(),
        },
      }),
    ];
  });

  await prisma.$transaction([
    ...updates,
    ...creates.map(({ result, slug }) =>
      prisma.affiliateHotel.create({
        data: {
          providerId,
          externalId: result.externalId,
          name: result.name,
          city: result.city,
          country: result.country,
          latitude: result.latitude,
          longitude: result.longitude,
          starRating: result.starRating,
          guestRating: result.guestRating,
          reviewCount: result.reviewCount,
          primaryPhotoUrl: result.primaryPhotoUrl,
          photos: [],
          facilities: [],
          currency: result.currency,
          lastKnownPriceCents: result.priceCents,
          lastFetchedAt: new Date(),
          slug,
        },
      }),
    ),
  ]);

  return slugByExternalId;
}

/**
 * Searches every ACTIVE provider and merges their results. A single
 * provider failing (HotelProviderAdapterError) doesn't fail the whole
 * search if at least one other provider succeeded - only surfaces as
 * "unavailable" when every provider failed or none are configured at all,
 * matching Phase 5's "provider error" state without letting one bad
 * provider take down a page that has other, working results to show.
 */
export async function searchHotels(params: HotelSearchParams): Promise<HotelSearchOutcome> {
  const providers = await prisma.hotelProvider.findMany({ where: { status: "ACTIVE" } });
  if (providers.length === 0) {
    return {
      status: "unavailable",
      message: "Hotel search isn't available right now. Please try again later.",
    };
  }

  const allResults: HotelSearchCard[] = [];
  let failureCount = 0;

  for (const provider of providers) {
    const adapter = getHotelProviderAdapter(provider.code);
    try {
      const results = await adapter.searchHotels(params);
      if (results.length === 0) continue;
      const slugByExternalId = await upsertAffiliateHotels(provider.id, results);
      for (const result of results) {
        const slug = slugByExternalId.get(result.externalId);
        if (!slug) continue;
        allResults.push({ ...result, slug, providerCode: provider.code, providerName: provider.name });
      }
    } catch (err) {
      failureCount++;
      if (!(err instanceof HotelProviderAdapterError)) throw err;
    }
  }

  if (allResults.length === 0 && failureCount === providers.length) {
    return {
      status: "unavailable",
      message: "We couldn't reach our hotel search partner. Please try again shortly.",
    };
  }

  return { status: "ok", results: allResults };
}

export type HotelForBooking = {
  slug: string;
  providerCode: string;
  providerName: string;
  externalId: string;
  details: HotelDetails;
};

export type HotelLookupOutcome =
  | { status: "ok"; hotel: HotelForBooking }
  | { status: "not_found" }
  | { status: "unavailable"; message: string };

/**
 * Resolves a public hotel slug back to (provider, externalId) via the
 * AffiliateHotel cache, then re-fetches live details from the provider -
 * the cache is only ever used for routing/identity here, never for display
 * content, so the detail page can never show a guest a stale description,
 * facility list, or photo set (see this module's own top comment).
 */
export async function getHotelForBooking(slug: string): Promise<HotelLookupOutcome> {
  const cached = await prisma.affiliateHotel.findUnique({
    where: { slug },
    include: { provider: true },
  });
  if (!cached || !cached.active) return { status: "not_found" };

  const adapter = getHotelProviderAdapter(cached.provider.code);
  try {
    const details = await adapter.getHotelDetails(cached.externalId);
    return {
      status: "ok",
      hotel: {
        slug: cached.slug,
        providerCode: cached.provider.code,
        providerName: cached.provider.name,
        externalId: cached.externalId,
        details,
      },
    };
  } catch (err) {
    if (err instanceof HotelProviderAdapterError) {
      return {
        status: "unavailable",
        message: "This hotel's details aren't available right now. Please try again shortly.",
      };
    }
    throw err;
  }
}

export type HotelAvailabilityOutcome =
  | { status: "ok"; deals: HotelDeal[] }
  | { status: "unavailable"; message: string };

export async function getHotelAvailability(
  providerCode: string,
  externalId: string,
  params: AvailabilityParams,
): Promise<HotelAvailabilityOutcome> {
  const adapter = getHotelProviderAdapter(providerCode);
  try {
    const deals = await adapter.getAvailability(externalId, params);
    return { status: "ok", deals };
  } catch (err) {
    if (err instanceof HotelProviderAdapterError) {
      return {
        status: "unavailable",
        message: "We couldn't check live availability for this hotel. Please try again shortly.",
      };
    }
    throw err;
  }
}

/** The `[destination]` URL segment a hotel's card/detail link should use - always derived from the hotel's own city, never the raw search query, so two different searches that surface the same hotel always agree on one canonical URL. */
export function destinationSlugFor(city: string): string {
  return slugify(city);
}
