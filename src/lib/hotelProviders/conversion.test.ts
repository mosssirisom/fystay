import { beforeEach, describe, expect, it, vi } from "vitest";

const mockClickFindUnique = vi.fn();
const mockConversionUpsert = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    affiliateClick: { findUnique: (...args: unknown[]) => mockClickFindUnique(...args) },
    affiliateConversion: { upsert: (...args: unknown[]) => mockConversionUpsert(...args) },
  },
}));

const { reconcileConversion } = await import("./conversion");

beforeEach(() => {
  mockClickFindUnique.mockReset();
  mockConversionUpsert.mockReset();
});

describe("reconcileConversion", () => {
  it("reports unknown_click and never writes anything when the subId doesn't match any click", async () => {
    mockClickFindUnique.mockResolvedValue(null);

    const outcome = await reconcileConversion({
      subId: "hc_does_not_exist",
      status: "CONFIRMED",
      commissionConfirmed: true,
      commissionCents: 1500,
    });

    expect(outcome).toEqual({ status: "unknown_click" });
    expect(mockConversionUpsert).not.toHaveBeenCalled();
  });

  it("creates a conversion keyed to the resolved click when the subId is known", async () => {
    mockClickFindUnique.mockResolvedValue({ id: "click-1" });
    mockConversionUpsert.mockResolvedValue({ id: "conversion-1" });

    const outcome = await reconcileConversion({
      subId: "hc_real",
      status: "CONFIRMED",
      externalBookingReference: "BDC-12345",
      bookingValueCents: 45000,
      currency: "GBP",
      commissionCents: 6750,
      commissionConfirmed: true,
    });

    expect(outcome).toEqual({ status: "ok", conversionId: "conversion-1", clickId: "click-1" });
    expect(mockClickFindUnique).toHaveBeenCalledWith({
      where: { subId: "hc_real" },
      select: { id: true },
    });
    const call = mockConversionUpsert.mock.calls[0][0];
    expect(call.where).toEqual({ clickId: "click-1" });
    expect(call.create).toMatchObject({
      clickId: "click-1",
      status: "CONFIRMED",
      externalBookingReference: "BDC-12345",
      bookingValueCents: 45000,
      currency: "GBP",
      commissionCents: 6750,
      commissionConfirmed: true,
    });
    expect(call.update).toMatchObject({
      status: "CONFIRMED",
      commissionCents: 6750,
      commissionConfirmed: true,
    });
  });

  it("never fabricates a commission figure - null/undefined pass through as null, not 0 or a guess", async () => {
    mockClickFindUnique.mockResolvedValue({ id: "click-2" });
    mockConversionUpsert.mockResolvedValue({ id: "conversion-2" });

    await reconcileConversion({
      subId: "hc_pending",
      status: "PENDING",
      commissionConfirmed: false,
    });

    const call = mockConversionUpsert.mock.calls[0][0];
    expect(call.create.commissionCents).toBeNull();
    expect(call.create.bookingValueCents).toBeNull();
    expect(call.create.commissionConfirmed).toBe(false);
  });

  it("distinguishes an estimated commission from a confirmed one via commissionConfirmed", async () => {
    mockClickFindUnique.mockResolvedValue({ id: "click-3" });
    mockConversionUpsert.mockResolvedValue({ id: "conversion-3" });

    await reconcileConversion({
      subId: "hc_estimate",
      status: "CONFIRMED",
      commissionCents: 2000,
      commissionConfirmed: false,
    });

    const call = mockConversionUpsert.mock.calls[0][0];
    expect(call.create.commissionCents).toBe(2000);
    expect(call.create.commissionConfirmed).toBe(false);
  });

  it("defaults reportedAt to now when the report doesn't supply one", async () => {
    mockClickFindUnique.mockResolvedValue({ id: "click-4" });
    mockConversionUpsert.mockResolvedValue({ id: "conversion-4" });
    const before = Date.now();

    await reconcileConversion({ subId: "hc_no_date", status: "CONFIRMED", commissionConfirmed: false });

    const call = mockConversionUpsert.mock.calls[0][0];
    expect(call.create.reportedAt).toBeInstanceOf(Date);
    expect(call.create.reportedAt.getTime()).toBeGreaterThanOrEqual(before);
  });

  it("is idempotent: re-reporting the same subId upserts against the same clickId rather than creating a second row", async () => {
    mockClickFindUnique.mockResolvedValue({ id: "click-5" });
    mockConversionUpsert.mockResolvedValue({ id: "conversion-5" });

    await reconcileConversion({ subId: "hc_repeat", status: "PENDING", commissionConfirmed: false });
    await reconcileConversion({
      subId: "hc_repeat",
      status: "CONFIRMED",
      commissionCents: 3000,
      commissionConfirmed: true,
    });

    expect(mockConversionUpsert).toHaveBeenCalledTimes(2);
    expect(mockConversionUpsert.mock.calls[0][0].where).toEqual({ clickId: "click-5" });
    expect(mockConversionUpsert.mock.calls[1][0].where).toEqual({ clickId: "click-5" });
    expect(mockConversionUpsert.mock.calls[1][0].update.status).toBe("CONFIRMED");
    expect(mockConversionUpsert.mock.calls[1][0].update.commissionConfirmed).toBe(true);
  });

  it("never treats CANCELLED as a reason to invent a commission - fields pass through as given", async () => {
    mockClickFindUnique.mockResolvedValue({ id: "click-6" });
    mockConversionUpsert.mockResolvedValue({ id: "conversion-6" });

    await reconcileConversion({ subId: "hc_cancelled", status: "CANCELLED", commissionConfirmed: false });

    const call = mockConversionUpsert.mock.calls[0][0];
    expect(call.create.status).toBe("CANCELLED");
    expect(call.create.commissionCents).toBeNull();
  });
});
