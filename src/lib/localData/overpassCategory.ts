import type { LocalPlaceCategory } from "@prisma/client";
import type { OverpassElement } from "@/lib/localData/overpassSource";

/**
 * Maps an OSM element's tags to FYStay's own LocalPlaceCategory - the
 * unified taxonomy every source (OSM today, anything else later) has to
 * fit into. Returns null for anything that doesn't match one of the tag
 * combinations this app actually queries for, so a stray, oddly-tagged
 * element gets skipped rather than mislabelled as OTHER.
 */
export function categorizeOverpassElement(tags: Record<string, string>): LocalPlaceCategory | null {
  switch (tags.amenity) {
    case "restaurant":
      return "RESTAURANT";
    case "cafe":
      return "CAFE";
    case "pub":
      return "PUB";
    case "pharmacy":
      return "PHARMACY";
    case "parking":
      return "PARKING";
    case "charging_station":
      return "EV_CHARGING";
    case "toilets":
      return "TOILET";
    default:
      break;
  }
  switch (tags.shop) {
    case "supermarket":
    case "convenience":
      return "SUPERMARKET";
    default:
      break;
  }
  switch (tags.leisure) {
    case "park":
      return "PARK";
    case "playground":
      return "PLAYGROUND";
    default:
      break;
  }
  if (tags.natural === "beach") return "BEACH";
  switch (tags.tourism) {
    case "attraction":
      return "ATTRACTION";
    case "museum":
      return "MUSEUM";
    case "viewpoint":
      return "VIEWPOINT";
    default:
      break;
  }
  return null;
}

/** OSM's own wheelchair=yes/no/limited/designated vocabulary, kept close to verbatim rather than collapsed to a boolean - "limited" is real, useful information a yes/no can't carry. */
export function accessibilityFromTags(tags: Record<string, string>): string | null {
  switch (tags.wheelchair) {
    case "yes":
      return "Wheelchair accessible";
    case "limited":
      return "Limited wheelchair access";
    case "no":
      return "Not wheelchair accessible";
    case "designated":
      return "Designated wheelchair access";
    default:
      return null;
  }
}

/** Tri-state: OSM's dog=yes/leashed/no, or null when the place simply isn't tagged either way (a real "unknown", not a "no"). */
export function dogFriendlyFromTags(tags: Record<string, string>): boolean | null {
  if (tags.dog === "yes" || tags.dog === "leashed") return true;
  if (tags.dog === "no") return false;
  return null;
}

function addressFromTags(tags: Record<string, string>): string | null {
  const parts = [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"]].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : null;
}

export type NormalizedPlace = {
  sourceId: string;
  name: string;
  category: LocalPlaceCategory;
  latitude: number;
  longitude: number;
  address: string | null;
  openingHours: string | null;
  website: string | null;
  phone: string | null;
  accessibility: string | null;
  dogFriendly: boolean | null;
  familyFriendly: boolean | null;
  rawData: Record<string, string>;
};

/**
 * Turns one raw Overpass element into FYStay's own unified place shape, or
 * null when it's missing something a guest-facing recommendation can't do
 * without - a name, or real coordinates (a way/relation Overpass didn't
 * return a `center` for, which happens for a small fraction of results).
 */
export function normalizeOverpassElement(element: OverpassElement): NormalizedPlace | null {
  const tags = element.tags ?? {};
  const name = tags.name;
  if (!name) return null;

  const category = categorizeOverpassElement(tags);
  if (!category) return null;

  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;
  if (latitude === undefined || longitude === undefined) return null;

  return {
    sourceId: `${element.type}/${element.id}`,
    name,
    category,
    latitude,
    longitude,
    address: addressFromTags(tags),
    openingHours: tags.opening_hours ?? null,
    website: tags.website ?? tags["contact:website"] ?? null,
    phone: tags.phone ?? tags["contact:phone"] ?? null,
    accessibility: accessibilityFromTags(tags),
    dogFriendly: dogFriendlyFromTags(tags),
    familyFriendly: category === "PLAYGROUND" ? true : null,
    rawData: tags,
  };
}
