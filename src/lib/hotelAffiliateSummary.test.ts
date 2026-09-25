import { describe, expect, it } from "vitest";
import {
  groupRevenueByDate,
  groupRevenueByKey,
  summarizeAffiliateFunnel,
  summarizeConversionRevenue,
} from "./hotelAffiliateSummary";

describe("summarizeAffiliateFunnel", () => {
  it("computes the primary affiliate CTR as clicks / hotel detail views, not clicks / searches", () => {
    const result = summarizeAffiliateFunnel({ totalSearches: 200, totalDetailViews: 80, totalClicks: 20 });
    expect(result.affiliateClickThroughRate).toBe(0.25);
    expect(result.totalSearches).toBe(200);
    expect(result.totalDetailViews).toBe(80);
    expect(result.totalClicks).toBe(20);
  });

  it("computes search -> click as a separate, non-CTR funnel metric", () => {
    const result = summarizeAffiliateFunnel({ totalSearches: 200, totalDetailViews: 80, totalClicks: 20 });
    expect(result.searchToClickRate).toBe(0.1);
  });

  it("returns 0 CTR rather than NaN/Infinity when there have been no detail views yet", () => {
    const result = summarizeAffiliateFunnel({ totalSearches: 0, totalDetailViews: 0, totalClicks: 0 });
    expect(result.affiliateClickThroughRate).toBe(0);
    expect(result.searchToClickRate).toBe(0);
  });

  it("still returns 0 for both rates when there are clicks but somehow no detail views/searches on record", () => {
    // Shouldn't happen in practice (a click always implies a prior detail
    // view and search), but neither function must ever divide by zero.
    const result = summarizeAffiliateFunnel({ totalSearches: 0, totalDetailViews: 0, totalClicks: 5 });
    expect(result.affiliateClickThroughRate).toBe(0);
    expect(result.searchToClickRate).toBe(0);
    expect(Number.isFinite(result.affiliateClickThroughRate)).toBe(true);
    expect(Number.isFinite(result.searchToClickRate)).toBe(true);
  });

  it("can exceed 100% for either rate - clicking multiple hotels per view/search is real, not a bug", () => {
    const result = summarizeAffiliateFunnel({ totalSearches: 1, totalDetailViews: 1, totalClicks: 39 });
    expect(result.affiliateClickThroughRate).toBe(39);
    expect(result.searchToClickRate).toBe(39);
  });
});

describe("summarizeConversionRevenue", () => {
  it("returns all zeros for no conversions - never fabricates a number", () => {
    const result = summarizeConversionRevenue([]);
    expect(result).toEqual({
      confirmedBookingsCount: 0,
      pendingCount: 0,
      cancelledCount: 0,
      confirmedCommissionCents: 0,
      estimatedCommissionCents: 0,
    });
  });

  it("sums confirmed commission only from commissionConfirmed=true rows", () => {
    const result = summarizeConversionRevenue([
      { status: "CONFIRMED", commissionCents: 1000, commissionConfirmed: true },
      { status: "CONFIRMED", commissionCents: 2000, commissionConfirmed: true },
      { status: "CONFIRMED", commissionCents: 500, commissionConfirmed: false },
    ]);
    expect(result.confirmedCommissionCents).toBe(3000);
    expect(result.estimatedCommissionCents).toBe(500);
    expect(result.confirmedBookingsCount).toBe(3);
  });

  it("excludes cancelled conversions from every commission total", () => {
    const result = summarizeConversionRevenue([
      { status: "CANCELLED", commissionCents: 9999, commissionConfirmed: true },
      { status: "CANCELLED", commissionCents: 9999, commissionConfirmed: false },
    ]);
    expect(result.confirmedCommissionCents).toBe(0);
    expect(result.estimatedCommissionCents).toBe(0);
    expect(result.cancelledCount).toBe(2);
  });

  it("treats a null commissionCents as 0, not as missing/skipped", () => {
    const result = summarizeConversionRevenue([
      { status: "PENDING", commissionCents: null, commissionConfirmed: false },
    ]);
    expect(result.estimatedCommissionCents).toBe(0);
    expect(result.pendingCount).toBe(1);
  });

  it("counts PENDING and CONFIRMED and CANCELLED independently", () => {
    const result = summarizeConversionRevenue([
      { status: "PENDING", commissionCents: null, commissionConfirmed: false },
      { status: "PENDING", commissionCents: null, commissionConfirmed: false },
      { status: "CONFIRMED", commissionCents: 100, commissionConfirmed: true },
      { status: "CANCELLED", commissionCents: null, commissionConfirmed: false },
    ]);
    expect(result.pendingCount).toBe(2);
    expect(result.confirmedBookingsCount).toBe(1);
    expect(result.cancelledCount).toBe(1);
  });
});

describe("groupRevenueByKey", () => {
  it("groups and sums by key, excluding cancelled from commission totals", () => {
    const rows = groupRevenueByKey([
      { key: "mock", status: "CONFIRMED", commissionCents: 1000, commissionConfirmed: true },
      { key: "mock", status: "CONFIRMED", commissionCents: 500, commissionConfirmed: false },
      { key: "booking_com", status: "CANCELLED", commissionCents: 5000, commissionConfirmed: true },
    ]);
    const mockRow = rows.find((r) => r.key === "mock")!;
    expect(mockRow.confirmedCommissionCents).toBe(1000);
    expect(mockRow.estimatedCommissionCents).toBe(500);
    expect(mockRow.conversionCount).toBe(2);

    const bookingRow = rows.find((r) => r.key === "booking_com")!;
    expect(bookingRow.confirmedCommissionCents).toBe(0);
    expect(bookingRow.conversionCount).toBe(1);
  });

  it("sorts by confirmed commission descending", () => {
    const rows = groupRevenueByKey([
      { key: "small", status: "CONFIRMED", commissionCents: 100, commissionConfirmed: true },
      { key: "big", status: "CONFIRMED", commissionCents: 9000, commissionConfirmed: true },
      { key: "medium", status: "CONFIRMED", commissionCents: 500, commissionConfirmed: true },
    ]);
    expect(rows.map((r) => r.key)).toEqual(["big", "medium", "small"]);
  });

  it("returns an empty array for no rows", () => {
    expect(groupRevenueByKey([])).toEqual([]);
  });
});

describe("groupRevenueByDate", () => {
  it("groups by calendar date and sorts chronologically", () => {
    const rows = groupRevenueByDate([
      { date: new Date(2026, 9, 3), status: "CONFIRMED", commissionCents: 100, commissionConfirmed: true },
      { date: new Date(2026, 9, 1), status: "CONFIRMED", commissionCents: 200, commissionConfirmed: true },
      { date: new Date(2026, 9, 1), status: "CONFIRMED", commissionCents: 50, commissionConfirmed: true },
    ]);
    expect(rows.map((r) => r.key)).toEqual(["2026-10-01", "2026-10-03"]);
    expect(rows[0].confirmedCommissionCents).toBe(250);
    expect(rows[1].confirmedCommissionCents).toBe(100);
  });
});
