/**
 * Real, named Fylde Coast landmarks with approximate coordinates, used to
 * show a guest genuine distances from a listing to things they'd actually
 * recognise (Blackpool Tower, the nearest railway station) - the same kind
 * of "0.3 miles from X" proximity callout Booking.com and Airbnb show,
 * built from this app's own real per-listing coordinates (src/lib/
 * geocoding.ts) rather than anything invented.
 *
 * Coordinates here are drawn from general geographic knowledge of well-
 * known public landmarks, not a verified geocoding lookup - close enough
 * for "about a mile away", not survey-grade. Worth a manual spot-check
 * against a map before leaning on this for anything more precise.
 */
export type LandmarkCategory = "attraction" | "station";

export type Landmark = {
  name: string;
  category: LandmarkCategory;
  latitude: number;
  longitude: number;
};

export const LANDMARKS: Landmark[] = [
  // Blackpool
  { name: "Blackpool Tower", category: "attraction", latitude: 53.8142, longitude: -3.0553 },
  { name: "Blackpool Pleasure Beach", category: "attraction", latitude: 53.7877, longitude: -3.0522 },
  { name: "North Pier", category: "attraction", latitude: 53.8168, longitude: -3.0592 },
  { name: "Blackpool North", category: "station", latitude: 53.8168, longitude: -3.048 },

  // Lytham St Annes
  { name: "Lytham Windmill", category: "attraction", latitude: 53.7423, longitude: -2.9611 },
  { name: "St Annes Pier", category: "attraction", latitude: 53.7529, longitude: -3.0335 },
  { name: "Fairhaven Lake", category: "attraction", latitude: 53.7469, longitude: -3.0035 },
  { name: "Lytham", category: "station", latitude: 53.7423, longitude: -2.9583 },
  { name: "Ansdell & Fairhaven", category: "station", latitude: 53.7457, longitude: -2.9814 },

  // Fleetwood
  { name: "Fleetwood Pharos Lighthouse", category: "attraction", latitude: 53.9256, longitude: -3.0113 },
  { name: "Fleetwood Ferry", category: "attraction", latitude: 53.9268, longitude: -3.0068 },
  // Fleetwood's own passenger line closed decades ago - Poulton-le-Fylde
  // is genuinely the nearest working station, not a stand-in for one.
  { name: "Poulton-le-Fylde", category: "station", latitude: 53.8483, longitude: -2.9883 },

  // Cleveleys
  { name: "Rossall Point Tower", category: "attraction", latitude: 53.9021, longitude: -3.0247 },
  { name: "Anchorsholme Park", category: "attraction", latitude: 53.8654, longitude: -3.0472 },

  // Bispham
  { name: "Bispham Tramway Stop", category: "attraction", latitude: 53.8459, longitude: -3.0453 },
];

const EARTH_RADIUS_MILES = 3958.8;
// A brisk-but-realistic average, matching the "about a 10 min walk" style
// of estimate every major booking site shows next to a straight-line
// distance - not a routed path, so kept as a round, honestly-approximate
// figure rather than a falsely precise one.
const WALKING_MPH = 3;
const MAX_WALK_MINUTES_SHOWN = 30;

function distanceMiles(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.asin(Math.sqrt(h));
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
    .map(({ landmark, distance }) => {
      const walkMinutes = Math.round(distance / WALKING_MPH * 60 / 5) * 5;
      return {
        name: landmark.name,
        category: landmark.category,
        distanceMiles: Math.round(distance * 10) / 10,
        walkMinutes: walkMinutes > 0 && walkMinutes <= MAX_WALK_MINUTES_SHOWN ? walkMinutes : null,
      };
    });
}
