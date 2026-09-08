import type { EditorialRecommendation, LocalPlace, LocalPlaceCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getTownWeather, type TownWeather } from "@/lib/localData/weather";
import { getTownPlaces } from "@/lib/localData/places";
import { buildRecommendations, type LocalRecommendation } from "@/lib/localData/recommendationEngine";

// Purely functional/administrative categories don't belong in a "here's
// what's good right now" spotlight - a guest doesn't want the concierge's
// top pick to be a supermarket or an EV charger. They still exist as
// LocalPlace rows (and still show up wherever the guide surfaces amenities
// directly), just not here.
const UTILITY_CATEGORIES = new Set<LocalPlaceCategory>([
  "PARKING",
  "TOILET",
  "EV_CHARGING",
  "PHARMACY",
  "SUPERMARKET",
]);

const SPOTLIGHT_COUNT = 6;

export type ConciergeSources = {
  weather: TownWeather | null;
  places: LocalPlace[];
  editorial: EditorialRecommendation[];
};

export type ConciergeSnapshot = {
  weather: TownWeather | null;
  recommendations: LocalRecommendation[];
};

/**
 * Every raw source the "Right now" concierge panel needs for one town,
 * fetched in parallel so the destination page only waits as long as its
 * slowest single source rather than the sum of all three. Each source
 * already fails safe on its own (see weather.ts/places.ts's fallback to
 * last-known-good cache) - a dead API here just means fewer entries below,
 * never a broken page.
 */
export async function loadConciergeSources(townSlug: string): Promise<ConciergeSources> {
  const [weather, places, editorial] = await Promise.all([
    getTownWeather(townSlug),
    getTownPlaces(townSlug),
    prisma.editorialRecommendation.findMany({ where: { townSlug }, orderBy: { rank: "asc" } }),
  ]);
  return { weather, places, editorial };
}

/**
 * Merges the raw sources into the ranked, spotlight-ready view. Kept as a
 * separate, synchronous step from loadConciergeSources so it can run only
 * once both that fetch and the guest's origin listing (a separate,
 * independent lookup on the destination page) have resolved, instead of
 * forcing them to happen one after the other.
 */
export function buildConciergeSnapshot(
  sources: ConciergeSources,
  origin: { latitude: number; longitude: number } | null,
): ConciergeSnapshot {
  const ranked = buildRecommendations(sources.places, sources.editorial, {
    origin,
    weather: sources.weather,
    mood: null,
    now: new Date(),
  });
  const recommendations = ranked.filter((rec) => !UTILITY_CATEGORIES.has(rec.category)).slice(0, SPOTLIGHT_COUNT);
  return { weather: sources.weather, recommendations };
}
