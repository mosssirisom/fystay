import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HotelProviderAdapterError } from "../types";
import { bookingComAdapter } from "./bookingCom";

const searchParams = {
  destination: "Blackpool",
  checkIn: new Date("2027-06-01"),
  checkOut: new Date("2027-06-04"),
  adults: 2,
  children: 0,
  rooms: 1,
};

describe("bookingComAdapter", () => {
  it("declares its provider identity and expected capabilities", () => {
    expect(bookingComAdapter.code).toBe("booking_com");
    expect(bookingComAdapter.supportsSearch).toBe(true);
    expect(bookingComAdapter.supportsDeepLink).toBe(true);
    // Never true until real reporting/postback access is confirmed - see
    // this adapter's own top-of-file comment.
    expect(bookingComAdapter.supportsConversionTracking).toBe(false);
  });

  describe("without credentials configured", () => {
    beforeEach(() => {
      vi.stubEnv("BOOKING_COM_API_KEY", "");
      vi.stubEnv("BOOKING_COM_AFFILIATE_ID", "");
    });
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("rejects searchHotels with a clear, non-retryable configuration error", async () => {
      await expect(bookingComAdapter.searchHotels(searchParams)).rejects.toMatchObject({
        name: "HotelProviderAdapterError",
        retryable: false,
        message: expect.stringContaining("BOOKING_COM_API_KEY"),
      });
    });

    it("rejects getHotelDetails the same way", async () => {
      await expect(bookingComAdapter.getHotelDetails("bc-12345")).rejects.toMatchObject({
        message: expect.stringContaining("not configured"),
      });
    });

    it("rejects getAvailability the same way", async () => {
      await expect(bookingComAdapter.getAvailability("bc-12345", searchParams)).rejects.toMatchObject({
        message: expect.stringContaining("not configured"),
      });
    });

    it("throws synchronously from createDeepLink rather than building a URL from partial config", () => {
      expect(() =>
        bookingComAdapter.createDeepLink({
          externalId: "bc-12345",
          checkIn: searchParams.checkIn,
          checkOut: searchParams.checkOut,
          adults: 2,
          children: 0,
          rooms: 1,
          subId: "abc123",
        }),
      ).toThrow(/not configured/);
    });

    it("rejects with only the API key set but not the affiliate id", async () => {
      vi.stubEnv("BOOKING_COM_API_KEY", "fake-token-for-shape-testing-only");
      await expect(bookingComAdapter.searchHotels(searchParams)).rejects.toMatchObject({
        message: expect.stringContaining("BOOKING_COM_AFFILIATE_ID"),
      });
    });
  });

  describe("with credentials configured", () => {
    beforeEach(() => {
      vi.stubEnv("BOOKING_COM_API_KEY", "fake-token-for-shape-testing-only");
      vi.stubEnv("BOOKING_COM_AFFILIATE_ID", "123456");
    });
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("still rejects searchHotels - the endpoint's request/response shape isn't confirmed yet, so it never invents one", async () => {
      await expect(bookingComAdapter.searchHotels(searchParams)).rejects.toMatchObject({
        name: "HotelProviderAdapterError",
        retryable: false,
        message: expect.stringContaining("has not yet been confirmed"),
      });
    });

    it("never returns mock-provider data even once credentials are present", async () => {
      await expect(bookingComAdapter.searchHotels(searchParams)).rejects.toBeInstanceOf(
        HotelProviderAdapterError,
      );
    });
  });
});
