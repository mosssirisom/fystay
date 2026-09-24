import { describe, expect, it } from "vitest";
import { getHotelProviderAdapter, LIVE_HOTEL_PROVIDER_CODES } from "./registry";

describe("getHotelProviderAdapter", () => {
  it("resolves the mock provider", () => {
    expect(getHotelProviderAdapter("mock").code).toBe("mock");
  });

  it("resolves the booking_com provider", () => {
    expect(getHotelProviderAdapter("booking_com").code).toBe("booking_com");
  });

  it("throws for an unregistered provider code", () => {
    expect(() => getHotelProviderAdapter("expedia")).toThrow(/No HotelProviderAdapter registered/);
  });
});

describe("LIVE_HOTEL_PROVIDER_CODES", () => {
  it("never includes the mock provider", () => {
    expect(LIVE_HOTEL_PROVIDER_CODES).not.toContain("mock");
  });

  it("doesn't yet include booking_com (no real credentials/endpoints wired up)", () => {
    expect(LIVE_HOTEL_PROVIDER_CODES).not.toContain("booking_com");
  });
});
