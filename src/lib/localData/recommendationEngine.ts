import type { EditorialRecommendation, EditorialTag, LocalPlace, LocalPlaceCategory } from "@prisma/client";
import { distanceMiles, estimateDriveMinutes, estimateWalkMinutes } from "@/lib/geo";
import { isOpenAt } from "@/lib/localData/openingHours";
import type { MoodKey } from "@/lib/moods";

export type RecommendationSource = "OSM" | "EDITORIAL";

export type LocalRecommendation = {
  id: string;
  source: RecommendationSource;
  name: string;
  category: LocalPlaceCategory;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceMiles: number | null;
  walkMinutes: number | null;
  driveMinutes: number | null;
  rating: number | null;
  priceLevel: number | null;
  openingHours: string | null;
  openNow: boolean | null;
  website: string | null;
  imageUrl: string | null;
  familyFriendly: boolean | null;
  dogFriendly: boolean | null;
  accessibility: string | null;
  editorialTag: EditorialTag | null;
  fyStayPick: boolean;
  score: number;
};

const INDOOR_CATEGORIES = new Set<LocalPlaceCategory>(["CAFE", "RESTAURANT", "PUB", "MUSEUM", "SHOP", "SUPERMARKET"]);
const OUTDOOR_CATEGORIES = new Set<LocalPlaceCategory>(["BEACH", "PARK", "PLAYGROUND", "VIEWPOINT"]);

// A small, honest mapping from a mood (the same ones the static Local
// Guide's mood picker already uses - see src/lib/moods.ts) to the live
// categories most relevant to it, so picking "Food & drink" or "Beach day"
// here means the same thing it does on the static guide, not a second,
// subtly different taxonomy.
const MOOD_CATEGORY_BOOST: Partial<Record<MoodKey, LocalPlaceCategory[]>> = {
  family: ["PLAYGROUND", "PARK", "ATTRACTION", "BEACH"],
  couples: ["RESTAURANT", "VIEWPOINT", "CAFE"],
  foodAndDrink: ["RESTAURANT", "CAFE", "PUB"],
  beachDay: ["BEACH", "PARK"],
  rainyDay: ["MUSEUM", "CAFE", "SHOP", "ATTRACTION"],
  nightOut: ["PUB"],
  relaxing: ["PARK", "CAFE", "VIEWPOINT"],
  dogFriendly: ["PARK", "BEACH"],
  shopping: ["SHOP", "SUPERMARKET"],
  kids: ["PLAYGROUND", "PARK", "ATTRACTION"],
  adventure: ["ATTRACTION", "VIEWPOINT", "BEACH"],
};

export type ScoringContext = {
  origin: { latitude: number; longitude: number } | null;
  // Only the one signal scoreRecommendation actually reads from weather -
  // never the full TownWeather shape - so this stays safely importable
  // into a "use client" component (for instant client-side re-scoring when
  // a guest picks a personalisation preference) without dragging in
  // weather.ts's server-only Prisma-backed module or a Date to serialize.
  weather: { rainy: boolean } | null;
  mood: MoodKey | null;
  now: Date;
};

type RecommendationInput = {
  id: string;
  source: RecommendationSource;
  name: string;
  category: LocalPlaceCategory;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  priceLevel: number | null;
  openingHours: string | null;
  website: string | null;
  imageUrl: string | null;
  familyFriendly: boolean | null;
  dogFriendly: boolean | null;
  accessibility: string | null;
  editorialTag: EditorialTag | null;
};

/**
 * Every factor here reads from a real, already-computed field - nothing
 * is invented for the sake of ranking. Distance and rating taper in
 * naturally rather than gating on a threshold, so a great match slightly
 * further away can still outrank a mediocre one next door.
 */
export function scoreRecommendation(rec: Omit<LocalRecommendation, "score">, context: ScoringContext): number {
  let score = 0;

  if (rec.distanceMiles !== null) {
    score += Math.max(0, 8 - rec.distanceMiles * 1.5);
  }
  if (rec.editorialTag) {
    score += rec.editorialTag === "FYSTAY_PICK" ? 6 : 5;
  }
  if (rec.rating !== null) {
    score += rec.rating;
  }

  const isRainy = context.weather?.rainy ?? false;
  if (isRainy && INDOOR_CATEGORIES.has(rec.category)) score += 4;
  if (!isRainy && OUTDOOR_CATEGORIES.has(rec.category)) score += 2;

  if (context.mood) {
    const boosted = MOOD_CATEGORY_BOOST[context.mood];
    if (boosted?.includes(rec.category)) score += 3;
  }

  if (rec.openNow === true) score += 2;
  if (rec.openNow === false) score -= 3;

  return Math.round(score * 100) / 100;
}

function toRecommendation(base: RecommendationInput, context: ScoringContext): LocalRecommendation {
  const hasCoords = base.latitude !== null && base.longitude !== null;
  const miles =
    hasCoords && context.origin
      ? distanceMiles(context.origin, { latitude: base.latitude as number, longitude: base.longitude as number })
      : null;

  const withoutScore: Omit<LocalRecommendation, "score"> = {
    ...base,
    distanceMiles: miles !== null ? Math.round(miles * 10) / 10 : null,
    walkMinutes: miles !== null ? estimateWalkMinutes(miles) : null,
    driveMinutes: miles !== null ? estimateDriveMinutes(miles) : null,
    openNow: isOpenAt(base.openingHours, context.now),
    fyStayPick: base.editorialTag !== null,
  };

  return { ...withoutScore, score: scoreRecommendation(withoutScore, context) };
}

/**
 * Merges OSM-sourced places and FYStay's own editorial picks into one
 * ranked list, highest score first. An editorial entry already linked to
 * a live place (placeId set) overlays that place's tag/pick status rather
 * than appearing a second time; one never linked (placeId still null -
 * true of every row prisma/seed-editorial.ts writes today) shows up in
 * its own right, so the guide has real content even where no live source
 * has synced yet for that town.
 */
export function buildRecommendations(
  places: LocalPlace[],
  editorial: EditorialRecommendation[],
  context: ScoringContext,
): LocalRecommendation[] {
  const editorialByPlaceId = new Map(
    editorial.filter((entry) => entry.placeId !== null).map((entry) => [entry.placeId as string, entry]),
  );

  const fromPlaces = places.map((place) =>
    toRecommendation(
      {
        id: place.id,
        source: "OSM",
        name: place.name,
        category: place.category,
        description: place.description,
        latitude: place.latitude,
        longitude: place.longitude,
        rating: place.rating,
        priceLevel: place.priceLevel,
        openingHours: place.openingHours,
        website: place.website,
        imageUrl: place.imageUrl,
        familyFriendly: place.familyFriendly,
        dogFriendly: place.dogFriendly,
        accessibility: place.accessibility,
        editorialTag: editorialByPlaceId.get(place.id)?.tag ?? null,
      },
      context,
    ),
  );

  const fromEditorialOnly = editorial
    .filter((entry) => entry.placeId === null)
    .map((entry) =>
      toRecommendation(
        {
          id: entry.id,
          source: "EDITORIAL",
          name: entry.name,
          category: entry.category,
          description: entry.description,
          latitude: null,
          longitude: null,
          rating: null,
          priceLevel: null,
          openingHours: null,
          website: null,
          imageUrl: null,
          familyFriendly: null,
          dogFriendly: null,
          accessibility: null,
          editorialTag: entry.tag,
        },
        context,
      ),
    );

  return [...fromPlaces, ...fromEditorialOnly].sort((a, b) => b.score - a.score);
}
