import type {
  HotelDeal,
  HotelDetails,
  HotelProviderAdapter,
  HotelSearchResult,
} from "@/lib/hotelProviders/types";
import { notConfigured } from "@/lib/hotelProviders/providers/notConfigured";

// ============================================================================
// ⚠️ NOT YET CONNECTED - NO REAL API CALLS IN THIS FILE ⚠️
//
// Per this task's explicit instruction, nothing here invents a Booking.com
// endpoint, request/response shape, or deep-link URL format - every method
// below throws notConfigured() until this adapter is actually implemented
// against Booking.com's real, documented API.
//
// What's needed before this can move from stub to a working integration:
//
//   1. Booking.com Partner/Affiliate Program approval. Booking.com's
//      hotel-search/booking APIs are only available to approved partners -
//      there's no public, keyless endpoint to build against. Apply via
//      Booking.com's own Affiliate Partner Program or Demand API partner
//      onboarding (the exact program depends on whether this is meant as
//      a pure affiliate-link integration or a deeper API partnership -
//      confirm which with Booking.com's partner team before applying).
//   2. Once approved: real API credentials (an affiliate ID / API key,
//      however Booking.com issues it for the approved program) and
//      Booking.com's current API reference for search, hotel details, and
//      availability endpoints.
//   3. Booking.com's actual deep-link format for an approved affiliate,
//      including how a per-click tracking/sub-id (aid or a similar
//      parameter) is passed - this varies by partner program and must be
//      taken from Booking.com's own partner documentation, not guessed.
//
// Once all three exist: fill in each method below against the confirmed
// endpoints, set BOOKING_COM_API_KEY (and whatever else the confirmed
// integration needs) in the environment, and flip this provider's
// HotelProvider.status row from INACTIVE to ACTIVE. Nothing else in this
// app needs to change - the search/detail/click routes built in later
// phases only ever call through the HotelProviderAdapter interface.
// ============================================================================

export const bookingComAdapter: HotelProviderAdapter = {
  code: "booking_com",
  name: "Booking.com",

  // Declared true because Booking.com's affiliate program is expected to
  // support all of these once connected - these flags describe the
  // provider's real capabilities, not whether FYStay has finished
  // connecting to them yet (see HotelProvider.status in the database for
  // that). supportsConversionTracking stays false until Booking.com's
  // reporting/postback access is specifically confirmed for this app's
  // approved partner program.
  supportsSearch: true,
  supportsDeepLink: true,
  supportsClickTracking: true,
  supportsConversionTracking: false,

  async searchHotels(): Promise<HotelSearchResult[]> {
    notConfigured("booking_com", "searchHotels");
  },

  async getHotelDetails(): Promise<HotelDetails> {
    notConfigured("booking_com", "getHotelDetails");
  },

  async getAvailability(): Promise<HotelDeal[]> {
    notConfigured("booking_com", "getAvailability");
  },

  createDeepLink(): string {
    notConfigured("booking_com", "createDeepLink");
  },
};
