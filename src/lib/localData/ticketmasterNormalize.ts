import type { TicketmasterEvent } from "@/lib/localData/ticketmasterSource";

export type NormalizedEvent = {
  sourceId: string;
  name: string;
  category: string;
  venueName: string | null;
  latitude: number | null;
  longitude: number | null;
  startsAt: Date;
  url: string | null;
  imageUrl: string | null;
  priceRange: string | null;
  rawData: TicketmasterEvent;
};

/**
 * Turns one raw Ticketmaster event into FYStay's own event shape, or null
 * when it's missing a real, parseable start time - the one thing a "what's
 * happening near you" listing genuinely can't do without.
 */
export function normalizeTicketmasterEvent(event: TicketmasterEvent): NormalizedEvent | null {
  const startIso = event.dates.start.dateTime ?? (event.dates.start.localDate ? `${event.dates.start.localDate}T00:00:00` : undefined);
  if (!startIso) return null;

  const startsAt = new Date(startIso);
  if (Number.isNaN(startsAt.getTime())) return null;

  const venue = event._embedded?.venues?.[0];
  const price = event.priceRanges?.[0];
  // Prefer a reasonably sized image (Ticketmaster returns many crops) over
  // whatever happens to be first, but fall back to the first rather than
  // showing nothing.
  const image = event.images?.find((img) => img.width >= 640) ?? event.images?.[0];

  return {
    sourceId: event.id,
    name: event.name,
    category: event.classifications?.[0]?.segment?.name ?? "Event",
    venueName: venue?.name ?? null,
    latitude: venue?.location ? Number(venue.location.latitude) : null,
    longitude: venue?.location ? Number(venue.location.longitude) : null,
    startsAt,
    url: event.url ?? null,
    imageUrl: image?.url ?? null,
    priceRange: price ? `${price.currency} ${price.min}–${price.max}` : null,
    rawData: event,
  };
}
