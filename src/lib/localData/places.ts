import type { LocalPlace, LocalPlaceCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureTownsSeeded } from "@/lib/localData/seedTowns";
import { fetchOverpassPlaces } from "@/lib/localData/overpassSource";
import { normalizeOverpassElement, type NormalizedPlace } from "@/lib/localData/overpassCategory";
import { hasRecentLog, runSync } from "@/lib/localData/syncLog";

// OSM places don't meaningfully change (a restaurant doesn't close, or a
// park doesn't move) fast enough to justify checking more than daily - and
// Overpass's own fair-use policy asks for infrequent, sequential requests,
// which a 24-hour-per-town cache comfortably satisfies regardless of how
// much guest traffic hits the pages that read this.
const PLACES_TTL_MS = 24 * 60 * 60 * 1000;

async function upsertPlace(townSlug: string, place: NormalizedPlace): Promise<void> {
  await prisma.localPlace.upsert({
    where: { source_sourceId: { source: "OSM", sourceId: place.sourceId } },
    create: {
      source: "OSM",
      sourceId: place.sourceId,
      townSlug,
      name: place.name,
      category: place.category,
      latitude: place.latitude,
      longitude: place.longitude,
      address: place.address,
      openingHours: place.openingHours,
      website: place.website,
      phone: place.phone,
      accessibility: place.accessibility,
      dogFriendly: place.dogFriendly,
      familyFriendly: place.familyFriendly,
      rawData: place.rawData,
    },
    update: {
      name: place.name,
      category: place.category,
      latitude: place.latitude,
      longitude: place.longitude,
      address: place.address,
      openingHours: place.openingHours,
      website: place.website,
      phone: place.phone,
      accessibility: place.accessibility,
      dogFriendly: place.dogFriendly,
      familyFriendly: place.familyFriendly,
      rawData: place.rawData,
      lastFetchedAt: new Date(),
    },
  });
}

/**
 * The one function anything in the app should call for OSM places - never
 * fetchOverpassPlaces directly. Refreshes the cache when it's stale (see
 * isCacheFresh - tracked via ApiSyncLog, not "does a row exist yet", so a
 * town with genuinely zero matches doesn't get re-fetched on every single
 * request), then always serves from LocalPlace - a failed refresh simply
 * means today's read falls back to whatever's already cached, per the
 * "keep working on last-known-good data" requirement for every source
 * here. A brand new town with no cache yet and a failed first fetch
 * returns an empty list rather than throwing.
 */
export async function getTownPlaces(townSlug: string, category?: LocalPlaceCategory): Promise<LocalPlace[]> {
  await ensureTownsSeeded();
  const town = await prisma.localTown.findUnique({ where: { slug: townSlug } });
  if (!town) return [];

  if (!(await hasRecentLog({ source: "OSM", townSlug, statuses: ["SUCCESS"], ttlMs: PLACES_TTL_MS }))) {
    await runSync({ source: "OSM", townSlug }, async () => {
      const elements = await fetchOverpassPlaces(town);
      const places = elements
        .map(normalizeOverpassElement)
        .filter((place): place is NormalizedPlace => place !== null);
      await Promise.all(places.map((place) => upsertPlace(townSlug, place)));
      return { result: places, recordCount: places.length };
    }).catch(() => undefined);
  }

  return prisma.localPlace.findMany({
    where: { townSlug, source: "OSM", ...(category ? { category } : {}) },
    orderBy: { name: "asc" },
  });
}
