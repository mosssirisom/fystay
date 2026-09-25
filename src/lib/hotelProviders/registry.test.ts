import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFindUnique = vi.fn();
const mockUpsert = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    hotelProviderCacheEntry: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      upsert: (...args: unknown[]) => mockUpsert(...args),
    },
  },
}));

const { getHotelProviderAdapter, LIVE_HOTEL_PROVIDER_CODES } = await import("./registry");

beforeEach(() => {
  mockFindUnique.mockReset().mockResolvedValue(null);
  mockUpsert.mockReset().mockResolvedValue({});
});

describe("getHotelProviderAdapter", () => {
  it("resolves the mock provider", () => {
    expect(getHotelProviderAdapter("mock").code).toBe("mock");
  });

  it("resolves the booking_com provider", () => {
    expect(getHotelProviderAdapter("booking_com").code).toBe("booking_com");
  });

  it("throws for an unregistered provider code", () => {
    expect(() => getHotelProviderAdapter("not-a-real-provider")).toThrow(
      'No HotelProviderAdapter registered for code "not-a-real-provider"',
    );
  });

  it("returns a wrapped 'mock' adapter that still behaves like the real mock provider end to end", async () => {
    const adapter = getHotelProviderAdapter("mock");
    expect(adapter.code).toBe("mock");

    const results = await adapter.searchHotels({
      destination: "registry-test-destination",
      checkIn: new Date("2026-12-01"),
      checkOut: new Date("2026-12-03"),
      adults: 2,
      children: 0,
      rooms: 1,
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].externalId).toContain("registry-test-destination");
  });

  it("wraps 'booking_com' too - still throws its own not-yet-configured error, wrapping doesn't hide or change that", async () => {
    const adapter = getHotelProviderAdapter("booking_com");
    await expect(
      adapter.searchHotels({
        destination: "anywhere",
        checkIn: new Date("2026-12-01"),
        checkOut: new Date("2026-12-03"),
        adults: 2,
        children: 0,
        rooms: 1,
      }),
    ).rejects.toThrow(/not configured/i);
  });
});

describe("LIVE_HOTEL_PROVIDER_CODES", () => {
  it("stays empty - no provider is live simply because it's registered or has an adapter", () => {
    expect(LIVE_HOTEL_PROVIDER_CODES).toEqual([]);
  });

  it("never includes the mock provider", () => {
    expect(LIVE_HOTEL_PROVIDER_CODES).not.toContain("mock");
  });

  it("does not include 'booking_com' - it must never be flipped on without a deliberate decision", () => {
    expect(LIVE_HOTEL_PROVIDER_CODES).not.toContain("booking_com");
  });
});
