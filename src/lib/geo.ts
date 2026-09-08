/**
 * Shared, pure geographic math - the haversine distance and the walking/
 * driving time estimates derived from it. Originally lived only inside
 * landmarks.ts; pulled out so the same formulas back both the listing
 * page's "Getting around" callout and the Local Guide's location-aware
 * distance badges, rather than two copies drifting apart.
 */

const EARTH_RADIUS_MILES = 3958.8;

export function distanceMiles(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.asin(Math.sqrt(h));
}

// A brisk-but-realistic average, matching the "about a 10 min walk" style
// of estimate every major booking site shows next to a straight-line
// distance - not a routed path, so kept as a round, honestly-approximate
// figure rather than a falsely precise one.
const WALKING_MPH = 3;
const MAX_WALK_MINUTES_SHOWN = 30;

/** Null once far enough that a walking-time estimate stops being useful information and starts being noise. */
export function estimateWalkMinutes(miles: number): number | null {
  const minutes = Math.round(((miles / WALKING_MPH) * 60) / 5) * 5;
  return minutes > 0 && minutes <= MAX_WALK_MINUTES_SHOWN ? minutes : null;
}

// A deliberately cautious average for short trips on Fylde Coast town
// roads - junctions, seafront traffic, parking at the other end - rather
// than open-road speed, so this reads as "roughly this long", not a
// routed sat-nav estimate.
const DRIVING_MPH = 18;
const MAX_DRIVE_MINUTES_SHOWN = 30;

/** Null once far enough that this coast's own guide entries wouldn't realistically still be the "nearby" pick. */
export function estimateDriveMinutes(miles: number): number | null {
  const minutes = Math.round(((miles / DRIVING_MPH) * 60) / 5) * 5;
  return minutes > 0 && minutes <= MAX_DRIVE_MINUTES_SHOWN ? minutes : null;
}
