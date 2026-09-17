/**
 * Real, named Fylde Coast landmarks, used to show a guest genuine
 * distances from a listing to things they'd actually recognise (Blackpool
 * Tower, the nearest railway station) - the same kind of "0.3 miles from
 * X" proximity callout Booking.com and Airbnb show, built from this app's
 * own real per-listing coordinates (src/lib/geocoding.ts) rather than
 * anything invented. Coordinates come from src/lib/placeCoordinates.ts,
 * the single source every distance calculation in the app reads from - see
 * that file's own doc comment for how approximate they are.
 */
import { PLACE_COORDINATES } from "@/lib/placeCoordinates";
import { distanceMiles, estimateWalkMinutes } from "@/lib/geo";

export type LandmarkCategory = "attraction" | "station";

export type Landmark = {
  name: string;
  category: LandmarkCategory;
  /** The real town this landmark is in, matching the exact city string
   * listings are stored under (e.g. "Lytham") - lets a landmark search
   * scope straight to that town's listings, not just the whole coast, the
   * same way picking that town by name already does. */
  town: string;
  latitude: number;
  longitude: number;
};

export const LANDMARKS: Landmark[] = [
  // Blackpool
  { name: "Blackpool Tower", category: "attraction", town: "Blackpool", ...PLACE_COORDINATES["Blackpool Tower"] },
  {
    name: "Blackpool Pleasure Beach",
    category: "attraction",
    town: "Blackpool",
    ...PLACE_COORDINATES["Blackpool Pleasure Beach"],
  },
  { name: "North Pier", category: "attraction", town: "Blackpool", ...PLACE_COORDINATES["North Pier"] },
  { name: "Blackpool North", category: "station", town: "Blackpool", ...PLACE_COORDINATES["Blackpool North"] },

  // Lytham
  {
    name: "Lytham Windmill",
    category: "attraction",
    town: "Lytham",
    ...PLACE_COORDINATES["Lytham Windmill"],
  },
  { name: "Lytham Hall", category: "attraction", town: "Lytham", ...PLACE_COORDINATES["Lytham Hall"] },
  { name: "Lytham", category: "station", town: "Lytham", ...PLACE_COORDINATES.Lytham },

  // St Annes
  { name: "St Annes Pier", category: "attraction", town: "St Annes", ...PLACE_COORDINATES["St Annes Pier"] },
  { name: "Fairhaven Lake", category: "attraction", town: "St Annes", ...PLACE_COORDINATES["Fairhaven Lake"] },
  { name: "Ashton Gardens", category: "attraction", town: "St Annes", ...PLACE_COORDINATES["Ashton Gardens"] },
  {
    name: "Ansdell & Fairhaven",
    category: "station",
    town: "St Annes",
    ...PLACE_COORDINATES["Ansdell & Fairhaven"],
  },

  // Poulton-le-Fylde
  {
    name: "St Chad's Church, Poulton",
    category: "attraction",
    town: "Poulton-le-Fylde",
    ...PLACE_COORDINATES["St Chad's Church Poulton"],
  },
  {
    name: "Teanlowe Centre",
    category: "attraction",
    town: "Poulton-le-Fylde",
    ...PLACE_COORDINATES["Teanlowe Centre"],
  },
  {
    name: "Poulton-le-Fylde railway station",
    category: "station",
    town: "Poulton-le-Fylde",
    ...PLACE_COORDINATES["Poulton-le-Fylde"],
  },

  // Fleetwood
  {
    name: "Fleetwood Pharos Lighthouse",
    category: "attraction",
    town: "Fleetwood",
    ...PLACE_COORDINATES["Fleetwood Pharos Lighthouse"],
  },
  { name: "Fleetwood Ferry", category: "attraction", town: "Fleetwood", ...PLACE_COORDINATES["Fleetwood Ferry"] },

  // Thornton-Cleveleys
  {
    name: "Rossall Point Tower",
    category: "attraction",
    town: "Thornton-Cleveleys",
    ...PLACE_COORDINATES["Rossall Point Tower"],
  },
  {
    name: "Anchorsholme Park",
    category: "attraction",
    town: "Thornton-Cleveleys",
    ...PLACE_COORDINATES["Anchorsholme Park"],
  },
  { name: "Marsh Mill", category: "attraction", town: "Thornton-Cleveleys", ...PLACE_COORDINATES["Marsh Mill"] },
];

/** Case-insensitive exact lookup by name - the id a landmark search
 * suggestion round-trips through the URL as (see searchSuggestions.ts and
 * the /search page), so only a name that genuinely matches one of these
 * real, curated places ever resolves to a location. */
export function findLandmarkByName(name: string): Landmark | undefined {
  const normalized = name.trim().toLowerCase();
  return LANDMARKS.find((landmark) => landmark.name.toLowerCase() === normalized);
}

export type NearbyLandmark = {
  name: string;
  category: LandmarkCategory;
  distanceMiles: number;
  /** Null once far enough that a walking-time estimate stops being useful information and starts being noise. */
  walkMinutes: number | null;
};

/**
 * The nearest attractions plus the single nearest station, sorted closest
 * first - never landmarks from a different town's cluster that happen to
 * be the "nearest" only because a listing has no closer options, since
 * that would read as a fabricated selling point rather than a genuine one.
 */
export function nearbyLandmarks(
  listing: { latitude: number; longitude: number },
  options: { maxAttractionMiles?: number; maxAttractions?: number; maxStationMiles?: number } = {},
): NearbyLandmark[] {
  const { maxAttractionMiles = 3, maxAttractions = 3, maxStationMiles = 10 } = options;

  const withDistance = LANDMARKS.map((landmark) => ({
    landmark,
    distance: distanceMiles(listing, landmark),
  }));

  const attractions = withDistance
    .filter((l) => l.landmark.category === "attraction" && l.distance <= maxAttractionMiles)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxAttractions);

  const nearestStation = withDistance
    .filter((l) => l.landmark.category === "station" && l.distance <= maxStationMiles)
    .sort((a, b) => a.distance - b.distance)[0];

  const results = nearestStation ? [...attractions, nearestStation] : attractions;

  return results
    .sort((a, b) => a.distance - b.distance)
    .map(({ landmark, distance }) => ({
      name: landmark.name,
      category: landmark.category,
      distanceMiles: Math.round(distance * 10) / 10,
      walkMinutes: estimateWalkMinutes(distance),
    }));
}
