import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type {
  AvailabilityParams,
  HotelDeal,
  HotelProviderAdapter,
  HotelSearchParams,
  HotelSearchResult,
} from "@/lib/hotelProviders/types";

/**
 * A small, provider-agnostic, DB-backed cache in front of the two provider
 * calls actually worth caching: searchHotels and getAvailability (never
 * getHotelDetails - see search.ts's own top comment on why the hotel detail
 * page always re-fetches live, and never createDeepLink, a synchronous pure
 * function with nothing to cache).
 *
 * Backed by Postgres (HotelProviderCacheEntry), not an in-memory Map, for
 * exactly the reason rateLimit.ts's own top comment already documents for
 * this codebase: FYStay runs as short-lived Vercel serverless functions,
 * each with its own process memory, so an in-process cache would reset on
 * every cold start and wouldn't agree across concurrent instances - it
 * wouldn't meaningfully reduce provider calls at all.
 *
 * Cache keys are built only from HotelSearchParams/AvailabilityParams -
 * neither type has ever had (and never should have) a userId, sessionId, or
 * subId field, so there is structurally nothing user- or attribution-
 * specific for this cache to leak between guests. A cache entry answering
 * one guest's search is exactly as valid for any other guest who searches
 * the same destination/dates/guests against the same provider.
 */

export type CacheTtlConfig = {
  searchTtlMs: number;
  availabilityTtlMs: number;
};

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Search results (5 min default): a hotel list for a destination/dates
 * combination changes slowly enough that a few minutes of staleness is an
 * unremarkable trade for far fewer provider calls under real traffic.
 * Availability (1 min default) is deliberately much shorter - see this
 * file's own top comment: price and room inventory are exactly the fields
 * this codebase's own docs (HotelSearchResult's comment) already warn are
 * "last known", never guaranteed, and the hotel detail page re-checks
 * availability specifically so a guest is never shown a stale price to
 * commit to - a long availability cache would quietly undermine that same
 * guarantee this cache sits in front of. Both overridable via env for
 * production tuning - see .env.example.
 */
export const DEFAULT_CACHE_TTL: CacheTtlConfig = {
  searchTtlMs: envInt("HOTEL_SEARCH_CACHE_TTL_MS", 5 * 60 * 1000),
  availabilityTtlMs: envInt("HOTEL_AVAILABILITY_CACHE_TTL_MS", 60 * 1000),
};

function hashParts(parts: unknown[]): string {
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex").slice(0, 40);
}

/** Deterministic, provider-scoped key covering every input that materially affects a search result. */
export function searchCacheKey(providerCode: string, params: HotelSearchParams): string {
  return `search:${providerCode}:${hashParts([
    params.destination.trim().toLowerCase(),
    params.destinationLat ?? null,
    params.destinationLng ?? null,
    params.checkIn.toISOString(),
    params.checkOut.toISOString(),
    params.adults,
    params.children,
    params.rooms,
  ])}`;
}

/** Deterministic, provider-and-hotel-scoped key covering every input that materially affects an availability result. */
export function availabilityCacheKey(providerCode: string, externalId: string, params: AvailabilityParams): string {
  return `availability:${providerCode}:${externalId}:${hashParts([
    params.checkIn.toISOString(),
    params.checkOut.toISOString(),
    params.adults,
    params.children,
    params.rooms,
  ])}`;
}

/**
 * Reads a cache entry, treating any read failure or an expired row exactly
 * like a cache miss - never lets a cache outage or an expired-but-not-yet-
 * pruned row break or slow down the guest-facing request beyond falling
 * through to the real provider call.
 */
async function getCached<T>(cacheKey: string, now: Date): Promise<T | null> {
  try {
    const row = await prisma.hotelProviderCacheEntry.findUnique({ where: { cacheKey } });
    if (!row || row.expiresAt <= now) return null;
    return row.payload as T;
  } catch (err) {
    console.error(err);
    return null;
  }
}

/**
 * Writes a cache entry. Only ever called by the wrappers below after a
 * provider call has already succeeded - there is no code path that reaches
 * this function with an error response, so a failed provider call can never
 * be cached as if it were a successful one. A write failure is logged and
 * swallowed: the guest already has their (uncached) result regardless.
 */
async function setCached(cacheKey: string, providerCode: string, payload: unknown, ttlMs: number, now: Date): Promise<void> {
  try {
    const expiresAt = new Date(now.getTime() + ttlMs);
    await prisma.hotelProviderCacheEntry.upsert({
      where: { cacheKey },
      create: { cacheKey, providerCode, payload: payload as never, expiresAt },
      update: { payload: payload as never, expiresAt },
    });
  } catch (err) {
    console.error(err);
  }
}

/**
 * Wraps searchHotels and getAvailability with the cache above; leaves
 * getHotelDetails and createDeepLink untouched. Wired in once, in
 * registry.ts, alongside withResilientAdapter - the cache sits outside the
 * resilience layer (a cache hit skips the timeout/retry machinery entirely,
 * since there's no provider call to time out or retry).
 */
export function withCachedAdapter(adapter: HotelProviderAdapter, ttl: CacheTtlConfig = DEFAULT_CACHE_TTL): HotelProviderAdapter {
  return {
    ...adapter,
    async searchHotels(params: HotelSearchParams): Promise<HotelSearchResult[]> {
      const now = new Date();
      const key = searchCacheKey(adapter.code, params);
      const cached = await getCached<HotelSearchResult[]>(key, now);
      if (cached) return cached;
      const results = await adapter.searchHotels(params);
      await setCached(key, adapter.code, results, ttl.searchTtlMs, now);
      return results;
    },
    async getAvailability(externalId: string, params: AvailabilityParams): Promise<HotelDeal[]> {
      const now = new Date();
      const key = availabilityCacheKey(adapter.code, externalId, params);
      const cached = await getCached<HotelDeal[]>(key, now);
      if (cached) return cached;
      const deals = await adapter.getAvailability(externalId, params);
      await setCached(key, adapter.code, deals, ttl.availabilityTtlMs, now);
      return deals;
    },
  };
}
