import type { LocalDataSource, SyncStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const FAILURE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const USAGE_WINDOW_MS = 24 * 60 * 60 * 1000;

export type SourceStatus = "LIVE" | "FAILING" | "DISABLED" | "NEVER_RUN";

export type SourceSummary = {
  source: LocalDataSource;
  label: string;
  /** Whether this source has everything it needs to run at all (e.g. an API key) - independent of whether it's ever succeeded. */
  configured: boolean;
  status: SourceStatus;
  lastSuccessAt: Date | null;
  lastAttempt: { at: Date; status: SyncStatus; errorMessage: string | null } | null;
  recordCount: number;
  failuresLast7Days: number;
  syncRunsLast24h: number;
};

export type FeaturedRecommendation = {
  id: string;
  townSlug: string;
  townName: string;
  tag: string;
  name: string;
  category: string;
  rank: number;
  linkedToLivePlace: boolean;
};

export type LocalDataAdminSummary = {
  towns: number;
  sources: SourceSummary[];
  featured: FeaturedRecommendation[];
  generatedAt: Date;
};

const SOURCE_LABEL: Record<LocalDataSource, string> = {
  OSM: "OpenStreetMap / Overpass (places)",
  TICKETMASTER: "Ticketmaster Discovery (events)",
  OPEN_METEO: "Open-Meteo (weather)",
  EDITORIAL: "FYStay editorial",
};

async function summarizeSource(source: LocalDataSource, configured: boolean, recordCount: number): Promise<SourceSummary> {
  const [lastSuccess, lastAttempt, failuresLast7Days, syncRunsLast24h] = await Promise.all([
    prisma.apiSyncLog.findFirst({
      where: { source, status: "SUCCESS" },
      orderBy: { finishedAt: "desc" },
      select: { finishedAt: true },
    }),
    prisma.apiSyncLog.findFirst({
      where: { source },
      orderBy: { finishedAt: "desc" },
      select: { finishedAt: true, status: true, errorMessage: true },
    }),
    prisma.apiSyncLog.count({
      where: { source, status: "FAILURE", finishedAt: { gte: new Date(Date.now() - FAILURE_WINDOW_MS) } },
    }),
    prisma.apiSyncLog.count({
      where: { source, finishedAt: { gte: new Date(Date.now() - USAGE_WINDOW_MS) } },
    }),
  ]);

  let status: SourceStatus;
  if (!configured) status = "DISABLED";
  else if (!lastAttempt) status = "NEVER_RUN";
  else if (lastAttempt.status === "FAILURE") status = "FAILING";
  else status = "LIVE";

  return {
    source,
    label: SOURCE_LABEL[source],
    configured,
    status,
    lastSuccessAt: lastSuccess?.finishedAt ?? null,
    lastAttempt: lastAttempt
      ? { at: lastAttempt.finishedAt, status: lastAttempt.status, errorMessage: lastAttempt.errorMessage }
      : null,
    recordCount,
    failuresLast7Days,
    syncRunsLast24h,
  };
}

/**
 * Everything the admin status dashboard needs, in one call - "API status",
 * "last successful refresh", "number of records", "failed requests", "API
 * usage" and "data source" per the brief, each read straight from
 * ApiSyncLog (the same log every fetch function already writes to) rather
 * than a separate metrics system. "API usage" here means sync attempts in
 * the last 24h, not third-party quota - Overpass and Open-Meteo don't
 * expose one to query, and this is an honest proxy for "how often is
 * FYStay actually calling this" rather than a number we can't really know.
 */
export async function getLocalDataAdminSummary(): Promise<LocalDataAdminSummary> {
  const [towns, placesCount, eventsCount, weatherCount, ticketmasterConfigured, editorial] = await Promise.all([
    prisma.localTown.count(),
    prisma.localPlace.count({ where: { source: "OSM" } }),
    prisma.localEvent.count(),
    prisma.weatherCache.count(),
    Promise.resolve(Boolean(process.env.TICKETMASTER_API_KEY)),
    prisma.editorialRecommendation.findMany({
      include: { town: { select: { name: true } } },
      orderBy: [{ townSlug: "asc" }, { rank: "asc" }],
    }),
  ]);

  const sources = await Promise.all([
    summarizeSource("OSM", true, placesCount),
    summarizeSource("OPEN_METEO", true, weatherCount),
    summarizeSource("TICKETMASTER", ticketmasterConfigured, eventsCount),
  ]);

  const featured: FeaturedRecommendation[] = editorial.map((rec) => ({
    id: rec.id,
    townSlug: rec.townSlug,
    townName: rec.town.name,
    tag: rec.tag,
    name: rec.name,
    category: rec.category,
    rank: rec.rank,
    linkedToLivePlace: rec.placeId !== null,
  }));

  return { towns, sources, featured, generatedAt: new Date() };
}
