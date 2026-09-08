/**
 * The raw Ticketmaster Discovery API client. Unlike Open-Meteo/Overpass,
 * this genuinely needs an API key - a free one, registered for at
 * https://developer.ticketmaster.com, set as TICKETMASTER_API_KEY. Never
 * read outside src/lib/localData/events.ts, and never sent anywhere but
 * Ticketmaster's own domain.
 */

const TICKETMASTER_URL = "https://app.ticketmaster.com/discovery/v2/events.json";
const REQUEST_TIMEOUT_MS = 10000;
const SEARCH_RADIUS_MILES = 10;

export type TicketmasterEvent = {
  id: string;
  name: string;
  url?: string;
  images?: { url: string; width: number; height: number }[];
  dates: { start: { dateTime?: string; localDate?: string } };
  classifications?: { segment?: { name?: string } }[];
  priceRanges?: { min: number; max: number; currency: string }[];
  _embedded?: {
    venues?: { name?: string; location?: { latitude: string; longitude: string } }[];
  };
};

type TicketmasterResponse = {
  _embedded?: { events?: TicketmasterEvent[] };
};

export async function fetchTicketmasterEvents(params: {
  latitude: number;
  longitude: number;
  apiKey: string;
}): Promise<TicketmasterEvent[]> {
  const url = new URL(TICKETMASTER_URL);
  url.searchParams.set("apikey", params.apiKey);
  url.searchParams.set("latlong", `${params.latitude},${params.longitude}`);
  url.searchParams.set("radius", String(SEARCH_RADIUS_MILES));
  url.searchParams.set("unit", "miles");
  url.searchParams.set("size", "50");
  url.searchParams.set("sort", "date,asc");

  const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`Ticketmaster request failed with status ${response.status}`);
  }
  const data = (await response.json()) as TicketmasterResponse;
  return data._embedded?.events ?? [];
}
