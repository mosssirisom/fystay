import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncListingIcalImport } from "@/lib/icalSync";

// A calendar fetch per listing, done sequentially - see refresh-local-data's
// own maxDuration comment for the same "stay inside Vercel Hobby's 60s
// ceiling" reasoning.
export const maxDuration = 60;

/** Same trust model as refresh-local-data's isAuthorizedCronRequest - see that file for the full reasoning. */
function isAuthorizedCronRequest(request: Request): boolean {
  if (request.headers.get("x-vercel-cron")) return true;

  const secret = process.env.ICAL_SYNC_CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

type ListingSyncResult = {
  listingId: string;
  status: "synced" | "failed";
  synced?: number;
  removed?: number;
};

/**
 * Nightly background sync for every listing with an icalImportUrl set -
 * see vercel.json for the schedule. The host-triggered "Sync now" button
 * (POST /api/listings/[id]/ical-sync) covers the immediate case; this is
 * what keeps a listing's imported blocks fresh even if the host never
 * comes back to press it. One listing failing to fetch (a dead link, a
 * platform's export temporarily down) is logged and skipped, not fatal to
 * every other listing's sync in the same run.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listings = await prisma.listing.findMany({
    where: { icalImportUrl: { not: null } },
    select: { id: true },
  });

  const results: ListingSyncResult[] = [];
  for (const listing of listings) {
    try {
      const result = await syncListingIcalImport(prisma, listing.id);
      results.push({ listingId: listing.id, status: "synced", synced: result?.synced, removed: result?.removed });
    } catch (error) {
      console.error(`ical sync failed for listing ${listing.id}:`, error);
      results.push({ listingId: listing.id, status: "failed" });
    }
  }

  return NextResponse.json({ syncedAt: new Date().toISOString(), listings: results });
}
