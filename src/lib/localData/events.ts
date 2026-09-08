import type { LocalEvent } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureTownsSeeded } from "@/lib/localData/seedTowns";
import { fetchTicketmasterEvents } from "@/lib/localData/ticketmasterSource";
import { normalizeTicketmasterEvent, type NormalizedEvent } from "@/lib/localData/ticketmasterNormalize";
import { hasRecentLog, logSkipped, runSync } from "@/lib/localData/syncLog";

// Events churn faster than places or weather (a gig gets added or sells
// out within a day) but Ticketmaster is a registered, rate-limited key,
// not an anonymous public endpoint like Overpass - a few hours' staleness
// is a reasonable trade against calling it on every request.
const EVENTS_TTL_MS = 6 * 60 * 60 * 1000;

async function upsertEvent(townSlug: string, event: NormalizedEvent): Promise<void> {
  await prisma.localEvent.upsert({
    where: { sourceId: event.sourceId },
    create: {
      source: "TICKETMASTER",
      sourceId: event.sourceId,
      townSlug,
      name: event.name,
      category: event.category,
      venueName: event.venueName,
      latitude: event.latitude,
      longitude: event.longitude,
      startsAt: event.startsAt,
      url: event.url,
      imageUrl: event.imageUrl,
      priceRange: event.priceRange,
      rawData: event.rawData,
    },
    update: {
      name: event.name,
      category: event.category,
      venueName: event.venueName,
      latitude: event.latitude,
      longitude: event.longitude,
      startsAt: event.startsAt,
      url: event.url,
      imageUrl: event.imageUrl,
      priceRange: event.priceRange,
      rawData: event.rawData,
      lastFetchedAt: new Date(),
    },
  });
}

function upcomingEventsFromCache(townSlug: string): Promise<LocalEvent[]> {
  return prisma.localEvent.findMany({
    where: { townSlug, startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
  });
}

/**
 * The one function anything in the app should call for events - never
 * fetchTicketmasterEvents directly. Without TICKETMASTER_API_KEY
 * configured this is a permanent, honest no-op: it logs a single SKIPPED
 * entry per TTL window (so the admin dashboard shows "not switched on",
 * not silence) and returns whatever's already cached (nothing, on a fresh
 * install) - it never fabricates an event to fill the gap.
 */
export async function getTownEvents(townSlug: string): Promise<LocalEvent[]> {
  await ensureTownsSeeded();
  const town = await prisma.localTown.findUnique({ where: { slug: townSlug } });
  if (!town) return [];

  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) {
    if (!(await hasRecentLog({ source: "TICKETMASTER", townSlug, statuses: ["SKIPPED"], ttlMs: EVENTS_TTL_MS }))) {
      await logSkipped({ source: "TICKETMASTER", townSlug, reason: "TICKETMASTER_API_KEY is not configured" });
    }
    return upcomingEventsFromCache(townSlug);
  }

  if (!(await hasRecentLog({ source: "TICKETMASTER", townSlug, statuses: ["SUCCESS"], ttlMs: EVENTS_TTL_MS }))) {
    await runSync({ source: "TICKETMASTER", townSlug }, async () => {
      const events = await fetchTicketmasterEvents({ latitude: town.latitude, longitude: town.longitude, apiKey });
      const normalized = events
        .map(normalizeTicketmasterEvent)
        .filter((event): event is NormalizedEvent => event !== null);
      await Promise.all(normalized.map((event) => upsertEvent(townSlug, event)));
      return { result: normalized, recordCount: normalized.length };
    }).catch(() => undefined);
  }

  return upcomingEventsFromCache(townSlug);
}
