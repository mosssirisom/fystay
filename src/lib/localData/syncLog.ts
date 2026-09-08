import { prisma } from "@/lib/prisma";
import type { LocalDataSource, SyncStatus } from "@prisma/client";

/**
 * Wraps one sync attempt (a single source, optionally scoped to one town)
 * with a timed, always-written ApiSyncLog row - the admin dashboard's only
 * window into "is this actually working", so every call path that talks to
 * an external source goes through this rather than logging ad hoc. Never
 * throws itself: a logging failure must never be what takes a data fetch
 * down, so a failed log write is swallowed after one attempt.
 */
export async function runSync<T>(
  params: { source: LocalDataSource; townSlug?: string },
  fn: () => Promise<{ result: T; recordCount: number }>,
): Promise<T> {
  const startedAt = new Date();
  try {
    const { result, recordCount } = await fn();
    await writeLog({ ...params, status: "SUCCESS", recordCount, startedAt });
    return result;
  } catch (error) {
    await writeLog({
      ...params,
      status: "FAILURE",
      recordCount: 0,
      startedAt,
      errorMessage: error instanceof Error ? error.message.slice(0, 500) : "Unknown error",
    });
    throw error;
  }
}

/**
 * Whether a source has logged one of the given statuses for a town within
 * the last ttlMs - the shared "is the cache still fresh" check every
 * cache-aware fetch function (weather.ts, places.ts, events.ts) uses
 * instead of a source-specific freshness heuristic, so "how long do we
 * trust this before refreshing" always means the same thing: a real
 * logged attempt, not just "does a data row happen to exist".
 */
export async function hasRecentLog(params: {
  source: LocalDataSource;
  townSlug?: string;
  statuses: SyncStatus[];
  ttlMs: number;
}): Promise<boolean> {
  const recent = await prisma.apiSyncLog.findFirst({
    where: { source: params.source, townSlug: params.townSlug, status: { in: params.statuses } },
    orderBy: { finishedAt: "desc" },
    select: { finishedAt: true },
  });
  return Boolean(recent && Date.now() - recent.finishedAt.getTime() < params.ttlMs);
}

/** For a source that's configured off (no API key) rather than failing - see runSync's SKIPPED status doc comment on the SyncStatus enum. */
export async function logSkipped(params: { source: LocalDataSource; townSlug?: string; reason: string }): Promise<void> {
  const now = new Date();
  await writeLog({
    source: params.source,
    townSlug: params.townSlug,
    status: "SKIPPED",
    recordCount: 0,
    startedAt: now,
    errorMessage: params.reason,
  });
}

async function writeLog(params: {
  source: LocalDataSource;
  townSlug?: string;
  status: SyncStatus;
  recordCount: number;
  startedAt: Date;
  errorMessage?: string;
}): Promise<void> {
  await prisma.apiSyncLog
    .create({
      data: {
        source: params.source,
        townSlug: params.townSlug,
        status: params.status,
        recordCount: params.recordCount,
        errorMessage: params.errorMessage,
        startedAt: params.startedAt,
        finishedAt: new Date(),
      },
    })
    .catch(() => undefined);
}
