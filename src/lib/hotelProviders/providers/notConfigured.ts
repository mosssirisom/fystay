import { HotelProviderAdapterError } from "@/lib/hotelProviders/types";

/**
 * Shared "not yet built" error for a stub hotel-provider adapter (see
 * bookingCom.ts) - same reasoning and shape as src/lib/pms/providers/
 * notConfigured.ts: non-retryable, since retrying an unimplemented call
 * would never succeed, and one shared helper so every stub method raises
 * the exact same, clearly-worded error rather than each writing its own.
 */
export function notConfigured(providerCode: string, method: string): never {
  throw new HotelProviderAdapterError(
    `${providerCode} is not yet connected (called ${method}). This provider satisfies the ` +
      `HotelProviderAdapter interface so it plugs into the same search/detail/deep-link ` +
      `architecture as any other provider, but its real API calls still need to be written once ` +
      `partner approval and real API credentials exist - see this provider's own file for exactly ` +
      `what that requires. Until then, use the mock provider (src/lib/hotelProviders/providers/mock.ts) ` +
      `for local development and testing.`,
    { retryable: false },
  );
}
