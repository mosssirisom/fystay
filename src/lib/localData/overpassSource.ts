/**
 * The raw Overpass (OpenStreetMap) client - free, keyless, no signup
 * required. Overpass's public instance asks callers to keep requests
 * infrequent and sequential rather than parallel; the cache-aware layer in
 * places.ts is what actually keeps this app within that fair-use policy
 * (at most one request per town per TTL, however many guests are browsing),
 * not this file - this file only knows how to make one honest request.
 */

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const REQUEST_TIMEOUT_MS = 25000;
// How far from a town's centre to look - wide enough to cover a compact
// seaside town end to end, not so wide it pulls in a neighbouring town's
// amenities and mislabels them.
const SEARCH_RADIUS_METERS = 5000;

export type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

type OverpassResponse = {
  elements: OverpassElement[];
};

// Each clause is `key~"value1|value2|..."`, combined into one query so a
// town's whole amenity set comes back in a single request rather than one
// per category - the difference between 5 Overpass calls a day (one per
// town, once the cache goes stale) and 5x that.
const TAG_FILTERS = [
  ["amenity", "restaurant|cafe|pub|pharmacy|parking|charging_station|toilets"],
  ["shop", "supermarket|convenience"],
  ["leisure", "park|playground"],
  ["natural", "beach"],
  ["tourism", "attraction|museum|viewpoint"],
] as const;

function buildQuery(coordinates: { latitude: number; longitude: number }): string {
  const { latitude, longitude } = coordinates;
  const clauses = TAG_FILTERS.map(
    ([key, values]) => `nwr(around:${SEARCH_RADIUS_METERS},${latitude},${longitude})["${key}"~"^(${values})$"];`,
  ).join("\n  ");
  return `[out:json][timeout:25];\n(\n  ${clauses}\n);\nout center tags;`;
}

/**
 * Every OSM place (restaurant, café, park, beach, parking, ...) within
 * SEARCH_RADIUS_METERS of a town's centre. Ways and relations (many parks
 * and beaches are mapped as an area, not a single point) come back with a
 * `center` instead of their own lat/lon - see normalizeOverpassPlaces in
 * places.ts for how both shapes get merged into one coordinate.
 */
export async function fetchOverpassPlaces(coordinates: {
  latitude: number;
  longitude: number;
}): Promise<OverpassElement[]> {
  const query = buildQuery(coordinates);
  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: query,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Overpass request failed with status ${response.status}`);
  }
  const data = (await response.json()) as OverpassResponse;
  return data.elements;
}
