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
  latitude: number;
  longitude: number;
};

export const LANDMARKS: Landmark[] = [
  // Blackpool
  { name: "Blackpool Tower", category: "attraction", ...PLACE_COORDINATES["Blackpool Tower"] },
  { name: "Blackpool Pleasure Beach", category: "attraction", ...PLACE_COORDINATES["Blackpool Pleasure Beach"] },
  { name: "North Pier", category: "attraction", ...PLACE_COORDINATES["North Pier"] },
  { name: "Blackpool North", category: "station", ...PLACE_COORDINATES["Blackpool North"] },

  // Lytham St Annes
  { name: "Lytham Windmill", category: "attraction", ...PLACE_COORDINATES["Lytham Windmill"] },
  { name: "St Annes Pier", category: "attraction", ...PLACE_COORDINATES["St Annes Pier"] },
  { name: "Fairhaven Lake", category: "attraction", ...PLACE_COORDINATES["Fairhaven Lake"] },
  { name: "Lytham", category: "station", ...PLACE_COORDINATES.Lytham },
  { name: "Ansdell & Fairhaven", category: "station", ...PLACE_COORDINATES["Ansdell & Fairhaven"] },

  // Fleetwood
  { name: "Fleetwood Pharos Lighthouse", category: "attraction", ...PLACE_COORDINATES["Fleetwood Pharos Lighthouse"] },
  { name: "Fleetwood Ferry", category: "attraction", ...PLACE_COORDINATES["Fleetwood Ferry"] },
  // Fleetwood's own passenger line closed decades ago - Poulton-le-Fylde
  // is genuinely the nearest working station, not a stand-in for one.
  { name: "Poulton-le-Fylde", category: "station", ...PLACE_COORDINATES["Poulton-le-Fylde"] },

  // Cleveleys
  { name: "Rossall Point Tower", category: "attraction", ...PLACE_COORDINATES["Rossall Point Tower"] },
  { name: "Anchorsholme Park", category: "attraction", ...PLACE_COORDINATES["Anchorsholme Park"] },

  // Bispham
  { name: "Bispham Tramway Stop", category: "attraction", ...PLACE_COORDINATES["Bispham Tramway Stop"] },
];

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
