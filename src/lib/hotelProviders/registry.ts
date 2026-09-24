import type { HotelProviderAdapter } from "@/lib/hotelProviders/types";
import { mockHotelProviderAdapter } from "@/lib/hotelProviders/providers/mock";
import { bookingComAdapter } from "@/lib/hotelProviders/providers/bookingCom";

/**
 * The one place that maps a HotelProvider.code to its adapter
 * implementation - same role as src/lib/pms/registry.ts. A route resolves
 * which provider(s) to actually query by reading HotelProvider rows from
 * the database (status: ACTIVE, in Phase 5's search route), then looks up
 * each one's adapter here; nothing outside this file imports a specific
 * provider's module directly.
 *
 * Adding a fourth provider later (Expedia, HBX/Hotelbeds) is exactly two
 * changes: a new file in providers/ implementing HotelProviderAdapter, and
 * one new entry in this map - never a change to the search/detail/click
 * routes, the frontend, or the database schema.
 */
const ADAPTERS: Record<string, HotelProviderAdapter> = {
  mock: mockHotelProviderAdapter,
  booking_com: bookingComAdapter,
};

export function getHotelProviderAdapter(code: string): HotelProviderAdapter {
  const adapter = ADAPTERS[code];
  if (!adapter) {
    throw new Error(`No HotelProviderAdapter registered for code "${code}"`);
  }
  return adapter;
}

/**
 * Providers with a real (non-stub) implementation, for anywhere that needs
 * to know "can this actually be queried today" without importing every
 * adapter to check - same role as LIVE_PMS_PROVIDERS. "mock" is
 * deliberately excluded: it's real, working code, but it's dev/test
 * fixture data, not a provider a production deployment should ever list
 * as one of its live hotel sources. A production environment seeds no
 * HotelProvider row with code "mock" in the first place (see this
 * package's own README once Phase 4/5 add one) - this constant is a second,
 * independent guard against it ever being treated as live by mistake.
 */
export const LIVE_HOTEL_PROVIDER_CODES: string[] = [];
