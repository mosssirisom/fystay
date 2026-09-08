import type { EditorialRecommendation, LocalEvent, LocalPlace, LocalPlaceCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getTownWeather, type TownWeather } from "@/lib/localData/weather";
import { getTownPlaces } from "@/lib/localData/places";
import { getTownEvents } from "@/lib/localData/events";
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

// Generous enough to serve every section built on top of this one snapshot
// (the "Today" spotlight only needs its top 3, FYStay Picks wants a full
// carousel) without a second query - each consumer just slices further.
const SPOTLIGHT_COUNT = 16;

export type ConciergeSources = {
  weather: TownWeather | null;
  places: LocalPlace[];
  editorial: EditorialRecommendation[];
  events: LocalEvent[];
};

export type ConciergeSnapshot = {
  weather: TownWeather | null;
  recommendations: LocalRecommendation[];
  /** The same ranked list as `recommendations`, but without the utility-category filter - only "Near Your Stay" needs a supermarket, pharmacy or car park to actually show up. */
  nearby: LocalRecommendation[];
  events: LocalEvent[];
};

/**
 * Every raw source the town guide's live sections need for one town,
 * fetched in parallel so the destination page only waits as long as its
 * slowest single source rather than the sum of all four. Each source
 * already fails safe on its own (see weather.ts/places.ts/events.ts's
 * fallback to last-known-good cache, or an honest empty list) - a dead API
 * here just means fewer entries below, never a broken page.
 */
export async function loadConciergeSources(townSlug: string): Promise<ConciergeSources> {
  const [weather, places, editorial, events] = await Promise.all([
    getTownWeather(townSlug),
    getTownPlaces(townSlug),
    prisma.editorialRecommendation.findMany({ where: { townSlug }, orderBy: { rank: "asc" } }),
    getTownEvents(townSlug),
  ]);
  return { weather, places, editorial, events };
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
    weather: sources.weather ? { rainy: sources.weather.current.condition.rainy } : null,
    mood: null,
    now: new Date(),
  });
  const recommendations = ranked.filter((rec) => !UTILITY_CATEGORIES.has(rec.category)).slice(0, SPOTLIGHT_COUNT);
  return { weather: sources.weather, recommendations, nearby: ranked, events: sources.events };
}

/** Events starting on today's calendar date, for the "Today in town" section - everything else on the returned list (already sorted soonest-first) is "upcoming" for the What's On section instead. */
export function eventsToday(events: LocalEvent[], now: Date): LocalEvent[] {
  return events.filter((event) => isSameCalendarDay(event.startsAt, now));
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
