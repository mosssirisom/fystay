import { describe, expect, it } from "vitest";
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

  it("rejects searchHotels with a non-retryable, clearly-worded error", async () => {
    await expect(bookingComAdapter.searchHotels(searchParams)).rejects.toMatchObject({
      name: "HotelProviderAdapterError",
      retryable: false,
    });
  });

  it("rejects getHotelDetails", async () => {
    await expect(bookingComAdapter.getHotelDetails("bc-12345")).rejects.toBeInstanceOf(
      HotelProviderAdapterError,
    );
  });

  it("rejects getAvailability", async () => {
    await expect(bookingComAdapter.getAvailability("bc-12345", searchParams)).rejects.toBeInstanceOf(
      HotelProviderAdapterError,
    );
  });

  it("throws synchronously from createDeepLink rather than inventing a URL format", () => {
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
    ).toThrow(HotelProviderAdapterError);
  });
});
