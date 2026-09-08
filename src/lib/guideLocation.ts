import { distanceMiles, estimateDriveMinutes, estimateWalkMinutes } from "@/lib/geo";
import { PLACE_COORDINATES } from "@/lib/placeCoordinates";
import type { GuideCategoryKey, GuideEntry, TownGuide } from "@/lib/localGuide";

export type EntryLocation = {
  distanceMiles: number;
  walkMinutes: number | null;
  driveMinutes: number | null;
};

/** The listing a guest arrived from, once resolved to a fresh, real title + coordinates - see the destination page's own lookup. */
export type OriginListing = { title: string; latitude: number; longitude: number };

/**
 * Real distance/walk/drive time from a listing to a guide entry's named
 * place - null whenever there's no origin yet (no listing context), or the
 * entry doesn't name one identifiable place. Never a guessed distance for
 * something we can't actually place on a map.
 */
export function locateEntry(
  origin: { latitude: number; longitude: number } | null,
  place: string | undefined,
): EntryLocation | null {
  if (!origin || !place) return null;
  const target = PLACE_COORDINATES[place];
  if (!target) return null;

  const miles = distanceMiles(origin, target);
  return {
    distanceMiles: Math.round(miles * 10) / 10,
    walkMinutes: estimateWalkMinutes(miles),
    driveMinutes: estimateDriveMinutes(miles),
  };
}

/**
 * Puts entries with a known distance first, closest first; everything
 * else - entries that don't name one identifiable place - keeps its
 * original relative order, appended after them. "Prioritise by distance"
 * only ever means resorting what's already there, never inventing a rank
 * for an entry we have no real location for.
 */
export function prioritizeEntriesByDistance(
  entries: GuideEntry[],
  origin: { latitude: number; longitude: number } | null,
): GuideEntry[] {
  if (!origin) return entries;
  return [...entries].sort((a, b) => {
    const da = locateEntry(origin, a.place)?.distanceMiles ?? Infinity;
    const db = locateEntry(origin, b.place)?.distanceMiles ?? Infinity;
    return da - db;
  });
}

/**
 * True when this exact entry name is also listed under the guide's own
 * "family" or "dogFriendly" category for this town - a fact the guide
 * already asserts elsewhere, surfaced as a badge rather than a new claim
 * invented for this feature.
 */
export function entryMatchesCategory(guide: TownGuide, category: GuideCategoryKey, entryName: string): boolean {
  return guide[category].some((entry) => entry.name === entryName);
}
