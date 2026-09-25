/**
 * Pure metrics for the admin hotel-affiliate dashboard (Phase 8) - same
 * pattern as src/lib/adminSummary.ts: the page does the Prisma fetch, these
 * functions do the arithmetic, so the arithmetic itself is unit-testable
 * without a database. Every function here only ever sums/counts fields a
 * caller already has - none of them can manufacture a conversion or a
 * commission that wasn't already recorded (see AffiliateConversion's own
 * schema comment, and reconcileConversion in conversion.ts, for the only
 * place those rows are ever created).
 */

export type AffiliateFunnelCounts = {
  totalSearches: number;
  totalDetailViews: number;
  totalClicks: number;
};

export type AffiliateFunnelSummary = AffiliateFunnelCounts & {
  /**
   * The dashboard's primary CTR: clicks / hotel detail views, as a fraction
   * (0-1) - the page formats it as a percentage. This is the conventional
   * definition of "click-through rate" (clicks against views of the surface
   * the link actually sits on, i.e. the hotel detail page), not clicks
   * against searches - a search can produce many detail views, so measuring
   * against searches understates how many people who actually saw the link
   * went on to click it. 0 when there have been no detail views yet, never
   * a divide-by-zero NaN/Infinity.
   */
  affiliateClickThroughRate: number;
  /**
   * A separate, non-CTR funnel metric: clicks / searches. Deliberately not
   * named/labelled as CTR anywhere - see affiliateClickThroughRate above for
   * why. Also not a reliable per-search conversion measure for any click
   * recorded before AffiliateSearch rows started being written (Phase 8):
   * such clicks have no AffiliateSearch of their own behind them, so this
   * ratio can run far above 100% until enough post-tracking volume accrues.
   * 0 when there have been no searches yet, never a divide-by-zero.
   */
  searchToClickRate: number;
};

export function summarizeAffiliateFunnel(counts: AffiliateFunnelCounts): AffiliateFunnelSummary {
  const affiliateClickThroughRate =
    counts.totalDetailViews > 0 ? counts.totalClicks / counts.totalDetailViews : 0;
  const searchToClickRate = counts.totalSearches > 0 ? counts.totalClicks / counts.totalSearches : 0;
  return { ...counts, affiliateClickThroughRate, searchToClickRate };
}

export type ConversionRow = {
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  commissionCents: number | null;
  commissionConfirmed: boolean;
};

export type ConversionRevenueSummary = {
  confirmedBookingsCount: number;
  pendingCount: number;
  cancelledCount: number;
  /** Sum of commissionCents where commissionConfirmed is true - a provider's own finalized figure, never FYStay's own estimate (see AffiliateConversion's schema comment). Cancelled conversions never contribute here. */
  confirmedCommissionCents: number;
  /** Sum of commissionCents where commissionConfirmed is false - FYStay's own estimate from a provider's published rate, not yet finalized. Kept as a clearly separate figure throughout this dashboard so an estimate is never presented as booked revenue. */
  estimatedCommissionCents: number;
};

export function summarizeConversionRevenue(conversions: ConversionRow[]): ConversionRevenueSummary {
  let confirmedBookingsCount = 0;
  let pendingCount = 0;
  let cancelledCount = 0;
  let confirmedCommissionCents = 0;
  let estimatedCommissionCents = 0;

  for (const conversion of conversions) {
    if (conversion.status === "CONFIRMED") confirmedBookingsCount++;
    else if (conversion.status === "PENDING") pendingCount++;
    else if (conversion.status === "CANCELLED") cancelledCount++;

    if (conversion.status === "CANCELLED") continue;
    const cents = conversion.commissionCents ?? 0;
    if (conversion.commissionConfirmed) confirmedCommissionCents += cents;
    else estimatedCommissionCents += cents;
  }

  return {
    confirmedBookingsCount,
    pendingCount,
    cancelledCount,
    confirmedCommissionCents,
    estimatedCommissionCents,
  };
}

export type RevenueGroupRow = {
  key: string;
  confirmedCommissionCents: number;
  estimatedCommissionCents: number;
  conversionCount: number;
};

/**
 * Groups conversions by an arbitrary caller-supplied key (provider name,
 * destination, ...) - used for both "revenue by provider" and "revenue by
 * destination", which differ only in what key each conversion is grouped
 * under. Sorted by confirmed commission descending, so the biggest real
 * earner leads the table rather than an alphabetical or insertion order
 * that says nothing about performance.
 */
export function groupRevenueByKey(rows: (ConversionRow & { key: string })[]): RevenueGroupRow[] {
  const byKey = new Map<string, RevenueGroupRow>();
  for (const row of rows) {
    const existing = byKey.get(row.key) ?? {
      key: row.key,
      confirmedCommissionCents: 0,
      estimatedCommissionCents: 0,
      conversionCount: 0,
    };
    if (row.status !== "CANCELLED") {
      const cents = row.commissionCents ?? 0;
      if (row.commissionConfirmed) existing.confirmedCommissionCents += cents;
      else existing.estimatedCommissionCents += cents;
    }
    existing.conversionCount += 1;
    byKey.set(row.key, existing);
  }
  return [...byKey.values()].sort((a, b) => b.confirmedCommissionCents - a.confirmedCommissionCents);
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Same shape as groupRevenueByKey, but keyed by calendar date (the date a
 * conversion was reported, falling back to when it was first recorded for
 * one that hasn't been reported yet) and sorted chronologically rather than
 * by amount - a revenue-by-date table reads as a timeline, not a
 * leaderboard.
 */
export function groupRevenueByDate(rows: (ConversionRow & { date: Date })[]): RevenueGroupRow[] {
  return groupRevenueByKey(rows.map((row) => ({ ...row, key: toDateKey(row.date) }))).sort((a, b) =>
    a.key < b.key ? -1 : a.key > b.key ? 1 : 0,
  );
}
