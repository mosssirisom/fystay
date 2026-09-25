import type {
  AvailabilityParams,
  CreateDeepLinkParams,
  HotelDeal,
  HotelDetails,
  HotelProviderAdapter,
  HotelSearchParams,
  HotelSearchResult,
} from "@/lib/hotelProviders/types";

/**
 * A second, deliberately trivial HotelProviderAdapter implementation used
 * only by this package's own tests (resilience.test.ts, cache.test.ts,
 * registry.test.ts). Its purpose is narrow: prove that the resilience/cache
 * wrappers and the search orchestration genuinely work against ANY
 * conforming HotelProviderAdapter, not just because they happen to have
 * been written and tested against providers/mock.ts's own specific
 * behaviour. Contains no Booking.com-derived data, endpoint shapes, or
 * naming of any kind - it is intentionally boring, fixed test data.
 *
 * Never registered in registry.ts and never selectable by a real
 * HotelProvider row - importing this file outside a test is a mistake.
 */
export function createFixtureAdapter(overrides: Partial<HotelProviderAdapter> = {}): HotelProviderAdapter {
  const base: HotelProviderAdapter = {
    code: "fixture",
    name: "Test fixture provider (test-only, never registered)",

    supportsSearch: true,
    supportsDeepLink: true,
    supportsClickTracking: true,
    supportsConversionTracking: false,

    async searchHotels(params: HotelSearchParams): Promise<HotelSearchResult[]> {
      return [
        {
          externalId: `fixture:${params.destination}:0`,
          name: "Fixture Test Hotel",
          city: params.destination,
          country: "Testland",
          facilities: ["Test amenity"],
          currency: "GBP",
          priceCents: 9900,
        },
      ];
    },

    async getHotelDetails(externalId: string): Promise<HotelDetails> {
      return {
        externalId,
        name: "Fixture Test Hotel",
        city: "Testville",
        country: "Testland",
        photos: [],
        facilities: ["Test amenity"],
      };
    },

    async getAvailability(externalId: string, params: AvailabilityParams): Promise<HotelDeal[]> {
      return [
        {
          externalRoomId: `${externalId}:room:0`,
          name: "Fixture Room",
          currency: "GBP",
          priceCents: 9900 * Math.max(1, params.rooms),
        },
      ];
    },

    createDeepLink(params: CreateDeepLinkParams): string {
      return `https://fixture-provider.invalid/deeplink/${encodeURIComponent(params.externalId)}?subid=${encodeURIComponent(params.subId)}`;
    },
  };
  return { ...base, ...overrides };
}
